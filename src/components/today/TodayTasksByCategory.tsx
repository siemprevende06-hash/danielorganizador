import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ListChecks, GraduationCap, Briefcase, Code2, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TodayTask {
  id: string;
  title: string;
  completed: boolean;
  source: string;
  table: "tasks" | "entrepreneurship_tasks";
}

const CATEGORIES: {
  key: string;
  label: string;
  icon: typeof ListChecks;
  color: string;
  match: (t: TodayTask) => boolean;
}[] = [
  { key: "university", label: "Universidad", icon: GraduationCap, color: "text-purple-500 bg-purple-500/10", match: (t) => t.source === "university" },
  { key: "entrepreneurship", label: "Emprendimiento", icon: Briefcase, color: "text-amber-500 bg-amber-500/10", match: (t) => t.source === "entrepreneurship" },
  { key: "projects", label: "Proyectos", icon: Code2, color: "text-cyan-500 bg-cyan-500/10", match: (t) => t.source === "projects" },
  { key: "general", label: "Generales", icon: ClipboardList, color: "text-foreground bg-foreground/10", match: (t) => !t.source || t.source === "general" },
];

export function TodayTasksByCategory() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [{ data: regular }, { data: ent }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, completed, source")
        .gte("due_date", `${today}T00:00:00`)
        .lte("due_date", `${today}T23:59:59`),
      supabase
        .from("entrepreneurship_tasks")
        .select("id, title, completed")
        .eq("due_date", today),
    ]);

    const merged: TodayTask[] = [
      ...(regular || []).map((t: any) => ({ id: t.id, title: t.title, completed: !!t.completed, source: t.source || "general", table: "tasks" as const })),
      ...(ent || []).map((t: any) => ({ id: t.id, title: t.title, completed: !!t.completed, source: "entrepreneurship", table: "entrepreneurship_tasks" as const })),
    ];
    setTasks(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (task: TodayTask) => {
    const { error } = await supabase.from(task.table).update({ completed: !task.completed }).eq("id", task.id);
    if (error) { toast.error("Error al actualizar"); return; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Tareas de Hoy
          {tasks.length > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px]">
              {tasks.filter((t) => t.completed).length}/{tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-3">Cargando…</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No hay tareas con fecha de hoy
            <button
              onClick={() => navigate("/tasks")}
              className="block mx-auto mt-2 text-xs text-primary hover:underline"
            >
              Ir a Tareas
            </button>
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const catTasks = tasks.filter(cat.match);
            if (catTasks.length === 0) return null;
            const Icon = cat.icon;
            const done = catTasks.filter((t) => t.completed).length;
            return (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded", cat.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide">{cat.label}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{done}/{catTasks.length}</Badge>
                </div>
                <div className="space-y-1 pl-1">
                  {catTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggle(t)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 text-left transition-colors"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={cn("text-sm flex-1 truncate", t.completed && "line-through text-muted-foreground")}>
                        {t.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
