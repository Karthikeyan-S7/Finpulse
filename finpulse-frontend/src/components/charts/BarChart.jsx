import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useCanvas } from './useCanvas';
import { CanvasChart } from './CanvasChart';
import { getNiceTicks, drawRoundedRect } from './chartUtils';

export function BarChart({
  data = [],
  height = 260,
  loading = false,
  emptyMessage = 'No cashflow records found for this period',
  ariaLabel = 'Monthly income vs expenses bar chart',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { formatAmount, formatCompact } = useCurrency();

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Normalized monthly groups
  const groups = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d, i) => {
      const income = Math.max(0, Number(d.income || 0));
      const expenses = Math.max(0, Number(d.expenses || 0));
      const net = d.net !== undefined ? Number(d.net) : income - expenses;
      return {
        month: d.month || `M${i + 1}`,
        label: d.label || d.month || `M${i + 1}`,
        income,
        expenses,
        net,
      };
    });
  }, [data]);

  // Compute scale boundaries
  const scale = useMemo(() => {
    if (groups.length === 0) return { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] };

    let max = 0;
    for (const g of groups) {
      if (g.income > max) max = g.income;
      if (g.expenses > max) max = g.expenses;
    }

    if (max === 0) max = 1000;
    return getNiceTicks(0, max, 5);
  }, [groups]);

  // Draw on canvas
  const onDraw = useCallback(
    ({ ctx, width, height: canvasHeight, progress, colors }) => {
      if (groups.length === 0) return;

      const paddingLeft = 52;
      const paddingRight = 18;
      const paddingTop = 24;
      const paddingBottom = 30;

      const plotWidth = Math.max(10, width - paddingLeft - paddingRight);
      const plotHeight = Math.max(10, canvasHeight - paddingTop - paddingBottom);
      const range = scale.max - scale.min || 1;

      // 1. Draw horizontal gridlines & Y-axis labels
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      for (const tick of scale.ticks) {
        const y = paddingTop + plotHeight - ((tick - scale.min) / range) * plotHeight;

        ctx.beginPath();
        ctx.strokeStyle = colors.borderSubtle;
        ctx.lineWidth = 1;
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotWidth, y);
        ctx.stroke();

        ctx.fillStyle = colors.textMuted;
        ctx.fillText(formatCompact(tick), paddingLeft - 8, y);
      }

      // 2. Compute group slots
      const slotWidth = plotWidth / groups.length;
      const maxBarWidth = 22;
      const barWidth = Math.max(4, Math.min(maxBarWidth, (slotWidth - 14) / 2));
      const barGap = 3;

      // Highlight hovered background slot
      if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < groups.length) {
        const hx = paddingLeft + hoverIndex * slotWidth;
        ctx.fillStyle = colors.bgSurfaceHover;
        ctx.fillRect(hx, paddingTop, slotWidth, plotHeight);
      }

      // 3. Draw Bars and Net Markers
      groups.forEach((g, i) => {
        const cx = paddingLeft + (i + 0.5) * slotWidth;

        // Income Bar (Left of center)
        const incomeH = ((g.income - scale.min) / range) * plotHeight * progress;
        const incomeY = paddingTop + plotHeight - incomeH;
        const incomeX = cx - barWidth - barGap / 2;

        ctx.fillStyle = colors.colorIncome;
        drawRoundedRect(ctx, incomeX, incomeY, barWidth, incomeH, [4, 4, 0, 0]);
        ctx.fill();

        // Expense Bar (Right of center)
        const expenseH = ((g.expenses - scale.min) / range) * plotHeight * progress;
        const expenseY = paddingTop + plotHeight - expenseH;
        const expenseX = cx + barGap / 2;

        ctx.fillStyle = colors.colorExpense;
        drawRoundedRect(ctx, expenseX, expenseY, barWidth, expenseH, [4, 4, 0, 0]);
        ctx.fill();

        // Net Cashflow Marker (Horizontal Pill / Line across both bars)
        const clampedNet = Math.max(scale.min, Math.min(scale.max, g.net));
        const netY = paddingTop + plotHeight - ((clampedNet - scale.min) / range) * plotHeight * progress;

        const netMarkerWidth = barWidth * 2 + barGap + 6;
        const netMarkerX = cx - netMarkerWidth / 2;

        ctx.save();
        ctx.fillStyle = g.net >= 0 ? colors.accent : colors.colorWarning;
        ctx.beginPath();
        drawRoundedRect(ctx, netMarkerX, netY - 2, netMarkerWidth, 4, 2);
        ctx.fill();
        ctx.restore();

        // X-axis Month Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = i === hoverIndex ? colors.textPrimary : colors.textMuted;
        ctx.font = i === hoverIndex ? 'bold 11px sans-serif' : '11px sans-serif';
        ctx.fillText(g.label, cx, paddingTop + plotHeight + 8);
      });
    },
    [groups, scale, hoverIndex, formatCompact]
  );

  useCanvas({
    canvasRef,
    containerRef,
    onDraw,
    dependencies: [groups, scale, hoverIndex],
  });

  // Pointer interaction
  const handlePointer = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container || groups.length === 0) return;

      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const paddingLeft = 52;
      const paddingRight = 18;
      const plotWidth = rect.width - paddingLeft - paddingRight;

      if (plotWidth <= 0) return;

      const relX = clientX - rect.left - paddingLeft;
      const slotWidth = plotWidth / groups.length;
      const index = Math.floor(relX / slotWidth);

      if (index >= 0 && index < groups.length) {
        setHoverIndex(index);
        const g = groups[index];
        const tooltipX = paddingLeft + (index + 0.5) * slotWidth;
        const tooltipY = Math.max(10, clientY - rect.top);

        setTooltip({
          visible: true,
          x: tooltipX,
          y: tooltipY,
          content: (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '12px' }}>
                {g.month || g.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 12px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Income:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-income-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  +{formatAmount(g.income)}
                </span>

                <span style={{ color: 'var(--text-muted)' }}>Expenses:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-expense-text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  -{formatAmount(g.expenses)}
                </span>

                <span style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '2px' }}>
                  Net Cashflow:
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    textAlign: 'right',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '2px',
                    fontVariantNumeric: 'tabular-nums',
                    color: g.net >= 0 ? 'var(--color-income-text)' : 'var(--color-expense-text)',
                  }}
                >
                  {g.net >= 0 ? `+${formatAmount(g.net)}` : `-${formatAmount(Math.abs(g.net))}`}
                </span>
              </div>
            </div>
          ),
        });
      } else {
        setHoverIndex(null);
        setTooltip({ visible: false, x: 0, y: 0, content: null });
      }
    },
    [groups, formatAmount]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  }, []);

  // Screen reader fallback table
  const accessibleTable = useMemo(() => {
    return (
      <table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
            <th scope="col">Net Cashflow</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={i}>
              <td>{g.month}</td>
              <td>{formatAmount(g.income)}</td>
              <td>{formatAmount(g.expenses)}</td>
              <td>{formatAmount(g.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [groups, formatAmount, ariaLabel]);

  return (
    <div>
      {/* Legend Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '16px',
          marginBottom: '8px',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-income)' }} />
          <span>Income</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--color-expense)' }} />
          <span>Expenses</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '14px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--accent)' }} />
          <span>Net Marker</span>
        </div>
      </div>

      <CanvasChart
        height={height}
        loading={loading}
        empty={groups.length === 0}
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

export default BarChart;
