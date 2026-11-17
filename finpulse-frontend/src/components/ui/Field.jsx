import React from 'react';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span style={{ color: 'var(--color-expense)', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
}
