import { Surface } from '@shared/ui';
import React, { ErrorInfo, ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  /** Context-specific label shown in the error UI (e.g. "Order Tracker", "Admin Map") */
  fallbackLabel?: string;
  /** Optional callback to retry/reset the boundary without a full page reload */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React ErrorBoundary Caught Exception', { 
      error: error.message, 
      stack: error.stack, 
      componentStack: errorInfo.componentStack,
      fallbackLabel: this.props.fallbackLabel || 'Unknown' 
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const label = this.props.fallbackLabel || 'This section';
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 font-sans p-4 rounded-xl">
          <Surface radius="md" elevation={2} className="p-6 max-w-md w-full text-center space-y-3">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{label} encountered an error</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Something went wrong while loading this section. You can try again or reload the page.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-left overflow-auto max-h-32 border border-rose-100 dark:border-rose-800/30">
                <p className="text-xs font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={this.handleRetry}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </Surface>
        </div>
      );
    }

    return this.props.children;
  }
}
