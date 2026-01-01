import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";

// Dashboard components
import { YearProgressOverview } from "@/components/dashboard/YearProgressOverview";
import { GoalsTrendChart } from "@/components/dashboard/GoalsTrendChart";
import { CategoryProgressGrid } from "@/components/dashboard/CategoryProgressGrid";
import { WeeklyComparisonChart } from "@/components/dashboard/WeeklyComparisonChart";
import { StreaksDashboard } from "@/components/dashboard/StreaksDashboard";
import { GoalsCategoryPieChart } from "@/components/dashboard/GoalsCategoryPieChart";
import { ProductivityMetrics } from "@/components/dashboard/ProductivityMetrics";
import { GoalDistanceIndicator } from "@/components/dashboard/GoalDistanceIndicator";

type TwelveWeekGoal = Tables<"twelve_week_goals">;

interface RoutineBlock {
  id: string;
  weeklyCompletion: boolean[];
  currentStreak?: number;
  maxStreak?: number;
  effortLevel?: 'minimum' | 'normal' | 'maximum';
}

interface Task {
  id: string;
  completed?: boolean;
}

export default function Index() {
  const [goals, setGoals] = useState<TwelveWeekGoal[]>([]);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load 12-week goals
      const { data: goalsData } = await supabase
        .from('twelve_week_goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (goalsData) setGoals(goalsData);

      // Load tasks for today
      const today = new Date().toISOString().split('T')[0];
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, completed')
        .gte('due_date', today)
        .lte('due_date', today + 'T23:59:59');
      
      if (tasksData) setTasks(tasksData);

      // Load routine blocks from localStorage
      const storedBlocks = localStorage.getItem('dailyRoutineBlocks');
      if (storedBlocks) {
        try {
          const parsed = JSON.parse(storedBlocks);
          setRoutineBlocks(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current quarter goals
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const quarterGoals = useMemo(() => 
    goals.filter(g => g.quarter === currentQuarter),
    [goals, currentQuarter]
  );

  // Overall progress
  const overallProgress = useMemo(() => {
    if (quarterGoals.length === 0) return 0;
    return Math.round(
      quarterGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / quarterGoals.length
    );
  }, [quarterGoals]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          Dashboard 2026
        </h1>
        <p className="text-muted-foreground">
          Tu año de 12 semanas en un vistazo
        </p>
      </header>

      {/* Year Progress */}
      <YearProgressOverview />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary">{quarterGoals.length}</div>
            <div className="text-xs text-muted-foreground">Metas Q{currentQuarter}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-500">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">Progreso Global</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {quarterGoals.filter(g => g.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">Metas Activas</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-purple-500">
              {quarterGoals.filter(g => g.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Progreso por Categoría
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/12-week-year" className="flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CategoryProgressGrid goals={quarterGoals} />
      </section>

      <Separator />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <GoalsTrendChart goals={quarterGoals} />
        <GoalsCategoryPieChart goals={quarterGoals} />
      </div>

      {/* Goal Distance + Weekly Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <GoalDistanceIndicator goals={quarterGoals} />
        <WeeklyComparisonChart goals={quarterGoals} />
      </div>

      <Separator />

      {/* Productivity Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Productividad y Rachas
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ProductivityMetrics routineBlocks={routineBlocks} tasks={tasks} />
          <StreaksDashboard routineBlocks={routineBlocks} />
        </div>
      </section>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/12-week-year">
                <Target className="h-5 w-5" />
                <span className="text-xs">Metas 12 Semanas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/weeks">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Plan Semanal</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/routine-day">
                <Target className="h-5 w-5" />
                <span className="text-xs">Rutina del Día</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/focus">
                <Target className="h-5 w-5" />
                <span className="text-xs">Focus Mode</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
