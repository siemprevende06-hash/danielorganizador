import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookMarked,
  CalendarClock,
  Check,
  CheckCircle2,
  Gauge,
  Loader2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatWpm, type SpeakingMetrics, type SummaryError } from '@/lib/speakingMetrics';
import type { Language } from '@/hooks/useLanguageLearning';
import { TUTOR_MODES, type TutorSkill } from './tutorModes';

export interface SpeakingReportData {
  minutes: number;
  elapsedMs: number;
  metrics: SpeakingMetrics;
  /** Chat libre: la habilidad se pregunta al cerrar (B1). */
  needsSkill: boolean;
  /** Los minutos ya se registraron con una habilidad conocida. */
  saved: boolean;
  scenarioLabel?: string | null;
  structureLabel?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  level: string;
  report: SpeakingReportData | null;
  summary: string;
  summaryLoading: boolean;
  errors: SummaryError[];
  errorsSaved: boolean;
  onSaveMinutes: (skill: TutorSkill) => void;
  onSaveErrors: () => void;
  onRepeatTomorrow: () => void;
  onRequestSummary: () => void;
}

const LANGUAGE_LABEL: Record<Language, string> = {
  english: 'Inglés',
  italian: 'Italiano',
};

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** M7: qué hacer en la próxima sesión según el resultado. */
function recommendation(metrics: SpeakingMetrics): { tone: 'success' | 'warning' | 'info'; text: string } {
  if (metrics.turns === 0) {
    return {
      tone: 'info',
      text: 'No hubo turnos tuyos. La próxima vez empieza con una frase corta y deja que el tutor pregunte.',
    };
  }
  if (metrics.correctPct !== null && metrics.correctPct >= 90) {
    return {
      tone: 'success',
      text: 'Vas sobrado: sube el escenario un nivel o activa «Charla larga» para respuestas más ricas.',
    };
  }
  if (metrics.correctPct !== null && metrics.correctPct < 50) {
    return {
      tone: 'warning',
      text: 'Ve más despacio: activa «Turnos cortos», elige una estructura y repite la frase corregida antes de seguir.',
    };
  }
  if (metrics.wpm > 0 && metrics.wpm < 70) {
    return {
      tone: 'info',
      text: 'Buen control, pero hablas pausado. Practica la misma idea en 30 segundos sin parar para ganar fluidez.',
    };
  }
  return {
    tone: 'info',
    text: 'Ritmo correcto. Repite mañana el mismo escenario y compara el % de frases correctas.',
  };
}

/**
 * Informe de cierre de una sesión de Speaking (U7).
 *
 * Reúne en un solo sitio lo que antes se perdía entre toasts: minutos, métricas
 * locales, errores para el cuaderno y el resumen del tutor. También pregunta la
 * habilidad cuando se practicó en chat libre (B1).
 */
export function SpeakingSessionReport({
  open,
  onOpenChange,
  language,
  level,
  report,
  summary,
  summaryLoading,
  errors,
  errorsSaved,
  onSaveMinutes,
  onSaveErrors,
  onRepeatTomorrow,
  onRequestSummary,
}: Props) {
  const [skill, setSkill] = useState<TutorSkill>('speaking');

  useEffect(() => {
    if (open) setSkill('speaking');
  }, [open]);

  if (!report) return null;

  const metrics = report.metrics;
  const recommendationInfo = recommendation(metrics);
  const needsSkill = report.needsSkill && !report.saved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[min(34rem,94vw)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Sesión de Speaking · {LANGUAGE_LABEL[language]} {level}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {report.scenarioLabel
              ? `Escenario: ${report.scenarioLabel}`
              : report.structureLabel
                ? `Estructura: ${report.structureLabel}`
                : 'Conversación libre'}
            {report.elapsedMs > 0 ? ` · ${formatDuration(report.elapsedMs)} en el cronómetro` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric icon={<CalendarClock className="h-3.5 w-3.5" />} label="Minutos" value={`${report.minutes}`} hint="guardados" />
          <Metric icon={<MessageCircle className="h-3.5 w-3.5" />} label="Turnos" value={`${metrics.turns}`} hint={`${metrics.avgWordsPerTurn} palabras/turno`} />
          <Metric icon={<Gauge className="h-3.5 w-3.5" />} label="Ritmo" value={formatWpm(metrics.wpm)} hint={`${metrics.words} palabras`} />
          <Metric
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Correctas"
            value={metrics.correctPct === null ? '—' : `${metrics.correctPct}%`}
            hint={metrics.evaluated > 0 ? `${metrics.correct}/${metrics.evaluated} frases` : 'sin evaluar'}
          />
        </div>

        {metrics.fillers > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Muletillas detectadas: {metrics.fillers}. No es un error, pero bajarlas mejora la fluidez.
          </p>
        )}

        {needsSkill && (
          <section className="space-y-2 rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
            <p className="text-xs font-semibold">¿Qué practicaste en esta sesión?</p>
            <p className="text-[11px] text-muted-foreground">
              El chat libre no registra minutos a ciegas. Elige la habilidad real para que tu progreso no mienta.
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {TUTOR_MODES.map(m => (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  variant={skill === m.id ? 'default' : 'outline'}
                  className="h-8 justify-start gap-1.5 text-[11px]"
                  onClick={() => setSkill(m.id)}
                >
                  <m.Icon className="h-3.5 w-3.5" />
                  {m.label}
                </Button>
              ))}
            </div>
            <Button size="sm" className="h-8 w-full text-[11px]" onClick={() => onSaveMinutes(skill)} disabled={report.minutes <= 0}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Guardar {report.minutes} min como {TUTOR_MODES.find(m => m.id === skill)?.label ?? skill}
            </Button>
          </section>
        )}

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <BookMarked className="h-3.5 w-3.5 text-primary" />
              Errores para el cuaderno
              {errors.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {errors.length}
                </Badge>
              )}
            </p>
            {errors.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant={errorsSaved ? 'ghost' : 'outline'}
                className={cn('h-7 gap-1 px-2 text-[11px]', errorsSaved && 'text-success')}
                onClick={onSaveErrors}
                disabled={errorsSaved}
              >
                {errorsSaved ? <Check className="h-3 w-3" /> : <BookMarked className="h-3 w-3" />}
                {errorsSaved ? 'Guardados' : 'Guardar todos'}
              </Button>
            )}
          </div>
          {errors.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              Sin errores evaluados en esta sesión. Si el tutor aún está corrigiendo, aparecerán al pedir el resumen.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {errors.slice(0, 5).map(error => (
                <li key={`${error.wrong}-${error.correct}`} className="rounded-lg border border-border/70 px-2.5 py-1.5 text-[11px]">
                  <p className="leading-snug">
                    <span className="text-muted-foreground line-through decoration-destructive/40">{error.wrong}</span>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className="font-semibold text-success">{error.correct}</span>
                  </p>
                  {error.note && <p className="mt-0.5 leading-snug text-muted-foreground">{error.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-1.5">
          <p className="text-xs font-semibold">Resumen del tutor</p>
          {summaryLoading ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Preparando el resumen de la sesión…
            </p>
          ) : summary ? (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border/70 px-3 py-2 text-[12px] leading-relaxed [&_h2]:mt-2 [&_h2]:text-xs [&_h3]:mt-2 [&_h3]:text-xs [&_li]:text-[12px] [&_p]:mb-1.5 [&_p]:text-[12px] [&_ul]:mb-1.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
          ) : (
            <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={onRequestSummary}>
              Pedir resumen al tutor
            </Button>
          )}
        </section>

        <p
          className={cn(
            'rounded-lg border px-2.5 py-1.5 text-[11px] leading-snug',
            recommendationInfo.tone === 'success' && 'border-success/30 bg-success/5 text-success',
            recommendationInfo.tone === 'warning' && 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
            recommendationInfo.tone === 'info' && 'border-border/70 bg-muted/30 text-muted-foreground'
          )}
        >
          {recommendationInfo.text}
        </p>

        <DialogFooter className="gap-1.5 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-[11px]" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" size="sm" className="h-8 text-[11px]" onClick={onRepeatTomorrow}>
            <CalendarClock className="mr-1 h-3.5 w-3.5" />
            Guardar y repetir mañana
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{hint}</p>
    </div>
  );
}
