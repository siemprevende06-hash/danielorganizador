import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Check, Clock, ExternalLink, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { SecondaryGoalProgress } from "@/hooks/usePillarProgress";

interface Props {
  goals: SecondaryGoalProgress[];
  loading?: boolean;
  onToggle?: (goalId: string, completed: boolean) => void;
  onChanged?: () => void;
}

const ROUTES: Record<string, string | null> = {
  musica: '/music-dashboard',
  lectura: '/reading-library',
  ajedrez: null,
  gaming: null,
};

export function SecondaryGoalsProgress({ goals, loading, onToggle, onChanged }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  const completedCount = goals.filter(g => g.completed).length;

  const toggleSystem = async (goalId: string, current: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const { data: row } = await supabase
      .from("daily_systems_tracking")
      .select("id, completions")
      .eq("tracking_date", today)
      .maybeSingle();
    const key = `streak:${goalId}`;
    const completions: any = { ...((row?.completions as any) || {}) };
    if (current) delete completions[key];
    else completions[key] = "true";
    if (row?.id) {
      await supabase.from("daily_systems_tracking").update({ completions }).eq("id", row.id);
    } else {
      await supabase.from("daily_systems_tracking").upsert({ tracking_date: today, completions }, { onConflict: "tracking_date" });
    }
    onToggle?.(goalId, !current);
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">🎯 Metas Secundarias</h4>
        <span className="text-xs text-muted-foreground">{completedCount}/{goals.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {goals.map(goal => {
          const route = ROUTES[goal.id];
          const useHeart = goal.iconKey === 'heart';

          const inner = (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all text-left cursor-pointer",
                "hover:shadow-md hover:scale-[1.02]",
                goal.completed ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border hover:border-primary/50"
              )}
              onClick={(e) => {
                if (!route) { e.preventDefault(); toggleSystem(goal.id, goal.completed); }
              }}
            >
              {useHeart ? (
                <Heart className={cn("w-6 h-6", goal.completed ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
              ) : (
                <span className="text-xl">{goal.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{goal.name}</span>
                  {goal.completed && <Check className="w-3 h-3 text-green-500" />}
                </div>
                {goal.duration > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /><span>{goal.duration} min</span>
                  </div>
                ) : !goal.completed && (
                  <span className="text-xs text-muted-foreground">Pendiente</span>
                )}
              </div>
              {route && <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />}
            </div>
          );

          return route ? (
            <Link key={goal.id} to={route} className="block group">{inner}</Link>
          ) : (
            <div key={goal.id} className="group">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
