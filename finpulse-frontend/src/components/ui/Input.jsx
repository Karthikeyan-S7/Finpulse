import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    prefix,
    suffix,
    className = '',
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputEl = (
    <input
      ref={ref}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      aria-invalid={error ? 'true' : 'false'}
      className={[
        'input',
        error ? 'error' : '',
        prefix ? 'has-prefix' : '',
        suffix ? 'has-suffix' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );

  if (prefix || suffix) {
    return (
      <div className="input-group">
        {prefix && <span className="input-prefix">{prefix}</span>}
        {inputEl}
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
    );
  }

  return inputEl;
});
