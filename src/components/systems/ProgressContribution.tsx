import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CalendarDays, CalendarRange, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  dailyPercent: number;
  weeklyPercent: number;
  monthlyPercent: number;
  quarterlyPercent: number;
  weeklyContribution: number;
  monthlyContribution: number;
  quarterlyContribution: number;
}

function ContributionRow({
  icon: Icon, label, percent, contribution, color,
}: {
  icon: any; label: string; percent: number; contribution: number; color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{percent}%</span>
          {contribution > 0 && (
            <span className="text-xs text-emerald-500 font-medium">+{contribution.toFixed(1)}%</span>
          )}
        </div>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

export function ProgressContribution({
  dailyPercent, weeklyPercent, monthlyPercent, quarterlyPercent,
  weeklyContribution, monthlyContribution, quarterlyContribution,
}: Props) {
  return (
    <Card className="p-4 md:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Tu Progreso & Contribución</h3>
      </div>
      <div className="space-y-3">
        <ContributionRow
          icon={Calendar} label="Hoy" percent={dailyPercent}
          contribution={0} color="text-blue-500"
        />
        <ContributionRow
          icon={CalendarDays} label="Esta Semana" percent={weeklyPercent}
          contribution={weeklyContribution} color="text-emerald-500"
        />
        <ContributionRow
          icon={CalendarRange} label="Este Mes" percent={monthlyPercent}
          contribution={monthlyContribution} color="text-orange-500"
        />
        <ContributionRow
          icon={Target} label="Trimestre" percent={quarterlyPercent}
          contribution={quarterlyContribution} color="text-purple-500"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-4 italic">
        💡 Cada hábito que completas hoy suma a tu progreso semanal, mensual y trimestral.
      </p>
    </Card>
  );
}
