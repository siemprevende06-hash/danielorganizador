import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass } from "lucide-react";
import { QuickDaySummary } from "@/components/today/QuickDaySummary";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { WeekContext } from "@/components/today/WeekContext";
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
            INICIO
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {formattedDate}
          </p>
        </div>

        {/* Quick Day Summary - Score, Tasks, Current Block, CTA */}
        <QuickDaySummary />

        <Separator />

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

        {/* Week Context - 12-week year position */}
        <WeekContext />

        {/* Daily Motivation */}
        <DailyMotivation />

        <Separator />

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
