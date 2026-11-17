import React from 'react';
import { StatCard as BaseStatCard } from './ui/StatCard';
import { useCurrency } from '../context/CurrencyContext';

export function StatCard({ title, amount, subtitle, icon, color, trend, delta, label, value, ...props }) {
  const { formatAmount } = useCurrency();

  const displayLabel = label || title;
  const displayValue = value !== undefined ? value : (typeof amount === 'number' ? formatAmount(amount) : amount);
  const displayDelta = delta || trend;

  return (
    <BaseStatCard
      label={displayLabel}
      value={displayValue}
      delta={displayDelta}
      subtitle={subtitle}
      icon={icon}
      {...props}
    />
  );
}

export default StatCard;
