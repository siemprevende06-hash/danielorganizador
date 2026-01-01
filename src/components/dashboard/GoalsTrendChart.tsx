import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface GoalsTrendChartProps {
  goals: TwelveWeekGoal[];
}

export function GoalsTrendChart({ goals }: GoalsTrendChartProps) {
  // Generate mock weekly data based on goals - in real app this would come from weekly_plans
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const weekNum = i + 1;
    const baseProgress = goals.length > 0 
      ? goals.reduce((acc, g) => acc + (g.progress_percentage || 0), 0) / goals.length
      : 0;
    
    // Simulate progression through weeks
    const weekProgress = Math.min(100, Math.round((baseProgress / 12) * weekNum + Math.random() * 10));
    
    return {
      week: `S${weekNum}`,
      progreso: weekProgress,
      objetivo: Math.round((100 / 12) * weekNum),
    };
  });

  // Calculate if trending up or down
  const lastWeekProgress = weeklyData[weeklyData.length - 1]?.progreso || 0;
  const prevWeekProgress = weeklyData[weeklyData.length - 2]?.progreso || 0;
  const trend = lastWeekProgress - prevWeekProgress;
  
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-yellow-500";

  const chartConfig = {
    progreso: {
      label: "Progreso Real",
      color: "hsl(var(--primary))",
    },
    objetivo: {
      label: "Objetivo",
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Tendencia de Metas</span>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{trend > 0 ? "+" : ""}{trend}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={10} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="progreso" 
              stroke="hsl(var(--primary))" 
              fill="url(#progressGradient)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="objetivo" 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
