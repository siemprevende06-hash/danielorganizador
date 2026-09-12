import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Music, ListChecks, Flame, Save, Loader2, NotebookPen } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER } from '@/hooks/useResultadosPeriodo';
import { useTextSection } from '@/hooks/useTextSection';
import { cn } from '@/lib/utils';

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const BAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReviewAnual({ year }: { year: number }) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const r = useResultadosPeriodo(start, end).data ?? EMPTY_RESULTADO;

  const { data: reviewText, setData: setReviewText, saveNow, saving } = useTextSection<string>(`review-anual-${year}`, '');

  const [monthly, setMonthly] = useState<number[]>(Array(12).fill(0));
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const startStr = `${year}-01-01`;
      const endStr = `${year}-12-31`;
      const [trackingRes, streakRes] = await Promise.all([
        supabase.from('daily_systems_tracking').select('tracking_date, time_data').gte('tracking_date', startStr).lte('tracking_date', endStr),
        supabase.from('system_habit_streaks').select('current_streak').order('current_streak', { ascending: false }).limit(1),
      ]);
      if (cancelled) return;

      const acc = Array(12).fill(0);
      (trackingRes.data || []).forEach((row) => {
        const d = row.tracking_date || '';
        const m = Number(d.slice(5, 7)) - 1;
        if (m >= 0 && m < 12) {
          let total = 0;
          Object.entries((row.time_data || {}) as Record<string, number>).forEach(([, v]) => { total += Number(v) || 0; });
          acc[m] += total;
        }
      });
      setMonthly(acc);
      setStreak((streakRes.data && streakRes.data[0]?.current_streak) || 0);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const minutes = AREA_ORDER.reduce((s, k) => s + (r.byArea?.[k]?.minutes || 0), 0);
  const booksDone = r.books.filter(b => b.done).length;
  const booksTotal = r.books.length;
  const songsDone = r.songs.filter(s => s.status === 'mastered').length;
  const songsTotal = r.songs.length;
  const taskPct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : 0;
  const chartData = monthly.map((m, i) => ({ month: MONTH_SHORT[i], mins: Math.round(m) }));
  const maxMin = Math.max(...monthly, 1);
  const activeMonths = monthly.filter(m => m > 0).length;

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
    <div className="space-y-4">
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500" />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-fuchsia-500" />
            <h2 className="text-sm font-semibold">Review anual {year}</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpi('Score del año', `${r.score || 0}`, `${taskPct}% de tareas completadas`, <Award className="h-4 w-4" />, 'bg-fuchsia-500/10 text-fuchsia-500')}
            {kpi('Horas registradas', `${(minutes / 60).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, `en ${activeMonths} meses con actividad`, <ListChecks className="h-4 w-4" />, 'bg-indigo-500/10 text-indigo-500')}
            {kpi('Libros / canciones', `${booksDone}/${booksTotal} · ${songsDone}/${songsTotal}`, booksTotal > 0 ? `${Math.round((booksDone / booksTotal) * 100)}% lecturas · ${songsTotal > 0 ? Math.round((songsDone / songsTotal) * 100) : 0}% música` : 'Sin plan de libros', <BookOpen className="h-4 w-4" />, 'bg-rose-500/10 text-rose-500')}
            {kpi('Mejor racha', `${streak}d`, 'racha actual más larga de sistemas', <Flame className="h-4 w-4" />, 'bg-orange-500/10 text-orange-500')}
          </div>

          {maxMin > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Music className="h-3 w-3" /> Minutos por mes
              </p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 0, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                      formatter={(v: number) => [`${v} min`, 'Minutos']}
                    />
                    <Bar dataKey="mins" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={d.mins > 0 ? 0.9 : 0.15} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-semibold">Resumen y reflexión anual</h2>
            </div>
            <Button variant="outline" size="sm" onClick={saveNow} disabled={saving} className="text-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Guardar
            </Button>
          </div>
          <Textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder={'¿Qué logré este año? ¿Qué aprendizajes me llevo? ¿Qué voy a mejorar el próximo año?'}
            className="min-h-[140px] resize-y text-sm leading-relaxed"
          />
          <p className="text-[9px] text-muted-foreground">Se guarda automáticamente al escribir y con el botón Guardar.</p>
          <Badge variant="outline" className="text-[9px] tabular-nums">{year}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}