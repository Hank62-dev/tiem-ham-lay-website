import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// page-flip removes its mount node during destroy(). StrictMode replays effects
// in development, which makes the library try to initialize a detached node.
// Keep the production behavior unchanged while avoiding a blank dev screen.
createRoot(document.getElementById('root')).render(<App />);
