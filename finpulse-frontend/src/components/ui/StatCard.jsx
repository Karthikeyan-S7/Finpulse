import React from 'react';
import { Icon } from './Icon';

export function StatCard({
  label,
  value,
  delta,
  trend, // 'positive' | 'negative' | 'neutral'
  subtitle,
  icon,
  className = '',
  onClick,
  ...props
}) {
  // Derive trend if not explicitly passed
  let trendClass = trend;
  if (!trendClass && delta) {
    if (delta.startsWith('+')) trendClass = 'positive';
    else if (delta.startsWith('-')) trendClass = 'negative';
    else trendClass = 'neutral';
  }

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon} size={20} />;
    }
    return icon;
  };

  return (
    <div
      className={`stat-card ${className}`.trim()}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      {...props}
    >
      <div className="stat-header">
        <span>{label}</span>
        {icon && <span className="stat-icon-wrapper">{renderIcon()}</span>}
      </div>

      <div className="stat-value">{value}</div>

      {(delta || subtitle) && (
        <div className="stat-footer">
          {delta && (
            <span className={`stat-delta ${trendClass || 'neutral'}`}>
              {trendClass === 'positive' && <Icon name="ArrowUp" size={12} strokeWidth={2.5} />}
              {trendClass === 'negative' && <Icon name="ArrowDown" size={12} strokeWidth={2.5} />}
              {delta}
            </span>
          )}
          {subtitle && <span className="stat-subtext">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
