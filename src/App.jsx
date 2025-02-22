import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { FiSun, FiMoon, FiDroplet, FiWind, FiCloud, FiLoader } from 'react-icons/fi';
import { themes } from './themes';
import { useTheme } from './context/ThemeContext';
import { withDefaultTheme } from './utils/withDefaultTheme';
import QuoteSection from './components/QuoteSection';
import FocusSection from './components/FocusSection';
import TodoSection from './components/TodoSection';
import { backgroundService } from './services/backgroundService';
import { apiKeyManager } from './services/apiKeyManager';
import SetupScreen from './components/SetupScreen';

// Styled components
const Container = styled(motion.div)`
    min-height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);
    color: ${props => props.theme.colors.text};
    transition: background-color 0.3s, color 0.3s;
    position: relative;
    overflow: hidden;
`;

const BackgroundImage = styled(motion.div)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 100%;
    min-height: 100vh;
    width: auto;
    height: auto;
    background-image: url(${props => props.blur});
    background-size: cover;
    background-position: center;
    filter: blur(10px) brightness(0.7);
    opacity: 0.5;
    transition: opacity 0.3s ease;
    z-index: -2;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
    }
`;

const MainBackground = styled(motion.div)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 100%;
    min-height: 100vh;
    width: auto;
    height: auto;
    background-image: url(${props => props.url});
    background-size: cover;
    background-position: center;
    opacity: ${props => props.isLoaded ? 0.8 : 0};
    filter: contrast(1.1) saturate(1.1);
    transition: opacity 1s ease;
    z-index: -1;

    @media (min-width: 2560px) {
        width: 100%;
        height: 100vh;
    }
`;

const PhotoCredit = styled.a`
    position: fixed;
    bottom: 10px;
    right: 10px;
    color: ${props => props.theme.colors.text};
    opacity: 0.5;
    font-size: 0.8rem;
    text-decoration: none;
    z-index: 10;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 1;
    }
`;

const ThemeSwitcher = styled(motion.div)`
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    background: ${props => props.theme.colors.surface}40;
    padding: 10px;
    border-radius: 15px;
    z-index: 1000;
    backdrop-filter: blur(12px);
    border: 1px solid ${props => props.theme.colors.border}40;
`;

const ThemeButton = styled(motion.button)`
    background: none;
    border: none;
    color: ${props => props.theme.colors.text};
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: ${props => props.theme.colors.border};
    }

    &.active {
        background: ${props => props.theme.colors.accent};
    }
`;

const Dashboard = styled(motion.div)`
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: grid;
    gap: 2rem;
    grid-template-areas:
        "time greeting"
        "quote quote"
        "focus todo";
    position: relative;
    z-index: 1;
`;

const LoadingScreen = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${props => withDefaultTheme(props).theme.colors.background};
    z-index: 1000;
`;

const GlassPanel = styled(motion.div)`
    background: ${props => props.theme.colors.surface}40;
    backdrop-filter: blur(12px);
    border-radius: 1.5rem;
    border: 1px solid ${props => props.theme.colors.border}40;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

// Animation variants
const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
};

// Theme icons mapping
const themeIcons = {
    default: FiMoon,
    nature: FiSun,
    ocean: FiDroplet,
    sunset: FiWind,
    nordic: FiCloud
};

// Update the background color in the themes file
const getThemeWithTransparency = (theme) => ({
    ...theme,
    colors: {
        ...theme.colors,
        surface: `${theme.colors.surface}40`,
        border: `${theme.colors.border}40`,
        background: 'transparent'
    }
});

export default function App() {
    const { theme, currentTheme, setTheme, isLoading: isThemeLoading } = useTheme();
    const [time, setTime] = useState(new Date());
    const [name, setName] = useState('');
    const [focus, setFocus] = useState('');
    const [todos, setTodos] = useState([]);
    const [background, setBackground] = useState(null);
    const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
    const [isSetup, setIsSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Wait for theme to be ready
                if (isThemeLoading) return;

                // Initialize API key manager
                const isKeySetup = await apiKeyManager.initialize();
                setIsSetup(isKeySetup);

                if (isKeySetup) {
                    // Load saved data only if API key is set up
                    const data = await chrome.storage.sync.get(['name', 'focus', 'todos']);
                    if (data.name) setName(data.name);
                    if (data.focus) setFocus(data.focus);
                    if (data.todos) setTodos(data.todos);
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();

        // Update time
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isThemeLoading]);

    const handleSetupComplete = () => {
        setIsSetup(true);
    };

    const handleQuoteChange = async (newQuote) => {
        try {
            const newBackground = await backgroundService.getBackgroundForQuote(newQuote);
            
            // Immediately set the blur image
            setBackground({
                ...newBackground,
                tempUrl: newBackground.blur
            });
            setIsBackgroundLoaded(false);

            // Load high quality image
            const img = new Image();
            img.onload = () => {
                setBackground(newBackground);
                setIsBackgroundLoaded(true);
            };
            img.src = newBackground.url;
        } catch (error) {
            console.error('Error updating background:', error);
        }
    };

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Show loading state if theme or app is loading
    if (isThemeLoading || isLoading) {
        return (
            <Container theme={themes.default}>
                <LoadingScreen theme={themes.default}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <FiLoader size={40} />
                    </motion.div>
                </LoadingScreen>
            </Container>
        );
    }

    // Show setup screen if API key is not set
    if (!isSetup) {
        return <SetupScreen theme={theme} onSetupComplete={handleSetupComplete} />;
    }

    // In your App component, modify the theme before passing it to components
    const safeTheme = theme ? getThemeWithTransparency(theme) : getThemeWithTransparency(themes.default);

    return (
        <Container
            theme={safeTheme}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {background && (
                <>
                    <BackgroundImage
                        blur={background.blur}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                    />
                    <MainBackground
                        url={background.tempUrl || background.url}
                        isLoaded={isBackgroundLoaded}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isBackgroundLoaded ? 0.6 : 0.4 }}
                    />
                    <PhotoCredit
                        href={background.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        theme={safeTheme}
                    >
                        Photo by {background.photographer} on Pexels
                    </PhotoCredit>
                </>
            )}

            <ThemeSwitcher theme={safeTheme}>
                {Object.entries(themes).map(([key, themeData]) => {
                    const Icon = themeIcons[key];
                    return (
                        <ThemeButton
                            key={key}
                            onClick={() => setTheme(key)}
                            className={currentTheme === key ? 'active' : ''}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            theme={safeTheme}
                        >
                            <Icon size={20} />
                        </ThemeButton>
                    );
                })}
            </ThemeSwitcher>

            <Dashboard>
                <motion.div
                    className="time-section"
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                >
                    <motion.h1 className="time">
                        {format(time, 'hh:mm a')}
                    </motion.h1>
                    <motion.h2 className="date">
                        {format(time, 'EEEE, MMMM d')}
                    </motion.h2>
                </motion.div>

                <motion.div
                    className="greeting-section"
                    variants={itemVariants}
                >
                    <motion.h2>{getGreeting()}!</motion.h2>
                    <motion.h3
                        contentEditable
                        onBlur={(e) => {
                            const newName = e.target.textContent.trim();
                            setName(newName);
                            chrome.storage.sync.set({ name: newName });
                        }}
                        suppressContentEditableWarning
                    >
                        {name || 'Enter your name'}
                    </motion.h3>
                </motion.div>

                <QuoteSection onQuoteChange={handleQuoteChange} theme={safeTheme}>
                    <GlassPanel>
                        {/* Quote content */}
                    </GlassPanel>
                </QuoteSection>
                <FocusSection focus={focus} setFocus={setFocus} theme={safeTheme}>
                    <GlassPanel>
                        {/* Focus content */}
                    </GlassPanel>
                </FocusSection>
                <TodoSection todos={todos} setTodos={setTodos} theme={safeTheme}>
                    <GlassPanel>
                        {/* Todo content */}
                    </GlassPanel>
                </TodoSection>
            </Dashboard>
        </Container>
    );
} 