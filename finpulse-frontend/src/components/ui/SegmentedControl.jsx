import React from 'react';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) {
  return (
    <div
      className={`segmented-control ${size === 'sm' ? 'segmented-sm' : ''} ${className}`.trim()}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`segmented-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <span style={{ marginRight: '4px', verticalAlign: 'middle' }}>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
