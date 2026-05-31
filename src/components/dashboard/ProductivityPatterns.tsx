import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock } from "lucide-react";
import { useProductivityPatterns } from "@/hooks/useProductivityPatterns";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductivityPatterns() {
  const { hourPatterns, bestBlock, bestHour, loading } = useProductivityPatterns();

  if (loading) return <Skeleton className="h-36 w-full" />;
  if (!hourPatterns.length) return null;

  const maxMins = Math.max(...hourPatterns.map(h => h.totalMinutes), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Patrones de Productividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span>Mejor hora: <strong>{bestHour}:00</strong></span>
          </div>
          {bestBlock && bestBlock !== 'sin-bloque' && (
            <div>
              <span>Mejor bloque: <strong>{bestBlock}</strong></span>
            </div>
          )}
        </div>
        {/* Mini hour heatmap */}
        <div className="flex gap-0.5 items-end h-12">
          {Array.from({ length: 18 }, (_, i) => i + 5).map(hour => {
            const hp = hourPatterns.find(h => h.hour === hour);
            const height = hp ? Math.max(4, (hp.totalMinutes / maxMins) * 48) : 4;
            return (
              <div
                key={hour}
                className="flex-1 rounded-t bg-primary/30 hover:bg-primary/60 transition-colors relative group"
                style={{ height: `${height}px` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100">
                  {hour}h
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>5:00</span>
          <span>12:00</span>
          <span>22:00</span>
        </div>
      </CardContent>
    </Card>
  );
}
