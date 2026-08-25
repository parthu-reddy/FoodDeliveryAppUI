import { ErrorBoundary } from "@shared/ui";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logger } from './lib/logger.ts';

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  logger.error('Uncaught Exception', { message, source, lineno, colno, stack: error?.stack });
};

window.onunhandledrejection = (event) => {
  logger.error('Unhandled Promise Rejection', { reason: event.reason });
};

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass', // Don't warn on unhandled requests (like static assets)
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});
const _test_unused_ = 'break_lint';
