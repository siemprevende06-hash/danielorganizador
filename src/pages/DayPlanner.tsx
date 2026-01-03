import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Save, Zap, Activity, BatteryLow, Heart, Settings2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";
import { useRoutinePresets, RoutinePreset } from "@/hooks/useRoutinePresets";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { Link } from "react-router-dom";

import { RoutinePresetSelector } from "@/components/routine/RoutinePresetSelector";
import { SleepTimeSelector } from "@/components/routine/SleepTimeSelector";
import { DaySchedulePreview } from "@/components/routine/DaySchedulePreview";

interface Task {
  id: string;
  title: string;
  description?: string;
  source: string;
  completed: boolean;
  due_date?: string;
}

interface DailyPlan {
  id: string;
  plan_date: string;
  mode: string;
  notes?: string;
  selectedTaskIds: string[];
  preset_id?: string;
  wake_time?: string;
  sleep_time?: string;
  excluded_blocks?: string[];
}

const MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'alto-rendimiento': Zap,
  'normal': Activity,
  'bajo-rendimiento': BatteryLow,
  'recuperacion': Heart,
};

export default function DayPlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [mode, setMode] = useState<string>('normal');
  const [notes, setNotes] = useState<string>('');
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingPlan, setExistingPlan] = useState<DailyPlan | null>(null);
  
  // Preset and sleep configuration
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [wakeTime, setWakeTime] = useState('05:00');
  const [sleepTime, setSleepTime] = useState('21:00');
  const [excludeIdiomas, setExcludeIdiomas] = useState(false);
  const [excludeBloqueExtra, setExcludeBloqueExtra] = useState(false);
  
  const { modes, selectMode } = usePerformanceModes();
  const { presets, isLoading: presetsLoading, applyPresetToDate } = useRoutinePresets();
  const { blocks, isLoaded: blocksLoaded } = useRoutineBlocksDB();
  const { toast } = useToast();

  // Calculate excluded block IDs based on toggles
  const excludedBlockIds = useMemo(() => {
    const ids: string[] = [];
    if (excludeIdiomas) ids.push('2'); // Idiomas block ID
    if (excludeBloqueExtra) ids.push('18'); // Bloque Extra ID
    return ids;
  }, [excludeIdiomas, excludeBloqueExtra]);

  // Calculate sleep hours
  const sleepHours = useMemo(() => {
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    const [sleepH, sleepM] = sleepTime.split(':').map(Number);
    let wakeMinutes = wakeH * 60 + wakeM + 24 * 60;
    let sleepMinutes = sleepH * 60 + sleepM;
    return (wakeMinutes - sleepMinutes) / 60;
  }, [wakeTime, sleepTime]);

  // When preset changes, update wake/sleep times and exclusions
  useEffect(() => {
    if (selectedPresetId) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) {
        setWakeTime(preset.wake_time);
        setSleepTime(preset.sleep_time);
        setExcludeIdiomas(preset.excluded_block_ids.includes('2'));
        setExcludeBloqueExtra(preset.excluded_block_ids.includes('18'));
      }
    }
  }, [selectedPresetId, presets]);

  // Set default preset when loaded
  useEffect(() => {
    if (!presetsLoading && presets.length > 0 && !selectedPresetId) {
      const defaultPreset = presets.find(p => p.is_default);
      if (defaultPreset) {
        setSelectedPresetId(defaultPreset.id);
      }
    }
  }, [presetsLoading, presets, selectedPresetId]);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    loadExistingPlan();
  }, [selectedDate]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadExistingPlan = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: plan, error: planError } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('plan_date', dateStr)
        .maybeSingle();

      if (planError) throw planError;

      if (plan) {
        const { data: planTasks, error: tasksError } = await supabase
          .from('daily_plan_tasks')
          .select('task_id')
          .eq('daily_plan_id', plan.id);

        if (tasksError) throw tasksError;

        setExistingPlan({
          ...plan,
          selectedTaskIds: planTasks?.map(pt => pt.task_id) || [],
          excluded_blocks: plan.excluded_blocks || [],
        });
        setMode(plan.mode);
        setNotes(plan.notes || '');
        setSelectedTaskIds(planTasks?.map(pt => pt.task_id) || []);
        
        // Load preset settings if exists
        if (plan.preset_id) {
          setSelectedPresetId(plan.preset_id);
        }
        if (plan.wake_time) {
          setWakeTime(plan.wake_time);
        }
        if (plan.sleep_time) {
          setSleepTime(plan.sleep_time);
        }
        if (plan.excluded_blocks) {
          setExcludeIdiomas(plan.excluded_blocks.includes('2'));
          setExcludeBloqueExtra(plan.excluded_blocks.includes('18'));
        }
      } else {
        setExistingPlan(null);
        setMode('normal');
        setNotes('');
        setSelectedTaskIds([]);
        // Reset to default preset
        const defaultPreset = presets.find(p => p.is_default);
        if (defaultPreset) {
          setSelectedPresetId(defaultPreset.id);
        }
      }
    } catch (error) {
      console.error('Error loading existing plan:', error);
    }
  };

  const handleSavePlan = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Upsert daily plan with preset info
      const { data: plan, error: planError } = await supabase
        .from('daily_plans')
        .upsert({
          plan_date: dateStr,
          mode,
          notes,
          preset_id: selectedPresetId,
          wake_time: wakeTime,
          sleep_time: sleepTime,
          excluded_blocks: excludedBlockIds,
        }, {
          onConflict: 'plan_date'
        })
        .select()
        .single();

      if (planError) throw planError;

      // Delete existing task associations
      await supabase
        .from('daily_plan_tasks')
        .delete()
        .eq('daily_plan_id', plan.id);

      // Insert new task associations
      if (selectedTaskIds.length > 0) {
        const taskAssociations = selectedTaskIds.map((taskId, index) => ({
          daily_plan_id: plan.id,
          task_id: taskId,
          order_index: index
        }));

        const { error: tasksError } = await supabase
          .from('daily_plan_tasks')
          .insert(taskAssociations);

        if (tasksError) throw tasksError;
      }

      // Apply the selected mode to the routine
      selectMode(mode);

      const presetName = presets.find(p => p.id === selectedPresetId)?.name || 'Personalizado';
      toast({
        title: "Plan guardado",
        description: `Plan para ${format(selectedDate, "d 'de' MMMM", { locale: es })} guardado con preset "${presetName}". Despertar: ${wakeTime}, Dormir: ${sleepTime}`
      });

      loadExistingPlan();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      project: 'Proyecto',
      university: 'Universidad',
      entrepreneurship: 'Emprendimiento'
    };
    return labels[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-500/10 text-blue-500',
      project: 'bg-purple-500/10 text-purple-500',
      university: 'bg-green-500/10 text-green-500',
      entrepreneurship: 'bg-orange-500/10 text-orange-500'
    };
    return colors[source] || 'bg-gray-500/10 text-gray-500';
  };

  const tasksBySource = allTasks.reduce((acc, task) => {
    if (!acc[task.source]) {
      acc[task.source] = [];
    }
    acc[task.source].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Planificación del Día
            </h1>
            <p className="text-muted-foreground mt-2">
              Configura tu rutina, selecciona tareas y organiza tu jornada
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full md:w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: es })
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="routine" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routine">Configuración de Rutina</TabsTrigger>
            <TabsTrigger value="tasks">Tareas del Día</TabsTrigger>
            <TabsTrigger value="mode">Modo y Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="routine" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Routine Preset Selector */}
                {!presetsLoading && (
                  <RoutinePresetSelector
                    presets={presets}
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={setSelectedPresetId}
                  />
                )}

                {/* Sleep Time Selector */}
                <SleepTimeSelector
                  wakeTime={wakeTime}
                  sleepTime={sleepTime}
                  excludeIdiomas={excludeIdiomas}
                  excludeBloqueExtra={excludeBloqueExtra}
                  onWakeTimeChange={setWakeTime}
                  onSleepTimeChange={setSleepTime}
                  onExcludeIdiomasChange={setExcludeIdiomas}
                  onExcludeBloqueExtraChange={setExcludeBloqueExtra}
                />
              </div>

              {/* Day Schedule Preview */}
              {blocksLoaded && (
                <DaySchedulePreview
                  date={selectedDate}
                  blocks={blocks}
                  excludedBlockIds={excludedBlockIds}
                  wakeTime={wakeTime}
                  sleepTime={sleepTime}
                  sleepHours={sleepHours}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Tareas Disponibles</h2>
              {Object.keys(tasksBySource).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay tareas disponibles
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(tasksBySource).map(([source, tasks]) => (
                    <div key={source} className="space-y-2">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-md text-sm", getSourceColor(source))}>
                          {getSourceLabel(source)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({tasks.length})
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-all",
                              selectedTaskIds.includes(task.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Checkbox
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={() => toggleTaskSelection(task.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="mode" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Modo del Día</h2>
                  <Link to="/performance-modes">
                    <Button variant="ghost" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configurar Modos
                    </Button>
                  </Link>
                </div>
                <RadioGroup value={mode} onValueChange={setMode} className="space-y-3">
                  {modes.map((modeOption) => {
                    const Icon = MODE_ICONS[modeOption.id] || Activity;
                    return (
                      <div
                        key={modeOption.id}
                        className={cn(
                          "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                          mode === modeOption.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setMode(modeOption.id)}
                      >
                        <RadioGroupItem value={modeOption.id} id={modeOption.id} />
                        <div className="flex-1">
                          <Label
                            htmlFor={modeOption.id}
                            className="flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Icon className="h-5 w-5" />
                            {modeOption.name}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {modeOption.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </Card>

              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Notas del Día</h2>
                  <Textarea
                    placeholder="Escribe notas o recordatorios para este día..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[150px]"
                  />
                </Card>

                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Resumen</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">
                        {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preset de Rutina</p>
                      <p className="font-medium">
                        {presets.find(p => p.id === selectedPresetId)?.name || 'No seleccionado'}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Despertar</p>
                        <p className="font-medium text-lg">{wakeTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dormir</p>
                        <p className="font-medium text-lg">{sleepTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sueño</p>
                        <p className={cn(
                          "font-medium text-lg",
                          sleepHours >= 8 ? 'text-green-500' : sleepHours >= 7 ? 'text-yellow-500' : 'text-red-500'
                        )}>
                          {sleepHours.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modo</p>
                      <p className="font-medium">
                        {modes.find(m => m.id === mode)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tareas seleccionadas</p>
                      <p className="font-medium text-2xl">{selectedTaskIds.length}</p>
                    </div>
                    {excludedBlockIds.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bloques excluidos</p>
                        <p className="font-medium text-red-500">{excludedBlockIds.length}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSavePlan}
          disabled={loading}
          className="w-full md:w-auto"
          size="lg"
        >
          <Save className="mr-2 h-5 w-5" />
          {loading ? 'Guardando...' : 'Guardar Plan'}
        </Button>
      </div>
    </div>
  );
}
