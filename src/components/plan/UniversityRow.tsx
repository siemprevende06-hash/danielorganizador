import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, CheckCircle2, Circle, Clock, GraduationCap, Plus, Target, Timer, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { StudySessionRow, MonthTaskCounts } from '@/hooks/useWeeklyPlanData';
import { Ring } from './WeekMinutesRings';

const fmtMin = (m: number) => {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
};

/** Selector de resultado persiguiendo (viene de la sección Resultados) */
function ResultTarget({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; title: string; done: boolean }[];
  onChange: (v: string) => void;
}) {
  const [custom, setCustom] = useState(false);
  return (
    <div className="space-y-1">
      <select
        value={custom ? '__custom__' : value}
        onChange={e => {
          if (e.target.value === '__custom__') {
            setCustom(true);
            return;
          }
          onChange(e.target.value);
        }}
        className="h-7 w-full rounded-md border border-input bg-background px-1.5 text-[11px] outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Resultado a perseguir…</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.done ? '✓ ' : ''}{o.title}
          </option>
        ))}
        <option value="__custom__">✏️ Otro resultado…</option>
      </select>
      {(custom || !options.some(o => o.id === value)) && value !== '' && (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Describe el resultado que persigues"
          className="h-7 text-[11px]"
        />
      )}
    </div>
  );
}

/** Fila completa: Universidad / Académico-profesional + sesiones de estudio */
export function UniversityRow({
  sessions,
  counts,
  minutesThisWeek,
  minutesGoal,
  subjects,
  results,
  resultId,
  onResultChange,
  onMinutesGoalChange,
  onRefresh,
}: {
  sessions: StudySessionRow[];
  counts: MonthTaskCounts;
  minutesThisWeek: number;
  minutesGoal: number;
  subjects: { id: string; name: string }[];
  results: { id: string; title: string; done: boolean }[];
  resultId: string;
  onResultChange: (v: string) => void;
  onMinutesGoalChange: (v: number) => void;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const bySubject = useMemo(() => {
    const map = new Map<string, StudySessionRow[]>();
    sessions.forEach(s => {
      const key = s.subjectName || 'Otros';
      map.set(key, [...(map.get(key) ?? []), s]);
    });
    return [...map.entries()];
  }, [sessions]);

  const visible = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter(s => s.subjectName === filter)),
    [sessions, filter],
  );

  const plannedMinutes = sessions.reduce((a, s) => a + s.estimatedMinutes, 0);
  const doneMinutes = sessions.reduce((a, s) => a + s.minutesDone, 0);

  const toggleSession = async (s: StudySessionRow) => {
    setToggling(s.id);
    const { error } = await supabase.from('tasks').update({ completed: !s.completed }).eq('id', s.id);
    setToggling(null);
    if (!error) onRefresh();
  };

  const addSession = async (day: string, subjectId: string) => {
    const { error } = await supabase.from('tasks').insert({
      title: 'Sesión de estudio',
      source: 'university',
      area_id: 'universidad',
      source_id: subjectId || null,
      task_type: 'study',
      completed: false,
      due_date: `${day}T12:00:00`,
    });
    if (!error) onRefresh();
  };

  return (
    <section className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-background to-background backdrop-blur-sm overflow-hidden">
      {/* Cabecera: título profesional / académico + universidad */}
      <div className="px-4 py-3 border-b border-blue-500/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Profesional · Académico</p>
            <h2 className="text-base font-bold tracking-tight leading-tight">Universidad</h2>
            <p className="text-[10px] text-muted-foreground truncate">
              {subjects.length > 0 ? subjects.map(s => s.name).join(' · ') : 'Sin asignaturas activas'}
            </p>
          </div>

          <Ring label="Minutos" value={minutesThisWeek} goal={minutesGoal} size={54} stroke={5} color="#3b82f6" />

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 border-blue-500/40 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {counts.done}/{counts.total} tareas del mes
            </Badge>
            <Badge variant="outline" className="text-[10px] h-5">
              {counts.pending} sin hacer
            </Badge>
          </div>
        </div>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_auto] items-end">
          <ResultTarget value={resultId} options={results} onChange={onResultChange} />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={15}
              value={minutesGoal || ''}
              onChange={e => onMinutesGoalChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-7 w-20 text-[11px] tabular-nums text-center"
              title="Objetivo de minutos de la semana"
            />
            <span className="text-[10px] text-muted-foreground">min/semana</span>
          </div>
        </div>
      </div>

      {/* Resumen de esfuerzo */}
      <div className="px-4 py-2 grid grid-cols-3 gap-2 border-b border-blue-500/10 text-center">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Sesiones</p>
          <p className="text-sm font-bold tabular-nums">{sessions.length}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Esfuerzo planificado</p>
          <p className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">{fmtMin(plannedMinutes)}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Realizado</p>
          <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmtMin(doneMinutes)}</p>
        </div>
      </div>

      {/* Filtro por asignatura + alta de sesión */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-1.5 border-b border-muted/40">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
            filter === 'all' ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'border-muted text-muted-foreground hover:border-blue-400'
          )}
        >
          Todas ({sessions.length})
        </button>
        {bySubject.map(([name, list]) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
              filter === name ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'border-muted text-muted-foreground hover:border-blue-400'
            )}
          >
            {name} ({list.length})
          </button>
        ))}
        <select
          defaultValue=""
          onChange={e => {
            const v = e.target.value;
            if (!v) return;
            const [sid, day] = v.split('|');
            void addSession(day, sid);
            e.target.value = '';
          }}
          className="ml-auto h-6 rounded-md border border-input bg-background px-1 text-[10px] outline-none"
        >
          <option value="">+ Sesión de estudio</option>
          {subjects.flatMap(s =>
            [1, 2, 3, 4, 5, 6, 7].map(offset => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const ds = format(d, 'yyyy-MM-dd');
              return (
                <option key={`${s.id}-${ds}`} value={`${s.id}|${ds}`}>
                  {s.name} · {format(d, 'EEE d', { locale: es })}
                </option>
              );
            }),
          )}
        </select>
      </div>

      {/* Sesiones */}
      <div className="px-4 py-2.5">
        {visible.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-5 italic">
            No hay sesiones de estudio creadas desde Universidad para esta semana.
          </p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map(s => (
              <div
                key={s.id}
                className={cn(
                  'flex items-start gap-2 rounded-xl border border-l-[3px] border-l-blue-500 bg-background/60 px-2.5 py-2 transition-all hover:shadow-sm',
                  s.completed && 'opacity-60'
                )}
              >
                <button
                  onClick={() => toggleSession(s)}
                  className={cn(
                    'mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
                    s.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'
                  )}
                >
                  {toggling === s.id ? (
                    <Circle className="w-3 h-3 animate-spin" />
                  ) : s.completed ? (
                    <Check className="w-3 h-3" />
                  ) : null}
                </button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className={cn('text-[11px] font-semibold leading-snug break-words', s.completed && 'line-through')}>
                    {s.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {s.subjectName}
                    {s.topicTitle && ` · ${s.topicTitle}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {s.day && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1">
                        {format(new Date(`${s.day}T12:00:00`), 'EEE d', { locale: es })}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-blue-500/40 text-blue-600 dark:text-blue-400">
                      <Timer className="w-2.5 h-2.5 mr-0.5" />
                      {s.estimatedMinutes}m
                    </Badge>
                    {s.sessions > 0 && (
                      <Badge variant="secondary" className="text-[8px] h-4 px-1">
                        {s.sessions} sesión{s.sessions === 1 ? '' : 'es'} · {fmtMin(s.minutesDone)}
                      </Badge>
                    )}
                    {s.blockTitle && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1">
                        {s.blockTitle}
                      </Badge>
                    )}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await supabase.from('tasks').delete().eq('id', s.id);
                    onRefresh();
                  }}
                  className="opacity-0 hover:opacity-100 transition-opacity shrink-0"
                  title="Eliminar sesión"
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-muted/40 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Target className="w-3 h-3" />
        El esfuerzo de las sesiones se dirige al resultado elegido arriba.
      </div>
    </section>
  );
}