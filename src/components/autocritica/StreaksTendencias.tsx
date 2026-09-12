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
  if (delta > 0) return <Badge variant="outline" className="text-[10px] text-emerald-600"><ArrowUp className="h-3 w-3 mr-0.5" />{delta}</Badge>;
  if (delta < 0) return <Badge variant="outline" className="text-[10px] text-destructive"><ArrowDown className="h-3 w-3 mr-0.5" />{delta}</Badge>;
  return <Badge variant="outline" className="text-[10px] text-muted-foreground"><Minus className="h-3 w-3 mr-0.5" />0</Badge>;
}

export function StreaksTendencias({ weekStart: weekStartProp }: { weekStart?: Date }) {
  const ref = weekStartProp ?? new Date();
  const weekStart = startOfWeek(ref, { weekStartsOn: 1 });
  const { streaks, minutesByArea, totalMinutes, prevTotalMinutes, loading } = useHabitStreaks(weekStart);

  const minDelta = totalMinutes - prevTotalMinutes;
  const topMins = Math.max(...minutesByArea.map(m => m.minutes), 1);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-semibold">Streaks y tendencias</h2>
          </div>
          {!loading && totalMinutes > 0 && (
            <Badge variant="outline" className="text-[10px] tabular-nums">
              <Clock className="h-3 w-3 mr-1" />
              {totalMinutes} min esta semana
              <span className={cn('ml-1 font-bold', minDelta >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                ({minDelta >= 0 ? '+' : ''}{minDelta})
              </span>
            </Badge>
          )}
        </div>

        {streaks.length === 0 && !loading ? (
          <p className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border/60">
            Registra hábitos esta semana para ver tus rachas y tendencias.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {streaks.slice(0, 8).map(s => (
                <div key={s.habitId} className="rounded-xl bg-muted/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium truncate flex items-center gap-1.5">
                      <Flame className={cn('h-3.5 w-3.5 shrink-0', s.current > 0 ? 'text-orange-500' : 'text-muted-foreground/40')} />
                      {s.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold tabular-nums">{s.doneThisWeek}/7</span>
                      <DeltaBadge delta={s.delta} />
                    </div>
                  </div>
                  <Progress value={Math.min((s.doneThisWeek / 7) * 100, 100)} className="h-1.5"
                    indicatorClassName={s.current > 0 ? 'bg-gradient-to-r from-orange-500 to-red-400' : 'bg-muted-foreground/30'} />
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>Racha {s.current} d</span>
                    <span>Récord {s.best} d</span>
                  </div>
                </div>
              ))}
            </div>

            {minutesByArea.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Minutos por área</h3>
                  <span className="text-[9px] text-muted-foreground">semana actual</span>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={minutesByArea} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                        formatter={(v: number) => [`${v} min`, 'Tiempo']}
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      />
                      <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                        {minutesByArea.map((entry, i) => (
                          <Cell key={entry.area} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {minutesByArea.slice(0, 6).map((m, i) => (
                    <span key={m.area} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      {m.label} <b className="text-foreground">{m.minutes}</b>
                    </span>
                  ))}
                </div>
                <div className="text-[9px] text-muted-foreground text-right tabular-nums">máx {topMins} min</div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}