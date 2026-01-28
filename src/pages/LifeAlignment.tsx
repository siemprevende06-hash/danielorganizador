import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Crown, Heart, TrendingUp, TrendingDown, Minus, Calendar, Zap, Star } from "lucide-react";
import { useLifeAlignment } from "@/hooks/useLifeAlignment";
import { cn } from "@/lib/utils";

export default function LifeAlignment() {
  const data = useLifeAlignment();

  if (data.loading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) {
      const percent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 100;
      return (
        <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          +{percent}%
        </span>
      );
    } else if (current < previous) {
      const percent = previous > 0 ? Math.round(((previous - current) / previous) * 100) : 0;
      return (
        <span className="flex items-center gap-1 text-destructive text-sm font-medium">
          <TrendingDown className="h-4 w-4" />
          -{percent}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-4 w-4" />
        Igual
      </span>
    );
  };

  const overallProgress = Math.round(
    (data.visions[0].progress + data.visions[1].progress) / 2
  );

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">ALINEACIÓN DE VIDA</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Tu Camino a la Mejor Versión
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Visualiza cómo cada acción diaria te acerca a tu propósito y moldea tu destino
        </p>
      </header>

      {/* Vision Pyramid */}
      <Card className="p-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="flex flex-col items-center space-y-6">
          {/* Purpose (Top) */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-2xl blur-xl" />
            <Card className="relative p-6 border-2 border-primary bg-background text-center max-w-md">
              <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">MI PROPÓSITO</p>
              <h2 className="text-2xl font-bold">{data.purpose}</h2>
              <div className="mt-4 flex justify-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {overallProgress}% progreso global
                </Badge>
              </div>
            </Card>
          </div>

          {/* Connector Line */}
          <div className="h-8 w-0.5 bg-gradient-to-b from-primary to-primary/30" />

          {/* Visions (Middle) */}
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
            {data.visions.map((vision, index) => (
              <Card key={vision.id} className={cn(
                "p-5 border-2 transition-all hover:shadow-lg",
                index === 0 ? "border-amber-500/50 bg-amber-500/5" : "border-pink-500/50 bg-pink-500/5"
              )}>
                <div className="flex items-start gap-3 mb-4">
                  {index === 0 ? (
                    <div className="p-2 rounded-full bg-amber-500/20">
                      <Crown className="h-5 w-5 text-amber-500" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-pink-500/20">
                      <Heart className="h-5 w-5 text-pink-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{vision.title}</h3>
                    <p className="text-sm text-muted-foreground">{vision.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span className="font-bold">{vision.progress}%</span>
                  </div>
                  <Progress value={vision.progress} className="h-2" />
                </div>
              </Card>
            ))}
          </div>

          {/* Connector Lines */}
          <div className="flex justify-center gap-24">
            <div className="h-8 w-0.5 bg-amber-500/30" />
            <div className="h-8 w-0.5 bg-pink-500/30" />
          </div>

          {/* Pillars (Bottom) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
            {data.pillars.map((pillar) => (
              <Card key={pillar.id} className="p-4 text-center hover:shadow-md transition-shadow">
                <span className="text-2xl mb-2 block">{pillar.icon}</span>
                <p className="text-sm font-medium mb-2">{pillar.name}</p>
                <div className="space-y-1">
                  <Progress value={pillar.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{pillar.progress}%</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Progress Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Mi Progreso Hacia la Mejor Versión
        </h3>
        
        <div className="space-y-6">
          {/* Annual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">ANUAL 2026</span>
              <span className="text-sm text-muted-foreground">Día {data.progress.annual.dayNumber} de 365</span>
            </div>
            <Progress value={data.progress.annual.percentComplete} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{data.progress.annual.percentComplete}% del año</p>
          </div>

          {/* Quarterly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">TRIMESTRE 1</span>
              <span className="text-sm text-muted-foreground">Semana {data.progress.quarterly.weekNumber} de 12</span>
            </div>
            <Progress value={Math.round((data.progress.quarterly.weekNumber / 12) * 100)} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{data.progress.quarterly.goalsProgress}% progreso metas</p>
          </div>

          {/* Monthly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">ESTE MES</span>
              <span className="text-sm text-muted-foreground">{data.progress.monthly.daysProductive} días productivos</span>
            </div>
            <Progress value={data.progress.monthly.score} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{data.progress.monthly.score}%</p>
          </div>

          {/* Weekly */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">ESTA SEMANA</span>
              <span className="text-sm text-muted-foreground">{data.progress.weekly.daysProductive} de 7 días</span>
            </div>
            <Progress value={data.progress.weekly.score} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">{data.progress.weekly.score}%</p>
          </div>

          {/* Daily */}
          <div className="space-y-2 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                HOY
              </span>
              <span className="text-sm">{data.progress.daily.completed} de {data.progress.daily.total} tareas</span>
            </div>
            <Progress value={data.progress.daily.score} className="h-4" />
            <p className="text-right font-bold text-primary">{data.progress.daily.score}%</p>
          </div>
        </div>
      </Card>

      {/* Improvement Proofs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Week vs Week */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Esta Semana vs Semana Pasada
          </h3>
          <div className="space-y-4">
            {data.comparisons.weekVsWeek.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">
                    {metric.current}{metric.unit} vs {metric.previous}{metric.unit}
                  </span>
                  {getChangeIndicator(metric.current, metric.previous)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Month vs Month */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Este Mes vs Mes Pasado
          </h3>
          <div className="space-y-4">
            {data.comparisons.monthVsMonth.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">{metric.label}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">
                    {metric.current}{metric.unit} vs {metric.previous}{metric.unit}
                  </span>
                  {getChangeIndicator(metric.current, metric.previous)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Motivational Message */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background text-center">
        <p className="text-lg font-medium">
          Cada tarea completada, cada bloque de trabajo, cada sesión de gym...
        </p>
        <p className="text-2xl font-bold text-primary mt-2">
          Te acerca un paso más a convertirte en tu mejor versión 🚀
        </p>
      </Card>
    </div>
  );
}