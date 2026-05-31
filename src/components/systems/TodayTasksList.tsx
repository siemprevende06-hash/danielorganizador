import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, Code } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  area_id: string | null;
  source: string;
}

const AREA_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  universidad: { label: "Universidad", icon: GraduationCap, color: "text-purple-500" },
  emprendimiento: { label: "Emprendimiento", icon: Briefcase, color: "text-amber-500" },
  "proyectos-personales": { label: "Proyectos", icon: Code, color: "text-cyan-500" },
};

export function TodayTasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("tasks")
      .select("id, title, completed, area_id, source")
      .or(`due_date.eq.${today},due_date.is.null`)
      .in("area_id", ["universidad", "emprendimiento", "proyectos-personales"])
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTasks(data);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const grouped = tasks.reduce((acc, t) => {
    const key = t.area_id || "otros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-lg font-bold mb-1">📋 Tareas del Día</h3>
      <p className="text-xs text-muted-foreground mb-4">Universidad, Emprendimiento y Proyectos</p>

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No hay tareas pendientes para hoy</p>
      )}

      {Object.entries(grouped).map(([areaId, areaTasks]) => {
        const config = AREA_CONFIG[areaId];
        if (!config) return null;
        const AreaIcon = config.icon;

        return (
          <div key={areaId} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <AreaIcon className={cn("h-4 w-4", config.color)} />
              <span className="text-sm font-semibold">{config.label}</span>
              <Badge variant="secondary" className="text-[10px]">{areaTasks.length}</Badge>
            </div>
            <div className="space-y-1.5 pl-6">
              {areaTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    className="h-4 w-4"
                  />
                  <span className={cn("text-sm flex-1", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
