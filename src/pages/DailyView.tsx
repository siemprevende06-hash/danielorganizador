import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DailyGuide } from '@/components/today/DailyGuide';
import { OrganizedLearning } from '@/components/today/OrganizedLearning';
import { DailyActionPlan } from '@/components/today/DailyActionPlan';
import { DailyScheduleOverview } from '@/components/today/DailyScheduleOverview';
import { NutritionAITracker } from '@/components/today/NutritionAITracker';
import { AreaStatsToday } from '@/components/today/AreaStatsToday';
import { TimelineConnection } from '@/components/today/TimelineConnection';
import { CurrentBlockHighlight } from '@/components/today/CurrentBlockHighlight';
import { InteractiveConsistencyTracker } from '@/components/today/InteractiveConsistencyTracker';
import { MealTracker } from '@/components/today/MealTracker';
import { TodayWorkout } from '@/components/today/TodayWorkout';
import { TodayFinances } from '@/components/today/TodayFinances';
import { GoalContributions } from '@/components/today/GoalContributions';

export default function DailyView() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight">
            HOY
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {formattedDate}
          </p>
        </div>

        {/* 1. Real-time Guide - Current block and next */}
        <DailyGuide />

        {/* 2. Current Block with AI Assistant */}
        <CurrentBlockHighlight />

        {/* 3. Organized Learning - Book, Music, Languages, University, Projects, Entrepreneurship */}
        <OrganizedLearning />

        {/* 4. Daily Action Plan - All tasks organized by priority */}
        <DailyActionPlan />

        <Separator />

        {/* 5. Full Day Schedule - Visual timeline */}
        <DailyScheduleOverview />

        <Separator />

        {/* 6. Nutrition Tracking with AI */}
        <NutritionAITracker />

        {/* 7. Meal Tracker */}
        <MealTracker />

        <Separator />

        {/* 8. Daily Finances */}
        <TodayFinances />

        <Separator />

        {/* 9. Area Progress with Weekly Objectives */}
        <AreaStatsToday />

        {/* 10. Day → Week → Month Connection */}
        <TimelineConnection />

        <Separator />

        {/* 11. Today's Workout */}
        <TodayWorkout />

        {/* 12. Interactive Habits Tracker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Hábitos de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveConsistencyTracker />
          </CardContent>
        </Card>

        <Separator />

        {/* 13. Goal Contributions */}
        <GoalContributions />
      </div>
    </div>
  );
}
