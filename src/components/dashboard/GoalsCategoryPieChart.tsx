import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Target } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface GoalsCategoryPieChartProps {
  goals: TwelveWeekGoal[];
}

const COLORS = {
  universidad: "hsl(217 91% 60%)",
  emprendimiento: "hsl(142 76% 36%)",
  gym: "hsl(25 95% 53%)",
  idiomas: "hsl(280 73% 60%)",
  proyectos: "hsl(340 82% 60%)",
};

export function GoalsCategoryPieChart({ goals }: GoalsCategoryPieChartProps) {
  // Group and calculate completion by category
  const categoryData = Object.entries(
    goals.reduce((acc, goal) => {
      const cat = goal.category.toLowerCase();
      if (!acc[cat]) {
        acc[cat] = { total: 0, completed: 0 };
      }
      acc[cat].total++;
      if (goal.status === 'completed') acc[cat].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>)
  ).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.total,
    completed: data.completed,
    percentage: Math.round((data.completed / data.total) * 100) || 0,
  }));

  // If no goals, show placeholder data
  const chartData = categoryData.length > 0 ? categoryData : [
    { name: "Universidad", value: 3, completed: 1, percentage: 33 },
    { name: "Emprendimiento", value: 2, completed: 0, percentage: 0 },
    { name: "Gym", value: 2, completed: 1, percentage: 50 },
    { name: "Idiomas", value: 1, completed: 0, percentage: 0 },
    { name: "Proyectos", value: 4, completed: 2, percentage: 50 },
  ];

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = {
      label: item.name,
      color: COLORS[item.name.toLowerCase() as keyof typeof COLORS] || "hsl(var(--primary))",
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const totalGoals = chartData.reduce((sum, d) => sum + d.value, 0);
  const completedGoals = chartData.reduce((sum, d) => sum + d.completed, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Metas por Categoría</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {completedGoals}/{totalGoals} completadas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || `hsl(${index * 60}, 70%, 50%)`}
                />
              ))}
            </Pie>
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.completed}/{data.value} metas ({data.percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[entry.name.toLowerCase() as keyof typeof COLORS] }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
