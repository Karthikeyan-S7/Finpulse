import React, { forwardRef } from 'react';
import { Input } from './Input';

export const DateInput = forwardRef(function DateInput(
  { id, value, onChange, error, className = '', ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      id={id}
      type="date"
      value={value}
      onChange={onChange}
      error={error}
      className={`date-input ${className}`.trim()}
      {...props}
    />
  );
});
