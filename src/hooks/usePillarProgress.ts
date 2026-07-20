import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PillarProgress {
  id: string;
  name: string;
  icon: string;
  percentage: number;
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;
  status: "pending" | "in_progress" | "completed";
  route?: string;
  coverUrl?: string | null;
  effort?: number;
  results?: number;
  hoursToday?: number;
}

export interface SecondaryGoal {
  id: string;
  name: string;
  icon: string;
  percentage: number;
  completed: boolean;
}

const PILLAR_CONFIG = [
  { id: "universidad", name: "Universidad", icon: "🎓", timeKey: "universidad", timeGoal: 120, taskSources: ["university"] },
  { id: "emprendimiento", name: "Emprendimiento", icon: "💼", timeKey: "emprendimiento", timeGoal: 60, taskSources: ["entrepreneurship"] },
  { id: "proyectos", name: "Proyectos", icon: "🚀", timeKey: "proyectos", timeGoal: 60, taskSources: ["project"] },
  { id: "gym", name: "Gym", icon: "💪", timeKey: null, timeGoal: 45, taskSources: [] },
  { id: "idiomas", name: "Idiomas", icon: "🌍", timeKey: "idiomas", timeGoal: 60, taskSources: ["idiomas"] },
];

const MEJORA_GOALS: Record<string, { name: string; icon: string; goal: number }> = {
  lectura: { name: "Lectura", icon: "📖", goal: 30 },
  ajedrez: { name: "Ajedrez", icon: "♟", goal: 15 },
  game: { name: "Game", icon: "🎮", goal: 20 },
  idiomas: { name: "Idiomas", icon: "🌍", goal: 60 },
};

function calcPct(spent: number, goal: number): number {
  return goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
}

export function usePillarProgress(date?: Date) {
  const [pillars, setPillars] = useState<PillarProgress[]>([]);
  const [secondaryGoals, setSecondaryGoals] = useState<SecondaryGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const dateStr = date
        ? date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      try {
        const [trackingRes, tasksRes, entrepTasksRes, streaksRes] = await Promise.all([
          supabase
            .from("daily_systems_tracking")
            .select("*")
            .eq("tracking_date", dateStr)
            .maybeSingle(),
          supabase
            .from("tasks")
            .select("id, completed, source, area_id")
            .gte("due_date", `${dateStr}T00:00:00`)
            .lte("due_date", `${dateStr}T23:59:59`),
          supabase
            .from("entrepreneurship_tasks")
            .select("id, completed")
            .eq("due_date", dateStr),
          supabase.from("system_habit_streaks").select("*"),
        ]);

        const tracking = trackingRes.data;
        const tasks = tasksRes.data || [];
        const entrepTasks = entrepTasksRes.data || [];
        const streaks: Record<string, number> = {};
        (streaksRes.data || []).forEach((s: any) => {
          streaks[s.habit_id] = s.current_streak || 0;
        });

        const timeData = (tracking?.time_data as Record<string, number>) || {};
        const completions = (tracking?.completions as Record<string, boolean>) || {};
        const workoutDuration = tracking?.workout_duration || 0;

        const pillarData: PillarProgress[] = PILLAR_CONFIG.map((cfg) => {
          let spent = 0;
          let completedTasks = 0;
          let totalTasks = 0;

          if (cfg.id === "gym") {
            spent = workoutDuration;
            completedTasks = completions["entrenamiento-fisico"] ? 1 : 0;
            totalTasks = 1;
          } else {
            spent = timeData[cfg.timeKey!] || 0;
            const filtered = tasks.filter(
              (t) => cfg.taskSources.includes(t.source || "") || t.area_id === cfg.id
            );
            completedTasks = filtered.filter((t) => t.completed).length;
            totalTasks = filtered.length;
          }

          if (cfg.id === "emprendimiento") {
            completedTasks += entrepTasks.filter((t) => t.completed).length;
            totalTasks += entrepTasks.length;
          }

          const pct = calcPct(spent, cfg.timeGoal);
          const status: "pending" | "in_progress" | "completed" =
            spent >= cfg.timeGoal
              ? "completed"
              : spent > 0
                ? "in_progress"
                : "pending";

          return {
            id: cfg.id,
            name: cfg.name,
            icon: cfg.icon,
            percentage: pct,
            tasksCompleted: completedTasks,
            tasksTotal: totalTasks,
            streak: streaks[cfg.id] || 0,
            status,
            hoursToday: Math.round((spent / 60) * 10) / 10,
          };
        });

        const secondary: SecondaryGoal[] = Object.entries(MEJORA_GOALS)
          .filter(([id]) => id !== "idiomas")
          .map(([id, cfg]) => {
            const spent = timeData[id] || 0;
            return {
              id,
              name: cfg.name,
              icon: cfg.icon,
              percentage: calcPct(spent, cfg.goal),
              completed: spent >= cfg.goal,
            };
          });

        if (timeData["idiomas"]) {
          secondary.push({
            id: "idiomas",
            name: "Idiomas",
            icon: "🌍",
            percentage: calcPct(timeData["idiomas"], 60),
            completed: timeData["idiomas"] >= 60,
          });
        }

        if (!cancelled) {
          setPillars(pillarData);
          setSecondaryGoals(secondary);
        }
      } catch (err) {
        console.error("Error loading pillar progress:", err);
        if (!cancelled) {
          setPillars([]);
          setSecondaryGoals([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const overallScore = pillars.length
    ? Math.round(pillars.reduce((s, p) => s + p.percentage, 0) / pillars.length)
    : 0;

  return { pillars, secondaryGoals, overallScore, loading };
}
