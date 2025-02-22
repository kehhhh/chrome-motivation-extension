import { quotes } from '../data/quotes';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT = {
    MAX_REQUESTS: 200,
    WINDOW: 60 * 60 * 1000, // 1 hour in milliseconds
    requests: [],
};

class BackgroundService {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.retryDelay = 1000;
        this.maxRetries = 3;
        this.isInitialized = false;
        this.apiKey = null;
        this.preloadedBackgrounds = new Map();
        this.currentQuoteIndex = -1;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Load API key from storage
            const result = await chrome.storage.local.get('pexels_api_key');
            if (!result.pexels_api_key) {
                throw new Error('Pexels API key not found. Please set up your API key in the extension settings.');
            }
            this.apiKey = result.pexels_api_key;

            // Load cached backgrounds
            const cached = await chrome.storage.local.get('cached_backgrounds');
            if (cached.cached_backgrounds) {
                this.cache = new Map(Object.entries(cached.cached_backgrounds));
            }

            // Load current quote index
            const { quote_index } = await chrome.storage.local.get('quote_index');
            this.currentQuoteIndex = quote_index || -1;

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize background service:', error);
            throw error;
        }
    }

    async setApiKey(key) {
        this.apiKey = key;
        await chrome.storage.local.set({ pexels_api_key: key });
    }

    checkRateLimit() {
        const now = Date.now();
        // Remove requests outside the current window
        RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
            time => now - time < RATE_LIMIT.WINDOW
        );

        if (RATE_LIMIT.requests.length >= RATE_LIMIT.MAX_REQUESTS) {
            const oldestRequest = RATE_LIMIT.requests[0];
            const timeToWait = RATE_LIMIT.WINDOW - (now - oldestRequest);
            throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(timeToWait / 1000)} seconds`);
        }

        RATE_LIMIT.requests.push(now);
    }

    async getBackgroundForQuote(quote) {
        try {
            await this.initialize();

            // Extract keywords from the quote
            const keywords = this.extractKeywords(quote);
            const cacheKey = keywords.join(',');

            // Check cache first
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                // Preload next background while serving cached one
                this.preloadNextBackground(quote);
                return cachedResult;
            }

            // Check if there's a pending request
            if (this.pendingRequests.has(cacheKey)) {
                return this.pendingRequests.get(cacheKey);
            }

            // Check if we have a preloaded background
            const preloaded = this.preloadedBackgrounds.get(cacheKey);
            if (preloaded) {
                this.preloadedBackgrounds.delete(cacheKey);
                this.cacheResult(cacheKey, preloaded);
                return preloaded;
            }

            // Create new request
            const requestPromise = this.fetchBackground(keywords);
            this.pendingRequests.set(cacheKey, requestPromise);

            const result = await requestPromise;
            this.pendingRequests.delete(cacheKey);
            this.cacheResult(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Error fetching background:', error);
            if (error.message.includes('Rate limit exceeded')) {
                // Use a different fallback for rate limits
                return this.getRateLimitedFallback();
            }
            return this.getFallbackBackground();
        }
    }

    async preloadNextBackground(currentQuote) {
        try {
            const nextQuote = this.getNextQuote(currentQuote);
            if (!nextQuote) {
                console.warn('No next quote available for preloading');
                return;
            }

            const keywords = this.extractKeywords(nextQuote);
            const cacheKey = keywords.join(',');

            if (!this.getCachedResult(cacheKey) && !this.preloadedBackgrounds.has(cacheKey)) {
                const background = await this.fetchBackground(keywords);
                this.preloadedBackgrounds.set(cacheKey, background);

                // Save current quote index
                await chrome.storage.local.set({ quote_index: this.currentQuoteIndex });
            }
        } catch (error) {
            console.error('Failed to preload next background:', error);
            // Don't throw the error as this is a non-critical operation
        }
    }

    getNextQuote(currentQuote) {
        if (!currentQuote) {
            this.currentQuoteIndex = 0;
            return quotes[0];
        }

        const currentIndex = quotes.findIndex(q => q.content === currentQuote.content);
        if (currentIndex === -1) {
            this.currentQuoteIndex = 0;
            return quotes[0];
        }

        this.currentQuoteIndex = (currentIndex + 1) % quotes.length;
        return quotes[this.currentQuoteIndex];
    }

    async fetchBackground(keywords, retryCount = 0) {
        try {
            this.checkRateLimit();

            // Add more contextual keywords for better matches
            const enhancedKeywords = [
                ...keywords,
                'hd', 'high resolution', 'wallpaper'
            ];

            const query = encodeURIComponent(enhancedKeywords.join(' '));
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${query}&per_page=15&orientation=landscape&size=large`, {
                headers: {
                    'Authorization': this.apiKey
                }
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < this.maxRetries) {
                    const retryAfter = response.headers.get('Retry-After') || this.retryDelay;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return this.fetchBackground(keywords, retryCount + 1);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.photos || data.photos.length === 0) {
                return this.getFallbackBackground();
            }

            // Filter photos by minimum dimensions and aspect ratio
            const filteredPhotos = data.photos.filter(photo => {
                const aspectRatio = photo.width / photo.height;
                return photo.width >= 1920 && 
                       photo.height >= 1080 && 
                       aspectRatio >= 1.6 && 
                       aspectRatio <= 2.1;
            });

            // Use filtered photos or fall back to all photos if none meet criteria
            const photos = filteredPhotos.length > 0 ? filteredPhotos : data.photos;
            const photo = photos[Math.floor(Math.random() * photos.length)];

            // Pre-download the blur image to ensure it's cached
            await fetch(photo.src.large);

            return {
                url: photo.src.original,
                photographer: photo.photographer,
                photographerUrl: photo.photographer_url,
                blur: photo.src.large, // Use large size for better initial quality
                id: photo.id,
                alt: photo.alt || 'Inspirational background image',
                width: photo.width,
                height: photo.height
            };
        } catch (error) {
            if (error.message.includes('Rate limit exceeded')) {
                throw error;
            }
            if (retryCount < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount)));
                return this.fetchBackground(keywords, retryCount + 1);
            }
            throw error;
        }
    }

    async cacheResult(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Persist cache to storage
        try {
            const cacheObject = Object.fromEntries(this.cache.entries());
            await chrome.storage.local.set({ cached_backgrounds: cacheObject });
        } catch (error) {
            console.error('Failed to persist cache:', error);
        }

        this.cleanCache();
    }

    getRateLimitedFallback() {
        const fallbacks = [
            {
                url: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1280',
                photographer: 'Francesco Ungaro',
                photographerUrl: 'https://www.pexels.com/@francesco-ungaro',
                blur: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=800',
                id: 'rate-limit-1',
                alt: 'Peaceful mountain landscape',
                sizes: {
                    small: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=800',
                    medium: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1280',
                    large: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1920'
                }
            },
            {
                url: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg',
                photographer: 'Aleksey Kuprikov',
                photographerUrl: 'https://www.pexels.com/@aleksey-kuprikov-1343037',
                blur: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=50',
                id: 'rate-limit-2',
                alt: 'Beautiful aurora borealis'
            },
            {
                url: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg',
                photographer: 'eberhard grossgasteiger',
                photographerUrl: 'https://www.pexels.com/@eberhardgross',
                blur: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=50',
                id: 'rate-limit-3',
                alt: 'Scenic mountain sunset'
            }
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    extractKeywords(quote) {
        // Remove common words and punctuation
        const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
        
        // Extract meaningful words from the quote
        const words = quote.content.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .split(/\s+/)
            .filter(word => !commonWords.has(word) && word.length > 3);

        // Map common themes to relevant keywords
        const themeKeywords = {
            'success': ['achievement', 'victory', 'summit', 'mountain peak'],
            'future': ['horizon', 'sunrise', 'dawn', 'path forward'],
            'growth': ['nature', 'forest', 'garden', 'trees'],
            'strength': ['mountain', 'rock', 'ocean', 'powerful'],
            'peace': ['calm water', 'peaceful nature', 'serene landscape'],
            'journey': ['path', 'road', 'adventure', 'exploration'],
            'wisdom': ['ancient', 'library', 'knowledge', 'learning'],
            'hope': ['sunrise', 'light rays', 'breaking dawn'],
            'courage': ['stormy sky', 'challenging terrain', 'dramatic landscape'],
            'change': ['seasons', 'transformation', 'metamorphosis'],
            'dream': ['stars', 'night sky', 'aurora', 'cosmic'],
            'determination': ['mountain climb', 'challenging path', 'upward journey']
        };

        // Find matching themes in the quote
        const matchingThemes = Object.entries(themeKeywords)
            .filter(([theme]) => quote.content.toLowerCase().includes(theme))
            .flatMap(([_, keywords]) => keywords);

        // Combine quote words with matching theme keywords
        const allKeywords = [...words, ...matchingThemes];

        // Add nature-based keywords for better results
        const baseKeywords = [
            'landscape', 'scenic', 'beautiful',
            'inspirational', 'dramatic', 'atmospheric'
        ];

        // Get unique keywords
        const uniqueKeywords = [...new Set([...allKeywords, ...baseKeywords])];

        // Return 4 keywords: 2 from quote/themes, 2 from base keywords
        const quoteRelated = this.shuffleArray(allKeywords).slice(0, 2);
        const baseRelated = this.shuffleArray(baseKeywords).slice(0, 2);
        
        return [...quoteRelated, ...baseRelated];
    }

    // Helper method to shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }

    getFallbackBackground() {
        return {
            url: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1920',
            photographer: 'Francesco Ungaro',
            photographerUrl: 'https://www.pexels.com/@francesco-ungaro',
            blur: 'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg?auto=compress&cs=tinysrgb&w=1280',
            id: 'fallback',
            alt: 'Peaceful mountain landscape'
        };
    }
}

export const backgroundService = new BackgroundService(); 