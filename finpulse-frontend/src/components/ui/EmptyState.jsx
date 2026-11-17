import React from 'react';
import { Icon } from './Icon';

export function EmptyState({
  icon = 'Transactions',
  title = 'No records found',
  description,
  action,
  className = '',
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon} size={40} strokeWidth={1.5} />;
    }
    return icon;
  };

  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-icon" aria-hidden="true">
        {renderIcon()}
      </div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div className="empty-action" style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
}
