import React from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { FiTarget, FiEdit3 } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const FocusContainer = styled(motion.div)`
    grid-area: focus;
    background: ${props => props.theme.colors.surface};
    padding: 2.5rem;
    border-radius: 1.5rem;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid ${props => props.theme.colors.border};
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
`;

const FocusHeader = styled(motion.div)`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    color: ${props => props.theme.colors.text};
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: -0.75rem;
        left: 0;
        width: 50px;
        height: 3px;
        background: ${props => props.theme.colors.accent};
        border-radius: 2px;
    }
`;

const FocusIcon = styled(motion(FiTarget))`
    color: ${props => props.theme.colors.accent};
    width: 28px;
    height: 28px;
`;

const FocusTitle = styled(motion.h3)`
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
`;

const FocusInput = styled(motion.div)`
    margin-top: 1.5rem;
    font-size: 1.5rem;
    font-weight: 500;
    outline: none;
    cursor: text;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
    min-height: 3.5rem;
    transition: all 0.3s ease;
    position: relative;

    &:empty:before {
        content: "What's your main focus for today?";
        color: ${props => props.theme.colors.text};
        opacity: 0.5;
        font-weight: 400;
    }

    &:hover {
        background: ${props => `${props.theme.colors.border}dd`};
    }

    &:focus {
        background: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 2px ${props => props.theme.colors.accent};
    }
`;

const EditIcon = styled(motion(FiEdit3))`
    position: absolute;
    top: 50%;
    right: 1.5rem;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.text};
    opacity: 0;
    transition: opacity 0.3s ease;
`;

const FocusWrapper = styled.div`
    position: relative;

    &:hover ${EditIcon} {
        opacity: 0.5;
    }
`;

const focusVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};

const iconVariants = {
    initial: { rotate: -90 },
    animate: { rotate: 0 },
    hover: { rotate: 15, scale: 1.1 }
};

export default function FocusSection({ focus, setFocus }) {
    const { theme } = useTheme();

    const handleFocusChange = (e) => {
        const newFocus = e.target.textContent.trim();
        setFocus(newFocus);
        chrome.storage.sync.set({ focus: newFocus });
    };

    return (
        <FocusContainer
            theme={theme}
            variants={focusVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <FocusHeader theme={theme}>
                <FocusIcon
                    theme={theme}
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                />
                <FocusTitle
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    TODAY'S MAIN FOCUS
                </FocusTitle>
            </FocusHeader>

            <FocusWrapper>
                <FocusInput
                    theme={theme}
                    contentEditable
                    onBlur={handleFocusChange}
                    suppressContentEditableWarning
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    whileFocus={{ scale: 1.02 }}
                >
                    {focus}
                </FocusInput>
                <EditIcon size={18} theme={theme} />
            </FocusWrapper>
        </FocusContainer>
    );
} 