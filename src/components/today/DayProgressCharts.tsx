import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AreaProgress {
  area: string;
  label: string;
  completed: number;
  total: number;
  percentage: number;
  color: string;
}

interface DailyProductivity {
  day: string;
  tasks: number;
}

const AREA_COLORS: Record<string, string> = {
  universidad: "hsl(var(--chart-1))",
  emprendimiento: "hsl(var(--chart-2))",
  gym: "hsl(var(--chart-3))",
  personal: "hsl(var(--chart-4))",
  otros: "hsl(var(--chart-5))",
};

const AREA_LABELS: Record<string, string> = {
  universidad: "Universidad",
  emprendimiento: "Emprendimiento",
  gym: "Gym",
  personal: "Personal",
  otros: "Otros",
};

export function DayProgressCharts() {
  const [areaProgress, setAreaProgress] = useState<AreaProgress[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailyProductivity[]>([]);
  const [todayVsYesterday, setTodayVsYesterday] = useState<{ today: number; yesterday: number }>({ today: 0, yesterday: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

      // Get today's tasks by area
      const { data: todayTasks } = await supabase
        .from("tasks")
        .select("area_id, completed")
        .gte("due_date", `${today}T00:00:00`)
        .lt("due_date", `${today}T23:59:59`);

      // Calculate progress by area
      const areaStats: Record<string, { completed: number; total: number }> = {};
      
      (todayTasks || []).forEach(task => {
        const area = task.area_id || "otros";
        if (!areaStats[area]) {
          areaStats[area] = { completed: 0, total: 0 };
        }
        areaStats[area].total++;
        if (task.completed) {
          areaStats[area].completed++;
        }
      });

      const progressData: AreaProgress[] = Object.entries(areaStats).map(([area, stats]) => ({
        area,
        label: AREA_LABELS[area] || area,
        completed: stats.completed,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        color: AREA_COLORS[area] || AREA_COLORS.otros,
      }));

      setAreaProgress(progressData);

      // Get weekly productivity data
      const weekData: DailyProductivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        const dayName = format(subDays(new Date(), i), "EEE");
        
        const { count } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("completed", true)
          .gte("updated_at", `${date}T00:00:00`)
          .lt("updated_at", `${date}T23:59:59`);

        weekData.push({ day: dayName, tasks: count || 0 });
      }
      setWeeklyData(weekData);

      // Compare today vs yesterday
      const { count: todayCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("completed", true)
        .gte("updated_at", `${today}T00:00:00`)
        .lt("updated_at", `${today}T23:59:59`);

      const { count: yesterdayCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("completed", true)
        .gte("updated_at", `${yesterday}T00:00:00`)
        .lt("updated_at", `${yesterday}T23:59:59`);

      setTodayVsYesterday({ today: todayCount || 0, yesterday: yesterdayCount || 0 });
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = () => {
    const diff = todayVsYesterday.today - todayVsYesterday.yesterday;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    const diff = todayVsYesterday.today - todayVsYesterday.yesterday;
    if (diff > 0) return `+${diff} más que ayer`;
    if (diff < 0) return `${diff} menos que ayer`;
    return "Igual que ayer";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardContent className="h-40" />
        </Card>
        <Card className="animate-pulse">
          <CardContent className="h-40" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Progress by Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Progreso por Área
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areaProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin tareas para hoy
            </p>
          ) : (
            areaProgress.map((area) => (
              <div key={area.area} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{area.label}</span>
                  <span className="text-muted-foreground">
                    {area.completed}/{area.total} ({area.percentage}%)
                  </span>
                </div>
                <Progress 
                  value={area.percentage} 
                  className="h-2"
                  style={{ 
                    "--progress-background": area.color 
                  } as React.CSSProperties}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Productividad Semanal
            </CardTitle>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon()}
              <span className="text-muted-foreground">{getTrendText()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              tasks: {
                label: "Tareas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[120px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis hide />
                <Bar 
                  dataKey="tasks" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
