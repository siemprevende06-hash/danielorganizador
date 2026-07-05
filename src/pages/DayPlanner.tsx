import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Plus, Clock, Target, X, GripVertical, ChevronDown, ChevronRight, Settings2, Loader2, BookOpen, Briefcase, FolderKanban, ListTodo, Dumbbell, Coffee, Moon, Sun, Languages, Zap, Activity, BatteryLow, Heart, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRoutineBlocks, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import { useRoutinePresets } from "@/hooks/useRoutinePresets";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";
import { QuickDateSelector } from "@/components/routine/QuickDateSelector";
import { PresetSchedulePicker } from "@/components/routine/PresetSchedulePicker";

interface Task {
  id: string;
  title: string;
  description?: string;
  source: string;
  sourceName?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
  area_id?: string;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  general: { label: 'General', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <ListTodo className="h-3 w-3" /> },
  university: { label: 'Universidad', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <BookOpen className="h-3 w-3" /> },
  entrepreneurship: { label: 'Emprendimiento', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: <Briefcase className="h-3 w-3" /> },
  project: { label: 'Proyecto', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: <FolderKanban className="h-3 w-3" /> },
};

const getBlockIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('gym')) return <Dumbbell className="h-4 w-4" />;
  if (lower.includes('activación') || lower.includes('despertar')) return <Sun className="h-4 w-4" />;
  if (lower.includes('desactivación') || lower.includes('dormir')) return <Moon className="h-4 w-4" />;
  if (lower.includes('almuerzo') || lower.includes('comida') || lower.includes('desayuno')) return <Coffee className="h-4 w-4" />;
  if (lower.includes('idiomas') || lower.includes('lectura')) return <Languages className="h-4 w-4" />;
  if (lower.includes('deep work') || lower.includes('focus')) return <Target className="h-4 w-4 text-primary" />;
  return <Clock className="h-4 w-4" />;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const AREAS = [
  { id: 'general', name: 'General', source: 'general' },
  { id: 'universidad', name: 'Universidad', source: 'university' },
  { id: 'emprendimiento', name: 'Emprendimiento', source: 'entrepreneurship' },
  { id: 'proyectos', name: 'Proyectos', source: 'project' },
];

const ROUTINE_STYLES: Record<RoutineType, { active: string; inactive: string }> = {
  disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
  normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
  super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
  descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};

export default function DayPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<string>('normal');
  const [notes, setNotes] = useState<string>('');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [planRoutineType, setPlanRoutineType] = useState<RoutineType>('normal');

  // Quick task creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState('general');
  const [creating, setCreating] = useState(false);

  // Preset config
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [wakeTime, setWakeTime] = useState('06:30');
  const [sleepTime, setSleepTime] = useState('22:30');

  const { blocks: routineBlocks, isLoaded: blocksLoaded, routineType, setRoutineType } = useRoutineBlocks();
  const { presets, isLoading: presetsLoading } = useRoutinePresets();
  const { modes, selectMode } = usePerformanceModes();
  const { toast } = useToast();

  // Sort blocks by time
  const sortedBlocks = useMemo(() => {
    return [...routineBlocks]
      .filter(block => {
        const startMinutes = parseTimeToMinutes(block.startTime);
        return startMinutes >= 300;
      })
      .sort((a, b) => a.order - b.order);
  }, [routineBlocks]);

  // Calculate sleep hours
  const sleepHours = useMemo(() => {
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    const [sleepH, sleepM] = sleepTime.split(':').map(Number);
    let wakeMinutes = wakeH * 60 + wakeM + 24 * 60;
    let sleepMinutes = sleepH * 60 + sleepM;
    return (wakeMinutes - sleepMinutes) / 60;
  }, [wakeTime, sleepTime]);

  // Set default preset
  useEffect(() => {
    if (!presetsLoading && presets.length > 0 && !selectedPresetId) {
      const defaultPreset = presets.find(p => p.is_default);
      if (defaultPreset) {
        setSelectedPresetId(defaultPreset.id);
        setWakeTime(defaultPreset.wake_time);
        setSleepTime(defaultPreset.sleep_time);
      }
    }
  }, [presetsLoading, presets, selectedPresetId]);

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { loadExistingPlan(); }, [selectedDate]);

  const loadTasks = async () => {
    try {
      const [{ data: regularTasks }, { data: entrepreneurshipTasks }, { data: entrepreneurships }] = await Promise.all([
        supabase.from('tasks').select('id, title, description, source, completed, due_date, priority, area_id').eq('completed', false),
        supabase.from('entrepreneurship_tasks').select('id, title, completed, due_date, entrepreneurship_id').eq('completed', false),
        supabase.from('entrepreneurships').select('id, name'),
      ]);

      const entMap = new Map(entrepreneurships?.map(e => [e.id, e.name]) || []);
      const mapped: Task[] = [
        ...(regularTasks || []).map(t => ({ ...t, completed: t.completed || false, source: t.source || 'general' })),
        ...(entrepreneurshipTasks || []).map(t => ({
          id: t.id, title: t.title, source: 'entrepreneurship', sourceName: entMap.get(t.entrepreneurship_id),
          completed: t.completed, due_date: t.due_date,
        })),
      ];
      setAllTasks(mapped);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadExistingPlan = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: plan } = await supabase.from('daily_plans').select('*').eq('plan_date', dateStr).maybeSingle();

      if (plan) {
        setMode(plan.mode);
        setNotes(plan.notes || '');
        if (plan.preset_id) setSelectedPresetId(plan.preset_id);
        if (plan.wake_time) setWakeTime(plan.wake_time);
        if (plan.sleep_time) setSleepTime(plan.sleep_time);
        if (plan.routine_type) {
          setPlanRoutineType(plan.routine_type as RoutineType);
          setRoutineType(plan.routine_type as RoutineType);
        }
        if (plan.block_assignments) {
          setTaskAssignments(plan.block_assignments as Record<string, string[]>);
        } else {
          setTaskAssignments({});
        }
      } else {
        setMode('normal');
        setNotes('');
        setPlanRoutineType(routineType);
        setTaskAssignments({});
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  // Filtered unassigned tasks
  const allAssignedIds = useMemo(() => new Set(Object.values(taskAssignments).flat()), [taskAssignments]);
  const unassignedTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (allAssignedIds.has(t.id)) return false;
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allTasks, allAssignedIds, sourceFilter, searchQuery]);

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId);
  const handleDragEnd = () => { setDraggedTaskId(null); setDragOverBlockId(null); };

  const handleBlockDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    setDragOverBlockId(blockId);
  };

  const handleBlockDrop = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      assignTaskToBlock(draggedTaskId, blockId);
    }
    setDraggedTaskId(null);
    setDragOverBlockId(null);
  };

  const assignTaskToBlock = useCallback((taskId: string, blockId: string) => {
    // Remove from any current block
    const newAssignments = { ...taskAssignments };
    Object.keys(newAssignments).forEach(bId => {
      newAssignments[bId] = newAssignments[bId].filter(id => id !== taskId);
    });
    // Add to new block
    if (!newAssignments[blockId]) newAssignments[blockId] = [];
    newAssignments[blockId].push(taskId);
    setTaskAssignments(newAssignments);
  }, [taskAssignments]);

  const removeTaskFromBlock = (blockId: string, taskId: string) => {
    setTaskAssignments(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(id => id !== taskId),
    }));
  };

  const handleQuickCreate = async () => {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      const area = AREAS.find(a => a.id === newTaskArea);
      const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle.trim(),
        source: area?.source || 'general',
        area_id: newTaskArea,
        priority: 'medium',
        due_date: `${format(selectedDate, 'yyyy-MM-dd')}T12:00:00`,
        completed: false,
        status: 'pendiente',
      });
      if (error) throw error;
      setNewTaskTitle('');
      toast({ title: "Tarea creada" });
      loadTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      await supabase.from('daily_plans').upsert({
        plan_date: dateStr, mode, notes,
        preset_id: selectedPresetId,
        wake_time: wakeTime, sleep_time: sleepTime,
        routine_type: planRoutineType,
        block_assignments: taskAssignments,
      }, { onConflict: 'plan_date' });

      // Also update routine_block_id on tasks directly for TODAY only,
      // so the current hoy/inicio view (without plan support) still works
      if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
        for (const [blockId, taskIds] of Object.entries(taskAssignments)) {
          for (const taskId of taskIds) {
            const task = allTasks.find(t => t.id === taskId);
            if (task?.source === 'entrepreneurship') {
              await supabase.from('entrepreneurship_tasks').update({ routine_block_id: blockId }).eq('id', taskId);
            } else {
              await supabase.from('tasks').update({ routine_block_id: blockId }).eq('id', taskId);
            }
          }
        }

        const allAssigned = Object.values(taskAssignments).flat();
        const toUnassign = allTasks.filter(t => !allAssigned.includes(t.id));
        for (const task of toUnassign) {
          if (task.source === 'entrepreneurship') {
            await supabase.from('entrepreneurship_tasks').update({ routine_block_id: null }).eq('id', task.id);
          } else {
            await supabase.from('tasks').update({ routine_block_id: null }).eq('id', task.id);
          }
        }
      }

      selectMode(mode);
      toast({ title: "Plan guardado ✓", description: `${format(selectedDate, "d 'de' MMMM", { locale: es })} · ${Object.values(taskAssignments).flat().length} tareas asignadas` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalAssigned = Object.values(taskAssignments).flat().length;

  const modeIcons: Record<string, React.ReactNode> = {
    'alto-rendimiento': <Zap className="h-4 w-4" />,
    'normal': <Activity className="h-4 w-4" />,
    'bajo-rendimiento': <BatteryLow className="h-4 w-4" />,
    'recuperacion': <Heart className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Planificar Día</h1>
            <p className="text-sm text-muted-foreground">Arrastra tareas a los bloques de tu rutina</p>
          </div>
          <div className="flex items-center gap-2">
            <QuickDateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            <Button onClick={handleSavePlan} disabled={loading} size="sm" className="gap-1.5">
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1 py-1">
            <Target className="h-3 w-3" /> {totalAssigned} asignadas
          </Badge>
          <Badge variant="outline" className="gap-1 py-1">
            <ListTodo className="h-3 w-3" /> {allTasks.length - totalAssigned} pendientes
          </Badge>
          <Badge variant="outline" className="gap-1 py-1">
            {modeIcons[mode]} {modes.find(m => m.id === mode)?.name || mode}
          </Badge>
          <Badge variant="outline" className={cn("gap-1 py-1", sleepHours >= 8 ? 'text-green-500' : sleepHours >= 7 ? 'text-yellow-500' : 'text-red-500')}>
            <Moon className="h-3 w-3" /> {sleepHours.toFixed(1)}h sueño
          </Badge>
        </div>

        {/* Routine Selector - same 4 routines as Inicio */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ROUTINES.map((r) => {
            const style = ROUTINE_STYLES[r.type];
            const isActive = planRoutineType === r.type;
            return (
              <button
                key={r.type}
                onClick={() => {
                  setPlanRoutineType(r.type);
                  setRoutineType(r.type);
                }}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]",
                  isActive ? style.active : `${style.inactive} bg-transparent`,
                  isActive && "scale-[1.02]"
                )}
              >
                <span className="text-xl leading-none transition-transform duration-300">{r.icon}</span>
                <span className={cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70")}>{r.shortLabel}</span>
                <span className={cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40")}>{r.wakeTime}—{r.sleepTime}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              Configuración
              {settingsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Preset</label>
                  <Select value={selectedPresetId || ''} onValueChange={(v) => {
                    setSelectedPresetId(v);
                    const preset = presets.find(p => p.id === v);
                    if (preset) { setWakeTime(preset.wake_time); setSleepTime(preset.sleep_time); }
                  }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {presets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Modo</label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {modes.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Despertar</label>
                    <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="h-9" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Dormir</label>
                    <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="h-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas</label>
                  <Input placeholder="Notas del día..." value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" />
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Preset schedule preview */}
        <PresetSchedulePicker
          persistToToday={false}
          selectedPresetId={selectedPresetId}
          onSelectPreset={(id, preset) => {
            setSelectedPresetId(id);
            setWakeTime(preset.wake_time);
            setSleepTime(preset.sleep_time);
          }}
        />

        {/* Main Layout: Blocks Timeline + Task Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Block Timeline */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Bloques del Día</h2>
            {!blocksLoaded ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />)}</div>
            ) : (
              sortedBlocks.map((block) => {
                const assignedTasks = (taskAssignments[block.id] || []).map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[];
                const isWorkBlock = block.title.toLowerCase().includes('deep work') || block.title.toLowerCase().includes('focus') || block.blockType === 'configurable' || block.blockType === 'dinamico';
                const isDragOver = dragOverBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onDragOver={(e) => handleBlockDragOver(e, block.id)}
                    onDragLeave={() => setDragOverBlockId(null)}
                    onDrop={(e) => handleBlockDrop(e, block.id)}
                    className={cn(
                      "flex items-start gap-2 transition-all",
                    )}
                  >
                    {/* Time */}
                    <div className="w-14 flex-shrink-0 text-[11px] text-muted-foreground font-mono pt-2.5 text-right">
                      {formatTime(block.startTime)}
                    </div>

                    {/* Block Card */}
                    <Card className={cn(
                      "flex-1 p-2.5 border-l-[3px] transition-all min-h-[48px]",
                      isWorkBlock ? "border-l-primary" : "border-l-muted-foreground/20",
                      isDragOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.01]",
                      assignedTasks.length > 0 && !isDragOver && "bg-primary/[0.03]"
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getBlockIcon(block.title)}
                          <span className="font-medium text-sm truncate">{block.title}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            {formatTime(block.endTime)}
                          </span>
                        </div>
                        {isWorkBlock && assignedTasks.length === 0 && (
                          <span className="text-[10px] text-muted-foreground italic">Arrastra tareas aquí</span>
                        )}
                        {assignedTasks.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5">{assignedTasks.length}</Badge>
                        )}
                      </div>

                      {assignedTasks.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {assignedTasks.map((task) => {
                            const cfg = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.general;
                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={() => handleDragStart(task.id)}
                                onDragEnd={handleDragEnd}
                                className="flex items-center justify-between p-1.5 bg-background/80 rounded group cursor-grab active:cursor-grabbing"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <GripVertical className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                                  <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4 flex-shrink-0", cfg.color)}>
                                    {cfg.icon}
                                  </Badge>
                                  <span className="text-xs truncate">{task.title}</span>
                                </div>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => removeTaskFromBlock(block.id, task.id)}
                                  className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 flex-shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })
            )}
          </div>

          {/* Task Sidebar */}
          <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            {/* Quick Create */}
            <Card className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Crear tarea rápida</p>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Nueva tarea..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                  className="h-8 text-sm"
                  disabled={creating}
                />
                <Select value={newTaskArea} onValueChange={setNewTaskArea}>
                  <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 w-8 p-0" onClick={handleQuickCreate} disabled={creating || !newTaskTitle.trim()}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>
            </Card>

            {/* Task List */}
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Tareas sin asignar ({unassignedTasks.length})
                </p>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 text-xs pl-7"
                  />
                </div>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-7 w-[90px] text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas</SelectItem>
                    {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                <div className="space-y-1">
                  {unassignedTasks.map((task) => {
                    const cfg = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.general;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50",
                          draggedTaskId === task.id && "opacity-40 scale-95"
                        )}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5", cfg.color)}>
                              {cfg.icon}
                              <span className="ml-0.5">{task.sourceName || cfg.label}</span>
                            </Badge>
                            {task.priority === 'high' && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">Alta</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {unassignedTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      {searchQuery || sourceFilter !== 'all' ? 'Sin resultados' : '¡Todas las tareas están asignadas! 🎯'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
