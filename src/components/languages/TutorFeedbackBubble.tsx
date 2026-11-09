import { CheckCircle2, Loader2, Sparkles, Volume2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TutorFeedback } from '@/hooks/useLanguageTutorCoach';

interface Props {
  original: string;
  feedback: TutorFeedback | null;
  evaluating: boolean;
  explaining: boolean;
  onExplain: () => void;
  onSpeakCorrection: () => void;
  onRetry: () => void;
}

export function TutorFeedbackBubble({
  original,
  feedback,
  evaluating,
  explaining,
  onExplain,
  onSpeakCorrection,
  onRetry,
}: Props) {
  if (evaluating) {
    return (
      <div className="flex w-full items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Revisando tu frase…
      </div>
    );
  }

  if (!feedback) return null;

  if (feedback.status === 'error') {
    return (
      <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[11px]">
        <p className="font-medium text-amber-700 dark:text-amber-300">No pude revisar tu frase</p>
        <p className="mt-0.5 text-muted-foreground">{feedback.explanation}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1.5 h-7 px-2 text-[11px]"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (feedback.status === 'correcto') {
    return (
      <div className="w-full rounded-xl border border-success/30 bg-success/5 px-2.5 py-2 text-[11px]">
        <p className="flex items-center gap-1.5 font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> Correcto
        </p>
        {feedback.explanation && <p className="mt-0.5 leading-relaxed text-muted-foreground">{feedback.explanation}</p>}
        {feedback.tip && <p className="mt-0.5 leading-relaxed text-muted-foreground">💡 {feedback.tip}</p>}
      </div>
    );
  }

  const changed =
    feedback.corrected &&
    feedback.corrected.replace(/\s+/g, ' ').trim().toLowerCase() !== original.replace(/\s+/g, ' ').trim().toLowerCase();
  const explanation = feedback.longExplanation || feedback.explanation;

  return (
    <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[11px]">
      <p className="flex items-center gap-1.5 font-semibold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Incorrecto
      </p>

      {changed && (
        <p className="mt-1 leading-snug">
          <span className="text-muted-foreground line-through decoration-destructive/40">{original}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span className="font-semibold text-success">{feedback.corrected}</span>
        </p>
      )}

      {explanation && (
        <p className={cn('mt-1 leading-relaxed text-muted-foreground', feedback.longExplanation && 'text-foreground/80')}>
          {explanation}
        </p>
      )}

      {feedback.tip && <p className="mt-1 leading-relaxed text-muted-foreground">💡 {feedback.tip}</p>}

      <div className="mt-1.5 flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={onSpeakCorrection}
        >
          <Volume2 className="h-3 w-3" />
          Escuchar corrección
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={onExplain}
          disabled={explaining}
        >
          {explaining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {explaining ? 'Explicando…' : 'Explicar más'}
        </Button>
      </div>
    </div>
  );
}
