import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../themes';
import { withDefaultTheme } from '../utils/withDefaultTheme';

const ThemeContext = createContext({
    currentTheme: 'default',
    theme: themes.default,
    setTheme: () => {},
    isLoading: true
});

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        console.warn('useTheme must be used within a ThemeProvider, falling back to default theme');
        return {
            currentTheme: 'default',
            theme: themes.default,
            setTheme: () => {},
            isLoading: false
        };
    }
    return context;
}

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initializeTheme = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load saved theme
                const result = await chrome.storage.sync.get('theme');
                if (result.theme && themes[result.theme]) {
                    setCurrentTheme(result.theme);
                }
            } catch (error) {
                console.error('Failed to load theme:', error);
                setError(error);
                // Fallback to default theme
                setCurrentTheme('default');
            } finally {
                setIsLoading(false);
            }
        };

        initializeTheme();
    }, []);

    const value = {
        currentTheme,
        theme: withDefaultTheme({ theme: themes[currentTheme] }).theme,
        setTheme: async (theme) => {
            if (themes[theme]) {
                try {
                    setCurrentTheme(theme);
                    await chrome.storage.sync.set({ theme });
                } catch (error) {
                    console.error('Failed to save theme:', error);
                    // Optionally revert the theme if save fails
                    setCurrentTheme(currentTheme);
                }
            }
        },
        isLoading,
        error
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
} 