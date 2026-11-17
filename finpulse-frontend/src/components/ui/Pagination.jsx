import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize,
  className = '',
}) {
  if (totalPages <= 1 && !totalItems) return null;

  const startItem = totalItems !== undefined && pageSize ? (page - 1) * pageSize + 1 : null;
  const endItem = totalItems !== undefined && pageSize ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className={`pagination ${className}`.trim()} role="navigation" aria-label="Pagination">
      <div className="pagination-info">
        {totalItems !== undefined && startItem && endItem ? (
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{startItem}</strong> to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{endItem}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          icon={<Icon name="ChevronLeft" size={14} />}
        >
          Previous
        </Button>

        <span style={{ padding: '0 var(--space-2)', fontSize: 'var(--font-xs)', fontWeight: 'var(--weight-semibold)' }}>
          {page} / {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          icon={<Icon name="ChevronRight" size={14} />}
          iconPosition="right"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
