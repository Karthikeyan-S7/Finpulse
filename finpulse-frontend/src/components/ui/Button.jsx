import React from 'react';

/**
 * Clean, Accessible Fintech Button
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  iconOnly = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    iconOnly ? 'btn-icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {!iconOnly && <span>Loading...</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon" aria-hidden="true">{icon}</span>}
          {!iconOnly && children}
          {iconOnly && (children || icon)}
          {icon && iconPosition === 'right' && !iconOnly && <span className="btn-icon" aria-hidden="true">{icon}</span>}
        </>
      )}
    </button>
  );
}
