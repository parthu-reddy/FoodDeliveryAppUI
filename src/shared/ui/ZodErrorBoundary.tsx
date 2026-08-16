import React, { Component, ErrorInfo, ReactNode } from 'react';
import { z } from 'zod';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  contextName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ZodErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = this.props.contextName || 'ZodErrorBoundary';
    
    let isZodError = false;
    let issues = '';

    if (error instanceof z.ZodError) {
      isZodError = true;
      issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    } else if (error && (error).name === 'ZodError') {
      isZodError = true;
      // @ts-expect-error Temporarily bypass for API mismatch/TS2589
      issues = JSON.stringify((error).issues || error.message);
    }

    if (isZodError) {
      logger.error(`Zod Render Validation Failed [${context}]`, {
        issues,
        componentStack: errorInfo.componentStack,
        originalError: error
      });
    } else {
      logger.error(`React Render Error [${context}]`, {
        error: error.message,
        componentStack: errorInfo.componentStack,
        originalError: error
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-md bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200 border border-red-200 dark:border-red-800 m-4">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">We're sorry, but there was an error displaying this section.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
             <pre className="mt-4 p-2 bg-red-100 dark:bg-red-950 rounded text-xs overflow-auto max-h-40">
               {this.state.error.message}
             </pre>
          )}
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
