import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { ForecastChartPoint } from '@/lib/forecasting/resultForecast';

interface ForecastSparklineProps {
  chart: ForecastChartPoint[];
  target: number | null;
  className?: string;
}

/**
 * Mini gráfico del resultado: línea sólida = real, línea punteada = proyección,
 * banda = escenario P10–P90 y línea horizontal = meta.
 */
export function ForecastSparkline({ chart, target, className }: ForecastSparklineProps) {
  const gradientId = `forecast-spark-${useId().replace(/[:]/g, '')}`;

  const values: number[] = [];
  for (const point of chart) {
    if (point.actual != null && Number.isFinite(point.actual)) values.push(point.actual);
    if (point.projected != null && Number.isFinite(point.projected)) values.push(point.projected);
    if (point.band) {
      values.push(point.band[0], point.band[1]);
    }
  }
  if (target != null && Number.isFinite(target)) values.push(target);

  if (!chart.length || values.length === 0) {
    return (
      <div className={cn('grid place-items-center rounded-lg border border-dashed border-border/60 text-[9px] text-muted-foreground', className)}>
        Sin serie para graficar
      </div>
    );
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = Math.max(1e-6, maxValue - minValue);
  const pad = span * 0.08;
  const min = minValue - pad;
  const max = maxValue + pad;
  const top = 4;
  const bottom = 32;
  const xFor = (index: number) => {
    if (chart.length <= 1) return 50;
    return (index / (chart.length - 1)) * 100;
  };
  const yFor = (value: number) => bottom - ((value - min) / (max - min)) * (bottom - top);
  const pointString = (points: Array<{ x: number; y: number }>) =>
    points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

  const actualPoints = chart
    .map((point, index) => (point.actual != null && Number.isFinite(point.actual)
      ? { x: xFor(index), y: yFor(point.actual) }
      : null))
    .filter((point): point is { x: number; y: number } => !!point);

  const projectedPoints = chart
    .map((point, index) => (point.projected != null && Number.isFinite(point.projected)
      ? { x: xFor(index), y: yFor(point.projected) }
      : null))
    .filter((point): point is { x: number; y: number } => !!point);

  const bandLow: Array<{ x: number; y: number }> = [];
  const bandHigh: Array<{ x: number; y: number }> = [];
  chart.forEach((point, index) => {
    if (!point.band) return;
    bandLow.push({ x: xFor(index), y: yFor(point.band[0]) });
    bandHigh.push({ x: xFor(index), y: yFor(point.band[1]) });
  });

  const bandPolygon = bandLow.length && bandHigh.length
    ? [...bandLow, ...[...bandHigh].reverse()].map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
    : null;

  const actualArea = actualPoints.length > 1
    ? [
        ...actualPoints,
        { x: actualPoints[actualPoints.length - 1].x, y: bottom },
        { x: actualPoints[0].x, y: bottom },
      ]
    : [];

  return (
    <svg
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
      role="img"
      aria-label="Serie real y proyección del resultado"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {target != null && Number.isFinite(target) && (
        <line
          x1="0"
          x2="100"
          y1={yFor(target)}
          y2={yFor(target)}
          stroke="hsl(var(--muted-foreground) / 0.45)"
          strokeWidth="1"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {bandPolygon && (
        <polygon points={bandPolygon} fill="hsl(var(--primary) / 0.10)" />
      )}

      {actualArea.length > 2 && (
        <polygon points={pointString(actualArea)} fill={`url(#${gradientId})`} />
      )}

      {actualPoints.length > 1 && (
        <polyline
          points={pointString(actualPoints)}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {projectedPoints.length > 1 && (
        <polyline
          points={pointString(projectedPoints)}
          fill="none"
          stroke="hsl(var(--primary) / 0.55)"
          strokeWidth="1.4"
          strokeDasharray="3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {actualPoints.length === 1 && (
        <circle cx={actualPoints[0].x} cy={actualPoints[0].y} r="1.6" fill="hsl(var(--primary))" />
      )}
    </svg>
  );
}
