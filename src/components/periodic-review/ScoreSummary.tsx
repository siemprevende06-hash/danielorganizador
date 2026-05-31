import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, Star, TrendingUp } from 'lucide-react';

interface ScoreSummaryProps {
  effortScore: number | null;
  resultScore: number | null;
  overallRating: number | null;
  effortCount: number;
  resultCount: number;
  onRatingChange: (rating: number) => void;
}

export function ScoreSummary({
  effortScore, resultScore, overallRating,
  effortCount, resultCount, onRatingChange
}: ScoreSummaryProps) {
  const combinedScore = effortScore !== null && resultScore !== null
    ? Math.round((effortScore + resultScore) / 2)
    : effortScore ?? resultScore ?? null;

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-muted/50';
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-destructive/10';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Effort Score */}
      <Card className={getScoreBg(effortScore)}>
        <CardContent className="p-4 text-center">
          <Flame className="h-6 w-6 mx-auto text-orange-500 mb-1" />
          <p className={`text-3xl font-bold ${getScoreColor(effortScore)}`}>
            {effortScore !== null ? `${Math.round(effortScore)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Esfuerzo</p>
          <p className="text-[10px] text-muted-foreground">{effortCount} objetivos</p>
        </CardContent>
      </Card>

      {/* Result Score */}
      <Card className={getScoreBg(resultScore)}>
        <CardContent className="p-4 text-center">
          <Target className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className={`text-3xl font-bold ${getScoreColor(resultScore)}`}>
            {resultScore !== null ? `${Math.round(resultScore)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Resultados</p>
          <p className="text-[10px] text-muted-foreground">{resultCount} objetivos</p>
        </CardContent>
      </Card>

      {/* Overall Rating */}
      <Card className="border-primary/20">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className={`text-3xl font-bold ${getScoreColor(combinedScore)}`}>
            {combinedScore !== null ? `${combinedScore}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Puntuación Total</p>
          {/* Star rating */}
          <div className="flex justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => onRatingChange(n)}
                className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all ${
                  overallRating !== null && n <= overallRating
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
