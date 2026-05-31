import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SplitSquareHorizontal, LayoutList, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TimelineBlock {
  id: string;
  start: string;
  end: string;
  label: string;
  system: string;
  color: string;
  bgFill: string;
}

const TIMELINE_BLOCKS: TimelineBlock[] = [
  { id: "activacion", start: "6:30", end: "7:00", label: "Rutina Activación", system: "estructural", color: "border-blue-500/40 text-blue-700 dark:text-blue-300", bgFill: "bg-blue-500/30" },
  { id: "gym", start: "7:00", end: "8:00", label: "Entrenamiento Físico", system: "fisica", color: "border-orange-500/40 text-orange-700 dark:text-orange-300", bgFill: "bg-orange-500/30" },
  { id: "alistamiento", start: "8:00", end: "8:30", label: "Alistamiento y Desayuno", system: "estructural", color: "border-blue-500/40 text-blue-700 dark:text-blue-300", bgFill: "bg-blue-500/30" },
  { id: "transporte-am", start: "8:30", end: "9:00", label: "Transporte (Podcast/Lectura)", system: "hobbys", color: "border-purple-500/40 text-purple-700 dark:text-purple-300", bgFill: "bg-purple-500/30" },
  { id: "work-1", start: "9:00", end: "10:30", label: "Bloque de Trabajo 1", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "work-2", start: "10:30", end: "12:00", label: "Bloque de Trabajo 2", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "work-3", start: "12:00", end: "13:20", label: "Bloque de Trabajo 3", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "almuerzo", start: "13:20", end: "14:00", label: "Almuerzo", system: "alimentacion", color: "border-amber-500/40 text-amber-700 dark:text-amber-300", bgFill: "bg-amber-500/30" },
  { id: "work-4", start: "14:00", end: "15:30", label: "Bloque de Trabajo 4", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "work-5", start: "15:30", end: "17:00", label: "Bloque de Trabajo 5", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "work-6", start: "17:00", end: "18:30", label: "Bloque de Trabajo 6", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "work-7", start: "18:30", end: "20:00", label: "Bloque de Trabajo 7", system: "work", color: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300", bgFill: "bg-emerald-500/30" },
  { id: "musica", start: "20:00", end: "20:30", label: "Piano/Guitarra", system: "hobbys", color: "border-indigo-500/40 text-indigo-700 dark:text-indigo-300", bgFill: "bg-indigo-500/30" },
  { id: "ocio", start: "20:30", end: "22:00", label: "Ocio", system: "hobbys", color: "border-purple-500/40 text-purple-700 dark:text-purple-300", bgFill: "bg-purple-500/30" },
  { id: "desactivacion", start: "22:00", end: "22:30", label: "Rutina Desactivación", system: "estructural", color: "border-blue-500/40 text-blue-700 dark:text-blue-300", bgFill: "bg-blue-500/30" },
  { id: "dormir", start: "22:30", end: "6:30", label: "Dormir 💤", system: "estructural", color: "border-slate-500/40 text-slate-700 dark:text-slate-300", bgFill: "bg-slate-500/30" },
];

const SYSTEM_LEGEND = [
  { label: "Estructural", color: "bg-blue-500" },
  { label: "Física", color: "bg-orange-500" },
  { label: "Hobbys", color: "bg-purple-500" },
  { label: "Trabajo", color: "bg-emerald-500" },
  { label: "Alimentación", color: "bg-amber-500" },
];

interface Task {
  id: string;
  title: string;
  area_id: string | null;
  completed: boolean;
}

interface Props {
  workBlockAssignments: Record<string, string>;
  blockCompletions: Record<string, boolean>;
  onToggleBlock: (blockId: string) => void;
}

const parseTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function DayTimeline({ workBlockAssignments, blockCompletions, onToggleBlock }: Props) {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [subdivided, setSubdivided] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [blockTasks, setBlockTasks] = useState<Record<string, Task[]>>({});
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load tasks assigned to blocks
  useEffect(() => {
    const loadBlockTasks = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, area_id, completed, routine_block_id")
        .not("routine_block_id", "is", null)
        .or(`due_date.eq.${today}T00:00:00,due_date.is.null`);

      if (data) {
        const grouped: Record<string, Task[]> = {};
        data.forEach((t: any) => {
          const bid = t.routine_block_id;
          if (!grouped[bid]) grouped[bid] = [];
          grouped[bid].push({ id: t.id, title: t.title, area_id: t.area_id, completed: t.completed });
        });
        setBlockTasks(grouped);
      }
    };
    loadBlockTasks();
  }, []);

  // Load available tasks when dialog opens
  const loadAvailableTasks = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("tasks")
      .select("id, title, area_id, completed")
      .eq("completed", false)
      .is("routine_block_id", null)
      .or(`due_date.eq.${today}T00:00:00,due_date.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);
    setAvailableTasks(data || []);
  };

  const assignTaskToBlock = async (taskId: string, blockId: string) => {
    await supabase.from("tasks").update({ routine_block_id: blockId }).eq("id", taskId);
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      setBlockTasks(prev => ({
        ...prev,
        [blockId]: [...(prev[blockId] || []), task],
      }));
      setAvailableTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const removeTaskFromBlock = async (taskId: string, blockId: string) => {
    await supabase.from("tasks").update({ routine_block_id: null }).eq("id", taskId);
    setBlockTasks(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(t => t.id !== taskId),
    }));
  };

  const displayBlocks = useMemo(() => {
    if (!subdivided) return TIMELINE_BLOCKS;
    const result: TimelineBlock[] = [];
    for (const block of TIMELINE_BLOCKS) {
      if (block.system === "work") {
        const startM = parseTime(block.start);
        const endM = parseTime(block.end);
        const duration = endM - startM;
        const subCount = Math.floor(duration / 30);
        for (let i = 0; i < subCount; i++) {
          const subStart = startM + i * 30;
          const subEnd = Math.min(startM + (i + 1) * 30, endM);
          const formatT = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
          result.push({
            ...block,
            id: `${block.id}-sub-${i}`,
            start: formatT(subStart),
            end: formatT(subEnd),
            label: `${block.label} (${i + 1}/${subCount})`,
          });
        }
      } else {
        result.push(block);
      }
    }
    return result;
  }, [subdivided]);

  const getBlockProgress = (block: TimelineBlock) => {
    const blockStart = parseTime(block.start);
    const blockEnd = block.id === "dormir" ? parseTime("22:30") : parseTime(block.end);
    if (currentMinutes >= blockEnd) return 100;
    if (currentMinutes <= blockStart) return 0;
    return ((currentMinutes - blockStart) / (blockEnd - blockStart)) * 100;
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold">📅 Horario del Día</h3>
          <p className="text-xs text-muted-foreground">6:30 AM — 10:30 PM · Toca un bloque para asignar tareas</p>
        </div>
        <Button
          variant={subdivided ? "default" : "outline"}
          size="sm"
          onClick={() => setSubdivided(!subdivided)}
          className="gap-1 text-xs"
        >
          {subdivided ? <LayoutList className="h-3 w-3" /> : <SplitSquareHorizontal className="h-3 w-3" />}
          {subdivided ? "Normal" : "Dividir"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {SYSTEM_LEGEND.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="relative space-y-1.5">
        {displayBlocks.filter(b => b.id !== "dormir").map(block => {
          const blockStart = parseTime(block.start);
          const blockEnd = parseTime(block.end);
          const duration = blockEnd - blockStart;
          const isPast = currentMinutes >= blockEnd;
          const isCurrent = currentMinutes >= blockStart && currentMinutes < blockEnd;
          const blockProgress = getBlockProgress(block);
          const assignment = workBlockAssignments[block.id];
          const isCompleted = blockCompletions[block.id];
          const tasks = blockTasks[block.id] || [];

          return (
            <div key={block.id}>
              <div
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all overflow-hidden cursor-pointer",
                  block.color,
                  isPast && !isCompleted && "opacity-40",
                  isPast && isCompleted && "opacity-70",
                  isCurrent && "ring-2 ring-primary shadow-lg"
                )}
                style={{ minHeight: Math.max(40, duration * 0.5) }}
                onClick={() => { setSelectedBlock(block.id); loadAvailableTasks(); }}
              >
                {(isPast || isCurrent) && (
                  <div
                    className={cn("absolute inset-y-0 left-0 transition-all duration-1000", block.bgFill)}
                    style={{ width: `${isPast ? 100 : blockProgress}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2 w-full">
                  <Checkbox
                    checked={!!isCompleted}
                    onCheckedChange={(e) => { e && e; onToggleBlock(block.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="text-xs font-mono w-[4.5rem] shrink-0">
                    {block.start}-{block.end}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">
                    {assignment || block.label}
                  </span>
                  {tasks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {tasks.length} tareas
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 animate-pulse shrink-0">
                      En curso
                    </Badge>
                  )}
                  {isCompleted && !isCurrent && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600 border-green-500/30 shrink-0">
                      ✓
                    </Badge>
                  )}
                </div>
                {isCurrent && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: `${blockProgress}%` }}
                  />
                )}
              </div>

              {/* Inline tasks */}
              {tasks.length > 0 && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", t.area_id === "universidad" ? "bg-blue-500" : t.area_id === "emprendimiento" ? "bg-purple-500" : "bg-cyan-500")} />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Sleep block */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border",
          "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-500/10"
        )}>
          <Checkbox
            checked={!!blockCompletions["dormir"]}
            onCheckedChange={() => onToggleBlock("dormir")}
            className="h-4 w-4 shrink-0"
          />
          <span className="text-xs font-mono w-[4.5rem] shrink-0">22:30-6:30</span>
          <span className="text-sm font-medium flex-1">Dormir 💤</span>
          <span className="text-[10px] text-muted-foreground">8h</span>
        </div>
      </div>

      {/* Task assignment dialog */}
      <Dialog open={!!selectedBlock} onOpenChange={(open) => !open && setSelectedBlock(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tareas — {TIMELINE_BLOCKS.find(b => b.id === selectedBlock)?.label || selectedBlock}
            </DialogTitle>
          </DialogHeader>

          {/* Already assigned tasks */}
          {selectedBlock && (blockTasks[selectedBlock] || []).length > 0 && (
            <div className="space-y-1.5 mb-4">
              <p className="text-xs font-medium text-muted-foreground">Asignadas</p>
              {(blockTasks[selectedBlock] || []).map(t => (
                <div key={t.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                  <span className="text-sm truncate">{t.title}</span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => selectedBlock && removeTaskFromBlock(t.id, selectedBlock)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Available tasks */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Disponibles</p>
            {availableTasks.length === 0 && <p className="text-xs text-muted-foreground">No hay tareas disponibles</p>}
            {availableTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between px-2 py-1.5 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => selectedBlock && assignTaskToBlock(t.id, selectedBlock)}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", t.area_id === "universidad" ? "bg-blue-500" : t.area_id === "emprendimiento" ? "bg-purple-500" : "bg-cyan-500")} />
                  <span className="text-sm truncate">{t.title}</span>
                </div>
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export { TIMELINE_BLOCKS };
