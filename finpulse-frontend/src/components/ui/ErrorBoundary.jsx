import React from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from './Card';
import { Icon } from './Icon';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Keep error logging clean and non-disruptive
    if (process.env.NODE_ENV !== 'production') {
      // In development, error details are preserved for inspection
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 'var(--space-8)',
            maxWidth: '640px',
            margin: 'var(--space-12) auto',
          }}
        >
          <Card style={{ border: '1px solid var(--color-danger)' }}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    color: 'var(--color-danger)',
                    backgroundColor: 'var(--color-danger-subtle)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                  }}
                >
                  <Icon name="alertTriangle" size={20} />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    An unexpected client-side error occurred while rendering this view.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-active)',
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-danger)',
                  overflowX: 'auto',
                }}
              >
                {this.state.error?.message || 'Unknown application error'}
              </div>
            </CardBody>
            <CardFooter style={{ borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => (window.location.href = '/')}>
                Go to Dashboard
              </Button>
              <Button variant="primary" onClick={this.handleReset}>
                <Icon name="refresh" size={14} />
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
