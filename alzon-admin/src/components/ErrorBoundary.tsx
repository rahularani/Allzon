import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Something went wrong</h1>
          <p style={{ color: '#64748B', marginBottom: 24 }}>The application encountered an unexpected error.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Refresh Page
          </button>
          <pre style={{ marginTop: 32, padding: 16, background: '#F1F5F9', color: '#EF4444', textAlign: 'left', borderRadius: 8, overflowX: 'auto', fontSize: 12 }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
