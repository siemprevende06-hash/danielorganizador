import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, ArrowRight } from "lucide-react";
import { CurrentBlockHighlight } from "@/components/today/CurrentBlockHighlight";
import { DayTimeline } from "@/components/today/DayTimeline";
import { TodayStats } from "@/components/today/TodayStats";
import { TodayTasks } from "@/components/today/TodayTasks";
import { TodayHabits } from "@/components/today/TodayHabits";
import { QuickProgress } from "@/components/today/QuickProgress";

export default function Index() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight">
            HOY
          </h1>
          <p className="text-muted-foreground capitalize mt-1">
            {formattedDate}
          </p>
        </div>

        {/* Current Block - Full Width */}
        <CurrentBlockHighlight />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Timeline del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DayTimeline />
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

        {/* Quick Progress Cards */}
        <QuickProgress />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/focus" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 gap-3 justify-start text-left hover:bg-foreground hover:text-background transition-colors"
            >
              <Focus className="w-5 h-5" />
              <div>
                <p className="font-medium">Focus Mode</p>
                <p className="text-xs text-muted-foreground">Eliminar distracciones</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>

          <Link to="/day-planner" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 gap-3 justify-start text-left hover:bg-foreground hover:text-background transition-colors"
            >
              <CalendarPlus className="w-5 h-5" />
              <div>
                <p className="font-medium">Planificar Mañana</p>
                <p className="text-xs text-muted-foreground">Preparar el día siguiente</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>

          <Link to="/self-review" className="block">
            <Button 
              variant="outline" 
              className="w-full h-14 gap-3 justify-start text-left hover:bg-foreground hover:text-background transition-colors"
            >
              <ClipboardCheck className="w-5 h-5" />
              <div>
                <p className="font-medium">Autocrítica</p>
                <p className="text-xs text-muted-foreground">Calificar el día</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
