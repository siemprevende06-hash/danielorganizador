import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRoutineBlocks, formatTimeDisplay } from "@/hooks/useRoutineBlocks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, Target, Clock, CheckCircle2, Brain, Coffee, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AvailableTask {
  id: string;
  title: string;
  source: string;
  priority?: string;
  area_id?: string;
  routine_block_id?: string;
}

const POMODORO_OPTIONS = [
  { label: "25 min", value: 25 },
  { label: "30 min", value: 30 },
  { label: "50 min", value: 50 },
  { label: "80 min", value: 80 },
];

const BREAK_TIME = 10;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function Focus() {
  const { isLoaded, getCurrentBlock } = useRoutineBlocks();
  const { startSession, endSession, getTodayStats, getWeekStats } = useFocusSessions();

  const todayStats = getTodayStats();
  const weeklyStats = getWeekStats();

  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [isBreak, setIsBreak] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusedTask, setFocusedTask] = useState<{ id?: string; title: string } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [showTaskPicker, setShowTaskPicker] = useState(true);
  const [deepWorkBlock, setDeepWorkBlock] = useState<{ title: string; time: string } | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load tasks
  useEffect(() => {
    (async () => {
      const [tr, etr] = await Promise.all([
        supabase.from("tasks").select("id,title,priority,source,area_id,routine_block_id").eq("completed", false).order("priority", { ascending: false }).catch(() => null),
        supabase.from("entrepreneurship_tasks").select("id,title,routine_block_id").eq("completed", false).catch(() => null),
      ]);
      const tasks: AvailableTask[] = [
        ...((tr?.data || []).map((t: any) => ({ ...t, source: t.source || "general", routine_block_id: t.routine_block_id || undefined }))),
        ...((etr?.data || []).map((t: any) => ({ id: t.id, title: t.title, source: "entrepreneurship", routine_block_id: t.routine_block_id || undefined }))),
      ];
      setAvailableTasks(tasks);
    })();
  }, []);

  // Detect deep work block from routine
  useEffect(() => {
    if (!isLoaded) return;
    const check = () => {
      const block = getCurrentBlock();
      if (block && (block.isFocusBlock || block.title?.toLowerCase().includes("deep") || block.title?.toLowerCase().includes("focus") || block.title?.toLowerCase().includes("trabajo profundo"))) {
        setDeepWorkBlock({ title: block.title, time: `${formatTimeDisplay(block.startTime)} – ${formatTimeDisplay(block.endTime)}` });
      } else {
        setDeepWorkBlock(null);
      }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [isLoaded, getCurrentBlock]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-stop when timer hits 0
  useEffect(() => {
    if (timeRemaining > 0 || !isRunning) return;
    setIsRunning(false);
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
    if (elapsed < 1) {
      toast.error("Sesión demasiado corta (< 1 min) — no se guardó");
      setActiveSessionId(null);
      return;
    }
    if (activeSessionId) {
      endSession(activeSessionId, !isBreak);
      setActiveSessionId(null);
    }
    if (!isBreak) {
      toast.success("¡Tiempo completado! Tómate un descanso ☕");
      setIsBreak(true);
      setTimeRemaining(BREAK_TIME * 60);
    } else {
      toast.success("¡Descanso terminado! Listo para el siguiente 🚀");
      setIsBreak(false);
      setTimeRemaining(pomodoroMinutes * 60);
    }
  }, [timeRemaining]);

  const selectPomodoro = (minutes: number) => {
    if (isRunning) return;
    setPomodoroMinutes(minutes);
    if (!isBreak) setTimeRemaining(minutes * 60);
  };

  const handleStart = async () => {
    let title = taskTitle;
    let taskId: string | undefined;
    if (selectedTaskId) {
      const t = availableTasks.find(x => x.id === selectedTaskId);
      if (t) { title = t.title; taskId = t.id; }
    }
    if (!title.trim()) { toast.error("Selecciona o escribe una tarea"); return; }

    setFocusedTask({ id: taskId, title });
    setShowTaskPicker(false);
    startTimeRef.current = Date.now();

    const session = await startSession(title, taskId, undefined, undefined);
    if (session) {
      setActiveSessionId(session.id);
      setIsRunning(true);
      toast.success(`Enfocado en: ${title}`);
    }
  };

  const handlePause = async () => {
    setIsRunning(false);
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
    if (elapsed < 1 && activeSessionId) {
      endSession(activeSessionId, false);
      setActiveSessionId(null);
      toast.error("Sesión demasiado corta (< 1 min) — no se guardó");
      return;
    }
    if (activeSessionId) {
      await endSession(activeSessionId, false);
      setActiveSessionId(null);
    }
  };

  const handleReset = () => {
    if (activeSessionId) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
      if (elapsed >= 1) endSession(activeSessionId, false);
      setActiveSessionId(null);
    }
    setIsRunning(false);
    setIsBreak(false);
    setTimeRemaining(pomodoroMinutes * 60);
    setFocusedTask(null);
    setShowTaskPicker(true);
  };

  const progressPct = pomodoroMinutes > 0 ? ((pomodoroMinutes * 60 - (isBreak ? BREAK_TIME * 60 - timeRemaining : timeRemaining)) / (pomodoroMinutes * 60)) * 100 : 0;
  // For display, when in break, progress is based on break timer
  const displayProgress = isBreak ? ((BREAK_TIME * 60 - timeRemaining) / (BREAK_TIME * 60)) * 100 : ((pomodoroMinutes * 60 - timeRemaining) / (pomodoroMinutes * 60)) * 100;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.05)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Focus</h1>
          <p className="text-xs text-muted-foreground">Temporizador Pomodoro</p>
        </div>

        {/* Deep Work Block Indicator */}
        {deepWorkBlock && (
          <Card className="border-primary/20 bg-primary/5 py-2 px-3">
            <div className="flex items-center gap-2 text-[11px]">
              <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Coincide con tu rutina:</span>
              <span className="font-semibold">{deepWorkBlock.title}</span>
              <Badge variant="outline" className="text-[9px] h-4 ml-auto">{deepWorkBlock.time}</Badge>
            </div>
          </Card>
        )}

        {/* Timer Card — iPhone style glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl" />
          <Card className="relative border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
            <div className="p-8 flex flex-col items-center gap-6">
              {/* Pomodoro selector */}
              <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl w-full">
                {POMODORO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => selectPomodoro(opt.value)}
                    disabled={isRunning}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      pomodoroMinutes === opt.value && !isBreak
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => { if (!isRunning) { setIsBreak(true); setTimeRemaining(BREAK_TIME * 60); } }}
                  disabled={isRunning}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                    isBreak ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Coffee className="h-3 w-3" /> {BREAK_TIME} min
                </button>
              </div>

              {/* Timer ring */}
              <div className="relative w-56 h-56 md:w-64 md:h-64">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke={isBreak ? "hsl(38, 92%, 50%)" : "hsl(var(--primary))"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - Math.min(displayProgress / 100, 1))}`}
                    className="transition-all duration-700 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tight">
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                    {isBreak ? "Descanso" : "Trabajo enfocado"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {!isRunning ? (
                  <Button onClick={handleStart} size="lg" disabled={!focusedTask && !taskTitle && !selectedTaskId} className="w-28 h-12 rounded-full text-sm gap-2 shadow-lg shadow-primary/20">
                    <Play className="w-4 h-4 fill-current" /> Iniciar
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="lg" variant="outline" className="w-28 h-12 rounded-full text-sm gap-2 border-2">
                    <Pause className="w-4 h-4" /> Pausar
                  </Button>
                )}
                <Button onClick={handleReset} variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hoy: {todayStats.totalMinutes} min</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Semana: {weeklyStats.totalHours}h</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {weeklyStats.sessionsCount} sesiones</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Task Picker */}
        {showTaskPicker ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-lg rounded-2xl p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">¿En qué te enfocas?</p>
            {availableTasks.length > 0 && (
              <Select value={selectedTaskId || "none"} onValueChange={v => { setSelectedTaskId(v === "none" ? "" : v); setTaskTitle(""); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar tarea..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Escribir manualmente</SelectItem>
                  {availableTasks.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="O escribe una tarea..."
                value={taskTitle}
                onChange={e => { setTaskTitle(e.target.value); setSelectedTaskId(""); }}
                onKeyDown={e => e.key === "Enter" && handleStart()}
                className="h-9 text-xs flex-1"
              />
              <Button onClick={handleStart} size="sm" disabled={!taskTitle && !selectedTaskId} className="h-9">
                <Target className="w-3.5 h-3.5 mr-1" /> Enfocar
              </Button>
            </div>
          </Card>
        ) : focusedTask && (
          <Card className="border-0 bg-primary/10 backdrop-blur-xl shadow-lg rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Enfocado en</p>
                <p className="text-sm font-medium truncate">{focusedTask.title}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={handleReset}>Cambiar</Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}


