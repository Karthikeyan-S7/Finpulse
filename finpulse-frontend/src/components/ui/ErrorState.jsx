import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export function ErrorState({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while communicating with the service.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <div className="error-icon" aria-hidden="true">
        <Icon name="AlertCircle" size={40} strokeWidth={1.5} />
      </div>
      <h3 className="error-title">{title}</h3>
      <p className="error-desc">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<Icon name="Refresh" size={14} />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
