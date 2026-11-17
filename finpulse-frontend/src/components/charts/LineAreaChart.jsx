import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useCanvas } from './useCanvas';
import { CanvasChart } from './CanvasChart';
import { getNiceTicks, drawSpline } from './chartUtils';

export function LineAreaChart({
  data = [],
  height = 260,
  showComparison = false,
  currentLabel = 'Current Period',
  comparisonLabel = 'Previous Period',
  accentColor,
  loading = false,
  emptyMessage = 'No spending data recorded for this period',
  ariaLabel = 'Spending and cashflow trend curve',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { formatAmount, formatCompact } = useCurrency();

  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  // Filter and normalize data points
  const points = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d, i) => ({
      date: d.date || d.label || `Day ${i + 1}`,
      label: d.label || d.date || `Day ${i + 1}`,
      value: Number(d.value ?? d.amount ?? 0),
      comparisonValue: d.comparisonValue !== undefined ? Number(d.comparisonValue) : null,
    }));
  }, [data]);

  // Compute scale boundaries
  const scale = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] };

    let min = 0; // Baseline at 0 for financial spending curves
    let max = -Infinity;

    for (const p of points) {
      if (p.value > max) max = p.value;
      if (p.comparisonValue !== null && p.comparisonValue > max) max = p.comparisonValue;
      if (p.value < min) min = p.value;
      if (p.comparisonValue !== null && p.comparisonValue < min) min = p.comparisonValue;
    }

    if (max === -Infinity || max === min) {
      max = min > 0 ? min * 1.25 : 1000;
    }

    return getNiceTicks(min, max, 5);
  }, [points]);

  // Draw function
  const onDraw = useCallback(
    ({ ctx, width, height: canvasHeight, progress, colors }) => {
      if (points.length === 0) return;

      const paddingLeft = 52;
      const paddingRight = 18;
      const paddingTop = 20;
      const paddingBottom = 28;

      const plotWidth = Math.max(10, width - paddingLeft - paddingRight);
      const plotHeight = Math.max(10, canvasHeight - paddingTop - paddingBottom);

      const colorAccent = accentColor || colors.accent;
      const range = scale.max - scale.min || 1;

      // 1. Draw horizontal gridlines & Y-axis labels
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      for (const tick of scale.ticks) {
        const y = paddingTop + plotHeight - ((tick - scale.min) / range) * plotHeight;

        // Light subtle gridline
        ctx.beginPath();
        ctx.strokeStyle = colors.borderSubtle;
        ctx.lineWidth = 1;
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotWidth, y);
        ctx.stroke();

        // Tick label
        ctx.fillStyle = colors.textMuted;
        ctx.fillText(formatCompact(tick), paddingLeft - 8, y);
      }

      // 2. Map coordinates
      const coordPoints = points.map((p, i) => {
        const x = points.length === 1
          ? paddingLeft + plotWidth / 2
          : paddingLeft + (i / (points.length - 1)) * plotWidth;
        const rawY = paddingTop + plotHeight - ((p.value - scale.min) / range) * plotHeight;
        // Animate vertically from baseline
        const baselineY = paddingTop + plotHeight - ((0 - scale.min) / range) * plotHeight;
        const animatedY = baselineY - (baselineY - rawY) * progress;

        let compY = null;
        if (p.comparisonValue !== null) {
          const rawCompY = paddingTop + plotHeight - ((p.comparisonValue - scale.min) / range) * plotHeight;
          compY = baselineY - (baselineY - rawCompY) * progress;
        }

        return { x, y: animatedY, compY, ...p };
      });

      // 3. Draw Comparison Line (if enabled and present)
      if (showComparison && coordPoints.some((p) => p.compY !== null)) {
        const compCoords = coordPoints
          .filter((p) => p.compY !== null)
          .map((p) => ({ x: p.x, y: p.compY }));

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = colors.textMuted;
        ctx.lineWidth = 1.5;
        drawSpline(ctx, compCoords);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw Area Fill Under Current Curve
      if (coordPoints.length > 1) {
        const baselineY = paddingTop + plotHeight - ((0 - scale.min) / range) * plotHeight;
        const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);

        gradient.addColorStop(0, `${colorAccent}33`); // ~20% opacity
        gradient.addColorStop(1, `${colorAccent}00`); // 0% opacity

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(coordPoints[0].x, baselineY);
        ctx.lineTo(coordPoints[0].x, coordPoints[0].y);

        // Path along the curve
        drawSpline(ctx, coordPoints);

        ctx.lineTo(coordPoints[coordPoints.length - 1].x, baselineY);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Primary Current Curve Line
      ctx.beginPath();
      ctx.strokeStyle = colorAccent;
      ctx.lineWidth = 2.25;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawSpline(ctx, coordPoints);
      ctx.stroke();

      // 6. Draw X-axis labels (sampled so they don't collide)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colors.textMuted;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      const maxLabels = Math.min(6, coordPoints.length);
      const step = Math.ceil(coordPoints.length / maxLabels) || 1;

      for (let i = 0; i < coordPoints.length; i += step) {
        const p = coordPoints[i];
        ctx.fillText(p.label, p.x, paddingTop + plotHeight + 8);
      }
      // Always include last label if space permits
      if ((coordPoints.length - 1) % step !== 0 && coordPoints.length > 1) {
        const lastP = coordPoints[coordPoints.length - 1];
        ctx.fillText(lastP.label, lastP.x, paddingTop + plotHeight + 8);
      }

      // 7. Interactive Hover Point & Crosshair
      if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < coordPoints.length) {
        const active = coordPoints[hoverIndex];

        // Vertical crosshair guide
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = colors.borderStrong;
        ctx.lineWidth = 1;
        ctx.moveTo(active.x, paddingTop);
        ctx.lineTo(active.x, paddingTop + plotHeight);
        ctx.stroke();
        ctx.restore();

        // Comparison point dot
        if (showComparison && active.compY !== null) {
          ctx.beginPath();
          ctx.arc(active.x, active.compY, 4, 0, Math.PI * 2);
          ctx.fillStyle = colors.textMuted;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = colors.bgSurface;
          ctx.stroke();
        }

        // Active point dot
        ctx.beginPath();
        ctx.arc(active.x, active.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = colorAccent;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.bgSurface;
        ctx.stroke();
      }
    },
    [points, scale, accentColor, showComparison, hoverIndex, formatCompact]
  );

  // Hook handles HiDPI, ResizeObserver, requestAnimationFrame, theme reactivity
  useCanvas({
    canvasRef,
    containerRef,
    onDraw,
    dependencies: [points, scale, hoverIndex, showComparison],
  });

  // Pointer interactions (mouse + touch)
  const handlePointer = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container || points.length === 0) return;

      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;

      if (clientX === undefined || clientY === undefined) return;

      const paddingLeft = 52;
      const paddingRight = 18;
      const plotWidth = rect.width - paddingLeft - paddingRight;

      if (plotWidth <= 0) return;

      const relX = clientX - rect.left - paddingLeft;
      const ratio = Math.max(0, Math.min(1, relX / plotWidth));
      const index = Math.round(ratio * (points.length - 1));

      setHoverIndex(index);

      const target = points[index];
      if (!target) return;

      const tooltipX = paddingLeft + (index / (points.length - 1 || 1)) * plotWidth;
      const tooltipY = Math.max(10, clientY - rect.top);

      let deltaPercent = null;
      if (target.comparisonValue && target.comparisonValue > 0) {
        const diff = target.value - target.comparisonValue;
        deltaPercent = Math.round((diff / target.comparisonValue) * 100);
      }

      setTooltip({
        visible: true,
        x: tooltipX,
        y: tooltipY,
        content: (
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>
              {target.date || target.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(target.value)}
              </span>
              {deltaPercent !== null && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: deltaPercent >= 0 ? 'var(--color-income-text)' : 'var(--color-expense-text)',
                  }}
                >
                  {deltaPercent >= 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                </span>
              )}
            </div>
            {showComparison && target.comparisonValue !== null && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                {comparisonLabel}: {formatAmount(target.comparisonValue)}
              </div>
            )}
          </div>
        ),
      });
    },
    [points, formatAmount, showComparison, comparisonLabel]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null);
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  }, []);

  // Visually hidden data table for screen reader accessibility
  const accessibleTable = useMemo(() => {
    return (
      <table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Date / Period</th>
            <th scope="col">{currentLabel}</th>
            {showComparison && <th scope="col">{comparisonLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{p.date}</td>
              <td>{formatAmount(p.value)}</td>
              {showComparison && <td>{p.comparisonValue !== null ? formatAmount(p.comparisonValue) : 'N/A'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [points, currentLabel, comparisonLabel, showComparison, formatAmount, ariaLabel]);

  return (
    <CanvasChart
      height={height}
      loading={loading}
      empty={points.length === 0}
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
  );
}

export default LineAreaChart;
