import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMealTracking } from '@/hooks/useMealTracking';
import { UtensilsCrossed, Clock, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MealTracker = () => {
  const {
    meals,
    loading,
    toggleMealCompletion,
    getNextMeal,
    getTimeUntilNextMeal,
    completedCount,
    totalCount,
    progressPercentage,
    goals,
  } = useMealTracking();

  const nextMeal = getNextMeal();

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatMinutes = (mins: number): string => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Alimentación
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Target className="w-3 h-3 mr-1" />
            {goals.currentWeight}kg → {goals.targetWeight}kg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Meal Alert */}
        {nextMeal && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">Próxima comida:</span>
              <span className="text-primary font-semibold">{nextMeal.label}</span>
              <span className="text-muted-foreground">
                en {formatMinutes(getTimeUntilNextMeal(nextMeal))} ({formatTime(nextMeal.scheduledTime)})
              </span>
            </div>
          </div>
        )}

        {/* Meal List */}
        <div className="space-y-2">
          {meals.map((meal, index) => {
            const isNext = nextMeal?.type === meal.type;
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
            const mealMinutes = hours * 60 + minutes;
            const isPast = mealMinutes < currentMinutes && !meal.completed;

            return (
              <div
                key={meal.type}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-colors',
                  isNext && 'bg-primary/5 border border-primary/20',
                  isPast && !meal.completed && 'bg-destructive/5 border border-destructive/20',
                  meal.completed && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={meal.completed}
                  onCheckedChange={() => toggleMealCompletion(meal.type)}
                  className="h-5 w-5"
                />
                <span className="text-sm font-mono text-muted-foreground w-16">
                  {formatTime(meal.scheduledTime)}
                </span>
                <span
                  className={cn(
                    'text-sm flex-1',
                    meal.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {meal.label}
                </span>
                {isNext && (
                  <Badge variant="default" className="text-xs">
                    Próxima
                  </Badge>
                )}
                {isPast && !meal.completed && (
                  <Badge variant="destructive" className="text-xs">
                    Atrasada
                  </Badge>
                )}
                {meal.completed && (
                  <span className="text-xs text-green-600">✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso hoy</span>
            <span className="font-medium">
              {completedCount}/{totalCount} comidas ({progressPercentage}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Weight Goal */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Meta mensual: +{goals.monthlyGain}kg</span>
          </div>
          <span>
            Faltan {goals.targetWeight - goals.currentWeight}kg para tu objetivo
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
