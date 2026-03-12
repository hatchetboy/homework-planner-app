import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('Uncaught error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '2rem auto', maxWidth: '500px' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Something went wrong</h2>
                    <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                        {this.state.error?.message ?? 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
