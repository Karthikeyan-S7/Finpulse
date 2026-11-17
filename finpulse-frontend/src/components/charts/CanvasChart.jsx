import React, { useRef } from 'react';
import { SkeletonCard } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

/**
 * CanvasChart: Shared base component owning the <canvas>, container, lifecycle,
 * tooltip overlay, accessibility role/aria, and loading/empty state fallbacks.
 */
export function CanvasChart({
  height = 260,
  loading = false,
  empty = false,
  emptyMessage = 'No data for this period',
  ariaLabel = 'Financial visualizer chart',
  dataTable = null,
  tooltip = null, // { visible, x, y, content }
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  children,
  canvasRef,
  containerRef: externalContainerRef,
  className = '',
}) {
  const internalContainerRef = useRef(null);
  const containerRef = externalContainerRef || internalContainerRef;

  if (loading) {
    return (
      <div style={{ height: `${height}px`, width: '100%' }}>
        <SkeletonCard style={{ height: '100%', width: '100%' }} />
      </div>
    );
  }

  if (empty) {
    return (
      <div
        style={{
          height: `${height}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EmptyState
          icon="Receipt"
          title="No Data Available"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`canvas-chart-container ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: `${height}px`,
        userSelect: 'none',
        touchAction: 'pan-y',
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: onPointerMove ? 'crosshair' : 'default',
        }}
      />

      {/* Floating Tooltip DOM Overlay */}
      {tooltip && tooltip.visible && tooltip.content && (
        <div
          className="canvas-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: `translate(${tooltip.x > 200 ? '-100%' : '0%'}, -100%)`,
            marginTop: '-10px',
            marginLeft: tooltip.x > 200 ? '-10px' : '10px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: 'var(--space-2) var(--space-3)',
            pointerEvents: 'none',
            zIndex: 20,
            whiteSpace: 'nowrap',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-primary)',
            transition: 'transform 80ms ease-out',
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Visually Hidden Accessible Data Table for Screen Readers */}
      {dataTable && (
        <div
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
          }}
        >
          {dataTable}
        </div>
      )}

      {children}
    </div>
  );
}

export default CanvasChart;
