import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass, Bell } from "lucide-react";
import { QuickDaySummary } from "@/components/today/QuickDaySummary";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { WeekContext } from "@/components/today/WeekContext";
import { usePillarProgress } from "@/hooks/usePillarProgress";
import { GoalPredictions } from "@/components/dashboard/GoalPredictions";
import { WeekComparisonCard } from "@/components/dashboard/WeekComparisonCard";
import { ProductivityPatterns } from "@/components/dashboard/ProductivityPatterns";
import { AchievementsDisplay } from "@/components/dashboard/AchievementsDisplay";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { ExportDataButton } from "@/components/dashboard/ExportDataButton";
import { EffortResultCompact, AreaEffortResultGrid } from "@/components/dashboard/EffortResultCards";
import { useEffortResultStats } from "@/hooks/useEffortResultStats";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect } from "react";

export default function Index() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress();
  const { requestPermission } = useNotifications();
  const effortResult = useEffortResultStats();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [requestPermission]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight">
            INICIO
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {formattedDate}
          </p>
          <div className="mt-2 flex justify-center">
            <ExportDataButton />
          </div>
        </div>

        {/* Effort vs Results - NEW */}
        {!effortResult.loading && <EffortResultCompact data={effortResult} />}

        {/* Quick Day Summary */}
        <QuickDaySummary />

        <Separator />

        {/* Pillar Progress Grid */}
        <Card>
          <CardContent className="pt-6">
            <PillarProgressGrid pillars={pillars} overallScore={overallScore} loading={pillarsLoading} />
          </CardContent>
        </Card>

        {/* Secondary Goals */}
        <Card>
          <CardContent className="pt-6">
            <SecondaryGoalsProgress goals={secondaryGoals} loading={pillarsLoading} />
          </CardContent>
        </Card>

        {/* Effort & Results per Area - NEW */}
        {!effortResult.loading && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                📊 Esfuerzo vs Resultados por Área
              </h3>
              <AreaEffortResultGrid areas={effortResult.areas} />
            </CardContent>
          </Card>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalPredictions />
          <WeekComparisonCard />
        </div>

        {/* Patterns + Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductivityPatterns />
          <AchievementsDisplay />
        </div>

        {/* Weekly AI Summary */}
        <WeeklySummaryCard />

        {/* Week Context */}
        <WeekContext />

        {/* Daily Motivation */}
        <DailyMotivation />

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to="/focus" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <Focus className="w-5 h-5" />
              <span className="text-xs">Focus Mode</span>
            </Button>
          </Link>
          <Link to="/day-planner" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <CalendarPlus className="w-5 h-5" />
              <span className="text-xs">Planificar</span>
            </Button>
          </Link>
          <Link to="/self-review" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs">Autocrítica</span>
            </Button>
          </Link>
          <Link to="/confidence-steps" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <Compass className="w-5 h-5" />
              <span className="text-xs">Escalones</span>
            </Button>
          </Link>
          <Link to="/vida-daniel" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Estadísticas</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}