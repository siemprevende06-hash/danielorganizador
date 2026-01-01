import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { Tables } from "@/integrations/supabase/types";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface WeeklyComparisonChartProps {
  goals: TwelveWeekGoal[];
}

export function WeeklyComparisonChart({ goals }: WeeklyComparisonChartProps) {
  // Generate weekly comparison data
  const weeklyData = [
    { day: "Lun", completado: 85, objetivo: 100 },
    { day: "Mar", completado: 90, objetivo: 100 },
    { day: "Mié", completado: 75, objetivo: 100 },
    { day: "Jue", completado: 95, objetivo: 100 },
    { day: "Vie", completado: 80, objetivo: 100 },
    { day: "Sáb", completado: 60, objetivo: 80 },
    { day: "Dom", completado: 40, objetivo: 60 },
  ];

  const chartConfig = {
    completado: {
      label: "Completado",
      color: "hsl(var(--primary))",
    },
    objetivo: {
      label: "Objetivo",
      color: "hsl(var(--muted))",
    },
  };

  // Calculate weekly stats
  const totalCompleted = weeklyData.reduce((sum, d) => sum + d.completado, 0);
  const totalObjective = weeklyData.reduce((sum, d) => sum + d.objetivo, 0);
  const weeklyPercentage = Math.round((totalCompleted / totalObjective) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Comparación Semanal</span>
          <span className="text-sm font-normal text-muted-foreground">
            {weeklyPercentage}% del objetivo
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="objetivo" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completado" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.completado >= entry.objetivo * 0.8 
                    ? "hsl(142 76% 36%)" 
                    : entry.completado >= entry.objetivo * 0.5 
                      ? "hsl(38 92% 50%)" 
                      : "hsl(0 84% 60%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
