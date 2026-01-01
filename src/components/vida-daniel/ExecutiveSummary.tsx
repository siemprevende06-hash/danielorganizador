import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Trophy, AlertTriangle, Target, Calendar, Flame } from 'lucide-react';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface ExecutiveSummaryProps {
  stats: LifeStats;
}

export const ExecutiveSummary = ({ stats }: ExecutiveSummaryProps) => {
  // Calculate strengths (areas with score > 7)
  const strengths = [
    ...(stats.habits.filter(h => h.monthlyCompletion > 70).map(h => h.name)),
    stats.university.generalScore > 7 ? 'Universidad' : null,
    ...(stats.entrepreneurship.filter(e => e.generalScore > 7).map(e => e.name)),
  ].filter(Boolean);

  // Calculate areas needing improvement (score < 5)
  const needsImprovement = [
    ...(stats.personalDevelopment.filter(p => p.generalScore < 5).map(p => p.name)),
    ...(stats.habits.filter(h => h.monthlyCompletion < 40).map(h => h.name)),
  ];

  // Find best streak
  const allStreaks = [
    ...stats.habits.map(h => ({ name: h.name, streak: h.currentStreak })),
    { name: 'Rutina Activación', streak: stats.routines.activation.streak },
    { name: 'Rutina Desactivación', streak: stats.routines.deactivation.streak },
  ];
  const bestStreak = allStreaks.reduce((best, current) => 
    current.streak > best.streak ? current : best
  , { name: '', streak: 0 });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Daniel - Resumen Ejecutivo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Global Score */}
        <div className="text-center mb-8">
          <h3 className="text-sm text-muted-foreground mb-2">PUNTUACIÓN GLOBAL</h3>
          <div className="text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            {stats.globalScore.toFixed(1)}/10
          </div>
          <Progress value={stats.globalScore * 10} className="h-4 max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">{Math.round(stats.globalScore * 10)}% hacia la mejor versión</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Strengths */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">Fortalezas</h4>
            </div>
            <div className="space-y-1">
              {strengths.length > 0 ? (
                strengths.slice(0, 4).map((s, i) => (
                  <p key={i} className="text-sm">• {s}</p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sigue trabajando para destacar</p>
              )}
            </div>
          </div>

          {/* Needs Improvement */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h4 className="font-medium">Áreas de Mejora</h4>
            </div>
            <div className="space-y-1">
              {needsImprovement.length > 0 ? (
                needsImprovement.slice(0, 4).map((s, i) => (
                  <p key={i} className="text-sm">• {s}</p>
                ))
              ) : (
                <p className="text-sm text-green-600">¡Todo en buen camino!</p>
              )}
            </div>
          </div>

          {/* Trend & Stats */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Tendencia</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">↗️</span>
                <span className="text-sm font-medium text-green-600">Mejorando</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Días productivos: {stats.productiveDaysThisMonth}/{stats.totalDaysThisMonth}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.productiveDaysThisMonth / stats.totalDaysThisMonth) * 100)}% del mes
              </p>
            </div>
          </div>

          {/* Best Streak */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <h4 className="font-medium">Mejor Racha</h4>
            </div>
            {bestStreak.streak > 0 ? (
              <div>
                <p className="text-3xl font-bold text-orange-500">{bestStreak.streak} días</p>
                <p className="text-sm text-muted-foreground">{bestStreak.name}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Comienza una racha hoy</p>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-primary" />
            <h4 className="font-medium">🎯 A Dónde Voy</h4>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm">
              <span className="font-medium">Meta Q1:</span> Transformación física + Lanzar emprendimiento + Aprobar exámenes universitarios
            </p>
            {stats.university.pendingExams > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Prioridad: Universidad ({stats.university.pendingExams} exámenes próximos)
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
