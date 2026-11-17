import React from 'react';
import { Icon } from './Icon';

export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  sortField,
  sortDirection = 'asc',
  onSort,
  emptyState,
  loading = false,
  className = '',
  onRowClick,
}) {
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    onSort(col.key);
  };

  return (
    <div className={`table-container ${className}`.trim()}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortField === col.key;
              const isSortable = !!col.sortable;

              return (
                <th
                  key={col.key}
                  className={isSortable ? 'sortable' : ''}
                  onClick={() => handleSort(col)}
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width || 'auto',
                  }}
                  aria-sort={
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    <span>{col.label}</span>
                    {isSortable && (
                      <span style={{ opacity: isSorted ? 1 : 0.3 }}>
                        {isSorted && sortDirection === 'desc' ? (
                          <Icon name="ArrowDown" size={12} strokeWidth={2.5} />
                        ) : (
                          <Icon name="ArrowUp" size={12} strokeWidth={2.5} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <span className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px' }} />
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                  Loading records...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}
              >
                {emptyState || 'No records found.'}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowKey = row[keyField] ?? index;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => {
                    const cellValue = col.render ? col.render(row[col.key], row, index) : row[col.key];
                    return (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || 'left',
                          fontVariantNumeric: col.numeric ? 'tabular-nums' : undefined,
                        }}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
