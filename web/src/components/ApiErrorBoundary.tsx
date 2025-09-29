import React, { type JSX } from 'react';
import type { ApiError } from '../types/api';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

interface ApiErrorBoundaryState {
  error: ApiError | Error | null;
}

export class ApiErrorBoundary extends React.Component<
  ApiErrorBoundaryProps,
  ApiErrorBoundaryState
> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: ApiError | Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ApiErrorBoundary caught error:', error, info);
  }

  private renderDetails(details: unknown): string {
    if (details == null) return '';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  }

  render(): JSX.Element {
    const { error } = this.state;

    if (error) {
      const message = (error as ApiError).message || 'An unexpected error occurred';
      const details = (error as ApiError).details;

      return (
        <div className="p-4 bg-red-50 border border-red-300 rounded">
          <h2 className="font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-800">{message}</p>
          {details !== undefined && details !== null && (
            <pre className="mt-2 p-2 bg-red-100 text-xs rounded overflow-x-auto">
              {this.renderDetails(details)}
            </pre>
          )}
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
