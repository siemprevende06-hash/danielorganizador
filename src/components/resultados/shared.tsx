import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, BookOpen, Music } from 'lucide-react';
import type { PlanBook, PlanSong } from '@/hooks/useResultadosPeriodo';

export const AREA_COLORS: Record<string, string> = {
  universidad: 'from-blue-600 to-indigo-500',
  lectura: 'from-cyan-500 to-sky-500',
  tareas: 'from-emerald-500 to-teal-500',
  emprendimiento: 'from-purple-500 to-fuchsia-500',
  proyectos: 'from-amber-500 to-orange-500',
  musica: 'from-pink-500 to-rose-500',
  ajedrez: 'from-slate-600 to-zinc-600',
  gym: 'from-red-500 to-orange-500',
  game: 'from-rose-500 to-red-500',
};

export function AreaCard({ title, icon, color, children }: {
  title: string;
  icon?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      {color && <div className={cn('h-1 bg-gradient-to-r', color)} />}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function AreaRow({ title, color, plan, result }: {
  title: string;
  color?: string;
  plan: React.ReactNode;
  result: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AreaCard title={`${title} — lo planificado`} color={color}>{plan}</AreaCard>
      <AreaCard title={`${title} — resultado`} color={color}>{result}</AreaCard>
    </div>
  );
}

export function CheckItem({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('flex items-start gap-2 text-xs', done && 'opacity-60')}>
      {done
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
        : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />}
      <span className={cn(done && 'line-through')}>{children}</span>
    </li>
  );
}

export function ResultRow({ label, value, ok, pending }: { label: string; value: string; ok?: boolean; pending?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-muted/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-semibold">
        {pending && <Circle className="h-3 w-3 text-amber-500" />}
        {ok && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        {value}
      </span>
    </div>
  );
}

export function ResumenGeneral({ score, subtitle, badges, stats }: {
  score: number;
  subtitle: string;
  badges: string[];
  stats: [string, string][];
}) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-primary" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - score / 100)}`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{score}</span>
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-semibold">{subtitle}</p>
          <p className="text-xs text-muted-foreground">Resultados alcanzados frente a lo planificado</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {badges.map(b => (
              <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {stats.map(([l, v]) => (
            <div key={l} className="rounded-xl bg-muted/40 px-2 py-2">
              <p className="text-sm font-bold tabular-nums">{v}</p>
              <p className="text-[9px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BigNumber({ value, fraction, label, badge, accent, progress = 71 }: {
  value: string;
  fraction?: string;
  label: string;
  badge?: string;
  accent?: string;
  progress?: number;
}) {
  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold tabular-nums">{value} {fraction && <span className="text-sm text-muted-foreground">{fraction}</span>}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
        {badge && <Badge variant="outline" className={cn('text-[10px]', accent)}>{badge}</Badge>}
      </div>
      <Progress value={Math.min(progress, 100)} className="h-1.5" />
    </>
  );
}

export function TaskPlanList({ area }: { area: { tasks: any[] } }) {
  if (!area.tasks || area.tasks.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic">Sin tareas planificadas</p>;
  }
  return (
    <ul className="space-y-1.5">
      {area.tasks.map((t: any) => (
        <li key={t.id}>
          <div className="flex items-start gap-2 text-xs">
            {t.completed
              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className={cn('break-words leading-snug', t.completed && 'line-through opacity-60')}>{t.title}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {t.entityName && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{t.entityName}</Badge>
                )}
                {t.dueShort && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{t.dueShort}</Badge>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BookCloud({ books }: { books: PlanBook[] }) {
  if (!books || books.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic">Sin libros del plan para este período</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {books.map(b => (
        <div key={b.id} className={cn('flex items-center gap-2 rounded-xl border p-1.5 pr-2.5 max-w-[220px]', b.done ? 'border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-border/50 bg-muted/20')}>
          {b.cover ? (
            <img src={b.cover} alt={b.title} className="w-8 h-11 rounded-md object-cover shrink-0 border border-border/40" />
          ) : (
            <div className="w-8 h-11 rounded-md bg-gradient-to-br from-cyan-500/30 to-sky-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-cyan-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold leading-tight break-words">{b.title}</p>
            <p className="text-[8px] text-muted-foreground truncate">
              {b.done ? 'Terminado' : b.pagesTotal > 0 ? `${b.pagesRead}/${b.pagesTotal} pág` : 'Pendiente'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SongCloud({ songs }: { songs: PlanSong[] }) {
  if (!songs || songs.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic">Sin canciones del plan para este período</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {songs.map(s => (
        <Badge key={s.id} variant="outline" className="text-[10px] gap-1 py-1 max-w-full">
          <Music className="w-3 h-3 text-pink-500 shrink-0" />
          <span className="truncate max-w-[130px]">{s.title}</span>
          <span className="text-[8px] text-muted-foreground">· {s.practiceMinutes}m</span>
        </Badge>
      ))}
    </div>
  );
}

export function PlanDelMes({ books, songs, title = 'Plan trimestral del mes' }: { books: PlanBook[]; songs: PlanSong[]; title?: string }) {
  const hasBooks = books && books.length > 0;
  const hasSongs = songs && songs.length > 0;
  if (!hasBooks && !hasSongs) return null;
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {hasBooks && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3 text-cyan-600" /> Libros a leer</p>
              <Badge variant="outline" className="text-[8px]">{books.filter(b => b.done).length}/{books.length} terminados</Badge>
            </div>
            <BookCloud books={books} />
          </div>
        )}
        {hasSongs && (
          <div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1.5"><Music className="w-3 h-3 text-pink-500" /> Canciones a dominar</p>
            <SongCloud songs={songs} />
          </div>
        )}
      </div>
    </div>
  );
}

export function MinutesRow({ area, label = 'Minutos invertidos' }: { area: { minutes: number; goalMinutes: number }; label?: string }) {
  const goal = area.goalMinutes || 0;
  const ok = area.minutes > 0 && area.minutes >= goal;
  return (
    <ResultRow
      label={label}
      value={goal > 0 ? `${Math.round(area.minutes / 60 * 10) / 10}h / ${Math.round(goal / 60 * 10) / 10}h` : `${Math.round(area.minutes / 60 * 10) / 10}h`}
      ok={ok}
      pending={area.minutes > 0 && !ok}
    />
  );
}

export function AreaEmpty({ children = 'Sin registro en el período' }: { children?: React.ReactNode }) {
  return <p className="text-[10px] text-muted-foreground italic">{children}</p>;
}

export function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-muted/50 p-2">
      <div className="flex items-center justify-center text-muted-foreground">{icon}</div>
      <p className="text-[11px] font-bold mt-0.5 text-center">{value}</p>
      <p className="text-[8px] text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export function StagesBar({ stages, current }: { stages: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1 mt-2">
      {stages.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={cn('h-1 rounded-full', i <= current ? 'bg-rose-500' : 'bg-muted')} />
          <p className={cn('text-[8px] text-center mt-1', i === current && 'font-bold text-rose-500', i > current && 'text-muted-foreground')}>{s}</p>
        </div>
      ))}
    </div>
  );
}