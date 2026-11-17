import React from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
