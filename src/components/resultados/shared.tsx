import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

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

export function BigNumber({ value, fraction, label, badge, accent }: {
  value: string;
  fraction?: string;
  label: string;
  badge?: string;
  accent?: string;
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
      <Progress value={71} className="h-1.5" />
    </>
  );
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