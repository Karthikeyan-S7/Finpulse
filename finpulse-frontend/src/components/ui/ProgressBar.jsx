import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'auto',
  showLabel = false,
  label,
  height = 8,
  className = '',
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  let colorClass = variant;
  if (variant === 'auto') {
    if (percentage > 100) colorClass = 'danger';
    else if (percentage >= 80) colorClass = 'warning';
    else colorClass = 'success';
  }

  return (
    <div className={`progress-bar-wrapper ${className}`.trim()}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-1)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="progress-bar-track"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
