import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass, Bell, Activity } from "lucide-react";
import { QuickDaySummary } from "@/components/today/QuickDaySummary";
import { WheelOfLife } from "@/components/WheelOfLife";
import { HombreTopWheel } from "@/components/HombreTopWheel";
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
import { RealStatsDashboard } from "@/components/dashboard/RealStatsDashboard";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
import { QuickStatsGrid } from "@/components/dashboard/QuickStatsGrid";
import { SostenSection } from "@/components/dashboard/SostenSection";
import { MiniHabitsSection } from "@/components/dashboard/MiniHabitsSection";
import { useNotifications } from "@/hooks/useNotifications";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useWheelScores } from "@/hooks/useWheelScores";
import { useHombreTopScores } from "@/hooks/useHombreTopScores";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { useEffect, useState } from "react";

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const formattedDate = format(time, "EEEE, d 'de' MMMM", { locale: es });
  const formattedTime = format(time, "h:mm a");
  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tight">INICIO</h1>
      <p className="text-lg text-muted-foreground capitalize mt-1">{formattedDate}</p>
      <p className="text-2xl font-light text-muted-foreground/70 mt-0.5 tabular-nums">{formattedTime}</p>
    </div>
  );
}

export default function Index() {
  const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress();
  const { requestPermission } = useNotifications();
  const { timeframe } = useTimeframe();
  const { scores: wheelScores, average: wheelAvg, loading: wheelLoading } = useWheelScores(timeframe);
  const { scores: hommeScores, average: hommeAvg, loading: hommeLoading } = useHombreTopScores(timeframe);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [requestPermission]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con fecha y hora grande */}
        <ClockWidget />

        {/* Timeframe Selector */}
        <TimeframeSelector />

        {/* Wheel of Life — Rueda de las 6 áreas */}
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-2">RUEDA DE LA VIDA</h2>
          <WheelOfLife
            values={wheelScores.map((s) => Math.round(s.value / 10))}
            average={Math.round(wheelAvg / 10)}
            loading={wheelLoading}
          />
        </Card>

        {/* Hombre Top — 8 áreas que una mujer busca */}
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-2">HOMBRE TOP</h2>
          <p className="text-xs text-muted-foreground text-center mb-3">Lo que una mujer busca en un hombre</p>
          <HombreTopWheel
            values={hommeScores.map((s) => s.value)}
            average={hommeAvg}
            loading={hommeLoading}
          />
        </Card>

        {/* Score del día + Ver mi día completo */}
        <QuickDaySummary />

        {/* REAL STATS — día, semana, mes, trimestre */}
        <RealStatsDashboard />

        {/* FOCUS — tarjetas de áreas principales */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Focus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wide">FOCUS</h2>
          </div>
          <QuickStatsGrid />
        </Card>

        {/* Mis Sistemas — esfuerzo acumulado por área */}
        <MySystemsSection />

        {/* SOSTÉN — hábitos estructurales, apariencia y salud */}
        <SostenSection />

        {/* MINI HÁBITOS — No FAP, No Redes Sociales, etc */}
        <MiniHabitsSection />

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
