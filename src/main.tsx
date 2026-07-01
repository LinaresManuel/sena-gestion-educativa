import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch.bind(window);
window.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) => {
  return originalFetch(input, { credentials: 'include', ...init });
}) as typeof window.fetch;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
