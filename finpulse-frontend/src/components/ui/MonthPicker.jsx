import React from 'react';
import { Icon } from './Icon';

export function MonthPicker({
  value,
  onChange,
  className = '',
}) {
  // value is expected in 'YYYY-MM' format
  const parseYearMonth = (ym) => {
    if (!ym || !ym.includes('-')) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const [yearStr, monthStr] = ym.split('-');
    return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
  };

  const { year, month } = parseYearMonth(value);

  const formatDisplay = (y, m) => {
    try {
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return `${y}-${String(m).padStart(2, '0')}`;
    }
  };

  const handlePrev = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNext = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleCurrent = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    onChange(`${curYear}-${curMonth}`);
  };

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrent = value === currentYm;

  return (
    <div className={`month-picker ${className}`.trim()} role="group" aria-label="Month selector">
      <button
        type="button"
        className="month-picker-btn"
        onClick={handlePrev}
        aria-label="Previous month"
        title="Previous month"
      >
        <Icon name="ChevronLeft" size={16} />
      </button>

      <span className="month-picker-label">
        {formatDisplay(year, month)}
      </span>

      <button
        type="button"
        className="month-picker-btn"
        onClick={handleNext}
        aria-label="Next month"
        title="Next month"
      >
        <Icon name="ChevronRight" size={16} />
      </button>

      {!isCurrent && (
        <button
          type="button"
          className="month-picker-btn"
          onClick={handleCurrent}
          title="Jump to current month"
          aria-label="Jump to current month"
          style={{ borderLeft: '1px solid var(--border-subtle)', padding: '0 8px', fontSize: 'var(--font-xs)' }}
        >
          Today
        </button>
      )}
    </div>
  );
}
