import { useEffect, useState } from "react";

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

const DEFAULT_PILLARS: PillarProgress[] = [
  { id: "universidad", name: "Universidad", icon: "🎓", percentage: 0, tasksCompleted: 0, tasksTotal: 0, streak: 0, status: "pending" },
  { id: "emprendimiento", name: "Emprendimiento", icon: "💼", percentage: 0, tasksCompleted: 0, tasksTotal: 0, streak: 0, status: "pending" },
  { id: "proyectos", name: "Proyectos", icon: "🚀", percentage: 0, tasksCompleted: 0, tasksTotal: 0, streak: 0, status: "pending" },
  { id: "gym", name: "Gym", icon: "💪", percentage: 0, tasksCompleted: 0, tasksTotal: 0, streak: 0, status: "pending" },
  { id: "idiomas", name: "Idiomas", icon: "🌍", percentage: 0, tasksCompleted: 0, tasksTotal: 0, streak: 0, status: "pending" },
];

const DEFAULT_SECONDARY: SecondaryGoal[] = [];

export function usePillarProgress(_date?: Date) {
  const [pillars] = useState<PillarProgress[]>(DEFAULT_PILLARS);
  const [secondaryGoals] = useState<SecondaryGoal[]>(DEFAULT_SECONDARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const overallScore = pillars.length
    ? Math.round(pillars.reduce((s, p) => s + p.percentage, 0) / pillars.length)
    : 0;

  return { pillars, secondaryGoals, overallScore, loading };
}
