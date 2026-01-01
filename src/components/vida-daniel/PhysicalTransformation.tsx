import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Dumbbell, TrendingUp, Flame } from 'lucide-react';

export const PhysicalTransformation = () => {
  // This would ideally come from a goals table or dedicated physical tracking
  const physicalStats = {
    startWeight: 65,
    currentWeight: 67.8,
    targetWeight: 73,
    muscleGainTarget: 8,
    currentMuscleGain: 2.8,
    gymDaysThisMonth: 12,
    gymDaysTarget: 20,
    currentStreak: 5,
    trend: 'up' as const
  };

  const progress = Math.round((physicalStats.currentMuscleGain / physicalStats.muscleGainTarget) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-orange-500" />
          Transformación Física
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Thin silhouette */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-48 flex items-center justify-center">
              <svg viewBox="0 0 60 120" className="w-full h-full text-muted-foreground/30">
                <ellipse cx="30" cy="12" rx="8" ry="10" fill="currentColor" />
                <rect x="27" y="22" width="6" height="8" fill="currentColor" />
                <rect x="22" y="30" width="16" height="25" rx="3" fill="currentColor" />
                <rect x="16" y="32" width="6" height="18" rx="2" fill="currentColor" />
                <rect x="38" y="32" width="6" height="18" rx="2" fill="currentColor" />
                <rect x="23" y="55" width="6" height="30" rx="2" fill="currentColor" />
                <rect x="31" y="55" width="6" height="30" rx="2" fill="currentColor" />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Inicio</span>
            <span className="font-medium">{physicalStats.startWeight} kg</span>
          </div>

          {/* Progress Arrow */}
          <div className="flex flex-col items-center gap-4 px-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="relative w-40">
              <Progress value={progress} className="h-3" />
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full text-primary h-6 w-6" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Meta: +{physicalStats.muscleGainTarget}kg músculo</p>
              <p className="text-primary font-medium">Actual: +{physicalStats.currentMuscleGain}kg</p>
            </div>
          </div>

          {/* Strong silhouette */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-48 flex items-center justify-center">
              <svg viewBox="0 0 80 120" className="w-full h-full text-primary">
                <ellipse cx="40" cy="12" rx="9" ry="11" fill="currentColor" />
                <rect x="36" y="23" width="8" height="8" fill="currentColor" />
                <path d="M20 32 Q40 28 60 32 L58 60 Q40 62 22 60 Z" fill="currentColor" />
                <ellipse cx="15" cy="38" rx="7" ry="12" fill="currentColor" />
                <ellipse cx="65" cy="38" rx="7" ry="12" fill="currentColor" />
                <rect x="24" y="58" width="10" height="35" rx="3" fill="currentColor" />
                <rect x="46" y="58" width="10" height="35" rx="3" fill="currentColor" />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Meta</span>
            <span className="font-medium">{physicalStats.targetWeight} kg</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Dumbbell className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{physicalStats.gymDaysThisMonth}/{physicalStats.gymDaysTarget}</p>
            <p className="text-xs text-muted-foreground">Entrenamientos este mes</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Flame className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold">{physicalStats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Racha actual (días)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{physicalStats.currentWeight} kg</p>
            <p className="text-xs text-muted-foreground">Peso actual</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-lg mb-1">📈</div>
            <p className="text-2xl font-bold text-green-500">↗️</p>
            <p className="text-xs text-muted-foreground">Tendencia</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
