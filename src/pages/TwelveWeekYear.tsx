import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  GraduationCap, 
  Rocket, 
  FolderKanban, 
  Dumbbell, 
  Languages, 
  Piano, 
  Guitar, 
  BookOpen,
  Plus,
  Target,
  Calendar,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface TwelveWeekGoal {
  id: string;
  quarter: number;
  year: number;
  title: string;
  description: string | null;
  category: string;
  target_value: string | null;
  current_value: string | null;
  progress_percentage: number;
  weekly_actions: unknown;
  connected_blocks: string[] | null;
  status: string;
}

const CATEGORIES = [
  { id: "universidad", name: "Universidad", icon: GraduationCap, color: "bg-blue-500" },
  { id: "emprendimiento", name: "Emprendimiento", icon: Rocket, color: "bg-purple-500" },
  { id: "proyectos", name: "Proyectos Personales", icon: FolderKanban, color: "bg-green-500" },
  { id: "gym", name: "Gym", icon: Dumbbell, color: "bg-red-500" },
  { id: "idiomas", name: "Idiomas", icon: Languages, color: "bg-yellow-500" },
  { id: "piano", name: "Piano", icon: Piano, color: "bg-pink-500" },
  { id: "guitarra", name: "Guitarra", icon: Guitar, color: "bg-orange-500" },
  { id: "lectura", name: "Lectura", icon: BookOpen, color: "bg-teal-500" },
];

const QUARTERS = [
  { id: 1, name: "Q1", dates: "Enero - Marzo", weeks: "Semanas 1-12" },
  { id: 2, name: "Q2", dates: "Abril - Junio", weeks: "Semanas 1-12" },
  { id: 3, name: "Q3", dates: "Julio - Septiembre", weeks: "Semanas 1-12" },
  { id: 4, name: "Q4", dates: "Octubre - Diciembre", weeks: "Semanas 1-12" },
];

const DEFAULT_GOALS = [
  { category: "universidad", title: "Aprobar exámenes con nota 4+", target_value: "Nota 4", description: "Aprobar todos los exámenes de enero con calificación mínima de 4" },
  { category: "emprendimiento", title: "Lanzar SiempreVende", target_value: "App pública", description: "Sacar la app SiempreVende al público y empezar a generar ingresos" },
  { category: "proyectos", title: "Arreglar cuarto", target_value: "Completado", description: "Organizar y arreglar mi cuarto completamente" },
  { category: "proyectos", title: "Sacar licencia de moto", target_value: "Licencia obtenida", description: "Obtener la licencia de conducir moto" },
  { category: "proyectos", title: "Sacar pasaporte", target_value: "Pasaporte obtenido", description: "Obtener el pasaporte" },
  { category: "gym", title: "Subir 8kg de músculo", target_value: "8kg", description: "Ganar 8 kilogramos de masa muscular" },
  { category: "idiomas", title: "Mejorar inglés e italiano", target_value: "Nivel avanzado", description: "Mejorar significativamente mi nivel de inglés e italiano" },
  { category: "piano", title: "Aprender canciones Gibraltar Alcocer", target_value: "Idea 10, 9, 22", description: "Aprender Idea 10, Idea 9, Idea 22 de Gibraltar Alcocer" },
  { category: "guitarra", title: "Aprender canciones", target_value: "3 canciones", description: "Aprender Dandelions, Bleed, You Belong with Me" },
  { category: "lectura", title: "La Universidad del Éxito", target_value: "Libro completo", description: "Leer el libro La Universidad del Éxito" },
];

export default function TwelveWeekYear() {
  const [goals, setGoals] = useState<TwelveWeekGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
    target_value: "",
    quarter: 1,
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("twelve_week_goals")
        .select("*")
        .eq("year", 2026)
        .order("quarter", { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Error al cargar metas");
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultGoals = async () => {
    try {
      const goalsToInsert = DEFAULT_GOALS.map(goal => ({
        ...goal,
        quarter: 1,
        year: 2026,
        progress_percentage: 0,
        weekly_actions: [],
        connected_blocks: [],
        status: "active",
      }));

      const { error } = await supabase
        .from("twelve_week_goals")
        .insert(goalsToInsert);

      if (error) throw error;
      toast.success("Metas inicializadas correctamente");
      fetchGoals();
    } catch (error) {
      console.error("Error initializing goals:", error);
      toast.error("Error al inicializar metas");
    }
  };

  const addGoal = async () => {
    if (!newGoal.title || !newGoal.category) {
      toast.error("Completa los campos requeridos");
      return;
    }

    try {
      const { error } = await supabase.from("twelve_week_goals").insert({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        target_value: newGoal.target_value,
        quarter: newGoal.quarter,
        year: 2026,
        progress_percentage: 0,
        weekly_actions: [],
        connected_blocks: [],
        status: "active",
      });

      if (error) throw error;
      toast.success("Meta agregada");
      setIsAddDialogOpen(false);
      setNewGoal({ title: "", description: "", category: "", target_value: "", quarter: 1 });
      fetchGoals();
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Error al agregar meta");
    }
  };

  const updateProgress = async (goalId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from("twelve_week_goals")
        .update({ progress_percentage: progress })
        .eq("id", goalId);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const getQuarterGoals = (quarter: number) => {
    return goals.filter(g => g.quarter === quarter);
  };

  const getMainGoals = (quarterGoals: TwelveWeekGoal[]) => {
    return quarterGoals.filter(g => 
      ["universidad", "emprendimiento", "proyectos", "gym", "idiomas"].includes(g.category)
    );
  };

  const getAdditionalGoals = (quarterGoals: TwelveWeekGoal[]) => {
    return quarterGoals.filter(g => 
      ["piano", "guitarra", "lectura"].includes(g.category)
    );
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(2026, 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return Math.min(weekNumber, 52);
  };

  const getWeekInQuarter = () => {
    const week = getCurrentWeek();
    const quarterWeek = ((week - 1) % 12) + 1;
    return quarterWeek;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 space-y-6" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Año de 12 Semanas - 2026
          </h1>
          <p className="text-muted-foreground mt-1">
            Semana {getWeekInQuarter()} de 12 en Q{selectedQuarter} • {52 - getCurrentWeek()} semanas restantes del año
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/weeks">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Ver Semanas
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Título de la meta"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
                <Textarea
                  placeholder="Descripción"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
                <Select value={newGoal.category} onValueChange={(v) => setNewGoal({ ...newGoal, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Meta objetivo (ej: 8kg, Nota 4)"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                />
                <Select value={String(newGoal.quarter)} onValueChange={(v) => setNewGoal({ ...newGoal, quarter: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q.id} value={String(q.id)}>
                        {q.name} - {q.dates}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addGoal} className="w-full">Agregar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {goals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay metas configuradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Inicializa tus metas principales del 2026 para comenzar
            </p>
            <Button onClick={initializeDefaultGoals}>
              Inicializar Metas 2026
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quarter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {QUARTERS.map((quarter) => (
          <Button
            key={quarter.id}
            variant={selectedQuarter === quarter.id ? "default" : "outline"}
            onClick={() => setSelectedQuarter(quarter.id)}
            className="flex-shrink-0"
          >
            <span className="font-bold mr-2">{quarter.name}</span>
            <span className="text-xs opacity-80">{quarter.dates}</span>
          </Button>
        ))}
      </div>

      {/* Quarter Overview */}
      <div className="grid gap-6">
        {/* Main Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              5 Metas Principales - Q{selectedQuarter}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getMainGoals(getQuarterGoals(selectedQuarter)).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay metas principales para este trimestre
              </p>
            ) : (
              getMainGoals(getQuarterGoals(selectedQuarter)).map((goal) => {
                const catInfo = getCategoryInfo(goal.category);
                const Icon = catInfo.icon;
                return (
                  <div key={goal.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${catInfo.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium truncate">{goal.title}</h4>
                          {goal.target_value && (
                            <Badge variant="secondary" className="flex-shrink-0">
                              {goal.target_value}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <Progress value={goal.progress_percentage} className="flex-1" />
                          <span className="text-sm font-medium w-12 text-right">
                            {goal.progress_percentage}%
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {[0, 25, 50, 75, 100].map((val) => (
                            <Button
                              key={val}
                              variant={goal.progress_percentage === val ? "default" : "outline"}
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => updateProgress(goal.id, val)}
                            >
                              {val}%
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Additional Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              Metas Adicionales - Q{selectedQuarter}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getAdditionalGoals(getQuarterGoals(selectedQuarter)).length === 0 ? (
                <p className="text-muted-foreground text-center py-4 col-span-3">
                  No hay metas adicionales para este trimestre
                </p>
              ) : (
                getAdditionalGoals(getQuarterGoals(selectedQuarter)).map((goal) => {
                  const catInfo = getCategoryInfo(goal.category);
                  const Icon = catInfo.icon;
                  return (
                    <div key={goal.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded ${catInfo.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">{catInfo.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{goal.title}</p>
                      <Progress value={goal.progress_percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground">{goal.progress_percentage}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
