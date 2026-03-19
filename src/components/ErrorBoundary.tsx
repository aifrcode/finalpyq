import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">SOMETHING WENT WRONG</h1>
            <p className="text-gray-400 mb-8">
              An unexpected error occurred. We've logged the details and are working to fix it.
            </p>
            <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-left mb-8 overflow-auto max-h-40">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
