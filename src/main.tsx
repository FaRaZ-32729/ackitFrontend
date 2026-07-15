// Global security exception and console shield for cross-origin iframes
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args.map(arg => {
      try {
        if (!arg) return '';
        return typeof arg === 'string' ? arg : (arg.message || String(arg));
      } catch (e) {
        return '';
      }
    }).join(' ');
    
    if (
      message.includes('SecurityError') || 
      message.includes('cross-origin frame') || 
      message.includes('$$typeof') ||
      message.includes('Blocked a frame')
    ) {
      console.warn('[Security Shield Ignored]', ...args);
      return;
    }
    originalError(...args);
  };

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (
      errorMsg.includes('SecurityError') || 
      errorMsg.includes('cross-origin') || 
      errorMsg.includes('$$typeof') ||
      errorMsg.includes('Blocked a frame')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || '';
    if (
      reasonMsg.includes('SecurityError') || 
      reasonMsg.includes('cross-origin') || 
      reasonMsg.includes('$$typeof') ||
      reasonMsg.includes('Blocked a frame')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

