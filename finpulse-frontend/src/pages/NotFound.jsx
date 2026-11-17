import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';

export function NotFound() {
  useDocumentTitle('404 Page Not Found');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Icon name="AlertCircle" size={32} />
      </div>

      <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>
        404 - Page Not Found
      </h1>

      <p style={{ color: 'var(--text-muted)', maxWidth: '420px', marginBottom: 'var(--space-6)', fontSize: 'var(--font-sm)' }}>
        The route or view you requested does not exist or has been relocated in FinPulse v2.
      </p>

      <Link to="/">
        <Button variant="primary" icon={<Icon name="Dashboard" size={16} />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}

export default NotFound;
