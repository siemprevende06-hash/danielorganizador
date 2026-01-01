import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Plus, Dumbbell } from 'lucide-react';
import { ExerciseProgress } from '@/hooks/useWorkoutTracking';

interface ExerciseProgressCardProps {
  progress: ExerciseProgress[];
  onLogClick: () => void;
}

export const ExerciseProgressCard = ({ progress, onLogClick }: ExerciseProgressCardProps) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  if (progress.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-medium text-muted-foreground">Sin registros de progreso</p>
            <p className="text-sm text-muted-foreground/70">Registra tus entrenamientos para ver tu evolución</p>
          </div>
          <Button onClick={onLogClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar Entrenamiento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Progreso de Fuerza
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onLogClick} className="gap-1">
            <Plus className="h-3 w-3" />
            Registrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {progress.slice(0, 6).map((p) => (
            <div 
              key={p.exercise.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{p.exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.exercise.muscle_group || 'Sin grupo'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm">
                    <span className="text-muted-foreground">{p.initialWeight}kg</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{p.currentWeight}kg</span>
                  </p>
                  <p className={`text-xs ${getTrendColor(p.trend)}`}>
                    {p.changePercent > 0 ? '+' : ''}{p.changePercent}%
                  </p>
                </div>
                {getTrendIcon(p.trend)}
              </div>
            </div>
          ))}
        </div>

        {progress.length > 6 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Y {progress.length - 6} ejercicios más...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
