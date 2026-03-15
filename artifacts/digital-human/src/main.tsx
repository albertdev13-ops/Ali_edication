import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.DEV) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      return;
    }

    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=3`).catch((error) => {
      console.warn('PWA offline cache unavailable', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
