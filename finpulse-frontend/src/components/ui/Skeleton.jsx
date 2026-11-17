import React from 'react';

export function Skeleton({ width, height, borderRadius, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-text-group ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton skeleton-text"
          style={{ width: idx === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonTitle({ className = '' }) {
  return <div className={`skeleton skeleton-title ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton skeleton-card ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`table-container ${className}`.trim()} aria-hidden="true">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx}>
                <div className="skeleton" style={{ height: '14px', width: '60%' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx}>
                  <div className="skeleton" style={{ height: '14px', width: `${65 + ((rIdx + cIdx) % 4) * 10}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
