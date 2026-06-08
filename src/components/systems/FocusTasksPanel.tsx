import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Briefcase, Code2, ListTodo, Plus, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AREAS = [
  { id: "universidad", label: "Universidad", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", link: "/university" },
  { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", link: "/entrepreneurship" },
  { id: "proyectos", label: "Proyectos", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30", link: "/projects" },
  { id: "tareas", label: "Tareas", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", link: "/tasks" },
];

interface TaskRow {
  id: string;
  title: string;
  area_id: string | null;
  completed: boolean;
}

export function FocusTasksPanel() {
  const [tasksByArea, setTasksByArea] = useState<Record<string, TaskRow[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({
    universidad: true, emprendimiento: true, proyectos: true, tareas: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newArea, setNewArea] = useState<string>("tareas");

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("tasks")
      .select("id, title, area_id, completed")
      .or(`due_date.gte.${today}T00:00:00,due_date.is.null`)
      .or(`due_date.lte.${today}T23:59:59,due_date.is.null`)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(80);
    const grouped: Record<string, TaskRow[]> = {};
    AREAS.forEach(a => (grouped[a.id] = []));
    (data || []).forEach((t: any) => {
      const k = t.area_id && grouped[t.area_id] ? t.area_id : "tareas";
      grouped[k].push(t);
    });
    setTasksByArea(grouped);
  };

  useEffect(() => { load(); }, []);

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed, status: !completed ? "completada" : "pendiente" }).eq("id", id);
    setTasksByArea(prev => {
      const next: Record<string, TaskRow[]> = {};
      Object.entries(prev).forEach(([k, list]) => {
        next[k] = list.map(t => t.id === id ? { ...t, completed: !completed } : t);
      });
      return next;
    });
  };

  const createTask = async () => {
    if (!newTitle.trim()) return;
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    const { error } = await supabase.from("tasks").insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      area_id: newArea,
      status: "pendiente",
      completed: false,
      due_date: today.toISOString(),
      source: "foco",
    });
    if (error) {
      toast.error("Error al crear tarea");
      return;
    }
    toast.success("Tarea creada");
    setNewTitle(""); setNewDesc(""); setDialogOpen(false);
    load();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">🎯 Tareas de Foco</h3>
          <p className="text-[11px] text-muted-foreground">Por área: Universidad · Emprendimiento · Proyectos · Tareas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-[11px] gap-1">
              <Plus className="h-3 w-3" /> Nueva tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva tarea de foco</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Área</label>
                <Select value={newArea} onValueChange={setNewArea}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <a.icon className={cn("h-4 w-4", a.color)} /> {a.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="¿Qué quieres lograr hoy?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descripción (opcional)</label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
              </div>
              <Button onClick={createTask} className="w-full">Crear tarea</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {AREAS.map(area => {
          const list = tasksByArea[area.id] || [];
          const done = list.filter(t => t.completed).length;
          const Icon = area.icon;
          const isOpen = open[area.id];
          return (
            <div key={area.id} className={cn("rounded-lg border", area.border, area.bg)}>
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5"
                onClick={() => setOpen(o => ({ ...o, [area.id]: !isOpen }))}
              >
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Icon className={cn("h-4 w-4", area.color)} />
                <span className="text-xs font-semibold flex-1 text-left">{area.label}</span>
                <span className="text-[10px] text-muted-foreground">{done}/{list.length}</span>
                <Link to={area.link} onClick={(e) => e.stopPropagation()} className="text-[10px] text-primary underline">Ver</Link>
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-1">
                  {list.length === 0 && (
                    <p className="text-[11px] text-muted-foreground py-1 italic">Sin tareas hoy</p>
                  )}
                  {list.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t.id, t.completed)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 text-left"
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                        t.completed ? "bg-green-500 border-green-500" : "border-muted-foreground/40"
                      )}>
                        {t.completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>
                      <span className={cn("text-[11px] flex-1 truncate", t.completed && "line-through text-muted-foreground")}>
                        {t.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
