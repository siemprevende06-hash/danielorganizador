import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, TrendingUp, Star, Trophy, Target, Sparkles, ArrowUp, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DailyComparison {
  area: string;
  icon: React.ReactNode;
  today: number;
  yesterday: number;
  label: string;
  unit: string;
}

export function PurposeVisualization() {
  const [comparisons, setComparisons] = useState<DailyComparison[]>([]);
  const [overallImprovement, setOverallImprovement] = useState(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Load today's and yesterday's reviews
    const { data: reviews } = await supabase
      .from('daily_reviews')
      .select('*')
      .in('review_date', [today, yesterday]);

    const todayReview = reviews?.find(r => r.review_date === today);
    const yesterdayReview = reviews?.find(r => r.review_date === yesterday);

    // Load tasks comparison
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('completed')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    const { data: yesterdayTasks } = await supabase
      .from('tasks')
      .select('completed')
      .gte('due_date', `${yesterday}T00:00:00`)
      .lte('due_date', `${yesterday}T23:59:59`);

    // Load activity tracking
    const { data: todayActivities } = await supabase
      .from('activity_tracking')
      .select('*')
      .eq('activity_date', today);

    const { data: yesterdayActivities } = await supabase
      .from('activity_tracking')
      .select('*')
      .eq('activity_date', yesterday);

    // Calculate metrics
    const todayTasksCompleted = todayTasks?.filter(t => t.completed).length || 0;
    const yesterdayTasksCompleted = yesterdayTasks?.filter(t => t.completed).length || 0;

    const todayFocus = (todayReview?.focus_minutes || 0);
    const yesterdayFocus = (yesterdayReview?.focus_minutes || 0);

    const todayHabits = todayReview?.habits_completed || 0;
    const yesterdayHabits = yesterdayReview?.habits_completed || 0;

    const todayBlocks = todayReview?.blocks_completed || 0;
    const yesterdayBlocks = yesterdayReview?.blocks_completed || 0;

    const todayGym = todayActivities?.find(a => a.activity_type === 'gym')?.duration_minutes || 0;
    const yesterdayGym = yesterdayActivities?.find(a => a.activity_type === 'gym')?.duration_minutes || 0;

    const newComparisons: DailyComparison[] = [
      {
        area: 'Tareas',
        icon: <CheckCircle2 className="w-4 h-4" />,
        today: todayTasksCompleted,
        yesterday: yesterdayTasksCompleted,
        label: 'tareas completadas',
        unit: ''
      },
      {
        area: 'Focus',
        icon: <Target className="w-4 h-4" />,
        today: todayFocus,
        yesterday: yesterdayFocus,
        label: 'minutos de foco',
        unit: 'min'
      },
      {
        area: 'Hábitos',
        icon: <Flame className="w-4 h-4" />,
        today: todayHabits,
        yesterday: yesterdayHabits,
        label: 'hábitos realizados',
        unit: ''
      },
      {
        area: 'Bloques',
        icon: <Trophy className="w-4 h-4" />,
        today: todayBlocks,
        yesterday: yesterdayBlocks,
        label: 'bloques completados',
        unit: ''
      },
      {
        area: 'Gym',
        icon: <TrendingUp className="w-4 h-4" />,
        today: todayGym,
        yesterday: yesterdayGym,
        label: 'entrenamiento',
        unit: 'min'
      }
    ];

    setComparisons(newComparisons);

    // Calculate overall improvement
    let improvements = 0;
    let total = 0;
    newComparisons.forEach(c => {
      if (c.yesterday > 0 || c.today > 0) {
        total++;
        if (c.today >= c.yesterday) improvements++;
      }
    });
    setOverallImprovement(total > 0 ? Math.round((improvements / total) * 100) : 0);

    // Count consecutive improvement days
    const { data: allReviews } = await supabase
      .from('daily_reviews')
      .select('review_date, overall_rating')
      .order('review_date', { ascending: false })
      .limit(30);

    let streak = 0;
    if (allReviews) {
      for (let i = 0; i < allReviews.length - 1; i++) {
        if ((allReviews[i].overall_rating || 0) >= (allReviews[i + 1].overall_rating || 0)) {
          streak++;
        } else {
          break;
        }
      }
    }
    setConsecutiveDays(streak);

    setLoading(false);
  };

  const getImprovementColor = (today: number, yesterday: number) => {
    if (today > yesterday) return 'text-success';
    if (today === yesterday && today > 0) return 'text-foreground';
    if (today < yesterday) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getImprovementIcon = (today: number, yesterday: number) => {
    if (today > yesterday) return <ArrowUp className="w-3 h-3 text-success" />;
    if (today === yesterday && today > 0) return <Star className="w-3 h-3 text-warning" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-background to-muted rounded-xl border-2 border-primary/20 p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mb-4" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted rounded-xl border-2 border-primary/30 p-6 space-y-6">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Purpose Statement */}
      <div className="relative text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Mi Propósito</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          Ser mi <span className="text-primary">mejor versión</span> hoy
        </h2>
        
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Cada día es una oportunidad para superarme. Las pruebas de mi progreso están en mis acciones.
        </p>
      </div>

      {/* Overall Progress Ring */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${overallImprovement * 3.52} 352`}
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{overallImprovement}%</span>
            <span className="text-xs text-muted-foreground">Mejora vs ayer</span>
          </div>
        </div>
      </div>

      {/* Streak Badge */}
      {consecutiveDays > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/30 rounded-full">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              {consecutiveDays} días mejorando consecutivamente
            </span>
          </div>
        </div>
      )}

      {/* Daily Comparisons */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">
          Pruebas de Progreso
        </h3>
        
        <div className="grid gap-2">
          {comparisons.map((comparison, index) => {
            const improvement = comparison.today - comparison.yesterday;
            const improvementPercent = comparison.yesterday > 0 
              ? Math.round((improvement / comparison.yesterday) * 100)
              : comparison.today > 0 ? 100 : 0;
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${comparison.today > comparison.yesterday ? 'bg-success/10' : 'bg-muted'}`}>
                    {comparison.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{comparison.area}</p>
                    <p className="text-xs text-muted-foreground">{comparison.label}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Yesterday */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Ayer</p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {comparison.yesterday}{comparison.unit}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex items-center">
                    {getImprovementIcon(comparison.today, comparison.yesterday)}
                  </div>
                  
                  {/* Today */}
                  <div className="text-right min-w-[60px]">
                    <p className="text-xs text-muted-foreground">Hoy</p>
                    <p className={`text-sm font-mono font-bold ${getImprovementColor(comparison.today, comparison.yesterday)}`}>
                      {comparison.today}{comparison.unit}
                      {improvement > 0 && (
                        <span className="text-xs ml-1 text-success">+{improvement}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm italic text-muted-foreground">
          "No compito con nadie más que con quien fui ayer"
        </p>
      </div>
    </div>
  );
}
