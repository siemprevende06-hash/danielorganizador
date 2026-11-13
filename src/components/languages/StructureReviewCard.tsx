import { CheckCircle2, ListChecks, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StructureReview } from '@/hooks/useLanguageTutorCoach';

interface Props {
  review: StructureReview | null;
  reviewing: boolean;
  error?: string | null;
}

/** Revisión compacta de si la respuesta cubrió los pasos de la estructura. */
export function StructureReviewCard({ review, reviewing, error }: Props) {
  if (reviewing) {
    return (
      <div className="flex w-full items-center gap-1.5 rounded-xl border border-focus/25 bg-focus/[0.04] px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin text-focus" />
        Revisando la estructura de tu respuesta…
      </div>
    );
  }

  if (error) {
    return <p className="px-1 text-[10px] text-muted-foreground">{error}</p>;
  }

  if (!review) return null;

  const covered = review.covered ?? [];
  const missing = review.missing ?? [];
  const done = covered.filter(item => item.ok).length;

  return (
    <div className="w-full rounded-xl border border-focus/25 bg-focus/[0.04] p-2.5">
      <div className="flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5 text-focus" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-focus">Estructura</span>
        {covered.length > 0 && (
          <span className="ml-auto rounded-full bg-focus/10 px-1.5 py-0.5 text-[10px] font-semibold text-focus">
            {done}/{covered.length} pasos
          </span>
        )}
      </div>

      {review.verdict && <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{review.verdict}</p>}

      {covered.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {covered.map(item => (
            <li key={item.label} className="flex items-start gap-1.5 text-[11px] leading-snug">
              {item.ok ? (
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
              ) : (
                <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              )}
              <span className={cn('min-w-0', item.ok ? 'text-foreground/90' : 'text-muted-foreground')}>
                <span className="font-medium">{item.label}</span>
                {item.note ? `: ${item.note}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {missing.map(item => (
            <span
              key={item}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
