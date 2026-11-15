import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { GameProvider } from './store.jsx';
import './index.css';

// The shareable preview page has no server and no service worker, and keeps routes in memory.
const STATIC = import.meta.env.VITE_STATIC === '1';
const Router = STATIC ? MemoryRouter : BrowserRouter;
if (!STATIC) registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <GameProvider>
        <App />
      </GameProvider>
    </Router>
  </React.StrictMode>,
);
