import { Star } from "lucide-react";

interface Props {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export function OverallRating({ rating, onRatingChange }: Props) {
  const getRatingLabel = (rating: number) => {
    if (rating === 0) return 'Sin calificar';
    if (rating <= 2) return 'Día difícil';
    if (rating <= 4) return 'Por debajo del objetivo';
    if (rating <= 6) return 'Día normal';
    if (rating <= 8) return 'Buen día';
    return 'Día excepcional';
  };

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'text-muted-foreground';
    if (rating <= 3) return 'text-destructive';
    if (rating <= 6) return 'text-foreground';
    return 'text-success';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 text-center">
        Calificación General del Día
      </h3>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className="p-1 hover:scale-125 transition-all"
          >
            <Star 
              className={`w-6 h-6 md:w-8 md:h-8 ${
                rating >= star 
                  ? 'fill-foreground text-foreground' 
                  : 'text-muted-foreground hover:text-foreground/50'
              }`} 
            />
          </button>
        ))}
      </div>

      {/* Rating display */}
      <div className="text-center">
        <span className={`text-4xl font-bold ${getRatingColor(rating)}`}>
          {rating}/10
        </span>
        <p className={`text-sm mt-1 ${getRatingColor(rating)}`}>
          {getRatingLabel(rating)}
        </p>
      </div>

      {/* Quick stats based on rating */}
      {rating > 0 && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            {rating >= 7 
              ? '¡Sigue así! Mantén este ritmo.'
              : rating >= 5
                ? 'Día aceptable. Busca mejorar mañana.'
                : 'Analiza qué falló y haz ajustes.'}
          </p>
        </div>
      )}
    </div>
  );
}
