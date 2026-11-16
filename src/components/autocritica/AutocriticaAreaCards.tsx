import { Activity, Target } from 'lucide-react';
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
  if (pct >= 60) return { label: 'Parcial', cls: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' };
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

  return (
    <div className="flex flex-col gap-3 px-3.5 py-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center lg:gap-4 lg:px-4">
      <div className="flex min-w-0 items-center gap-3 lg:w-56 lg:shrink-0">
        <div className={cn('relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br', getCoverGradient(row.key))}>
          {cover ? (
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xl drop-shadow-sm">{emoji}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-sm font-semibold leading-tight">{row.label}</h4>
            <span className="shrink-0 text-base font-bold tabular-nums leading-none lg:hidden">
              {combinedPct != null ? `${combinedPct}%` : '—'}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', verdict.cls)}>
              {verdict.label}
            </span>
            <p className="truncate text-[11px] text-muted-foreground">
              {row.resultTotal > 0
                ? `${row.resultDone}/${row.resultTotal} ${row.resultUnit}`
                : 'Sin objetivo marcable'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <Activity className="h-3 w-3" /> Esfuerzo
            </span>
            <span className="font-semibold tabular-nums">
              {row.plan > 0 ? `${row.real}/${row.plan} min` : `${row.real} min`}
              {effortPct != null ? ` · ${effortPct}%` : ''}
            </span>
          </div>
          <Progress
            value={Math.min(effortPct ?? 0, 100)}
            className="h-1.5"
            indicatorClassName={effortBar(effortPct)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <Target className="h-3 w-3" /> Resultado
            </span>
            <span className="font-semibold tabular-nums">{resultPct != null ? `${resultPct}%` : '—'}</span>
          </div>
          <Progress
            value={Math.min(resultPct ?? 0, 100)}
            className="h-1.5"
            indicatorClassName={resultBar(resultPct)}
          />
        </div>
      </div>

      <div className="hidden w-16 shrink-0 text-right lg:block">
        <div className="text-lg font-bold tabular-nums leading-none">
          {combinedPct != null ? `${combinedPct}%` : '—'}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">global</div>
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
    <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-background/40">
      {rows.map(row => (
        <AutocriticaAreaCard key={row.key} row={row} cover={areaCoverFor(row.key, covers)} />
      ))}
    </div>
  );
}
