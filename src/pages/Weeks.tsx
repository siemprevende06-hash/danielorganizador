import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useRoutineBlocks } from "@/hooks/useRoutineBlocks";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  GraduationCap,
  Rocket,
  FolderKanban,
  Dumbbell,
  Languages,
  Piano,
  Guitar,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

interface TwelveWeekGoal {
  id: string;
  quarter: number;
  title: string;
  category: string;
  target_value: string | null;
  progress_percentage: number;
}

interface WeeklyPlan {
  id: string;
  week_number: number;
  quarter: number;
  goal_id: string | null;
  daily_tasks: unknown;
  completion_status: unknown;
  notes: string | null;
}

const CATEGORIES = [
  { id: "universidad", name: "Universidad", icon: GraduationCap, color: "text-blue-500" },
  { id: "emprendimiento", name: "Emprendimiento", icon: Rocket, color: "text-purple-500" },
  { id: "proyectos", name: "Proyectos", icon: FolderKanban, color: "text-green-500" },
  { id: "gym", name: "Gym", icon: Dumbbell, color: "text-red-500" },
  { id: "idiomas", name: "Idiomas", icon: Languages, color: "text-yellow-500" },
  { id: "piano", name: "Piano", icon: Piano, color: "text-pink-500" },
  { id: "guitarra", name: "Guitarra", icon: Guitar, color: "text-orange-500" },
  { id: "lectura", name: "Lectura", icon: BookOpen, color: "text-teal-500" },
];

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ROUTINE_GOAL_MAP: Record<string, string[]> = {
  "idiomas": ["Idiomas"],
  "gym": ["Gym"],
  "emprendimiento": ["Focus Emprendimiento", "Deep Work"],
  "universidad": ["Focus Universidad", "Deep Work"],
  "lectura": ["Lectura"],
  "piano": ["Guitarra & Piano"],
  "guitarra": ["Guitarra & Piano"],
};

export default function Weeks() {
  const [goals, setGoals] = useState<TwelveWeekGoal[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { blocks } = useRoutineBlocks();

  useEffect(() => {
    fetchData();
  }, [selectedQuarter]);

  const fetchData = async () => {
    try {
      const [goalsRes, plansRes] = await Promise.all([
        supabase
          .from("twelve_week_goals")
          .select("id, quarter, title, category, target_value, progress_percentage")
          .eq("year", 2026)
          .eq("quarter", selectedQuarter),
        supabase
          .from("weekly_plans")
          .select("*")
          .eq("year", 2026)
          .eq("quarter", selectedQuarter),
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (plansRes.error) throw plansRes.error;

      setGoals(goalsRes.data || []);
      setWeeklyPlans(plansRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const quarterStart = new Date(2026, (selectedQuarter - 1) * 3, 1);
    const weekStart = addDays(startOfWeek(quarterStart, { weekStartsOn: 1 }), (selectedWeek - 1) * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId);
  };

  const getBlocksForGoal = (category: string) => {
    const blockNames = ROUTINE_GOAL_MAP[category] || [];
    return blocks.filter(b => blockNames.some(name => b.title.includes(name)));
  };

  const getRecommendedDailyPlan = () => {
    const plan: { block: string; time: string; goal: string; category: string }[] = [];
    
    blocks.forEach(block => {
      let matchedCategory = "";
      Object.entries(ROUTINE_GOAL_MAP).forEach(([cat, blockNames]) => {
        if (blockNames.some(name => block.title.includes(name))) {
          matchedCategory = cat;
        }
      });
      
      if (matchedCategory) {
        const goal = goals.find(g => g.category === matchedCategory);
        if (goal) {
          plan.push({
            block: block.title,
            time: `${block.startTime} - ${block.endTime}`,
            goal: goal.title,
            category: matchedCategory,
          });
        }
      }
    });

    return plan;
  };

  const getTotalBlockMinutes = () => {
    let total = 0;
    blocks.forEach(block => {
      const [startH, startM] = block.startTime.split(":").map(Number);
      const [endH, endM] = block.endTime.split(":").map(Number);
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      total += endMinutes - startMinutes;
    });
    return total;
  };

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const weekDates = getWeekDates();
  const recommendedPlan = getRecommendedDailyPlan();

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 space-y-6" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Semana {selectedWeek} de 12
          </h1>
          <p className="text-muted-foreground mt-1">
            Q{selectedQuarter} 2026 • {format(weekDates[0], "d MMM", { locale: es })} - {format(weekDates[6], "d MMM", { locale: es })}
          </p>
        </div>
        <Link to="/12-week-year">
          <Button variant="outline" className="gap-2">
            <Target className="h-4 w-4" />
            Ver Metas del Año
          </Button>
        </Link>
      </header>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
          disabled={selectedWeek === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        
        <div className="flex gap-1 overflow-x-auto px-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
            <Button
              key={week}
              variant={selectedWeek === week ? "default" : "ghost"}
              size="sm"
              className="w-8 h-8 p-0 flex-shrink-0"
              onClick={() => setSelectedWeek(week)}
            >
              {week}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedWeek(Math.min(12, selectedWeek + 1))}
          disabled={selectedWeek === 12}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quarter Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((q) => (
          <Button
            key={q}
            variant={selectedQuarter === q ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedQuarter(q);
              setSelectedWeek(1);
            }}
          >
            Q{q}
          </Button>
        ))}
      </div>

      {/* 7-Day View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista de 7 Días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-muted-foreground">{DAYS[idx]}</div>
                <div className={`text-sm font-medium rounded-full w-8 h-8 flex items-center justify-center mx-auto ${
                  format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}>
                  {format(date, "d")}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => (
              <div key={idx} className="min-h-[100px] border rounded-lg p-2 text-xs space-y-1">
                {blocks.slice(0, 3).map((block, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-1 text-muted-foreground">
                    <Circle className="h-2 w-2" />
                    <span className="truncate">{block.title}</span>
                  </div>
                ))}
                {blocks.length > 3 && (
                  <div className="text-muted-foreground">+{blocks.length - 3} más</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Progreso de Metas Q{selectedQuarter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay metas para este trimestre. <Link to="/12-week-year" className="text-primary underline">Configúralas aquí</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const catInfo = getCategoryInfo(goal.category);
                const Icon = catInfo?.icon || Target;
                return (
                  <div key={goal.id} className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${catInfo?.color || "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{goal.title}</span>
                        <span className="text-xs text-muted-foreground">{goal.progress_percentage}%</span>
                      </div>
                      <Progress value={goal.progress_percentage} className="h-1.5 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Daily Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Plan Diario Recomendado
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Basado en tu rutina • {formatMinutes(getTotalBlockMinutes())} de trabajo enfocado
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {recommendedPlan.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Configura tus metas para ver el plan recomendado
                </p>
              ) : (
                recommendedPlan.map((item, idx) => {
                  const catInfo = getCategoryInfo(item.category);
                  const Icon = catInfo?.icon || Target;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Icon className={`h-5 w-5 flex-shrink-0 ${catInfo?.color || "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.block}</div>
                        <div className="text-xs text-muted-foreground">{item.goal}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.time}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Weekly Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Checklist Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {goals.slice(0, 5).map((goal) => {
              const catInfo = getCategoryInfo(goal.category);
              const Icon = catInfo?.icon || Target;
              return (
                <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox id={goal.id} />
                  <Icon className={`h-4 w-4 ${catInfo?.color || "text-muted-foreground"}`} />
                  <label htmlFor={goal.id} className="flex-1 text-sm cursor-pointer">
                    Avanzar en: {goal.title}
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
