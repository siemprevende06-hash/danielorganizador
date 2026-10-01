import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarRange, Info, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { forecastSeries, MODEL_LABELS } from '@/lib/forecasting/holtWinters';
import {
  DIRECCION_HORIZON_DAYS,
  formatDayLabel,
  formatMinutes,
  type DireccionAreaSeries,
  type DireccionPoint,
} from '@/hooks/useDireccionData';

type Metric = 'minutos' | 'cumplimiento';

const METRIC_META: Record<Metric, { label: string; unit: string; color: string }> = {
  minutos: { label: 'Minutos de esfuerzo', unit: 'min', color: '#3b82f6' },
  cumplimiento: { label: 'Cumplimiento de sistemas', unit: '%', color: '#10b981' },
};

const METRICS: Metric[] = ['minutos', 'cumplimiento'];

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Etiquetas de dia de la semana alineadas con el indice 0 = lunes. */
function weekdayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return DAY_LABELS[(d.getDay() + 6) % 7];
}

export function DireccionTrendChart({ globalPoints }: { globalPoints: DireccionPoint[] }) {
  const [metric, setMetric] = useState<Metric>('minutos');
  const meta = METRIC_META[metric];

  const chart = useMemo(() => {
    const values = globalPoints.map(p => (metric === 'minutos' ? p.minutes : p.compliance));
    const result = forecastSeries(values, { horizon: DIRECCION_HORIZON_DAYS, minObservations: 21 });

    const observed = globalPoints.map((p, i) => {
      const date = new Date(`${p.date}T12:00:00`);
      return {
        date: p.date,
        label: formatDayLabel(p.date),
        observed: values[i],
        fitted: i > 0 ? Number(result.fitted[i]?.toFixed(1)) : null,
        forecast: null as number | null,
        band: null as [number, number] | null,
      };
    });

    const lastDate = globalPoints[globalPoints.length - 1];
    const forecast = result.forecast.map((value, i) => {
      const d = new Date(`${lastDate.date}T12:00:00`);
      d.setDate(d.getDate() + i + 1);
      const key = format(d, 'yyyy-MM-dd');
      return {
        date: key,
        label: formatDayLabel(key),
        observed: null as number | null,
        fitted: null as number | null,
        forecast: Number(value.toFixed(1)),
        band: [Number(result.bands[i].lower80.toFixed(1)), Number(result.bands[i].upper80.toFixed(1))] as [number, number],
        band95: [Number(result.bands[i].lower95.toFixed(1)), Number(result.bands[i].upper95.toFixed(1))] as [number, number],
      };
    });

    // Punto de union: ultimo observado conecta con la proyeccion.
    const bridge = observed.length
      ? { ...observed[observed.length - 1], forecast: observed[observed.length - 1].observed, band: null }
      : null;

    const joinDate = observed.length ? observed[observed.length - 1].date : null;

    return {
      data: [...observed, ...(bridge ? [bridge] : []), ...forecast],
      result,
      joinDate,
    };
  }, [globalPoints, metric]);

  if (!globalPoints.length) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  const { data, result, joinDate } = chart;
  const totalForecast = result.forecast.reduce((a, b) => a + b, 0);
  const avgLast30 = (() => {
    const slice = globalPoints.slice(-30);
    if (!slice.length) return 0;
    const vals = slice.map(p => (metric === 'minutos' ? p.minutes : p.compliance));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Tendencia de esfuerzo y pronóstico</span>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50">
          {METRICS.map(m => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setMetric(m)}
              className={cn(
                "h-6 px-3 rounded-full text-[10px] font-semibold",
                metric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === 'minutos' ? 'Minutos' : 'Cumplimiento'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox label="Promedio 30d" value={metric === 'minutos' ? formatMinutes(Math.round(avgLast30)) : `${avgLast30.toFixed(0)}%`} />
        <StatBox label="Pronóstico total" value={metric === 'minutos' ? formatMinutes(Math.round(totalForecast)) : `${totalForecast.toFixed(0)}%`} accent />
        <StatBox label="Tendencia" value={`${result.trend >= 0 ? '+' : ''}${result.trend.toFixed(1)}`} sub={meta.unit === 'min' ? meta.unit : 'pts/día'} />
        <StatBox label="Error validado" value={Number.isFinite(result.mape) ? `${result.mape.toFixed(0)}%` : '—'} sub="MAPE" />
      </div>

      <div className="rounded-xl border border-border/50 bg-white/70 dark:bg-zinc-950/70 p-3">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={`dirFill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={meta.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={meta.color} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`dirBand-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.28} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                formatter={(value: number | string, name: string) => [
                  metric === 'minutos' ? formatMinutes(Math.round(Number(value))) : `${Number(value).toFixed(0)}%`,
                  name === 'observed' ? 'Real' : name === 'fitted' ? 'Ajuste' : name === 'forecast' ? 'Pronóstico' : name,
                ]}
              />
              {joinDate && (
                <ReferenceArea x1={joinDate} x2={data[data.length - 1]?.date} fill="#f59e0b" fillOpacity={0.05} stroke="none" />
              )}
              <ReferenceLine x={joinDate} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area
                type="monotone"
                dataKey="observed"
                name="observed"
                stroke={meta.color}
                strokeWidth={2}
                fill={`url(#dirFill-${metric})`}
                connectNulls={false}
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="fitted"
                name="fitted"
                stroke={meta.color}
                strokeWidth={1}
                strokeOpacity={0.4}
                fill="none"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="band"
                name="banda 80%"
                stroke="none"
                fill={`url(#dirBand-${metric})`}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="forecast"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-2 flex-wrap text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ backgroundColor: meta.color }} />
            Real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded border-t-2 border-dashed" style={{ borderColor: '#f59e0b' }} />
            Pronóstico
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-amber-500/25" />
            Banda 80%
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <CalendarRange className="h-3 w-3" />
            {DIRECCION_HORIZON_DAYS} días
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl border border-border/50 bg-muted/20">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold flex items-center gap-2 flex-wrap">
            Modelo seleccionado por validación
            <Badge variant="outline" className="text-[9px]">
              {MODEL_LABELS[result.model]}
            </Badge>
            {result.bestBaseline && (
              <span className="text-[10px] font-normal text-muted-foreground">
                vs mejor baseline ({MODEL_LABELS[result.bestBaseline.name].split(' ')[0]}: {result.bestBaseline.mape.toFixed(0)}%)
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Los parámetros se eligen minimizando el error en backtesting walk-forward: el modelo se entrena sobre el pasado y se evalúa sobre días
            que nunca vio. Los intervalos son percentiles de esos residuos reales, no una fórmula asumida.
            {result.seasonal.length === 7 && (
              <>
                {' '}Patrón semanal detectado:{' '}
                {result.seasonal
                  .map((v, i) => ({
                    v,
                    day: globalPoints[i] ? weekdayLabel(globalPoints[i].date) : DAY_LABELS[i],
                  }))
                  .map(x => `${x.day} ${x.v > 0 ? '+' : ''}${x.v.toFixed(0)}`)
                  .join(' · ')}
                .
              </>
            )}
          </p>
          {result.reason && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              {result.reason}
            </p>
          )}
          {!result.reliable && (
            <p className="text-[10px] text-muted-foreground">
              Sin validación suficiente, el pronóstico se muestra solo como referencia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn("p-2.5 rounded-xl border space-y-0.5", accent ? "border-amber-500/30 bg-amber-500/5" : "border-border/40 bg-white/60 dark:bg-zinc-950/60")}>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold tabular-nums", accent && "text-amber-600")}>
        {value}
        {sub && <span className="text-[9px] font-normal text-muted-foreground ml-1">{sub}</span>}
      </p>
    </div>
  );
}

export function DireccionAreaSparkline({ area }: { area: DireccionAreaSeries }) {
  const data = useMemo(() => area.points.slice(-30), [area.points]);
  const result = useMemo(() => forecastSeries(data.map(p => p.minutes), { horizon: 7, minObservations: 14 }), [data]);

  const chartData = useMemo(() => {
    const historical = data.map((p, i) => ({ v: i > 0 ? Number(result.fitted[i]?.toFixed(1)) : p.minutes }));
    const projected = result.forecast.map(v => ({ v: Number(v.toFixed(1)) }));
    return [...historical, ...projected];
  }, [data, result]);

  return (
    <div className="h-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${area.areaId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill={`url(#spark-${area.areaId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}