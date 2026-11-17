/**
 * Pure HTML5 Canvas Chart Utilities
 * Color extraction, scale calculation, bezier spline smoothing, and geometric hit testing.
 */

/**
 * Reads theme CSS variables from the DOM root with robust fallbacks
 */
export function getThemeColors() {
  if (typeof window === 'undefined' || !document.documentElement) {
    return getDefaultThemeColors();
  }

  const computed = getComputedStyle(document.documentElement);

  const getVar = (name, fallback) => {
    const val = computed.getPropertyValue(name).trim();
    return val || fallback;
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return {
    isDark,
    bgApp: getVar('--bg-app', isDark ? '#0F1318' : '#F7F8FA'),
    bgSurface: getVar('--bg-surface', isDark ? '#171C23' : '#FFFFFF'),
    bgSurfaceHover: getVar('--bg-surface-hover', isDark ? '#1F2630' : '#F1F3F6'),
    borderSubtle: getVar('--border-subtle', isDark ? '#262D36' : '#E5E7EB'),
    borderStrong: getVar('--border-strong', isDark ? '#363F4D' : '#D1D5DB'),
    textPrimary: getVar('--text-primary', isDark ? '#E6E9EE' : '#111827'),
    textSecondary: getVar('--text-secondary', isDark ? '#9AA4B2' : '#4B5563'),
    textMuted: getVar('--text-muted', isDark ? '#6B7685' : '#6B7280'),
    accent: getVar('--accent', isDark ? '#6C93FF' : '#2457D6'),
    accentSubtle: getVar('--accent-subtle', isDark ? 'rgba(108, 147, 255, 0.15)' : 'rgba(36, 87, 214, 0.08)'),
    colorIncome: getVar('--color-income', '#10B981'),
    colorIncomeSubtle: getVar('--color-income-subtle', 'rgba(16, 185, 129, 0.12)'),
    colorExpense: getVar('--color-expense', '#EF4444'),
    colorExpenseSubtle: getVar('--color-expense-subtle', 'rgba(239, 68, 68, 0.12)'),
    colorWarning: getVar('--color-warning', '#F59E0B'),
    colorInfo: getVar('--color-info', '#06B6D4'),
    palette: [
      getVar('--chart-1', isDark ? '#60A5FA' : '#2563EB'),
      getVar('--chart-2', isDark ? '#34D399' : '#10B981'),
      getVar('--chart-3', isDark ? '#FBBF24' : '#F59E0B'),
      getVar('--chart-4', isDark ? '#A78BFA' : '#8B5CF6'),
      getVar('--chart-5', isDark ? '#F472B6' : '#EC4899'),
      getVar('--chart-6', isDark ? '#22D3EE' : '#06B6D4'),
      getVar('--chart-7', isDark ? '#FB923C' : '#F97316'),
      getVar('--chart-8', isDark ? '#818CF8' : '#6366F1'),
    ],
  };
}

function getDefaultThemeColors() {
  return {
    isDark: false,
    bgApp: '#F7F8FA',
    bgSurface: '#FFFFFF',
    bgSurfaceHover: '#F1F3F6',
    borderSubtle: '#E5E7EB',
    borderStrong: '#D1D5DB',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    accent: '#2457D6',
    accentSubtle: 'rgba(36, 87, 214, 0.08)',
    colorIncome: '#10B981',
    colorIncomeSubtle: 'rgba(16, 185, 129, 0.12)',
    colorExpense: '#EF4444',
    colorExpenseSubtle: 'rgba(239, 68, 68, 0.12)',
    colorWarning: '#F59E0B',
    colorInfo: '#06B6D4',
    palette: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1'],
  };
}

/**
 * Standard "Nice Numbers" algorithm for calculating clean, readable chart axis ticks
 */
export function getNiceTicks(minValue, maxValue, maxTicks = 5) {
  let min = Number(minValue) || 0;
  let max = Number(maxValue) || 0;

  if (min === max) {
    if (min === 0) {
      max = 100;
    } else if (min > 0) {
      min = 0;
      max = max * 1.25;
    } else {
      max = 0;
      min = min * 1.25;
    }
  }

  // Ensure minimum tick range
  const range = niceNum(max - min, false);
  const tickSpacing = niceNum(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;

  const ticks = [];
  // Use epsilon to avoid floating point precision loops
  const eps = tickSpacing / 1000;
  for (let val = niceMin; val <= niceMax + eps; val += tickSpacing) {
    // Round to 4 decimal places to remove binary floating artifact
    ticks.push(Math.round(val * 10000) / 10000);
  }

  return {
    ticks,
    min: niceMin,
    max: niceMax,
    step: tickSpacing,
  };
}

function niceNum(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

/**
 * Standard cubic ease-out animation curve
 */
export function easeOutCubic(t) {
  const p = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - p, 3);
}

/**
 * Checks whether user has enabled reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Draws rounded rectangle on 2D context with per-corner radii
 * Radii: number or [topLeft, topRight, bottomRight, bottomLeft]
 */
export function drawRoundedRect(ctx, x, y, width, height, radii = 4) {
  if (width <= 0 || height <= 0) return;

  let rTopLeft = 0;
  let rTopRight = 0;
  let rBottomRight = 0;
  let rBottomLeft = 0;

  if (typeof radii === 'number') {
    rTopLeft = rTopRight = rBottomRight = rBottomLeft = Math.min(radii, width / 2, height / 2);
  } else if (Array.isArray(radii)) {
    rTopLeft = Math.min(radii[0] || 0, width / 2, height / 2);
    rTopRight = Math.min(radii[1] || 0, width / 2, height / 2);
    rBottomRight = Math.min(radii[2] || 0, width / 2, height / 2);
    rBottomLeft = Math.min(radii[3] || 0, width / 2, height / 2);
  }

  ctx.beginPath();
  ctx.moveTo(x + rTopLeft, y);
  ctx.lineTo(x + width - rTopRight, y);
  if (rTopRight > 0) ctx.arcTo(x + width, y, x + width, y + rTopRight, rTopRight);
  ctx.lineTo(x + width, y + height - rBottomRight);
  if (rBottomRight > 0) ctx.arcTo(x + width, y + height, x + width - rBottomRight, y + height, rBottomRight);
  ctx.lineTo(x + rBottomLeft, y + height);
  if (rBottomLeft > 0) ctx.arcTo(x, y + height, x, y + height - rBottomLeft, rBottomLeft);
  ctx.lineTo(x, y + rTopLeft);
  if (rTopLeft > 0) ctx.arcTo(x, y, x + rTopLeft, y, rTopLeft);
  ctx.closePath();
}

/**
 * Generates smooth monotone cubic bezier curves across data points
 */
export function getMonotoneSplinePath(points) {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    path += ` L ${points[1].x} ${points[1].y}`;
    return path;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.25;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Draws smooth monotone cubic spline on 2D context
 */
export function drawSpline(ctx, points) {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}
