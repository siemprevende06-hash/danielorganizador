import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, CheckCircle2, XCircle, Flame, Check, Clock } from 'lucide-react';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface AppearanceSectionProps {
  stats: LifeStats;
}

export const AppearanceSection = ({ stats }: AppearanceSectionProps) => {
  const appearance = stats.appearance;

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          Apariencia
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* General Score */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-medium mb-4">Nota General</h4>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{appearance.generalScore}/10</div>
              <Progress value={appearance.generalScore * 10} className="flex-1 h-3" />
            </div>
          </div>

          {/* Daily Metrics */}
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-medium mb-4">Métricas Diarias</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🧴 Skincare Diario
                </span>
                <div className="flex items-center gap-3">
                  {appearance.skincare.completedToday ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {appearance.skincare.streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm">{appearance.skincare.streak}</span>
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">{appearance.skincare.monthlyCompletion}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  👔 Ropa Limpia
                </span>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm">30</span>
                  </div>
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  💇 Pelo Arreglado
                </span>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">✓ Pelado</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🧴 Perfume
                </span>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm">25</span>
                  </div>
                  <span className="text-sm text-muted-foreground">90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Goals */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-4">Metas de Apariencia</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {appearance.goals.map((goal, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  goal.achieved ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/50'
                }`}
              >
                {goal.achieved ? (
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <div className="p-1 rounded-full bg-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{goal.name}</p>
                  {!goal.achieved && (
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={goal.progress} className="h-1 flex-1" />
                      <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                    </div>
                  )}
                  {goal.achieved && (
                    <p className="text-xs text-green-600">Logrado</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
