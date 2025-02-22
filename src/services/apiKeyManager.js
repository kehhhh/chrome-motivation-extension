const API_KEY_CONFIG = {
    STORAGE_KEY: 'pexels_api_key',
    SETUP_STATUS: 'api_key_setup_status'
};

class ApiKeyManager {
    constructor() {
        this.isSetup = false;
    }

    async initialize() {
        try {
            const { [API_KEY_CONFIG.SETUP_STATUS]: setupStatus } = await chrome.storage.local.get(API_KEY_CONFIG.SETUP_STATUS);
            this.isSetup = setupStatus === true;
            return this.isSetup;
        } catch (error) {
            console.error('Failed to initialize API key manager:', error);
            return false;
        }
    }

    async getApiKey() {
        try {
            const { [API_KEY_CONFIG.STORAGE_KEY]: apiKey } = await chrome.storage.local.get(API_KEY_CONFIG.STORAGE_KEY);
            return apiKey || null;
        } catch (error) {
            console.error('Failed to get API key:', error);
            return null;
        }
    }

    async setApiKey(key) {
        if (!this.isValidApiKey(key)) {
            throw new Error('Invalid API key format');
        }

        try {
            // Verify the API key works before saving
            const isValid = await this.verifyApiKey(key);
            if (!isValid) {
                throw new Error('Invalid API key - verification failed');
            }

            await chrome.storage.local.set({
                [API_KEY_CONFIG.STORAGE_KEY]: key,
                [API_KEY_CONFIG.SETUP_STATUS]: true
            });
            
            this.isSetup = true;
            return true;
        } catch (error) {
            console.error('Failed to set API key:', error);
            throw error;
        }
    }

    async verifyApiKey(key) {
        try {
            const response = await fetch('https://api.pexels.com/v1/search?query=nature&per_page=1', {
                headers: {
                    'Authorization': key
                }
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    isValidApiKey(key) {
        // Basic validation for Pexels API key format
        return typeof key === 'string' && key.length > 30;
    }

    async clearApiKey() {
        try {
            await chrome.storage.local.remove([API_KEY_CONFIG.STORAGE_KEY, API_KEY_CONFIG.SETUP_STATUS]);
            this.isSetup = false;
            return true;
        } catch (error) {
            console.error('Failed to clear API key:', error);
            return false;
        }
    }

    async isKeySetup() {
        return this.isSetup;
    }
}

export const apiKeyManager = new ApiKeyManager(); 