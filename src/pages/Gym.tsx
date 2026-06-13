import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWorkoutTracking } from "@/hooks/useWorkoutTracking";
import { Check, ChevronRight, Minus, Plus, Timer, Dumbbell, Play, SkipForward, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { StrengthGoalsCard } from "@/components/gym/StrengthGoalsCard";
import { GymStatsView } from "@/components/gym/GymStatsView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ActiveSet {
  exerciseIndex: number;
  setIndex: number;
}

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutSession {
  exerciseIndex: number;
  sets: SetData[][];
}

const MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Piernas", "Abdominales", "Glúteos", "Cardio"
];

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo"
};

export default function Gym() {
  const {
    routine, exercises, isLoading,
    createRoutine, addExercise, removeExercise, logWorkout,
    getTodayWorkout, getExercisesByDay, reload, DAY_NAMES
  } = useWorkoutTracking();

  const [activeExercise, setActiveExercise] = useState(0);
  const [sessionSets, setSessionSets] = useState<SetData[][]>([]);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restDuration, setRestDuration] = useState(60);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup dialog state
  const [setupOpen, setSetupOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  
  // Add exercise dialog
  const [addExOpen, setAddExOpen] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExDay, setNewExDay] = useState("");
  const [newExSets, setNewExSets] = useState(5);
  const [newExReps, setNewExReps] = useState("8");
  const [newExMuscle, setNewExMuscle] = useState("");
  const [newExWeight, setNewExWeight] = useState(0);

  // View state
  const [viewDay, setViewDay] = useState<string | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  const todayWorkout = routine ? getTodayWorkout() : null;
  const todayExercises = todayWorkout?.exercises || [];

  // Initialize session sets when exercises load
  useEffect(() => {
    if (todayExercises.length > 0 && sessionSets.length === 0) {
      setSessionSets(
        todayExercises.map(ex =>
          Array.from({ length: ex.target_sets }, () => ({
            weight: 0,
            reps: parseInt(ex.target_reps) || 8,
            completed: false,
          }))
        )
      );
    }
  }, [todayExercises.length]);

  // Rest timer logic
  useEffect(() => {
    if (restTimer !== null && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimer === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restTimer !== null && restTimer > 0]);

  const completeSet = (exIdx: number, setIdx: number) => {
    setSessionSets(prev => {
      const next = prev.map(s => [...s]);
      next[exIdx] = next[exIdx].map((s, i) => i === setIdx ? { ...s, completed: true } : s);
      return next;
    });
    setRestTimer(restDuration);
  };

  const skipRest = () => {
    setRestTimer(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const adjustRest = (delta: number) => {
    setRestDuration(prev => Math.max(5, prev + delta));
    setRestTimer(prev => prev !== null ? Math.max(0, prev + delta) : null);
  };

  const updateSetData = (exIdx: number, setIdx: number, field: "weight" | "reps", value: number) => {
    setSessionSets(prev => {
      const next = prev.map(s => [...s]);
      next[exIdx] = next[exIdx].map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      return next;
    });
  };

  const currentExSets = sessionSets[activeExercise] || [];
  const completedSets = currentExSets.filter(s => s.completed).length;
  const totalSets = currentExSets.length;
  const currentSetIdx = currentExSets.findIndex(s => !s.completed);
  const currentExerciseObj = todayExercises[activeExercise];

  const allSetsComplete = completedSets === totalSets && totalSets > 0;

  const handleNext = () => {
    if (restTimer !== null) {
      skipRest();
      return;
    }
    if (allSetsComplete) {
      // Log this exercise
      if (currentExerciseObj) {
        const avgWeight = currentExSets.reduce((s, v) => s + v.weight, 0) / currentExSets.length;
        logWorkout(
          currentExerciseObj.id,
          avgWeight,
          completedSets,
          currentExSets.map(s => s.reps)
        );
      }
      if (activeExercise < todayExercises.length - 1) {
        setActiveExercise(prev => prev + 1);
        setRestTimer(null);
      } else {
        setWorkoutComplete(true);
        toast({ title: "🎉 ¡Entrenamiento completado!", description: "Excelente trabajo hoy." });
      }
    }
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) return;
    await createRoutine(newRoutineName, selectedDays);
    setSetupOpen(false);
    setNewRoutineName("");
    setSelectedDays({});
    toast({ title: "Rutina creada" });
  };

  const handleAddExercise = async () => {
    if (!routine || !newExName.trim() || !newExDay) return;
    await addExercise(routine.id, newExName, newExDay, newExSets, newExReps, newExMuscle || undefined);
    setAddExOpen(false);
    setNewExName("");
    setNewExSets(5);
    setNewExReps("8");
    setNewExMuscle("");
    toast({ title: "Ejercicio agregado" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No routine setup
  if (!routine) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <Dumbbell className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Gimnasio</h1>
          <p className="text-muted-foreground">Configura tu rutina de entrenamiento para empezar</p>
          <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2"><Plus className="h-5 w-5" /> Crear Rutina</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Rutina</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nombre de la rutina" value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} />
                <div>
                  <p className="text-sm font-medium mb-2">Días de entrenamiento</p>
                  <div className="flex flex-wrap gap-2">
                    {DAY_KEYS.map(d => (
                      <Button
                        key={d}
                        size="sm"
                        variant={selectedDays[d] ? "default" : "outline"}
                        onClick={() => setSelectedDays(prev => ({ ...prev, [d]: !prev[d] }))}
                      >
                        {DAY_LABELS[d].slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateRoutine} className="w-full">Crear</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Workout complete screen
  if (workoutComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 pt-24">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="p-6 rounded-full bg-green-500/20 w-fit mx-auto">
            <Trophy className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-500">¡Completado!</h1>
          <p className="text-muted-foreground">Has terminado tu entrenamiento de hoy</p>
          <Button onClick={() => { setWorkoutComplete(false); setWorkoutStarted(false); setActiveExercise(0); setSessionSets([]); reload(); }}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  // Main workout screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">
              {todayWorkout?.isWorkoutDay
                ? `Entrenamiento de ${currentExerciseObj?.muscle_group || todayWorkout.dayName}`
                : routine.name}
            </h1>
            <p className="text-sm text-muted-foreground">{todayWorkout?.dayName} · {routine.name}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={addExOpen} onOpenChange={setAddExOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Agregar Ejercicio</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nombre del ejercicio" value={newExName} onChange={e => setNewExName(e.target.value)} />
                  <Select value={newExDay} onValueChange={setNewExDay}>
                    <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                    <SelectContent>
                      {DAY_KEYS.filter(d => routine.workout_days[d]).map(d => (
                        <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newExMuscle} onValueChange={setNewExMuscle}>
                    <SelectTrigger><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Series</label>
                      <Input type="number" value={newExSets} onChange={e => setNewExSets(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <Input value={newExReps} onChange={e => setNewExReps(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleAddExercise} className="w-full">Agregar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="workout">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="workout">Entrenamiento</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="mt-3">
            <GymStatsView />
          </TabsContent>
          <TabsContent value="workout" className="mt-3 space-y-4">

        {!todayWorkout?.isWorkoutDay && !workoutStarted ? (
          /* Non-workout day: show routine overview */
          <div className="space-y-4">
            <Card className="p-4 text-center">
              <p className="text-lg font-semibold">Hoy no es día de entrenamiento</p>
              <p className="text-sm text-muted-foreground mt-1">Revisa tu rutina o agrega ejercicios</p>
            </Card>

            {/* Show exercises by day */}
            <div className="space-y-2">
              {DAY_KEYS.filter(d => routine.workout_days[d]).map(day => {
                const dayExercises = getExercisesByDay(day);
                const isExpanded = viewDay === day;
                return (
                  <Card key={day} className="p-3">
                    <button
                      className="flex items-center justify-between w-full"
                      onClick={() => setViewDay(isExpanded ? null : day)}
                    >
                      <span className="font-semibold">{DAY_LABELS[day]}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{dayExercises.length} ejercicios</Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {dayExercises.map(ex => (
                          <div key={ex.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/50">
                            <div>
                              <span className="text-sm font-medium">{ex.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{ex.target_sets}×{ex.target_reps}</span>
                              {ex.muscle_group && <Badge variant="outline" className="ml-2 text-[10px]">{ex.muscle_group}</Badge>}
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => removeExercise(ex.id)}>×</Button>
                          </div>
                        ))}
                        {dayExercises.length === 0 && <p className="text-xs text-muted-foreground">Sin ejercicios</p>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <StrengthGoalsCard />
          </div>
        ) : (
          /* Workout day: active training UI */
          <>
            {!workoutStarted ? (
              <div className="space-y-4">
                <Card className="p-6 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h2 className="text-xl font-bold mb-1">Hoy: {todayWorkout?.dayName}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{todayExercises.length} ejercicios programados</p>
                  <div className="space-y-2 mb-4">
                    {todayExercises.map(ex => (
                      <div key={ex.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium flex-1">{ex.name}</span>
                        <span className="text-xs text-muted-foreground">{ex.target_sets}×{ex.target_reps}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="lg" onClick={() => setWorkoutStarted(true)} className="gap-2 w-full" disabled={todayExercises.length === 0}>
                    <Play className="h-5 w-5" /> Iniciar Entrenamiento
                  </Button>
                </Card>
              </div>
            ) : (
              /* Active workout */
              <div className="space-y-4">
                {/* Current exercise card */}
                {currentExerciseObj && (
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold">{currentExerciseObj.name}</h2>
                          {currentExerciseObj.muscle_group && (
                            <Badge variant="outline" className="mt-1">{currentExerciseObj.muscle_group}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">{completedSets}/{totalSets}</span>
                          <p className="text-xs text-muted-foreground">series</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-2">
                      {currentExSets.map((set, idx) => {
                        const isCompleted = set.completed;
                        const isCurrent = idx === currentSetIdx;
                        const isPending = !isCompleted && !isCurrent;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                              isCompleted && "bg-green-500/10 border-green-500/30",
                              isCurrent && "bg-primary/5 border-primary ring-2 ring-primary/30",
                              isPending && "bg-muted/30 border-border opacity-60"
                            )}
                          >
                            {/* Set number */}
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                              isCompleted && "bg-green-500 text-white",
                              isCurrent && "bg-primary text-primary-foreground",
                              isPending && "bg-muted text-muted-foreground"
                            )}>
                              {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                            </div>

                            {/* Weight & reps */}
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="number"
                                value={set.weight}
                                onChange={e => updateSetData(activeExercise, idx, "weight", Number(e.target.value))}
                                className="w-20 h-8 text-center text-sm"
                                disabled={isCompleted}
                                placeholder="kg"
                              />
                              <span className="text-xs text-muted-foreground">kg</span>
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={e => updateSetData(activeExercise, idx, "reps", Number(e.target.value))}
                                className="w-16 h-8 text-center text-sm"
                                disabled={isCompleted}
                              />
                              <span className="text-xs text-muted-foreground">reps</span>
                            </div>

                            {/* Complete button */}
                            {isCurrent && (
                              <Button
                                size="sm"
                                onClick={() => completeSet(activeExercise, idx)}
                                className="h-8 gap-1"
                              >
                                <Check className="h-3 w-3" /> OK
                              </Button>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">✓</Badge>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Rest timer */}
                {restTimer !== null && restTimer > 0 && (
                  <Card className="p-6 text-center bg-gradient-to-b from-primary/5 to-background">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Temporizador de Descanso</p>
                    <p className="text-6xl font-bold text-primary tabular-nums">
                      {String(Math.floor(restTimer / 60)).padStart(2, "0")}:{String(restTimer % 60).padStart(2, "0")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Siguiente: {currentExerciseObj?.name} · Serie {(currentSetIdx !== -1 ? currentSetIdx : totalSets) + 1}/{totalSets}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0" onClick={() => adjustRest(-5)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">-5s / +5s</span>
                      <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0" onClick={() => adjustRest(5)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={skipRest} className="ml-2 gap-1">
                        <SkipForward className="h-4 w-4" /> Omitir
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Next exercise preview */}
                {activeExercise < todayExercises.length - 1 && (
                  <Card className="p-3 opacity-60">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium flex-1">{todayExercises[activeExercise + 1].name}</span>
                      <span className="text-xs text-muted-foreground">
                        0/{todayExercises[activeExercise + 1].target_sets}
                      </span>
                    </div>
                  </Card>
                )}

                {/* Next button */}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleNext}
                  disabled={!allSetsComplete && restTimer === null}
                >
                  {restTimer !== null && restTimer > 0 ? (
                    <><SkipForward className="h-5 w-5" /> Omitir Descanso</>
                  ) : allSetsComplete ? (
                    <><ChevronRight className="h-5 w-5" /> {activeExercise < todayExercises.length - 1 ? "Siguiente Ejercicio" : "Finalizar"}</>
                  ) : (
                    <><Timer className="h-5 w-5" /> Completa la serie actual</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
