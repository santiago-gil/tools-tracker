import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error);
    console.error('Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="form-width bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-semibold text-primary mb-2">
                Something went wrong
              </h2>
              <p className="text-secondary mb-6">{errorMessage}</p>
              {import.meta.env.DEV && this.state.error?.stack && (
                <details className="text-left bg-gray-100 dark:bg-gray-900 p-4 rounded mb-4 max-h-60 overflow-auto">
                  <summary className="cursor-pointer text-sm font-semibold mb-2">
                    Error details (development only)
                  </summary>
                  <pre className="text-xs whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              {!import.meta.env.DEV && this.state.error && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Error ID: {Date.now().toString(36)}-
                  {Math.random().toString(36).substr(2, 9)}
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <button onClick={this.handleReset} className="btn-secondary">
                  Try Again
                </button>
                <button onClick={() => window.location.reload()} className="btn-primary">
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
