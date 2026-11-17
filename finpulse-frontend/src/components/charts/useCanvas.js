import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeColors, easeOutCubic, prefersReducedMotion } from './chartUtils';

/**
 * useCanvas: Custom hook for managing pure HTML5 Canvas sizing, HiDPI scaling,
 * ResizeObserver lifecycle, requestAnimationFrame animation, and theme reactivity.
 */
export function useCanvas({
  canvasRef,
  containerRef,
  onDraw,
  dependencies = [],
  animate = true,
  duration = 600,
}) {
  const { effectiveTheme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, dpr: 1 });
  const [isReady, setIsReady] = useState(false);

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const themeColorsRef = useRef(getThemeColors());

  // Keep theme colors in sync
  useEffect(() => {
    themeColorsRef.current = getThemeColors();
  }, [effectiveTheme]);

  // Main rendering callback
  const renderFrame = useCallback(
    (progress = 1) => {
      const canvas = canvasRef.current;
      if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const colors = themeColorsRef.current;

      // Clear the canvas using CSS coordinates (since setTransform applies dpr)
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      if (onDraw) {
        onDraw({
          ctx,
          width: dimensions.width,
          height: dimensions.height,
          dpr: dimensions.dpr,
          progress,
          colors,
          isDark: colors.isDark,
        });
      }
    },
    [canvasRef, dimensions, onDraw]
  );

  // ResizeObserver for responsive container measurement & HiDPI scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer = null;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const roundedWidth = Math.floor(width);
        const roundedHeight = Math.floor(height);

        setDimensions((prev) => {
          if (prev.width === roundedWidth && prev.height === roundedHeight && prev.dpr === dpr) {
            return prev;
          }
          return { width: roundedWidth, height: roundedHeight, dpr };
        });

        const canvas = canvasRef.current;
        if (canvas) {
          // Set backing store dimensions to physical device pixels
          canvas.width = Math.floor(roundedWidth * dpr);
          canvas.height = Math.floor(roundedHeight * dpr);

          // Set CSS display dimensions
          canvas.style.width = `${roundedWidth}px`;
          canvas.style.height = `${roundedHeight}px`;

          // Scale 2D context so drawing coordinates remain 1:1 with CSS pixels
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
        }
      }
    });

    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [containerRef, canvasRef]);

  // Animation and redraw trigger when dimensions, theme, or dependencies change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    setIsReady(true);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const reducedMotion = prefersReducedMotion();

    if (!animate || reducedMotion) {
      renderFrame(1);
      return;
    }

    startTimeRef.current = performance.now();

    const loop = (now) => {
      const elapsed = now - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(rawProgress);

      renderFrame(easedProgress);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [dimensions, effectiveTheme, animate, duration, renderFrame, ...dependencies]);

  return {
    width: dimensions.width,
    height: dimensions.height,
    dpr: dimensions.dpr,
    isReady,
    themeColors: themeColorsRef.current,
  };
}
