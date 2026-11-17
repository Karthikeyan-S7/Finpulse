import React, { forwardRef } from 'react';
import { Input } from './Input';
import { useCurrency } from '../../context/CurrencyContext';

export const AmountInput = forwardRef(function AmountInput(
  {
    id,
    value,
    onChange,
    placeholder = '0.00',
    error,
    min = '0',
    step = '0.01',
    className = '',
    currencySymbol,
    ...props
  },
  ref
) {
  const { getCurrencySymbol, currency } = useCurrency();
  const prefix =
    currencySymbol ||
    (typeof getCurrencySymbol === 'function'
      ? getCurrencySymbol()
      : currency === 'INR'
      ? '₹'
      : currency || '₹');

  return (
    <Input
      ref={ref}
      id={id}
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      prefix={prefix}
      error={error}
      className={`amount-input ${className}`.trim()}
      {...props}
    />
  );
});
