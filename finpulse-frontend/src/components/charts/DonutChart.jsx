import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useCanvas } from './useCanvas';
import { CanvasChart } from './CanvasChart';

export function DonutChart({
  data = [],
  height = 260,
  donutWidth = 26,
  showLegend = true,
  loading = false,
  emptyMessage = 'No expense records found for this period',
  ariaLabel = 'Category spending breakdown donut chart',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { formatAmount } = useCurrency();

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Process data: filter > 0, sort descending, group beyond 6 into "Other"
  const slices = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const raw = data
      .map((item) => ({
        name: item.name || item.category || item.label || 'Uncategorized',
        amount: Math.max(0, Number(item.amount ?? item.value ?? item.totalAmount ?? 0)),
        color: item.color || null,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const totalAmount = raw.reduce((sum, item) => sum + item.amount, 0);
    if (totalAmount === 0) return [];

    let processed = raw;
    if (raw.length > 6) {
      const top5 = raw.slice(0, 5);
      const remainingAmount = raw.slice(5).reduce((sum, item) => sum + item.amount, 0);
      processed = [
        ...top5,
        {
          name: 'Other',
          amount: remainingAmount,
          color: null,
        },
      ];
    }

    return processed.map((item) => ({
      ...item,
      percent: Math.round((item.amount / totalAmount) * 100),
      exactPercent: ((item.amount / totalAmount) * 100).toFixed(1),
    }));
  }, [data]);

  const total = useMemo(() => {
    return slices.reduce((sum, s) => sum + s.amount, 0);
  }, [slices]);

  // Canvas Drawing
  const onDraw = useCallback(
    ({ ctx, width: canvasW, height: canvasH, progress, colors }) => {
      if (slices.length === 0 || total === 0) return;

      const outerRadius = Math.min(canvasW / 2 - 12, canvasH / 2 - 12, 100);
      const innerRadius = Math.max(20, outerRadius - donutWidth);

      const cx = canvasW / 2;
      const cy = canvasH / 2;

      let startAngle = -Math.PI / 2;
      const totalAngle = Math.PI * 2 * progress;

      // Draw each slice
      slices.forEach((slice, i) => {
        const sliceAngle = (slice.amount / total) * totalAngle;
        const endAngle = startAngle + sliceAngle;
        const isHovered = i === hoverIndex;

        const sliceOuterR = isHovered ? outerRadius + 4 : outerRadius;
        const sliceInnerR = isHovered ? Math.max(16, innerRadius - 2) : innerRadius;
        const sliceColor = slice.color || colors.palette[i % colors.palette.length];

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, sliceOuterR, startAngle, endAngle, false);
        ctx.arc(cx, cy, sliceInnerR, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = sliceColor;
        ctx.fill();

        // Slice separator gap
        ctx.lineWidth = 1.75;
        ctx.strokeStyle = colors.bgSurface;
        ctx.stroke();
        ctx.restore();

        startAngle = endAngle;
      });

      // Center Text (Total Spent)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = colors.textMuted;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Total Spent', cx, cy - 10);

      ctx.fillStyle = colors.textPrimary;
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(formatAmount(total), cx, cy + 10);
    },
    [slices, total, donutWidth, hoverIndex, formatAmount]
  );

  useCanvas({
    canvasRef,
    containerRef,
    onDraw,
    dependencies: [slices, total, donutWidth, hoverIndex],
  });

  // Interactive hit testing using Math.atan2 and distance radius
  const handlePointer = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container || slices.length === 0 || total === 0) return;

      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const outerRadius = Math.min(rect.width / 2 - 12, rect.height / 2 - 12, 100);
      const innerRadius = Math.max(20, outerRadius - donutWidth);

      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if pointer is within ring bounds
      if (distance >= innerRadius - 4 && distance <= outerRadius + 8) {
        let angle = Math.atan2(dy, dx);
        let normalized = angle - -Math.PI / 2;
        if (normalized < 0) normalized += Math.PI * 2;

        let accumulated = 0;
        let matchedIndex = null;

        for (let i = 0; i < slices.length; i++) {
          const sliceAngle = (slices[i].amount / total) * Math.PI * 2;
          if (normalized >= accumulated && normalized <= accumulated + sliceAngle) {
            matchedIndex = i;
            break;
          }
          accumulated += sliceAngle;
        }

        if (matchedIndex !== null) {
          setHoverIndex(matchedIndex);
          const s = slices[matchedIndex];
          setTooltip({
            visible: true,
            x: mouseX,
            y: mouseY,
            content: (
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '2px' }}>
                  {s.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatAmount(s.amount)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>({s.exactPercent}%)</span>
                </div>
              </div>
            ),
          });
          return;
        }
      }

      setHoverIndex(null);
      setTooltip({ visible: false, x: 0, y: 0, content: null });
    },
    [slices, total, donutWidth, formatAmount]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  }, []);

  // Screen reader accessible data table
  const accessibleTable = useMemo(() => {
    return (
      <table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Amount</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((s, i) => (
            <tr key={i}>
              <td>{s.name}</td>
              <td>{formatAmount(s.amount)}</td>
              <td>{s.exactPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [slices, formatAmount, ariaLabel]);

  // If legend is disabled, render just the canvas full width
  if (!showLegend) {
    return (
      <div style={{ width: '100%', height: `${height}px` }}>
        <CanvasChart
          height={height}
          loading={loading}
          empty={slices.length === 0}
          emptyMessage={emptyMessage}
          ariaLabel={ariaLabel}
          dataTable={accessibleTable}
          tooltip={tooltip}
          canvasRef={canvasRef}
          containerRef={containerRef}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={handlePointerLeave}
        />
      </div>
    );
  }

  // When legend is enabled, use stable flex layout without self-resizing feedback loop
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        width: '100%',
        minHeight: `${height}px`,
      }}
    >
      <div style={{ flex: '0 0 auto', width: `${Math.min(height, 220)}px`, height: `${height}px` }}>
        <CanvasChart
          height={height}
          loading={loading}
          empty={slices.length === 0}
          emptyMessage={emptyMessage}
          ariaLabel={ariaLabel}
          dataTable={accessibleTable}
          tooltip={tooltip}
          canvasRef={canvasRef}
          containerRef={containerRef}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={handlePointerLeave}
        />
      </div>

      {/* Legend List */}
      {slices.length > 0 && (
        <div
          style={{
            flex: '1 1 180px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '160px',
            overflowY: 'auto',
            maxHeight: `${height}px`,
            padding: '4px 0',
          }}
        >
          {slices.map((slice, i) => {
            const isHovered = i === hoverIndex;
            return (
              <div
                key={slice.name}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: slice.color || `var(--chart-${(i % 8) + 1})`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isHovered ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {slice.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    className="font-tabular"
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {formatAmount(slice.amount)}
                  </span>
                  <span
                    className="font-tabular"
                    style={{
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-muted)',
                      width: '36px',
                      textAlign: 'right',
                    }}
                  >
                    {slice.exactPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
