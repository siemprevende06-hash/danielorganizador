import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, GraduationCap, Briefcase, Dumbbell, Languages, FolderKanban } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface CategoryProgressGridProps {
  goals: TwelveWeekGoal[];
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  universidad: { icon: GraduationCap, color: "text-blue-500", label: "Universidad" },
  emprendimiento: { icon: Briefcase, color: "text-green-500", label: "Emprendimiento" },
  gym: { icon: Dumbbell, color: "text-orange-500", label: "Gym" },
  idiomas: { icon: Languages, color: "text-purple-500", label: "Idiomas" },
  proyectos: { icon: FolderKanban, color: "text-pink-500", label: "Proyectos" },
};

export function CategoryProgressGrid({ goals }: CategoryProgressGridProps) {
  // Group goals by category
  const categorizedGoals = goals.reduce((acc, goal) => {
    const cat = goal.category.toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {} as Record<string, TwelveWeekGoal[]>);

  // Calculate stats per category
  const categoryStats = Object.entries(categoryConfig).map(([key, config]) => {
    const catGoals = categorizedGoals[key] || [];
    const avgProgress = catGoals.length > 0
      ? Math.round(catGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / catGoals.length)
      : 0;
    
    // Mock trend - in real app would compare with previous week
    const trend = Math.floor(Math.random() * 20) - 5;
    
    return {
      ...config,
      key,
      goalCount: catGoals.length,
      avgProgress,
      trend,
      activeGoals: catGoals.filter(g => g.status === 'active').length,
    };
  });

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {categoryStats.map((cat) => {
        const Icon = cat.icon;
        const TrendIcon = cat.trend > 0 ? TrendingUp : cat.trend < 0 ? TrendingDown : Minus;
        const trendColor = cat.trend > 0 ? "text-green-500" : cat.trend < 0 ? "text-red-500" : "text-yellow-500";
        
        return (
          <Card key={cat.key} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${cat.color.replace('text-', 'bg-')}`} />
            <CardHeader className="pb-2 pl-5">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon className={`h-4 w-4 ${cat.color}`} />
                {cat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{cat.avgProgress}%</span>
                <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{cat.trend > 0 ? "+" : ""}{cat.trend}%</span>
                </div>
              </div>
              <Progress value={cat.avgProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{cat.activeGoals} activas</span>
                <span>{cat.goalCount} metas</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
