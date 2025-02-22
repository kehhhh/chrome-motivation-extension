import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { FiRefreshCw, FiCornerUpRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { quotes } from '../data/quotes';

const QuoteContainer = styled(motion.div)`
    grid-area: quote;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
    padding: 2.5rem;
    background: ${props => props.theme.colors.surface};
    border-radius: 1.5rem;
    position: relative;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid ${props => props.theme.colors.border};
    overflow: hidden;

    &::before {
        content: '"';
        position: absolute;
        top: -2rem;
        left: 2rem;
        font-size: 12rem;
        opacity: 0.1;
        color: ${props => props.theme.colors.accent};
        font-family: Georgia, serif;
    }
`;

const RefreshButton = styled(motion.button)`
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: ${props => props.theme.colors.border};
    border: none;
    color: ${props => props.theme.colors.text};
    cursor: pointer;
    padding: 0.75rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => props.theme.colors.accent};
        color: white;
        transform: rotate(180deg);
    }
`;

const Quote = styled(motion.blockquote)`
    font-size: 1.75rem;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 1.5rem;
    color: ${props => props.theme.colors.text};
    font-family: 'Inter', sans-serif;
    position: relative;
    padding: 0 1rem;
`;

const Author = styled(motion.div)`
    font-size: 1.1rem;
    color: ${props => props.theme.colors.text};
    opacity: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &::before {
        content: '';
        width: 2rem;
        height: 1px;
        background: ${props => props.theme.colors.accent};
        margin-right: 0.5rem;
    }

    &::after {
        content: '';
        width: 2rem;
        height: 1px;
        background: ${props => props.theme.colors.accent};
        margin-left: 0.5rem;
    }
`;

const ShareButton = styled(motion.button)`
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    color: ${props => props.theme.colors.text};
    cursor: pointer;
    padding: 0.5rem;
    opacity: 0.6;
    transition: all 0.3s ease;

    &:hover {
        opacity: 1;
        color: ${props => props.theme.colors.accent};
    }
`;

const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function QuoteSection({ onQuoteChange }) {
    const { theme } = useTheme();
    const [quote, setQuote] = useState(quotes[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getRandomQuote = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get a random quote that's different from the current one
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * quotes.length);
            } while (quotes[newIndex].content === quote.content && quotes.length > 1);

            const newQuote = quotes[newIndex];
            
            // Add a small delay for smooth animation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setQuote(newQuote);
            
            // Trigger background change
            if (onQuoteChange) {
                try {
                    await onQuoteChange(newQuote);
                } catch (error) {
                    console.error('Failed to update background:', error);
                    // Don't set error state as this is non-critical
                }
            }
        } catch (error) {
            console.error('Failed to update quote:', error);
            setError('Failed to update quote. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const shareQuote = async () => {
        try {
            await navigator.share({
                title: 'Inspirational Quote',
                text: `"${quote.content}" - ${quote.author}`,
            });
        } catch (error) {
            // Ignore AbortError as it's triggered when user cancels share
            if (error.name !== 'AbortError') {
                console.error('Sharing failed:', error);
            }
        }
    };

    useEffect(() => {
        getRandomQuote();
    }, []);

    return (
        <QuoteContainer
            theme={theme}
            variants={quoteVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <RefreshButton
                theme={theme}
                onClick={getRandomQuote}
                disabled={isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={isLoading ? { rotate: 360 } : {}}
                transition={isLoading ? { repeat: Infinity, duration: 1 } : {}}
            >
                <FiRefreshCw size={20} />
            </RefreshButton>

            <AnimatePresence mode="wait">
                {error ? (
                    <Quote
                        key="error"
                        theme={theme}
                        variants={quoteVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ color: '#e74c3c' }}
                    >
                        {error}
                    </Quote>
                ) : (
                    <>
                        <Quote
                            key={quote.content}
                            theme={theme}
                            variants={quoteVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {quote.content}
                        </Quote>
                        <Author
                            key={quote.author}
                            theme={theme}
                            variants={quoteVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {quote.author}
                        </Author>
                    </>
                )}
            </AnimatePresence>

            <ShareButton
                theme={theme}
                onClick={shareQuote}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <FiCornerUpRight size={20} />
            </ShareButton>
        </QuoteContainer>
    );
} 