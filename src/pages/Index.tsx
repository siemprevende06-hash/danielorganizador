import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass } from "lucide-react";
import { CurrentBlockHighlight } from "@/components/today/CurrentBlockHighlight";
import { MealTracker } from "@/components/today/MealTracker";
import { InteractiveConsistencyTracker } from "@/components/today/InteractiveConsistencyTracker";
import { EnhancedDayTimeline } from "@/components/today/EnhancedDayTimeline";
import { TodayStats } from "@/components/today/TodayStats";
import { TodayTasks } from "@/components/today/TodayTasks";
import { TodayHabits } from "@/components/today/TodayHabits";
import { QuickProgress } from "@/components/today/QuickProgress";
import { WeekContext } from "@/components/today/WeekContext";
import { TodayWorkout } from "@/components/today/TodayWorkout";
import { UpcomingDeadlines } from "@/components/today/UpcomingDeadlines";
import { GoalContributions } from "@/components/today/GoalContributions";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { ProductivityMeter } from "@/components/today/ProductivityMeter";
import { DayProgressCharts } from "@/components/today/DayProgressCharts";
import { DetailedDayStats } from "@/components/today/DetailedDayStats";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyGuide } from "@/components/today/DailyGuide";
import { EnhancedHabitsSchedule } from "@/components/today/EnhancedHabitsSchedule";
import { NutritionAITracker } from "@/components/today/NutritionAITracker";
import { usePillarProgress } from "@/hooks/usePillarProgress";

export default function Index() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight">
            HOY
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {formattedDate}
          </p>
        </div>

        {/* Daily Guide - Real-time guidance */}
        <DailyGuide />

        {/* Week Context - Shows where you are in the 12-week year */}
        <WeekContext />

        {/* Pillar Progress Grid - 5 Main Pillars (Clickable) */}
        <Card>
          <CardContent className="pt-6">
            <PillarProgressGrid 
              pillars={pillars} 
              overallScore={overallScore} 
              loading={pillarsLoading} 
            />
          </CardContent>
        </Card>

        {/* Secondary Goals (Clickable) */}
        <Card>
          <CardContent className="pt-6">
            <SecondaryGoalsProgress 
              goals={secondaryGoals} 
              loading={pillarsLoading} 
            />
          </CardContent>
        </Card>

        {/* Daily Motivation */}
        <DailyMotivation />

        {/* Enhanced Habits Schedule - With times */}
        <Card>
          <CardContent className="pt-6">
            <EnhancedHabitsSchedule />
          </CardContent>
        </Card>

        {/* Nutrition AI Tracker */}
        <NutritionAITracker />

        {/* Interactive Consistency Tracker - Clear view of daily activities */}
        <Card>
          <CardContent className="pt-6">
            <InteractiveConsistencyTracker />
          </CardContent>
        </Card>

        {/* Current Block - Full Width */}
        <CurrentBlockHighlight />

        {/* Meal Tracker - Nutrition tracking */}
        <MealTracker />

        {/* Urgent Items Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UpcomingDeadlines />
          <TodayWorkout />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Enhanced Timeline */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <EnhancedDayTimeline />
            </CardContent>
          </Card>

          {/* Middle Column - Tasks */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Tareas de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TodayTasks />
            </CardContent>
          </Card>

          {/* Right Column - Stats & Habits */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TodayStats />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Hábitos Diarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TodayHabits />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Productivity Meter */}
        <ProductivityMeter />

        {/* Charts and Statistics */}
        <DayProgressCharts />

        <Separator />

        {/* Detailed Stats */}
        <DetailedDayStats />

        {/* Goal Contributions - Why your tasks matter */}
        <GoalContributions />

        {/* Quick Progress Cards */}
        <QuickProgress />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to="/focus" className="block">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <Focus className="w-5 h-5" />
              <span className="text-xs">Focus Mode</span>
            </Button>
          </Link>

          <Link to="/day-planner" className="block">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <CalendarPlus className="w-5 h-5" />
              <span className="text-xs">Planificar</span>
            </Button>
          </Link>

          <Link to="/self-review" className="block">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs">Autocrítica</span>
            </Button>
          </Link>

          <Link to="/confidence-steps" className="block">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <Compass className="w-5 h-5" />
              <span className="text-xs">Escalones</span>
            </Button>
          </Link>

          <Link to="/vida-daniel" className="block">
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Estadísticas</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
