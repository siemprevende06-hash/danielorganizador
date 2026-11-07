import { Activity, CheckCircle2, Target } from 'lucide-react';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { Progress } from '@/components/ui/progress';
import { coverKey } from '@/hooks/useAreaCovers';
import { cn } from '@/lib/utils';

export interface AutocriticaAreaRow {
  key: string;
  label: string;
  /** Minutos planificados para el área en el período. */
  plan: number;
  /** Minutos realmente registrados en el área. */
  real: number;
  /** Avance del objetivo del área (tareas, páginas, habilidades…). */
  resultDone: number;
  resultTotal: number;
  resultUnit: string;
}

const AREA_META: Record<string, { emoji: string; coverFallback?: string }> = {
  universidad: { emoji: '🎓', coverFallback: 'profesional' },
  emprendimiento: { emoji: '🚀', coverFallback: 'profesional' },
  proyectos: { emoji: '📦', coverFallback: 'profesional' },
  lectura: { emoji: '📖', coverFallback: 'desarrollo' },
  musica: { emoji: '🎹', coverFallback: 'desarrollo' },
  ajedrez: { emoji: '♟️', coverFallback: 'desarrollo' },
  game: { emoji: '🎮', coverFallback: 'desarrollo' },
  idiomas: { emoji: '🌍', coverFallback: 'desarrollo' },
  gym: { emoji: '💪', coverFallback: 'salud' },
  general: { emoji: '✅' },
};

/** Portada del área con el mismo respaldo que usa Resultados. */
function areaCoverFor(key: string, covers: Record<string, string>): string | null {
  const fallback = AREA_META[key]?.coverFallback;
  return covers[coverKey('sub', key)]
    || (fallback ? covers[coverKey('area', fallback)] : undefined)
    || null;
}

const verdictFor = (pct: number | null) => {
  if (pct == null) return { label: 'Sin datos', cls: 'text-muted-foreground bg-muted' };
  if (pct >= 100) return { label: 'Cumplido', cls: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' };
  if (pct >= 60) return { label: 'Parcial', cls: 'text-amber-600 bg-amber-500/10' };
  return { label: 'No cumplido', cls: 'text-destructive bg-destructive/10' };
};

const effortBar = (pct: number | null) => {
  if (pct == null) return 'bg-muted-foreground/40';
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-indigo-500';
  return 'bg-destructive';
};

const resultBar = (pct: number | null) => {
  if (pct == null) return 'bg-muted-foreground/40';
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

function AutocriticaAreaCard({ row, cover }: { row: AutocriticaAreaRow; cover: string | null }) {
  const emoji = AREA_META[row.key]?.emoji ?? '📌';
  const effortPct = row.plan > 0 ? Math.round((row.real / row.plan) * 100) : null;
  const resultPct = row.resultTotal > 0 ? Math.round((row.resultDone / row.resultTotal) * 100) : null;
  const available = [effortPct, resultPct].filter((value): value is number => value != null);
  const combinedPct = available.length > 0
    ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length)
    : null;
  const verdict = verdictFor(combinedPct);
  const complete = combinedPct != null && combinedPct >= 100;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl ring-2 transition-colors',
        complete
          ? 'ring-emerald-500/40 bg-emerald-500/5'
          : 'ring-border/40 bg-white/80 dark:bg-zinc-950/80',
      )}
    >
      {/* Portada: mismo lenguaje visual que las tarjetas de Planificación. */}
      <div className={cn('relative h-16 w-full shrink-0 overflow-hidden bg-gradient-to-br', getCoverGradient(row.key))}>
        {cover ? (
          <img src={cover} alt={row.label} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">{emoji}</span>
          </div>
        )}
        {combinedPct != null && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            {combinedPct}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-[12px] font-bold leading-tight">{row.label}</h4>
          <span className={cn('ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold', verdict.cls)}>
            {verdict.label}
          </span>
        </div>

        {/* Esfuerzo real vs objetivo planificado. */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-xl bg-indigo-500/10 p-2">
            <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              <Activity className="h-2.5 w-2.5" />
              Esfuerzo
            </p>
            <p className="mt-0.5 text-xl font-extrabold leading-none tabular-nums">
              {row.real}
              <span className="ml-0.5 text-[9px] font-semibold text-muted-foreground">min</span>
            </p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">hechos</p>
          </div>

          <div className="rounded-xl bg-amber-500/10 p-2">
            <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <Target className="h-2.5 w-2.5" />
              Objetivo
            </p>
            <p className="mt-0.5 text-xl font-extrabold leading-none tabular-nums">
              {row.plan}
              <span className="ml-0.5 text-[9px] font-semibold text-muted-foreground">min</span>
            </p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">planificados</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[8px]">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">Esfuerzo vs plan</span>
            <span className="font-bold tabular-nums">{effortPct != null ? `${effortPct}%` : '—'}</span>
          </div>
          <Progress
            value={Math.min(effortPct ?? 0, 100)}
            className="h-1.5"
            indicatorClassName={effortBar(effortPct)}
          />
        </div>

        {/* Resultado / avance del objetivo del área. */}
        <div
          className={cn(
            'mt-auto space-y-1 rounded-xl p-2',
            resultPct != null && resultPct >= 100 ? 'bg-emerald-500/10' : 'bg-foreground/[0.04]',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
              Resultado objetivo
            </span>
            <span className="text-sm font-extrabold leading-none tabular-nums">
              {resultPct != null ? `${resultPct}%` : '—'}
            </span>
          </div>
          <Progress
            value={Math.min(resultPct ?? 0, 100)}
            className="h-1.5"
            indicatorClassName={resultBar(resultPct)}
          />
          <div className="flex items-center justify-between gap-2 text-[8px] text-muted-foreground">
            <span className="truncate">
              {row.resultTotal > 0
                ? `${row.resultDone}/${row.resultTotal} ${row.resultUnit}`
                : 'Sin objetivos marcables'}
            </span>
            <span className="shrink-0">{resultPct != null ? 'avance' : 'sin datos'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AutocriticaAreaCards({
  rows,
  covers,
}: {
  rows: AutocriticaAreaRow[];
  covers: Record<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(row => (
        <AutocriticaAreaCard key={row.key} row={row} cover={areaCoverFor(row.key, covers)} />
      ))}
    </div>
  );
}
