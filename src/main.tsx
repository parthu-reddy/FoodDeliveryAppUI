import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.tsx';
import { logger } from './lib/logger.ts';
import './index.css';

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  logger.error('Uncaught Exception', { message, source, lineno, colno, stack: error?.stack });
};

window.onunhandledrejection = (event) => {
  logger.error('Unhandled Promise Rejection', { reason: event.reason });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
