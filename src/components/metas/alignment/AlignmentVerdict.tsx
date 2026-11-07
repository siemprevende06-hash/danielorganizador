import { AlertTriangle, CheckCircle2, Compass, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlignmentAreaLine, Verdict } from '@/lib/alignment';
import type { PlanDayStatus } from '@/lib/planSystems';
import {
  Chip,
  Ring,
  SectionHeader,
  TONE,
  toneForDiagnosis,
  type Tone,
} from './alignmentUi';

function clamp(value: number): number {
  return Math.max(3, Math.min(97, value));
}

export function AlignmentVerdict({
  score,
  verdict,
  timePct,
  strengths,
  blockers,
  todayActions,
  areaLines,
}: {
  score: number;
  verdict: Verdict;
  timePct: number;
  strengths: AlignmentAreaLine[];
  blockers: AlignmentAreaLine[];
  todayActions: Array<{
    id: string;
    label: string;
    emoji: string;
    status: PlanDayStatus | null;
  }>;
  areaLines: AlignmentAreaLine[];
}) {
  const tone = verdict.tone as Tone;
  const diff = score - timePct;
  const ahead = diff > 0;
  const behind = diff < 0;

  return (
    <section className="space-y-3">
      <SectionHeader
        index="02"
        icon={Compass}
        title="El veredicto"
        subtitle="La respuesta en tres segundos."
        chips={<Chip label={`${score}% alineado`} tone={tone} />}
      />

      <div
        className={cn(
          'rounded-3xl border p-4 shadow-sm md:p-5',
          TONE[tone].border,
          TONE[tone].bg,
        )}
      >
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
          <Ring
            value={score}
            size={132}
            tone={tone}
            label={`Índice de alineación: ${score}%`}
            hint="Índice = 55% ejecución + 25% resultados + 20% áreas. Umbrales: 70 en camino, 45 con grietas. Es una heurística de lectura, no una métrica oficial."
          />

          <div className="min-w-0 flex-1 text-center md:text-left">
            <p className="text-lg font-bold leading-tight">{verdict.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{verdict.message}</p>
            <p
              className="mt-1 text-[9px] font-semibold text-muted-foreground/70"
              title="Heurística de lectura, no una métrica oficial."
            >
              55% ejecución · 25% resultados · 20% áreas
            </p>

            <div className="mt-3 grid gap-2 text-left sm:grid-cols-3">
              <VerdictColumn
                title="Te acerca"
                tone="green"
                icon={CheckCircle2}
                empty="Aún sin fortalezas claras."
                items={strengths.map(area => ({
                  key: area.id,
                  icon: area.icon,
                  label: area.label,
                  detail: `${area.effort}% esfuerzo`,
                }))}
              />
              <VerdictColumn
                title="Te frena"
                tone="amber"
                icon={AlertTriangle}
                empty="Sin frenos claros."
                items={blockers.map(area => ({
                  key: area.id,
                  icon: area.icon,
                  label: area.label,
                  detail: area.diagnosis.short,
                }))}
              />
              <VerdictColumn
                title="Hoy toca"
                tone="primary"
                icon={Target}
                empty="Todo hecho por hoy."
                items={todayActions.map(action => ({
                  key: action.id,
                  icon: action.emoji,
                  label: action.label,
                  detail: action.status === 'partial' ? 'Parcial' : 'Pendiente',
                }))}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5 md:grid-cols-10">
          {areaLines.map(area => {
            const areaTone = toneForDiagnosis(area.diagnosis.tone);
            return (
              <div
                key={area.id}
                title={`${area.label} · ${area.diagnosis.short}`}
                className="flex flex-col items-center gap-1 rounded-xl border border-border/50 bg-background/50 px-1 py-1.5"
              >
                <span className="text-base leading-none">{area.icon}</span>
                <span className={cn('h-1.5 w-1.5 rounded-full', TONE[areaTone].solid)} />
                <span className="max-w-full truncate text-[8px] font-semibold text-muted-foreground">
                  {area.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-muted-foreground">Calendario {timePct}%</span>
            <span className={ahead
              ? 'text-emerald-600 dark:text-emerald-400'
              : behind
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'}>
              Tú {score}%
            </span>
          </div>

          <div className="relative mt-1.5 h-2 rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                ahead ? 'bg-emerald-500/25' : behind ? 'bg-amber-500/25' : 'bg-muted-foreground/20',
              )}
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
            <span
              className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
              style={{ left: `${clamp(timePct)}%` }}
              title={`Calendario: ${timePct}%`}
            />
            <span
              className={cn(
                'absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded-full',
                ahead ? 'bg-emerald-500' : behind ? 'bg-amber-500' : 'bg-foreground',
              )}
              style={{ left: `${clamp(score)}%` }}
              title={`Tú: ${score}%`}
            />
          </div>

          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {ahead
              ? `El calendario va por el ${timePct}%. Tú vas por el ${score}%. Vas ${diff} puntos adelantado.`
              : behind
                ? `El calendario va por el ${timePct}%. Tú vas por el ${score}%. Vas ${Math.abs(diff)} puntos por detrás.`
                : `El calendario y tú van al mismo ritmo (${score}%).`}
          </p>
        </div>
      </div>
    </section>
  );
}

function VerdictColumn({
  title,
  tone,
  icon: Icon,
  items,
  empty = 'Sin datos todavía.',
}: {
  title: string;
  tone: Tone;
  icon: typeof CheckCircle2;
  items: Array<{ key: string; icon: string; label: string; detail: string }>;
  empty?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/55 p-2">
      <p className={cn('flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider', TONE[tone].text)}>
        <Icon className="h-3 w-3" />
        {title}
      </p>
      <div className="mt-1 space-y-0.5">
        {items.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">{empty}</p>
        ) : (
          items.slice(0, 3).map(item => (
            <div key={item.key} className="flex items-center gap-1">
              <span className="text-[11px] leading-none">{item.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">{item.label}</span>
              <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">{item.detail}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
