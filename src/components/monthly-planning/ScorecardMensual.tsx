import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, BookOpen, Music, TrendingUp, Activity, LayoutGrid } from 'lucide-react';
import { useResultadosPeriodo, AREA_ORDER, type AreaKey } from '@/hooks/useResultadosPeriodo';
import { getMonthGoalsSummary } from '@/lib/hierarchy';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = {
  universidad: 'Universidad',
  emprendimiento: 'Emprendimiento',
  proyectos: 'Proyectos',
  lectura: 'Lectura',
  musica: 'Música',
  ajedrez: 'Ajedrez',
  game: 'Game',
  idiomas: 'Idiomas',
  gym: 'Gym',
  general: 'General',
};

export function ScorecardMensual({ month }: { month: Date }) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const r = useResultadosPeriodo(start, end);
  const data = r.data;
  const monthGoals = getMonthGoalsSummary(start);

  const gymDays = data?.gym.perDay.length || 0;
  const gymMin = data?.workoutMin || 0;
  const booksTotal = data?.books.length || 0;
  const booksDone = data?.books.filter(b => b.done).length || 0;
  const songsTotal = data?.songs.length || 0;
  const songsDone = data?.songs.filter(s => s.status === 'mastered').length || 0;
  const bookPct = booksTotal > 0 ? Math.round((booksDone / booksTotal) * 100) : null;
  const songPct = songsTotal > 0 ? Math.round((songsDone / songsTotal) * 100) : null;

  const rows = AREA_ORDER.map(k => {
    const byArea = data?.byArea?.[k] || { minutes: 0, goalMinutes: 0 };
    let goal = 0;
    if (k === 'idiomas') goal = (monthGoals.italiano || 0) + (monthGoals.ingles || 0);
    else goal = monthGoals[k] || byArea.goalMinutes || 0;
    const minutes = byArea.minutes || 0;
    return {
      key: k as AreaKey,
      label: LABELS[k] || k,
      minutes,
      goal,
      pct: goal > 0 ? Math.round((minutes / goal) * 100) : null,
    };
  }).filter(x => x.minutes > 0 || (x.goal || 0) > 0);

  const planTotal = rows.reduce((s, x) => s + (x.goal || 0), 0);
  const realTotal = rows.reduce((s, x) => s + x.minutes, 0);

  const kpi = (label: string, value: string, sub: string, icon: React.ReactNode, tone: string) => (
    <div className="rounded-2xl border border-border/50 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-sm p-3.5 flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tone)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-tight truncate">{value}</p>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[9px] text-muted-foreground/70 truncate">{sub}</p>}
      </div>
    </div>
  );

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sky-500" />
            <h2 className="text-sm font-semibold">Scorecard mensual</h2>
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {format(start, 'MMMM yyyy', { locale: es })}
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpi('Días de gym', `${gymDays}`, gymMin > 0 ? `${gymMin} min de entrenamiento` : 'Sin actividad registrada', <Dumbbell className="h-4 w-4" />, 'bg-red-500/10 text-red-500')}
          {kpi('Minutos vs meta', planTotal > 0 ? `${Math.round((realTotal / planTotal) * 100)}%` : '—', planTotal > 0 ? `${realTotal}/${planTotal} min` : 'Sin metas de minutos', <Activity className="h-4 w-4" />, 'bg-indigo-500/10 text-indigo-500')}
          {kpi('Libros', booksTotal > 0 ? `${booksDone}/${booksTotal}` : '—', bookPct != null ? `${bookPct}% completados` : 'Sin libros planificados', <BookOpen className="h-4 w-4" />, 'bg-rose-500/10 text-rose-500')}
          {kpi('Canciones', songsTotal > 0 ? `${songsDone}/${songsTotal}` : '—', songPct != null ? `${songPct}% dominadas` : 'Sin canciones planificadas', <Music className="h-4 w-4" />, 'bg-emerald-500/10 text-emerald-500')}
        </div>

        {rows.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Minutos por área vs meta</h3>
            </div>
            {rows.map(row => (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate">{row.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {row.minutes} min{row.goal > 0 ? ` / ${row.goal}` : ''}
                    {row.pct != null && <b className={cn('ml-1', row.pct >= 100 ? 'text-emerald-600' : row.pct >= 60 ? 'text-amber-600' : 'text-destructive')}>{row.pct}%</b>}
                  </span>
                </div>
                <Progress value={Math.min(row.pct ?? 0, 100)} className="h-1.5"
                  indicatorClassName={cn((row.pct ?? 0) >= 100 ? 'bg-emerald-500' : (row.pct ?? 0) >= 60 ? 'bg-primary' : 'bg-destructive')} />
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border/60">
            Sin actividad ni metas registradas para este mes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}