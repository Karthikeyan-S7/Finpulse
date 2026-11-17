import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    id,
    value,
    onChange,
    options = [],
    placeholder,
    error,
    className = '',
    disabled = false,
    required = false,
    children,
    ...props
  },
  ref
) {
  return (
    <select
      ref={ref}
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      aria-invalid={error ? 'true' : 'false'}
      className={['select', error ? 'error' : '', className].filter(Boolean).join(' ')}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.length > 0
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
});
