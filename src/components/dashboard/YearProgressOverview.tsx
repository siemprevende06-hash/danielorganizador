import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target } from "lucide-react";
import { differenceInDays, startOfYear, endOfYear, getWeek, getQuarter } from "date-fns";

export function YearProgressOverview() {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  
  const daysPassed = differenceInDays(now, yearStart) + 1;
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const daysRemaining = totalDays - daysPassed;
  const yearProgress = Math.round((daysPassed / totalDays) * 100);
  
  const currentWeek = getWeek(now, { weekStartsOn: 1 });
  const currentQuarter = getQuarter(now);
  const weekInQuarter = ((currentWeek - 1) % 12) + 1;
  
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Progreso del Año 2026
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Día {daysPassed} de {totalDays}</span>
            <span className="font-semibold">{yearProgress}%</span>
          </div>
          <Progress value={yearProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {daysRemaining} días restantes
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{currentWeek}</div>
            <div className="text-xs text-muted-foreground">Semana del año</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">Q{currentQuarter}</div>
            <div className="text-xs text-muted-foreground">Trimestre</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{weekInQuarter}/12</div>
            <div className="text-xs text-muted-foreground">Semana en Q</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
