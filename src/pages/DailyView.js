import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyGuide } from "@/components/today/DailyGuide";
import { TaskAccordion } from "@/components/today/TaskAccordion";
import { TodayWorkout } from "@/components/today/TodayWorkout";
import { SystemHabitGroup } from "@/components/systems/SystemHabitGroup";
import { EnfoqueSection } from "@/components/today/EnfoqueSection";
import NotionCalendar from "@/components/calendar/NotionCalendar";
import { HobbyCards } from "@/components/systems/HobbyCards";
import { LanguageSkillCards } from "@/components/systems/LanguageSkillCards";
import { WorkoutVisual } from "@/components/systems/WorkoutVisual";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
import { MejoraProcessPanel } from "@/components/mejora/MejoraProcessPanel";
import { FocusProcessPanel } from "@/components/focus/FocusProcessPanel";
import { ReadingTrackingPanel } from "@/components/reading/ReadingSessionTracker";
import { HealthSection } from "@/components/dashboard/HealthSection";
import { Input } from "@/components/ui/input";
import { RoutineConfigBar } from "@/components/today/RoutineConfigBar";
import { CurrentBlockCard } from "@/components/today/CurrentBlockCard";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { TaskPoolPanel } from "@/components/today/TaskPoolPanel";
import { TaskChecklist } from "@/components/today/TaskChecklist";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { PanelControlSection } from "@/components/control/PanelControlSection";
import { EsfuerzoResultadosToggle } from "@/components/control/EsfuerzoResultadosToggle";
import { ResultadosDia } from "@/components/resultados/ResultadosDia";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useRoutineConfig } from "@/hooks/useRoutineConfig";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useRoutineBlocks, ROUTINES } from "@/hooks/useRoutineBlocks";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Zap, Shield, TrendingUp, BookOpen, LayoutGrid, Sparkles, Utensils, Focus, GraduationCap, Briefcase, FolderKanban, Globe, ListTodo, Clock, Gamepad2, ChevronLeft, ChevronRight, Flame, Scale, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, subDays } from "date-fns";
import { TimePeriodSections } from "@/components/today/TimePeriodSections";
const SOSTEN_GROUPS = [
  {
    id: "estructural",
    name: "H\xE1bitos Estructurales",
    icon: LayoutGrid,
    color: "bg-blue-500/20 text-blue-500",
    habits: [
      { id: "rutina-activacion", name: "Rutina de Activaci\xF3n", linkTo: "/activation-routine" },
      { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno" },
      { id: "horario-regular", name: "Horario Regular", isSleepSchedule: true },
      { id: "rutina-desactivacion", name: "Rutina de Desactivaci\xF3n", linkTo: "/deactivation-routine" }
    ]
  },
  {
    id: "apariencia",
    name: "Apariencia",
    icon: Sparkles,
    color: "bg-pink-500/20 text-pink-500",
    habits: [
      { id: "skincare-manana", name: "Skin Care Ma\xF1ana" },
      { id: "skincare-noche", name: "Skin Care Noche" },
      { id: "banarme-vestirme", name: "Ba\xF1arme y Vestirme" }
    ]
  },
  {
    id: "alimentacion",
    name: "Alimentaci\xF3n y Agua",
    icon: Utensils,
    color: "bg-amber-500/20 text-amber-500",
    habits: [
      { id: "pre-entreno", name: "Pre-entreno", hasWater: true, hasMealPhoto: true },
      { id: "desayuno", name: "Desayuno", hasWater: true, hasMealPhoto: true },
      { id: "merienda-1", name: "Merienda 1", hasWater: true, hasMealPhoto: true },
      { id: "almuerzo", name: "Almuerzo", hasWater: true, hasMealPhoto: true },
      { id: "merienda-2", name: "Merienda 2", hasWater: true, hasMealPhoto: true },
      { id: "comida", name: "Comida", hasWater: true, hasMealPhoto: true },
      { id: "antes-dormir", name: "Antes de Dormir", hasWater: true, hasMealPhoto: true },
      { id: "suplementos", name: "Suplementos" }
    ]
  }
];
const MEJORA_GROUPS = [
  {
    id: "hobbys",
    name: "Mejora Hobbys",
    icon: BookOpen,
    color: "bg-purple-500/20 text-purple-500",
    habits: [
      { id: "lectura", name: "Lectura", hasTime: true },
      { id: "musica", name: "M\xFAsica", hasTime: true },
      { id: "ajedrez", name: "Ajedrez", hasTime: true, hasCount: true, countLabel: "partidas" }
    ]
  }
];
const ALL_GROUPS = [...SOSTEN_GROUPS, ...MEJORA_GROUPS];
const ROUTINE_ICONS = {
  disciplina: /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4" }),
  normal: /* @__PURE__ */ jsx(Scale, { className: "h-4 w-4" }),
  super: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4" }),
  descanso: /* @__PURE__ */ jsx(Leaf, { className: "h-4 w-4" })
};
function DailyView() {
  const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
  const [viewMode, setViewMode] = useState("esfuerzo");
  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });
  const dayOfYear = Math.ceil((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / 864e5);
  const yearProgress = Math.round(dayOfYear / 365 * 100);
  const { data, loading, toggleCompletion, setTimeValue, setCountValue, toggleWater, setWorkAssignment, setMealPhoto, update, toggleSkip, toggleActiveFocusArea } = useSystemsTracking(selectedDate);
  const dailyPlanData = useDailyPlanData(selectedDate);
  const {
    blocks: rawBlocks,
    blocksLoaded,
    tasksByBlock,
    unassignedTasks,
    assignTaskToBlock,
    removeTaskFromBlock,
    refreshTasks,
    toggleTaskDone,
    toggleBlockComplete,
    isBlockCompleted,
    completedBlocks,
    completedTasks,
    dayScore,
    tasks,
    planRoutineType,
    planLanguage
  } = dailyPlanData;
  const planAssignments = dailyPlanData.planAssignments ?? null;
  const [todayEvents, setTodayEvents] = useState([]);
  useEffect(() => {
    supabase.from("calendar_events").select("*").eq("event_date", format(selectedDate, "yyyy-MM-dd")).order("event_date").then(({ data: data2 }) => {
      if (data2) setTodayEvents(data2);
    });
  }, [selectedDate]);
  const plannedTaskIds = useMemo(() => {
    if (!planAssignments) return /* @__PURE__ */ new Set();
    return new Set(Object.values(planAssignments).flat());
  }, [planAssignments]);
  const plannedTasks = useMemo(() => tasks.filter((t) => plannedTaskIds.has(t.id) && !t.completed), [tasks, plannedTaskIds]);
  const groupedTasks = useMemo(() => {
    const groups = {};
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    for (const task of plannedTasks) {
      const key = task.source === "entrepreneurship" ? "emprendimiento" : task.source || "general";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (priorityOrder[a.priority || "medium"] ?? 1) - (priorityOrder[b.priority || "medium"] ?? 1));
    }
    return groups;
  }, [plannedTasks]);
  const SOURCE_CONFIG = {
    universidad: { label: "Universidad", icon: /* @__PURE__ */ jsx(GraduationCap, { className: "h-3.5 w-3.5" }), color: "text-blue-500" },
    emprendimiento: { label: "Emprendimiento", icon: /* @__PURE__ */ jsx(Briefcase, { className: "h-3.5 w-3.5" }), color: "text-purple-500" },
    proyectos: { label: "Proyectos", icon: /* @__PURE__ */ jsx(FolderKanban, { className: "h-3.5 w-3.5" }), color: "text-amber-500" },
    idiomas: { label: "Idiomas", icon: /* @__PURE__ */ jsx(Globe, { className: "h-3.5 w-3.5" }), color: "text-emerald-500" },
    general: { label: "General", icon: /* @__PURE__ */ jsx(ListTodo, { className: "h-3.5 w-3.5" }), color: "text-muted-foreground" }
  };
  const {
    adjustedBlocks,
    wakeTime,
    setWakeTime,
    focusBlock,
    setFocusBlock,
    sleepTime,
    setSleepTime,
    lateWake,
    setLateWake,
    musicInstrument,
    setMusicInstrument,
    presetName
  } = useRoutineConfig();
  const { getCurrentBlock, getBlockProgress, updateBlockFocus } = useRoutineBlocksDB();
  const currentBlock = getCurrentBlock();
  const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;
  const { blocks: routineBlocks, isLoaded: routineLoaded, routineType, setRoutineType, updateBlockFocus: updateRoutineBlockFocus } = useRoutineBlocks();
  useEffect(() => {
    if (planRoutineType) {
      setRoutineType(planRoutineType);
    }
  }, [planRoutineType, setRoutineType]);
  const [activeSection, setActiveSection] = useState("tasks");
  const completedHabitsAll = ALL_GROUPS.reduce((sum, g) => sum + g.habits.filter((h) => data.completions?.[h.id]).length, 0);
  const totalHabitsAll = ALL_GROUPS.reduce((sum, g) => sum + g.habits.length, 0);
  const mejoraMinutes = (data.timeData?.lectura || 0) + (data.timeData?.musica || 0) + (data.timeData?.ajedrez || 0) + (data.workoutDuration || 0);
  const sostenMinutes = Object.entries(data.timeData || {}).filter(([k]) => !["lectura", "musica", "ajedrez"].includes(k)).reduce((s, [, v]) => s + v, 0);
  const todayMinutes = {
    lectura: data.timeData?.lectura || 0,
    musica: data.timeData?.musica || 0,
    ajedrez: data.timeData?.ajedrez || 0,
    idiomas: (data.timeData?.italiano || 0) + (data.timeData?.ingles || 0),
    game: data.timeData?.game || 0,
    gym: data.workoutDuration || 0
  };
  const focusTodayMinutes = {
    universidad: data.timeData?.universidad || 0,
    emprendimiento: data.timeData?.emprendimiento || 0,
    proyectos: data.timeData?.proyectos || 0
  };
  const SECTIONS = [
    { id: "tasks", label: "Tareas y Horario", icon: /* @__PURE__ */ jsx(ListTodo, { className: "h-4 w-4" }), pct: plannedTasks.length > 0 ? Math.round(plannedTasks.filter((t) => t.completed).length / plannedTasks.length * 100) : 0, time: data.workoutDuration || 0 },
    { id: "enfoque", label: "Enfoque", icon: /* @__PURE__ */ jsx(Focus, { className: "h-4 w-4" }), pct: plannedTasks.length > 0 ? Math.round(plannedTasks.filter((t) => t.completed).length / plannedTasks.length * 100) : 0, time: 0 },
    { id: "mejora", label: "Mejora", icon: /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }), pct: totalHabitsAll > 0 ? Math.round(completedHabitsAll / totalHabitsAll * 100) : 0, time: mejoraMinutes },
    { id: "sosten", label: "Sost\xE9n", icon: /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4" }), pct: totalHabitsAll > 0 ? Math.round(completedHabitsAll / totalHabitsAll * 100) : 0, time: sostenMinutes }
  ];
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center pt-24", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background p-3 md:p-6 pt-20 pb-24", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Zap, { className: "w-6 h-6 text-primary" }),
          "Mi D\xEDa"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground capitalize mt-0.5 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CalendarDays, { className: "w-3.5 h-3.5" }),
          formattedDate
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setSelectedDate((d) => subDays(d, 1)), children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "h-8 text-xs rounded-full", onClick: () => setSelectedDate(/* @__PURE__ */ new Date()), children: "Hoy" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => setSelectedDate((d) => addDays(d, 1)), children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs font-mono", children: [
          "D\xEDa ",
          dayOfYear,
          " \xB7 ",
          yearProgress,
          "% del a\xF1o"
        ] })
      ] })
    ] }),
    viewMode === "plan" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: ROUTINES.map((r) => {
        const isActive = routineType === r.type;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setRoutineType(r.type),
            className: cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200", isActive ? "bg-foreground text-background border-foreground shadow-sm" : "bg-white dark:bg-zinc-950 text-foreground/70 border-foreground/15 hover:border-foreground/40 hover:text-foreground"),
            children: [
              /* @__PURE__ */ jsx("span", { className: cn("shrink-0", !isActive && "opacity-60"), children: ROUTINE_ICONS[r.type] }),
              /* @__PURE__ */ jsxs("span", { className: "flex flex-col items-start gap-0.5 min-w-0", children: [
                /* @__PURE__ */ jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", !isActive && "opacity-70"), children: r.shortLabel }),
                /* @__PURE__ */ jsxs("span", { className: cn("text-[9px] font-mono tracking-tight", isActive ? "text-background/60" : "text-foreground/40"), children: [
                  r.wakeTime,
                  "\u2014",
                  r.sleepTime
                ] })
              ] })
            ]
          },
          r.type
        );
      }) }),
      /* @__PURE__ */ jsx(TimePeriodSections, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock }),
      /* @__PURE__ */ jsx(RoutineConfigBar, { wakeTime, onWakeChange: setWakeTime, focusBlock, onFocusChange: setFocusBlock, sleepTime, onSleepChange: setSleepTime, lateWake, onLateWakeChange: setLateWake, musicInstrument, onMusicInstrumentChange: setMusicInstrument, presetName }),
      /* @__PURE__ */ jsx(CurrentBlockCard, { currentBlock, blockProgress: currentProgress, tasksByBlock }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [
        /* @__PURE__ */ jsx(DailyTimelinePlanner, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock, onToggleBlock: toggleBlockComplete, isBlockCompleted, onDropTask: assignTaskToBlock, onRemoveTask: removeTaskFromBlock, onUpdateFocus: updateRoutineBlockFocus, events: todayEvents, musicInstrument, languageChoice: planLanguage || void 0 }),
        /* @__PURE__ */ jsx("div", { className: "lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]", children: /* @__PURE__ */ jsx(TaskPoolPanel, { unassignedTasks, onTaskCreated: refreshTasks }) })
      ] }),
      /* @__PURE__ */ jsx(TaskChecklist, { tasks, onToggle: toggleTaskDone })
    ] }) : viewMode === "esfuerzo" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(PanelControlSection, { timeData: data.timeData, completions: data.completions, workoutDuration: data.workoutDuration, date: selectedDate }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: SECTIONS.map((s) => {
        const isActive = activeSection === s.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveSection(s.id),
            className: cn(
              "relative rounded-2xl p-3 text-left transition-all border-0 backdrop-blur-xl overflow-hidden",
              isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: cn("text-lg", isActive ? "text-primary-foreground" : "text-primary"), children: s.icon }),
                (s.pct > 0 || s.time > 0) && /* @__PURE__ */ jsxs("div", { className: "relative w-8 h-8", children: [
                  /* @__PURE__ */ jsxs("svg", { className: "w-8 h-8 -rotate-90", viewBox: "0 0 32 32", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "16", cy: "16", r: "12", fill: "none", stroke: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)", strokeWidth: "3" }),
                    /* @__PURE__ */ jsx(
                      "circle",
                      {
                        cx: "16",
                        cy: "16",
                        r: "12",
                        fill: "none",
                        stroke: isActive ? "rgba(255,255,255,0.8)" : "currentColor",
                        strokeWidth: "3",
                        strokeDasharray: `${2 * Math.PI * 12}`,
                        strokeDashoffset: `${2 * Math.PI * 12 * (1 - Math.min(s.pct, 100) / 100)}`,
                        className: cn(isActive ? "" : "text-primary")
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums", children: [
                    s.pct,
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold leading-tight", children: s.label }),
              s.time > 0 && /* @__PURE__ */ jsxs("div", { className: cn("text-[9px] mt-0.5 flex items-center gap-1", isActive ? "text-primary-foreground/70" : "text-muted-foreground"), children: [
                /* @__PURE__ */ jsx(Clock, { className: "h-2.5 w-2.5" }),
                s.time,
                " min"
              ] })
            ]
          },
          s.id
        );
      }) }),
      activeSection === "tasks" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [
            /* @__PURE__ */ jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [
              /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: "20",
                  cy: "20",
                  r: "16",
                  fill: "none",
                  stroke: "currentColor",
                  className: "text-indigo-500",
                  strokeWidth: "3",
                  strokeDasharray: `${2 * Math.PI * 16}`,
                  strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[0].pct, 100) / 100)}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [
              SECTIONS[0].pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold", children: "Progreso del D\xEDa" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              plannedTasks.length,
              " tareas \xB7 ",
              data.workoutDuration || 0,
              " min ejercicio"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(DailyGuide, {}),
        Object.keys(groupedTasks).length > 0 && /* @__PURE__ */ jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 to-purple-400" }),
          /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ListTodo, { className: "h-4 w-4 text-indigo-500" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Tareas del D\xEDa" }),
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [
                plannedTasks.length,
                " pendientes"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: Object.entries(groupedTasks).map(([source, sourceTasks]) => {
              const cfg = SOURCE_CONFIG[source] || { label: source, icon: /* @__PURE__ */ jsx(ListTodo, { className: "h-3.5 w-3.5" }), color: "text-muted-foreground" };
              return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: cfg.color, children: cfg.icon }),
                  /* @__PURE__ */ jsx("span", { children: cfg.label }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-muted-foreground/60", children: [
                    "(",
                    sourceTasks.length,
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: sourceTasks.map((task) => {
                  const priorityColors = { high: "border-l-red-400 bg-red-50/30", medium: "border-l-amber-300 bg-amber-50/20", low: "border-l-gray-200" };
                  const priorityLabel = { high: "Alta", medium: "Media", low: "Baja" };
                  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center gap-2 py-1 px-2 rounded-lg border-l-2 text-xs", priorityColors[task.priority || "medium"]), children: [
                    /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: task.title }),
                    task.priority && task.priority !== "low" && /* @__PURE__ */ jsx("span", { className: cn("text-[9px] font-medium shrink-0", task.priority === "high" ? "text-red-500" : "text-amber-500"), children: priorityLabel[task.priority] })
                  ] }, task.id);
                }) })
              ] }, source);
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: ROUTINES.map((r) => {
          const isActive = routineType === r.type;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setRoutineType(r.type),
              className: cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200", isActive ? "bg-foreground text-background border-foreground shadow-sm" : "bg-white dark:bg-zinc-950 text-foreground/70 border-foreground/15 hover:border-foreground/40 hover:text-foreground"),
              children: [
                /* @__PURE__ */ jsx("span", { className: cn("shrink-0", !isActive && "opacity-60"), children: ROUTINE_ICONS[r.type] }),
                /* @__PURE__ */ jsxs("span", { className: "flex flex-col items-start gap-0.5 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", !isActive && "opacity-70"), children: r.shortLabel }),
                  /* @__PURE__ */ jsxs("span", { className: cn("text-[9px] font-mono tracking-tight", isActive ? "text-background/60" : "text-foreground/40"), children: [
                    r.wakeTime,
                    "\u2014",
                    r.sleepTime
                  ] })
                ] })
              ]
            },
            r.type
          );
        }) }),
        /* @__PURE__ */ jsx(RoutineConfigBar, { wakeTime, onWakeChange: setWakeTime, focusBlock, onFocusChange: setFocusBlock, sleepTime, onSleepChange: setSleepTime, lateWake, onLateWakeChange: setLateWake, musicInstrument, onMusicInstrumentChange: setMusicInstrument, presetName }),
        /* @__PURE__ */ jsx(CurrentBlockCard, { currentBlock, blockProgress: currentProgress, tasksByBlock }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4", children: [
          /* @__PURE__ */ jsx(DailyTimelinePlanner, { blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks, tasksByBlock, onToggleBlock: toggleBlockComplete, isBlockCompleted, onDropTask: assignTaskToBlock, onRemoveTask: removeTaskFromBlock, onUpdateFocus: updateRoutineBlockFocus, events: todayEvents, musicInstrument, languageChoice: planLanguage || void 0 }),
          /* @__PURE__ */ jsx("div", { className: "lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]", children: /* @__PURE__ */ jsx(TaskPoolPanel, { unassignedTasks, onTaskCreated: refreshTasks }) })
        ] }),
        /* @__PURE__ */ jsx(TodayWorkout, {}),
        /* @__PURE__ */ jsx(TaskAccordion, {})
      ] }),
      activeSection === "sosten" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [
            /* @__PURE__ */ jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [
              /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: "20",
                  cy: "20",
                  r: "16",
                  fill: "none",
                  stroke: "currentColor",
                  className: "text-blue-500",
                  strokeWidth: "3",
                  strokeDasharray: `${2 * Math.PI * 16}`,
                  strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[3].pct, 100) / 100)}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [
              SECTIONS[3].pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold", children: "Hoy" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              completedHabitsAll,
              "/",
              totalHabitsAll,
              " h\xE1bitos \xB7 ",
              sostenMinutes,
              " min"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(HealthSection, {}),
        /* @__PURE__ */ jsxs(Card, { className: "border-blue-500/20", children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4 text-blue-500" }),
              "Sost\xE9n"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Lo que te mantiene de pie" })
          ] }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: SOSTEN_GROUPS.map((group) => /* @__PURE__ */ jsx(SystemHabitGroup, { group, completions: data.completions, timeData: data.timeData, countData: data.countData, waterData: data.waterData, onToggle: toggleCompletion, onTimeChange: setTimeValue, onCountChange: setCountValue, onWaterToggle: toggleWater, workoutDuration: data.workoutDuration, workoutIntensity: data.workoutIntensity, onWorkoutDurationChange: (v) => update("workoutDuration", v), onWorkoutIntensityChange: (v) => update("workoutIntensity", v), wakeTime: data.wakeTime, sleepTime: data.sleepTime, onWakeTimeChange: (v) => update("wakeTime", v), onSleepTimeChange: (v) => update("sleepTime", v), mealPhotos: data.mealPhotos, onMealPhotoUpload: setMealPhoto, skipped: data.skipped, onSkipToggle: toggleSkip }, group.id)) })
        ] })
      ] }),
      activeSection === "mejora" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-12 h-12 shrink-0", children: [
            /* @__PURE__ */ jsxs("svg", { className: "w-12 h-12 -rotate-90", viewBox: "0 0 40 40", children: [
              /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "16", fill: "none", stroke: "rgba(0,0,0,0.08)", strokeWidth: "3" }),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: "20",
                  cy: "20",
                  r: "16",
                  fill: "none",
                  stroke: "currentColor",
                  className: "text-purple-500",
                  strokeWidth: "3",
                  strokeDasharray: `${2 * Math.PI * 16}`,
                  strokeDashoffset: `${2 * Math.PI * 16 * (1 - Math.min(SECTIONS[2].pct, 100) / 100)}`
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums", children: [
              SECTIONS[2].pct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold", children: "Hoy" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              completedHabitsAll,
              "/",
              totalHabitsAll,
              " h\xE1bitos \xB7 ",
              mejoraMinutes,
              " min invertidos"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(MejoraProcessPanel, { todayMinutes, children: [
          /* @__PURE__ */ jsx(MySystemsSection, {}),
          /* @__PURE__ */ jsxs(Card, { className: "border-purple-500/20", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
              /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-purple-500" }),
                "Mejora"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Lo que te transforma" })
            ] }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Mejora F\xEDsica" }),
                /* @__PURE__ */ jsx(WorkoutVisual, { duration: data.workoutDuration, intensity: data.workoutIntensity, onDurationChange: (v) => update("workoutDuration", v), onIntensityChange: (v) => update("workoutIntensity", v), completed: !!data.completions["entrenamiento-fisico"], onToggleCompleted: () => toggleCompletion("entrenamiento-fisico"), skipped: !!data.skipped["entrenamiento-fisico"], onSkip: () => toggleSkip("entrenamiento-fisico") })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Mejora Hobbys" }),
                /* @__PURE__ */ jsx(HobbyCards, { todayMinutes: { lectura: data.timeData["lectura"] || 0, musica: data.timeData["musica"] || 0, ajedrez: data.timeData["ajedrez"] || 0 }, countData: { ajedrez: data.countData["ajedrez"] || 0 }, onTimeChange: setTimeValue, onCountChange: setCountValue, skipped: data.skipped, onSkipToggle: toggleSkip })
              ] }),
              /* @__PURE__ */ jsx(ReadingTrackingPanel, { minutes: data.timeData["lectura"] || 0, onMinChange: (v) => setTimeValue("lectura", v) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1", children: "Gaming" }),
                /* @__PURE__ */ jsxs(Card, { className: "p-3 ring-2 ring-purple-500/30", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Gamepad2, { className: "h-4 w-4 text-purple-500" }),
                      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold", children: "Game (Seducci\xF3n)" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }),
                      /* @__PURE__ */ jsx(
                        Input,
                        {
                          type: "number",
                          min: 0,
                          value: data.timeData["game"] || "",
                          onChange: (e) => setTimeValue("game", parseInt(e.target.value) || 0),
                          placeholder: "min",
                          className: "w-16 h-7 text-xs text-center"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => toggleSkip("game"),
                          className: cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                            data.skipped?.["game"] ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"
                          ),
                          children: data.skipped?.["game"] ? "Saltado" : "No hice"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: "Tiempo diario para aprender seducci\xF3n" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(LanguageSkillCards, { completions: data.completions, onToggle: toggleCompletion, italianoTime: data.timeData?.italiano || 0, inglesTime: data.timeData?.ingles || 0, onItalianoTimeChange: (m) => setTimeValue("italiano", m), onInglesTimeChange: (m) => setTimeValue("ingles", m), skipped: data.skipped, onSkipToggle: toggleSkip }) })
            ] })
          ] })
        ] })
      ] }),
      activeSection === "enfoque" && /* @__PURE__ */ jsxs(FocusProcessPanel, { todayMinutes: focusTodayMinutes, children: [
        /* @__PURE__ */ jsx(
          EnfoqueSection,
          {
            blocks: routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks,
            tasksByBlock,
            onRemoveTask: removeTaskFromBlock,
            tasks,
            activeFocusAreas: data.activeFocusAreas,
            onToggleActiveFocusArea: toggleActiveFocusArea,
            skipped: data.skipped,
            onSkipToggle: toggleSkip
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-3", children: /* @__PURE__ */ jsx("h2", { className: "text-xs font-bold uppercase tracking-wide", children: "CALENDARIO MENSUAL" }) }),
          /* @__PURE__ */ jsx(NotionCalendar, {})
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsx(ResultadosDia, { date: selectedDate })
  ] }) });
}
export {
  DailyView as default
};