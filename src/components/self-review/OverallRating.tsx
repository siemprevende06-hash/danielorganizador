import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  onRatingChange: (rating: number) => void;
  /** Quita la tarjeta exterior cuando el componente vive dentro de otra tarjeta. */
  embedded?: boolean;
  /** Título contextual (día, semana, mes…). */
  title?: string;
}

export function OverallRating({ rating, onRatingChange, embedded = false, title = 'Calificación general' }: Props) {
  const getRatingLabel = (rating: number) => {
    if (rating === 0) return 'Sin calificar';
    if (rating <= 2) return 'Muy bajo';
    if (rating <= 4) return 'Por debajo del objetivo';
    if (rating <= 6) return 'Normal';
    if (rating <= 8) return 'Bueno';
    return 'Excelente';
  };

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'text-muted-foreground';
    if (rating <= 3) return 'text-destructive';
    if (rating <= 6) return 'text-foreground';
    return 'text-success';
  };

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5",
      embedded && "rounded-2xl border-border/60 bg-muted/20 p-4",
    )}>
      <h3 className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      {/* Stars */}
      <div
        className="mx-auto mb-4 grid max-w-sm grid-cols-10 gap-0.5 sm:gap-1"
        role="group"
        aria-label="Calificación de 1 a 10"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            aria-label={`Calificar con ${star} de 10`}
            aria-pressed={rating === star}
            className="flex items-center justify-center rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                'h-5 w-5 shrink-0 sm:h-6 sm:w-6 md:h-7 md:w-7',
                rating >= star
                  ? 'fill-foreground text-foreground'
                  : 'text-muted-foreground/50 hover:text-foreground/50',
              )}
            />
          </button>
        ))}
      </div>

      {/* Rating display */}
      <div className="text-center">
        <span className={cn('text-3xl font-bold tabular-nums sm:text-4xl', getRatingColor(rating))}>
          {rating}
          <span className="ml-0.5 text-lg font-semibold text-muted-foreground">/10</span>
        </span>
        <p className={cn('mt-1 text-sm', getRatingColor(rating))}>
          {getRatingLabel(rating)}
        </p>
      </div>

      {/* Quick stats based on rating */}
      {rating > 0 && (
        <div className="mt-4 border-t border-border/60 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {rating >= 7
              ? '¡Sigue así! Mantén este ritmo.'
              : rating >= 5
                ? 'Buen trabajo. Busca mejorar un poco más.'
                : 'Analiza qué falló y haz ajustes.'}
          </p>
        </div>
      )}
    </div>
  );
}
