import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, TrendingUp, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useHabitStreaks } from '@/hooks/useHabitStreaks';
import { cn } from '@/lib/utils';
import { startOfWeek } from 'date-fns';

const BAR_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#f97316'];

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <Badge variant="outline" className="shrink-0 border-emerald-500/30 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
        <ArrowUp className="mr-0.5 h-3 w-3" />
        {delta}
      </Badge>
    );
  }
  if (delta < 0) {
    return (
      <Badge variant="outline" className="shrink-0 border-destructive/30 px-1.5 text-[10px] text-destructive">
        <ArrowDown className="mr-0.5 h-3 w-3" />
        {delta}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0 px-1.5 text-[10px] text-muted-foreground">
      <Minus className="mr-0.5 h-3 w-3" />0
    </Badge>
  );
}

export function StreaksTendencias({ weekStart: weekStartProp }: { weekStart?: Date }) {
  const ref = weekStartProp ?? new Date();
  const weekStart = startOfWeek(ref, { weekStartsOn: 1 });
  const { streaks, minutesByArea, totalMinutes, prevTotalMinutes, loading } = useHabitStreaks(weekStart);

  const minDelta = totalMinutes - prevTotalMinutes;
  const topMins = Math.max(...minutesByArea.map((m) => m.minutes), 1);

  return (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight">Streaks y tendencias</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Rachas de hábitos y minutos por área de la semana.
              </p>
            </div>
          </div>
          {!loading && totalMinutes > 0 && (
            <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] tabular-nums">
              <Clock className="h-3 w-3" />
              {totalMinutes} min
              <span className={cn('font-bold', minDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {minDelta >= 0 ? '+' : ''}{minDelta}
              </span>
            </Badge>
          )}
        </div>

        {streaks.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium">Sin hábitos registrados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registra hábitos esta semana para ver tus rachas y tendencias.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {streaks.slice(0, 8).map((s) => (
                <div key={s.habitId} className="space-y-2 rounded-2xl border border-border/60 bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                      <Flame className={cn('h-3.5 w-3.5 shrink-0', s.current > 0 ? 'text-orange-500' : 'text-muted-foreground/40')} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-[11px] font-bold tabular-nums">{s.doneThisWeek}/7</span>
                      <DeltaBadge delta={s.delta} />
                    </div>
                  </div>
                  <Progress
                    value={Math.min((s.doneThisWeek / 7) * 100, 100)}
                    className="h-1.5"
                    indicatorClassName={s.current > 0 ? 'bg-orange-500' : 'bg-muted-foreground/30'}
                    aria-label={`${s.label}: ${s.doneThisWeek} de 7 días`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Racha <b className="text-foreground">{s.current} d</b></span>
                    <span>Récord <b className="text-foreground">{s.best} d</b></span>
                  </div>
                </div>
              ))}
            </div>

            {minutesByArea.length > 0 && (
              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Minutos por área
                  </h3>
                  <span className="text-[11px] text-muted-foreground">semana actual</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={minutesByArea} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 12,
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--popover))',
                          color: 'hsl(var(--popover-foreground))',
                        }}
                        formatter={(v) => [`${v} min`, 'Tiempo']}
                        cursor={{ fill: 'hsl(var(--muted) / 0.6)' }}
                      />
                      <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                        {minutesByArea.map((entry, i) => (
                          <Cell key={entry.area} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {minutesByArea.slice(0, 6).map((m, i) => (
                    <span key={m.area} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      {m.label} <b className="tabular-nums text-foreground">{m.minutes}</b>
                    </span>
                  ))}
                </div>
                <div className="text-right text-[11px] tabular-nums text-muted-foreground">máx {topMins} min</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
