import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <ThemeProvider>
        <App />
    </ThemeProvider>
); 