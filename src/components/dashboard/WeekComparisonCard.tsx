import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from "lucide-react";
import { useWeekComparison } from "@/hooks/useWeekComparison";
import { Skeleton } from "@/components/ui/skeleton";

function CompareRow({ label, current, previous }: { label: string; current: number; previous: number }) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">{current}</span>
        <span className="text-[10px] text-muted-foreground">vs {previous}</span>
        {diff > 0 ? (
          <span className="text-[10px] text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" />+{pct}%</span>
        ) : diff < 0 ? (
          <span className="text-[10px] text-red-500 flex items-center"><ArrowDownRight className="w-3 h-3" />{pct}%</span>
        ) : (
          <span className="text-[10px] text-muted-foreground flex items-center"><Minus className="w-3 h-3" />0%</span>
        )}
      </div>
    </div>
  );
}

export function WeekComparisonCard() {
  const { thisWeek, lastWeek, loading } = useWeekComparison();

  if (loading) return <Skeleton className="h-36 w-full" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Esta Semana vs Anterior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <CompareRow label="Tareas" current={thisWeek.tasksCompleted} previous={lastWeek.tasksCompleted} />
        <CompareRow label="Focus (min)" current={thisWeek.focusMinutes} previous={lastWeek.focusMinutes} />
        <CompareRow label="Bloques" current={thisWeek.blocksCompleted} previous={lastWeek.blocksCompleted} />
      </CardContent>
    </Card>
  );
}
