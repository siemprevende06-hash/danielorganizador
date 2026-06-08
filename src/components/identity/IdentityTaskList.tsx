import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Star, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskRow {
  id: string;
  identity_plan_id: string;
  parent_task_id: string | null;
  title: string;
  is_primary: boolean;
  completed: boolean;
  order_index: number;
}

interface Props {
  identityPlanId: string;
  color?: string;
}

export function IdentityTaskList({ identityPlanId, color = "#22c55e" }: Props) {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newSubFor, setNewSubFor] = useState<string | null>(null);
  const [subTitle, setSubTitle] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    const { data } = await supabase
      .from("identity_plan_tasks" as any)
      .select("*")
      .eq("identity_plan_id", identityPlanId)
      .order("order_index", { ascending: true });
    setTasks((data as any) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityPlanId]);

  const addTask = async (parent_task_id: string | null, title: string) => {
    if (!title.trim()) return;
    const order_index = tasks.filter(t => t.parent_task_id === parent_task_id).length;
    const { data } = await supabase
      .from("identity_plan_tasks" as any)
      .insert({ identity_plan_id: identityPlanId, parent_task_id, title: title.trim(), order_index })
      .select("*")
      .single();
    if (data) setTasks(prev => [...prev, data as any]);
  };

  const updateTask = async (id: string, patch: Partial<TaskRow>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    await supabase.from("identity_plan_tasks" as any).update(patch).eq("id", id);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id));
    await supabase.from("identity_plan_tasks" as any).delete().eq("id", id);
  };

  const setPrimary = async (id: string) => {
    setTasks(prev => prev.map(t => t.parent_task_id === null ? { ...t, is_primary: t.id === id } : t));
    await supabase.from("identity_plan_tasks" as any).update({ is_primary: false }).eq("identity_plan_id", identityPlanId).is("parent_task_id", null);
    await supabase.from("identity_plan_tasks" as any).update({ is_primary: true }).eq("id", id);
  };

  const roots = tasks.filter(t => !t.parent_task_id);
  const subs = (parentId: string) => tasks.filter(t => t.parent_task_id === parentId);
  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.completed).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-1.5">
      {roots.length > 0 && (
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Tareas Punto B</span>
          <span className="font-semibold" style={{ color }}>{doneCount}/{totalCount} · {pct}%</span>
        </div>
      )}
      {roots.map(t => {
        const children = subs(t.id);
        const childDone = children.filter(c => c.completed).length;
        const expanded = open[t.id] ?? true;
        return (
          <div key={t.id} className="rounded-md border bg-card/40 p-1.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Checkbox checked={t.completed} onCheckedChange={(c) => updateTask(t.id, { completed: !!c })} className="h-3.5 w-3.5" />
              <button
                onClick={() => setOpen(o => ({ ...o, [t.id]: !expanded }))}
                className="h-5 w-5 flex items-center justify-center text-muted-foreground"
              >
                {children.length > 0 ? (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : null}
              </button>
              <span className={cn("flex-1 text-xs truncate", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
              {children.length > 0 && (
                <span className="text-[9px] text-muted-foreground">{childDone}/{children.length}</span>
              )}
              <button
                onClick={() => setPrimary(t.id)}
                className={cn("h-5 w-5 flex items-center justify-center", t.is_primary ? "text-amber-500" : "text-muted-foreground/40")}
                title="Marcar como principal"
              >
                <Star className={cn("h-3 w-3", t.is_primary && "fill-amber-500")} />
              </button>
              <button onClick={() => removeTask(t.id)} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {expanded && (
              <div className="pl-6 space-y-1">
                {children.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <Checkbox checked={c.completed} onCheckedChange={(v) => updateTask(c.id, { completed: !!v })} className="h-3 w-3" />
                    <span className={cn("flex-1 text-[11px] truncate", c.completed && "line-through text-muted-foreground")}>{c.title}</span>
                    <button onClick={() => removeTask(c.id)} className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {newSubFor === t.id ? (
                  <div className="flex gap-1">
                    <Input
                      autoFocus
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { addTask(t.id, subTitle); setSubTitle(""); setNewSubFor(null); }
                        if (e.key === "Escape") { setSubTitle(""); setNewSubFor(null); }
                      }}
                      placeholder="Subtarea..."
                      className="h-6 text-[11px]"
                    />
                    <Button size="sm" className="h-6 px-2" onClick={() => { addTask(t.id, subTitle); setSubTitle(""); setNewSubFor(null); }}>OK</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewSubFor(t.id)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Plus className="h-2.5 w-2.5" /> Subtarea
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-1 pt-1">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { addTask(null, newTitle); setNewTitle(""); } }}
          placeholder="+ Nueva tarea para llegar al Punto B..."
          className="h-7 text-xs"
        />
        <Button size="sm" className="h-7 px-2" onClick={() => { addTask(null, newTitle); setNewTitle(""); }}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
