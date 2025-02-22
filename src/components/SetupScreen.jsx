import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FiKey, FiExternalLink } from 'react-icons/fi';
import { apiKeyManager } from '../services/apiKeyManager';
import { themes } from '../themes';
import { withDefaultTheme } from '../utils/withDefaultTheme';
import { useTheme } from '../context/ThemeContext';

const StyledContainer = styled(motion.div)`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${props => props.theme?.colors?.background || themes.default.colors.background};
    color: ${props => props.theme?.colors?.text || themes.default.colors.text};
`;

const StyledCard = styled(motion.div)`
    background: ${props => props.theme?.colors?.surface || themes.default.colors.surface};
    padding: 2.5rem;
    border-radius: 1.5rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid ${props => props.theme?.colors?.border || themes.default.colors.border};
`;

const StyledTitle = styled.h1`
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: ${props => props.theme?.colors?.text || themes.default.colors.text};
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const StyledDescription = styled.p`
    margin-bottom: 2rem;
    line-height: 1.6;
    opacity: 0.8;
    color: ${props => props.theme?.colors?.text || themes.default.colors.text};
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 1rem;
    background: ${props => props.theme?.colors?.border || themes.default.colors.border};
    color: ${props => props.theme?.colors?.text || themes.default.colors.text};
    font-size: 1rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        box-shadow: 0 0 0 2px ${props => props.theme?.colors?.accent || themes.default.colors.accent};
    }

    &::placeholder {
        color: ${props => props.theme?.colors?.text || themes.default.colors.text};
        opacity: 0.5;
    }
`;

const StyledButton = styled(motion.button)`
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 1rem;
    background: ${props => props.theme?.colors?.accent || themes.default.colors.accent};
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px ${props => props.theme?.colors?.accent + '50' || themes.default.colors.accent + '50'};
    }
`;

const StyledLink = styled.a`
    color: ${props => props.theme?.colors?.accent || themes.default.colors.accent};
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    transition: all 0.3s ease;

    &:hover {
        opacity: 0.8;
    }
`;

const StyledError = styled(motion.div)`
    color: #e74c3c;
    margin-top: 1rem;
    font-size: 0.9rem;
    background: ${props => props.theme?.colors?.error || 'rgba(231, 76, 60, 0.1)'};
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
`;

export default function SetupScreen({ onSetupComplete }) {
    const { theme } = useTheme();
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await apiKeyManager.setApiKey(apiKey);
            onSetupComplete();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const safeTheme = theme || themes.default;

    return (
        <StyledContainer
            theme={safeTheme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <StyledCard theme={safeTheme}>
                <StyledTitle theme={safeTheme}>
                    <FiKey size={24} />
                    Welcome to Motivational Dashboard
                </StyledTitle>
                
                <StyledDescription theme={safeTheme}>
                    To get started, you'll need a Pexels API key. This allows us to fetch beautiful
                    background images that match your daily quotes. Your API key is stored securely
                    in your browser and is never shared.
                </StyledDescription>

                <form onSubmit={handleSubmit}>
                    <StyledInput
                        theme={safeTheme}
                        type="password"
                        placeholder="Enter your Pexels API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoFocus
                    />

                    <StyledButton
                        theme={safeTheme}
                        type="submit"
                        disabled={!apiKey || isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? 'Verifying...' : 'Get Started'}
                    </StyledButton>

                    {error && (
                        <StyledError
                            theme={safeTheme}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </StyledError>
                    )}
                </form>

                <StyledLink
                    href="https://www.pexels.com/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    theme={safeTheme}
                >
                    Get a free Pexels API key
                    <FiExternalLink size={16} />
                </StyledLink>
            </StyledCard>
        </StyledContainer>
    );
} 