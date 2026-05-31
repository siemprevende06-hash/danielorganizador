import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DailyGuide } from '@/components/today/DailyGuide';
import { OrganizedDayStructure } from '@/components/today/OrganizedDayStructure';
import { DailyScheduleOverview } from '@/components/today/DailyScheduleOverview';
import { NutritionAITracker } from '@/components/today/NutritionAITracker';
import { TimelineConnection } from '@/components/today/TimelineConnection';
import { CurrentBlockHighlight } from '@/components/today/CurrentBlockHighlight';
import { InteractiveConsistencyTracker } from '@/components/today/InteractiveConsistencyTracker';
import { TodayWorkout } from '@/components/today/TodayWorkout';
import { GoalContributions } from '@/components/today/GoalContributions';
import { EffortResultScoreCards, EffortResultBars, AreaEffortResultGrid } from '@/components/dashboard/EffortResultCards';
import { useEffortResultStats } from '@/hooks/useEffortResultStats';
import { CalendarDays, Zap } from 'lucide-react';

export default function DailyView() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const dayOfYear = Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000);
  const totalDays = 365;
  const yearProgress = Math.round((dayOfYear / totalDays) * 100);
  const effortResult = useEffortResultStats();

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Mi Día
            </h1>
            <p className="text-sm text-muted-foreground capitalize mt-0.5 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              {formattedDate}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Día {dayOfYear} · {yearProgress}% del año
          </Badge>
        </div>

        {/* Effort vs Result Score */}
        {!effortResult.loading && (
          <>
            <EffortResultScoreCards data={effortResult} />
            <EffortResultBars data={effortResult} />
          </>
        )}

        {/* 1. Real-time Guide - Current block and next */}
        <DailyGuide />

        {/* 2. Current Block with AI Assistant */}
        <CurrentBlockHighlight />

        {/* 3. Organized Day Structure by Areas */}
        <OrganizedDayStructure />

        <Separator className="my-2" />

        {/* 4. Full Day Schedule */}
        <DailyScheduleOverview />

        <Separator className="my-2" />

        {/* 5. Nutrition Tracking */}
        <NutritionAITracker />

        <Separator className="my-2" />

        {/* 6. Today's Workout */}
        <TodayWorkout />

        {/* 7. Effort & Results per Area */}
        {!effortResult.loading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                📊 Esfuerzo y Resultados por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AreaEffortResultGrid areas={effortResult.areas} />
            </CardContent>
          </Card>
        )}

        {/* 8. Interactive Habits Tracker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              🔥 Constancia de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveConsistencyTracker />
          </CardContent>
        </Card>

        <Separator className="my-2" />

        {/* 9. Day → Week → Month → Quarter Connection */}
        <TimelineConnection />

        {/* 10. Goal Contributions */}
        <GoalContributions />
      </div>
    </div>
  );
}