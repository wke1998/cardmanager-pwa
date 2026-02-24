import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 註冊 PWA 的 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('ServiceWorker 註冊成功，範圍:', registration.scope);
      })
      .catch((err) => {
        console.warn('ServiceWorker 註冊失敗:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);