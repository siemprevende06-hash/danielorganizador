import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import danielFlaco from '@/assets/daniel-flaco.jpg';
import danielFuerte from '@/assets/daniel-fuerte.jpg';
import { usePhysicalTracking, PhysicalStats } from '@/hooks/usePhysicalTracking';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { AddMeasurementDialog } from './AddMeasurementDialog';
import { PhysicalProgressChart } from './PhysicalProgressChart';
import { SetPhysicalGoalDialog } from './SetPhysicalGoalDialog';
import { WorkoutRoutineCard } from './WorkoutRoutineCard';
import { ExerciseProgressCard } from './ExerciseProgressCard';
import { LogWorkoutDialog } from './LogWorkoutDialog';
import { ConfigureRoutineDialog } from './ConfigureRoutineDialog';

export const PhysicalTransformation = () => {
  const { goal, measurements, isLoading, addMeasurement, createOrUpdateGoal, getStats } = usePhysicalTracking();
  const { 
    routine, 
    exercises, 
    isLoading: isLoadingWorkout,
    createRoutine,
    addExercise,
    removeExercise,
    logWorkout,
    getAllProgress,
    getTodayWorkout
  } = useWorkoutTracking();

  const [stats, setStats] = useState<PhysicalStats>({
    startWeight: 50,
    currentWeight: 50,
    targetWeight: 70,
    muscleGainTarget: 20,
    currentMuscleGain: 0,
    gymDaysThisMonth: 0,
    gymDaysTarget: 16,
    currentStreak: 0,
    trend: 'stable',
    startPhotoUrl: null,
    targetPhotoUrl: null
  });

  const [showConfigureRoutine, setShowConfigureRoutine] = useState(false);
  const [showLogWorkout, setShowLogWorkout] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const newStats = await getStats();
      setStats(newStats);
    };
    if (!isLoading) {
      loadStats();
    }
  }, [isLoading, getStats]);

  const progress = stats.muscleGainTarget > 0 
    ? Math.min(100, Math.max(0, Math.round((stats.currentMuscleGain / stats.muscleGainTarget) * 100)))
    : 0;

  const handleSaveGoal = async (goalData: {
    start_weight: number;
    target_weight: number;
    gym_days_target: number;
    target_date?: string;
  }) => {
    await createOrUpdateGoal({
      start_weight: goalData.start_weight,
      target_weight: goalData.target_weight,
      gym_days_target: goalData.gym_days_target,
      target_date: goalData.target_date
    });
  };

  const todayWorkout = getTodayWorkout();
  const exerciseProgress = getAllProgress();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              Transformación Física
            </CardTitle>
            <div className="flex items-center gap-2">
              <SetPhysicalGoalDialog 
                onSave={handleSaveGoal}
                currentGoal={goal ? {
                  start_weight: goal.start_weight,
                  target_weight: goal.target_weight,
                  gym_days_target: goal.gym_days_target,
                  target_date: goal.target_date || undefined
                } : null}
              />
              <AddMeasurementDialog onSave={addMeasurement} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Daniel Flaco */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-48 md:w-40 md:h-56 rounded-lg overflow-hidden border-2 border-muted shadow-lg">
                <img 
                  src={stats.startPhotoUrl || danielFlaco} 
                  alt="Daniel - Inicio" 
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-white text-xs font-medium">Inicio</span>
                </div>
              </div>
              <span className="font-medium text-muted-foreground">{stats.startWeight} kg</span>
            </div>

            {/* Dynamic Progress Arrow */}
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <div className="text-3xl font-bold text-primary">{progress}%</div>
              
              {/* Animated Arrow with Progress */}
              <div className="relative flex items-center">
                {/* Progress bar background */}
                <div className="w-24 md:w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Animated chevrons */}
                <div className="flex items-center ml-1">
                  <ChevronRight 
                    className="h-6 w-6 text-orange-500 animate-pulse" 
                    style={{ animationDelay: '0ms' }}
                  />
                  <ChevronRight 
                    className="h-6 w-6 -ml-3 text-yellow-500 animate-pulse" 
                    style={{ animationDelay: '200ms' }}
                  />
                  <ChevronRight 
                    className="h-6 w-6 -ml-3 text-green-500 animate-pulse" 
                    style={{ animationDelay: '400ms' }}
                  />
                </div>
              </div>
              
              <div className="text-center text-sm">
                <p className="text-muted-foreground">Meta: +{stats.muscleGainTarget}kg músculo</p>
                <p className="text-primary font-semibold">Actual: +{stats.currentMuscleGain.toFixed(1)}kg</p>
              </div>
            </div>

            {/* Daniel Fuerte */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-48 md:w-40 md:h-56 rounded-lg overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
                <img 
                  src={stats.targetPhotoUrl || danielFuerte} 
                  alt="Daniel - Meta" 
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-white text-xs font-medium">Meta 🎯</span>
                </div>
              </div>
              <span className="font-medium text-primary">{stats.targetWeight} kg</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Dumbbell className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{stats.gymDaysThisMonth}/{stats.gymDaysTarget}</p>
              <p className="text-xs text-muted-foreground">Entrenamientos este mes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Flame className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Racha actual (días)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.currentWeight} kg</p>
              <p className="text-xs text-muted-foreground">Peso actual</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-lg mb-1">📈</div>
              <p className="text-2xl font-bold">{stats.trend === 'up' ? '↗️' : stats.trend === 'down' ? '↘️' : '➡️'}</p>
              <p className="text-xs text-muted-foreground">Tendencia</p>
            </div>
          </div>

          {/* Progress Chart */}
          {measurements.length > 0 && (
            <div className="mt-6">
              <PhysicalProgressChart 
                measurements={measurements} 
                targetWeight={stats.targetWeight}
                startWeight={stats.startWeight}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Routine & Exercise Progress Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <WorkoutRoutineCard 
          routine={routine}
          exercises={exercises}
          todayWorkout={todayWorkout}
          onConfigureClick={() => setShowConfigureRoutine(true)}
        />
        
        <ExerciseProgressCard 
          progress={exerciseProgress}
          onLogClick={() => setShowLogWorkout(true)}
        />
      </div>

      {/* Dialogs */}
      <ConfigureRoutineDialog
        open={showConfigureRoutine}
        onOpenChange={setShowConfigureRoutine}
        currentRoutine={routine}
        currentExercises={exercises}
        onCreateRoutine={createRoutine}
        onAddExercise={addExercise}
        onRemoveExercise={removeExercise}
      />

      <LogWorkoutDialog
        open={showLogWorkout}
        onOpenChange={setShowLogWorkout}
        exercises={exercises}
        onLog={logWorkout}
      />
    </div>
  );
};
