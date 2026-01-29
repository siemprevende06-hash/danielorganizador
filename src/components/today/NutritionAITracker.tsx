import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNutritionAI, DAILY_GOALS } from '@/hooks/useNutritionAI';
import { useMealTracking } from '@/hooks/useMealTracking';
import { UtensilsCrossed, Plus, Loader2, Target, TrendingUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NutritionAITracker = () => {
  const {
    meals,
    loading: mealsLoading,
    toggleMealCompletion,
    getNextMeal,
  } = useMealTracking();

  const {
    loading: aiLoading,
    todayMeals,
    analyzeFood,
    getTodayTotals,
    getProgressPercentage,
    getRemainingCalories,
    deleteMeal,
    fetchTodayMeals,
  } = useNutritionAI();

  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [foodDescription, setFoodDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTodayMeals();
  }, []);

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleAnalyze = async () => {
    if (!foodDescription.trim()) return;
    
    await analyzeFood(foodDescription, selectedMeal || undefined);
    setFoodDescription('');
    setDialogOpen(false);
    
    // Also mark the meal as completed
    if (selectedMeal) {
      const meal = meals.find(m => m.type === selectedMeal);
      if (meal && !meal.completed) {
        toggleMealCompletion(meal.type);
      }
    }
  };

  const totals = getTodayTotals();
  const progress = getProgressPercentage();
  const remaining = getRemainingCalories();
  const nextMeal = getNextMeal();

  if (mealsLoading) {
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
            🍽️ Nutrición con IA
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Target className="w-3 h-3 mr-1" />
            {DAILY_GOALS.calories} kcal/día
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calorie Progress */}
        <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Calorías Hoy</span>
            <span className="font-bold text-lg">
              {totals.calories}/{DAILY_GOALS.calories} kcal
            </span>
          </div>
          <Progress value={progress.calories} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>🥩 Proteína: {totals.protein}g/{DAILY_GOALS.protein}g</span>
            <span>Te faltan ~{remaining} kcal</span>
          </div>
        </div>

        {/* Meal List */}
        <div className="space-y-2">
          {meals.map((meal) => {
            const mealDetails = todayMeals.filter(d => 
              d.meal_tracking_id === meal.type || 
              new Date(d.created_at).getHours() === parseInt(meal.scheduledTime.split(':')[0])
            );
            const mealCalories = mealDetails.reduce((acc, d) => acc + (d.estimated_calories || 0), 0);
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
                <span className={cn(
                  'text-sm flex-1',
                  meal.completed && 'line-through text-muted-foreground'
                )}>
                  {meal.label}
                </span>
                
                {mealCalories > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {mealCalories} kcal
                  </Badge>
                )}
                
                <Dialog open={dialogOpen && selectedMeal === meal.type} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open) setSelectedMeal(meal.type);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => setSelectedMeal(meal.type)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar {meal.label}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium">¿Qué comiste?</label>
                        <Input
                          placeholder="Ej: 2 huevos, 2 tostadas, café con leche"
                          value={foodDescription}
                          onChange={(e) => setFoodDescription(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        La IA estimará las calorías y macros para tu meta de aumento de peso.
                      </p>
                      <Button 
                        onClick={handleAnalyze} 
                        disabled={aiLoading || !foodDescription.trim()}
                        className="w-full"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analizando...
                          </>
                        ) : (
                          '🤖 Analizar con IA'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>

        {/* Today's logged meals */}
        {todayMeals.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Registros de hoy:</p>
            {todayMeals.map((detail) => (
              <div key={detail.id} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                <span className="truncate flex-1">{detail.description}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {detail.estimated_calories} kcal
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => deleteMeal(detail.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weight Goal */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Meta mensual: +2.2kg</span>
          </div>
          <span>50kg → 70kg</span>
        </div>
      </CardContent>
    </Card>
  );
};
