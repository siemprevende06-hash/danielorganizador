import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, Plus, X, GraduationCap, Briefcase, Code2, Languages, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WORK_BLOCKS = [
  { id: "work-1", start: "9:00", end: "10:30" },
  { id: "work-2", start: "10:30", end: "12:00" },
  { id: "work-3", start: "12:00", end: "13:20" },
  { id: "work-4", start: "14:00", end: "15:30" },
  { id: "work-5", start: "15:30", end: "17:00" },
  { id: "work-6", start: "17:00", end: "18:30" },
  { id: "work-7", start: "18:30", end: "20:00" },
];

const AREAS = [
  { id: "universidad", label: "Uni", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/15 border-purple-500/40" },
  { id: "emprendimiento", label: "Emp", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/15 border-amber-500/40" },
  { id: "proyectos", label: "Proy", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/15 border-cyan-500/40" },
  { id: "idiomas", label: "Idi", icon: Languages, color: "text-green-500", bg: "bg-green-500/15 border-green-500/40" },
  { id: "tareas", label: "Tar", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/15 border-blue-500/40" },
];

const parseTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const formatT = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

interface Cell {
  id: string;       // e.g. "work-1-0"
  parentId: string;
  start: string;
  end: string;
  index: number;
}

interface Task {
  id: string;
  title: string;
  area_id: string | null;
  completed: boolean;
}

interface Props {
  cellAssignments: Record<string, string>;   // cellId -> areaId
  cellCompletions: Record<string, boolean>;  // cellId -> done
  onAssignArea: (cellId: string, areaId: string) => void;
  onToggleCell: (cellId: string) => void;
}

const UNIFIED_PREFIX = "__mode__";
const isUnified = (cellAssignments: Record<string, string>, parentId: string) =>
  cellAssignments[`${UNIFIED_PREFIX}${parentId}`] === "unified";

export function WorkBlockSquares({ cellAssignments, cellCompletions, onAssignArea, onToggleCell }: Props) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [cellTasks, setCellTasks] = useState<Record<string, Task[]>>({});
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const i = setInterval(() => {
      const n = new Date();
      setCurrentMinutes(n.getHours() * 60 + n.getMinutes());
    }, 30000);
    return () => clearInterval(i);
  }, []);

  // Build 30-min cells per work block
  const blocksWithCells: { parent: typeof WORK_BLOCKS[number]; cells: Cell[] }[] = WORK_BLOCKS.map(b => {
    const startM = parseTime(b.start);
    const endM = parseTime(b.end);
    const count = Math.max(1, Math.round((endM - startM) / 30));
    const cells: Cell[] = [];
    for (let i = 0; i < count; i++) {
      const s = startM + i * 30;
      const e = Math.min(s + 30, endM);
      cells.push({
        id: `${b.id}-${i}`,
        parentId: b.id,
        index: i,
        start: formatT(s),
        end: formatT(e),
      });
    }
    return { parent: b, cells };
  });

  // Load tasks per cell (uses tasks.routine_block_id with composed cell id)
  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const cellIds = blocksWithCells.flatMap(b => b.cells.map(c => c.id));
      const { data } = await supabase
        .from("tasks")
        .select("id, title, area_id, completed, routine_block_id")
        .in("routine_block_id", cellIds)
        .or(`due_date.eq.${today}T00:00:00,due_date.is.null`);
      const grouped: Record<string, Task[]> = {};
      (data || []).forEach((t: any) => {
        const k = t.routine_block_id;
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push({ id: t.id, title: t.title, area_id: t.area_id, completed: t.completed });
      });
      setCellTasks(grouped);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailableTasks = async (areaFilter?: string) => {
    const today = new Date().toISOString().split("T")[0];
    let q = supabase
      .from("tasks")
      .select("id, title, area_id, completed")
      .eq("completed", false)
      .is("routine_block_id", null)
      .or(`due_date.eq.${today}T00:00:00,due_date.is.null`)
      .order("created_at", { ascending: false })
      .limit(40);
    if (areaFilter) q = q.eq("area_id", areaFilter);
    const { data } = await q;
    setAvailableTasks((data as any) || []);
  };

  const assignTask = async (taskId: string, cellId: string) => {
    await supabase.from("tasks").update({ routine_block_id: cellId }).eq("id", taskId);
    const t = availableTasks.find(t => t.id === taskId);
    if (t) {
      setCellTasks(prev => ({ ...prev, [cellId]: [...(prev[cellId] || []), t] }));
      setAvailableTasks(prev => prev.filter(x => x.id !== taskId));
    }
  };

  const removeTask = async (taskId: string, cellId: string) => {
    await supabase.from("tasks").update({ routine_block_id: null }).eq("id", taskId);
    setCellTasks(prev => ({ ...prev, [cellId]: (prev[cellId] || []).filter(t => t.id !== taskId) }));
  };

  const openCell = (cellId: string) => {
    setSelectedCell(cellId);
    const area = cellAssignments[cellId];
    loadAvailableTasks(area);
  };

  const renderCell = (cell: Cell) => {
    const areaId = cellAssignments[cell.id];
    const area = AREAS.find(a => a.id === areaId);
    const Icon = area?.icon;
    const completed = !!cellCompletions[cell.id];
    const tasks = cellTasks[cell.id] || [];
    const startM = parseTime(cell.start);
    const endM = parseTime(cell.end);
    const isPast = currentMinutes >= endM;
    const isCurrent = currentMinutes >= startM && currentMinutes < endM;

    return (
      <button
        key={cell.id}
        onClick={() => openCell(cell.id)}
        className={cn(
          "relative aspect-square flex-1 min-w-0 rounded-lg border-2 p-1.5 transition-all flex flex-col items-center justify-between text-center overflow-hidden",
          area ? area.bg : "bg-muted/40 border-dashed border-muted-foreground/30",
          isCurrent && "ring-2 ring-primary shadow-md",
          isPast && !completed && "opacity-50",
          completed && "ring-2 ring-green-500/60",
        )}
      >
        <span className="text-[9px] font-mono leading-none text-muted-foreground">
          {cell.start}
        </span>
        {Icon ? (
          <Icon className={cn("h-5 w-5", area!.color)} />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground/60" />
        )}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium leading-none truncate max-w-full">
            {area ? area.label : "—"}
          </span>
          {tasks.length > 0 && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 leading-none">
              {tasks.length}
            </Badge>
          )}
        </div>
        {completed && (
          <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </span>
        )}
      </button>
    );
  };

  const selected = selectedCell
    ? blocksWithCells.flatMap(b => b.cells).find(c => c.id === selectedCell)
    : null;

  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3">
        <h3 className="text-lg font-bold">🧱 Bloques de Trabajo (30 min)</h3>
        <p className="text-xs text-muted-foreground">
          3 cajas = 1 bloque de 90min. Toca para asignar área y tareas.
        </p>
      </div>

      <div className="space-y-3">
        {blocksWithCells.map(({ parent, cells }) => {
          const unified = isUnified(cellAssignments, parent.id);
          const unifiedId = `${parent.id}-all`;
          const unifiedArea = cellAssignments[unifiedId];
          const unifiedAreaInfo = AREAS.find(a => a.id === unifiedArea);
          const UnifiedIcon = unifiedAreaInfo?.icon;
          const unifiedDone = !!cellCompletions[unifiedId];

          return (
            <div key={parent.id} className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {parent.start} – {parent.end}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Bloque {parent.id.split("-")[1]}
                  </span>
                  <button
                    onClick={() => onAssignArea(`${UNIFIED_PREFIX}${parent.id}`, unified ? "split" : "unified")}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors"
                  >
                    {unified ? "→ 3×30m" : "→ 1×1:30h"}
                  </button>
                </div>
              </div>
              {unified ? (
                <button
                  onClick={() => openCell(unifiedId)}
                  className={cn(
                    "w-full rounded-lg border-2 p-3 transition-all flex items-center gap-3 text-left",
                    unifiedAreaInfo ? unifiedAreaInfo.bg : "bg-muted/40 border-dashed border-muted-foreground/30",
                    unifiedDone && "ring-2 ring-green-500/60",
                  )}
                >
                  {UnifiedIcon ? (
                    <UnifiedIcon className={cn("h-6 w-6", unifiedAreaInfo!.color)} />
                  ) : (
                    <Plus className="h-5 w-5 text-muted-foreground/60" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {unifiedAreaInfo ? unifiedAreaInfo.label : "Sin asignar"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Bloque unificado de 1:30h · {(cellTasks[unifiedId] || []).length} tarea(s)
                    </p>
                  </div>
                  {unifiedDone && (
                    <span className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex gap-1.5">
                  {cells.map(renderCell)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
        {AREAS.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="flex items-center gap-1">
              <Icon className={cn("h-3 w-3", a.color)} />
              <span className="text-[10px] text-muted-foreground">{a.label}</span>
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={(o) => !o && setSelectedCell(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected && `${selected.start} – ${selected.end}`}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Area selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Área</p>
                <Select
                  value={cellAssignments[selected.id] || ""}
                  onValueChange={(v) => {
                    onAssignArea(selected.id, v);
                    loadAvailableTasks(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => {
                      const Icon = a.icon;
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", a.color)} />
                            {a.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Mark completed */}
              <Button
                variant={cellCompletions[selected.id] ? "default" : "outline"}
                onClick={() => onToggleCell(selected.id)}
                className="w-full gap-2"
              >
                <Check className="h-4 w-4" />
                {cellCompletions[selected.id] ? "Completado ✓" : "Marcar como completado"}
              </Button>

              {/* Assigned tasks */}
              {(cellTasks[selected.id] || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Tareas asignadas</p>
                  {(cellTasks[selected.id] || []).map(t => (
                    <div key={t.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                      <span className="text-sm truncate">{t.title}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeTask(t.id, selected.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Available tasks */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Tareas disponibles {cellAssignments[selected.id] ? `(${cellAssignments[selected.id]})` : ""}
                </p>
                {availableTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay tareas disponibles</p>
                )}
                {availableTasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded border hover:bg-muted/50 cursor-pointer"
                    onClick={() => assignTask(t.id, selected.id)}
                  >
                    <span className="text-sm truncate">{t.title}</span>
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
