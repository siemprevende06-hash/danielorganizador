import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProductivityMeterProps {
  title: string;
  completedHabits: number;
  totalHabits: number;
  completedTasks: number;
  totalTasks: number;
  showCard?: boolean;
}

export const ProductivityMeter = ({
  title,
  completedHabits,
  totalHabits,
  completedTasks,
  totalTasks,
  showCard = true,
}: ProductivityMeterProps) => {
  const totalItems = totalHabits + totalTasks;
  const completedItems = completedHabits + completedTasks;
  const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const getColor = (pct: number) => {
    if (pct >= 100) return "text-emerald-500";
    if (pct >= 75) return "text-green-500";
    if (pct >= 50) return "text-yellow-500";
    if (pct > 0) return "text-orange-500";
    return "text-red-500";
  };

  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className={cn("text-xs font-bold", getColor(percentage))}>
          {Math.round(percentage)}%
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <div className="text-xs text-muted-foreground">
        {completedItems}/{totalItems}
      </div>
    </div>
  );

  if (!showCard) {
    return <div className="min-w-[120px]">{content}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
