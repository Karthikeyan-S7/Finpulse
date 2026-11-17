import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
  icon,
  className = '',
  ...props
}) {
  // Normalize variant aliases
  let badgeVariant = variant;
  if (variant === 'success') badgeVariant = 'income';
  if (variant === 'danger') badgeVariant = 'expense';

  return (
    <span
      className={`badge badge-${badgeVariant} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
