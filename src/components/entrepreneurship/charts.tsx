import { useId, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatNumber, formatPercent, clamp, toISODate } from '@/lib/entrepreneurship/formatters';
import type { CategorySlice, FunnelStep, HealthBreakdown, MonthlyPoint, WeekPoint } from '@/lib/entrepreneurship/types';

const AXIS_TICK = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } as const;
const GRID_STROKE = 'hsl(var(--border))';
const TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
} as const;

const DONUT_COLORS = ['#3b82f6', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#64748b', '#ef4444'];

export function RevenueExpenseChart({ data, currency = 'USD' }: { data: MonthlyPoint[]; currency?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`rev-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`exp-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, true)} width={48} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name === 'revenue' ? 'Ingresos' : 'Gastos']}
          />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill={`url(#rev-${id})`} />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill={`url(#exp-${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MrrTrendChart({ data, currency = 'USD' }: { data: MonthlyPoint[]; currency?: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, true)} width={48} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [formatCurrency(value, currency), 'Ingresos']}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseDonut({ data, currency = 'USD' }: { data: CategorySlice[]; currency?: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total <= 0) {
    return (
      <div className="grid h-56 place-items-center text-xs text-muted-foreground">
        Sin gastos este mes
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={46} outerRadius={66} paddingAngle={2} stroke="none">
              {data.map((item, index) => (
                <Cell key={item.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value, currency)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-sm font-semibold tabular-nums">{formatCurrency(total, currency, true)}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Gastos</div>
          </div>
        </div>
      </div>
      <div className="w-full min-w-0 space-y-1.5">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.key} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
            <span className="tabular-nums font-medium">{formatCurrency(item.value, currency, true)}</span>
            <span className="w-9 text-right tabular-nums text-[10px] text-muted-foreground">
              {formatPercent(total ? item.value / total : 0, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="space-y-2.5">
      {steps.map((step, index) => (
        <div key={step.key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{step.label}</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{formatNumber(step.count)}</span>
              {index > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {formatPercent(step.conversion, 0)}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(3, (step.count / max) * 100)}%`,
                background: `linear-gradient(90deg, hsl(217 91% 60% / ${0.95 - index * 0.12}), hsl(199 89% 48% / ${0.75 - index * 0.1}))`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RunwayGauge({ months, cash, currency = 'USD' }: { months: number | null; cash: number; currency?: string }) {
  const percent = months === null ? 1 : clamp(months / 12, 0, 1);
  const color = months === null ? '#22c55e' : months < 4 ? '#ef4444' : months < 6 ? '#f59e0b' : '#22c55e';
  const circumference = Math.PI * 60;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 100" className="w-full max-w-[180px]">
        <path d="M 20 82 A 60 60 0 0 1 140 82" fill="none" stroke="hsl(var(--muted))" strokeWidth={12} strokeLinecap="round" />
        <path
          d="M 20 82 A 60 60 0 0 1 140 82"
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${percent * circumference} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="-mt-8 text-center">
        <div className="text-xl font-semibold tabular-nums" style={{ color }}>
          {months === null ? '∞ ' : months.toFixed(1)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">m</span>
        </div>
        <div className="text-[10px] text-muted-foreground">Caja: {formatCurrency(cash, currency, true)}</div>
      </div>
    </div>
  );
}

export function FocusHeatmap({ data, accent = '#3b82f6' }: { data: Record<string, number>; accent?: string }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const day = (end.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - day)); // domingo de esta semana
    const start = new Date(end);
    start.setDate(start.getDate() - 7 * 12 + 1);
    const result: Array<Array<{ date: string; minutes: number; future: boolean }>> = [];
    for (let w = 0; w < 12; w += 1) {
      const column: Array<{ date: string; minutes: number; future: boolean }> = [];
      for (let d = 0; d < 7; d += 1) {
        const current = new Date(start);
        current.setDate(start.getDate() + w * 7 + d);
        const iso = toISODate(current);
        column.push({
          date: iso,
          minutes: data[iso] || 0,
          future: current.getTime() > today.getTime(),
        });
      }
      result.push(column);
    }
    return result;
  }, [data]);

  const max = Math.max(...Object.values(data), 60);
  const levels = [0.14, 0.32, 0.55, 0.8, 1];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const intensity = day.minutes <= 0 ? 0 : Math.min(4, Math.floor((day.minutes / max) * 5));
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${Math.round(day.minutes)} min`}
                  className="h-3.5 w-3.5 rounded-[3px] border border-border/40"
                  style={{
                    background: day.future
                      ? 'transparent'
                      : day.minutes <= 0
                        ? 'hsl(var(--muted))'
                        : `${accent}${['24', '52', '8c', 'cc', 'ff'][intensity] || 'ff'}`,
                    opacity: day.future ? 0.25 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
        <span>12 semanas</span>
        <span className="flex items-center gap-1">
          Menos
          {levels.map((level, index) => (
            <span key={index} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `${accent}${['24', '52', '8c', 'cc', 'ff'][index]}` }} />
          ))}
          Más
        </span>
      </div>
    </div>
  );
}

export function ThroughputChart({ data }: { data: WeekPoint[] }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="created" name="Creadas" fill="hsl(var(--muted-foreground))" fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={16} />
          <Bar dataKey="completed" name="Completadas" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricLine({
  data,
  unit = 'count',
  color = '#3b82f6',
}: {
  data: Array<{ label: string; value: number }>;
  unit?: string;
  color?: string;
}) {
  if (!data.length) return null;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => (unit === 'USD' ? formatNumber(v, true) : formatNumber(v))} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [unit === 'USD' ? formatCurrency(value) : formatNumber(value), 'Valor']} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2.5, strokeWidth: 0, fill: color }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HealthRadar({ breakdown }: { breakdown: HealthBreakdown }) {
  const data = [
    { area: 'Finanzas', value: breakdown.finance },
    { area: 'Producto', value: breakdown.product },
    { area: 'Mercado', value: breakdown.market },
    { area: 'Ejecución', value: breakdown.execution },
  ];
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="area" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.28} strokeWidth={2} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [`${value}/100`, 'Puntaje']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}