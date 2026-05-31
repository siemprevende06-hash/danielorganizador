import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, CheckCircle2, XCircle, Flame, TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface HabitsSectionProps {
  stats: LifeStats;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export const HabitsSection = ({ stats }: HabitsSectionProps) => {
  // Add routine habits
  const allHabits = [
    {
      id: 'rutina-activacion',
      name: '🌅 Rutina Activación',
      completedToday: stats.routines.activation.completedToday,
      currentStreak: stats.routines.activation.streak,
      monthlyCompletion: stats.routines.activation.monthlyCompletion,
      trend: stats.routines.activation.monthlyCompletion > 70 ? 'up' : 'stable' as 'up' | 'down' | 'stable'
    },
    {
      id: 'rutina-desactivacion',
      name: '🌙 Rutina Desactivación',
      completedToday: stats.routines.deactivation.completedToday,
      currentStreak: stats.routines.deactivation.streak,
      monthlyCompletion: stats.routines.deactivation.monthlyCompletion,
      trend: stats.routines.deactivation.monthlyCompletion > 70 ? 'up' : 'stable' as 'up' | 'down' | 'stable'
    },
    ...stats.habits
  ];

  const habitScore = allHabits.length > 0 
    ? Math.round(allHabits.reduce((acc, h) => acc + h.monthlyCompletion, 0) / allHabits.length / 10) / 10 * 10
    : 0;

  const bestStreak = allHabits.reduce((best, h) => 
    h.currentStreak > best.streak ? { name: h.name, streak: h.currentStreak } : best
  , { name: '', streak: 0 });

  const needsAttention = allHabits.filter(h => h.monthlyCompletion < 50);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-yellow-500" />
          Hábitos Buenos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Habits Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Hábito</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Hoy</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Racha</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Este Mes</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {allHabits.map((habit) => (
                <tr key={habit.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3">
                    <span className="font-medium">{habit.name}</span>
                  </td>
                  <td className="text-center py-3 px-3">
                    {habit.completedToday ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-3">
                    {habit.currentStreak > 0 ? (
                      <div className="flex items-center justify-center gap-1 text-orange-500">
                        <Flame className="h-4 w-4" />
                        <span className="font-medium">{habit.currentStreak}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Progress value={habit.monthlyCompletion} className="h-2 w-16" />
                      <span className="text-sm">{habit.monthlyCompletion}%</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3">
                    <TrendIcon trend={habit.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Puntuación de Hábitos</p>
              <p className="text-xl font-bold">{habitScore.toFixed(1)}/10</p>
            </div>
          </div>

          {bestStreak.streak > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mejor Racha</p>
                <p className="text-sm font-medium">{bestStreak.name}</p>
                <p className="text-lg font-bold text-orange-500">{bestStreak.streak} días</p>
              </div>
            </div>
          )}

          {needsAttention.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Necesita Atención</p>
                <p className="text-sm font-medium">{needsAttention.map(h => h.name).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
