import { useHabitHistory } from "@/hooks/useHabitHistory";
import { HabitTrackerMain } from "@/components/habits/HabitTrackerMain";
import HabitAreasSummary from "@/components/dashboard/HabitAreasSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Moon, Zap, Droplet, Target, Shirt, GraduationCap, Code, Briefcase, Book, Music, Gamepad2, Globe, Crown } from "lucide-react";

const STRUCTURAL_HABITS = [
  { id: "habit-sueño", title: "Horario regular de sueño", icon: Moon, area: "sueño" },
  { id: "habit-rutina-activacion", title: "Rutina de activación", icon: Zap, area: "rutina-activacion" },
  { id: "habit-entrenamiento", title: "Gym", icon: Dumbbell, area: "entrenamiento" },
  { id: "habit-desayuno", title: "Alistamiento y desayuno", icon: Shirt, area: "cuidado-personal" },
  { id: "habit-skincare-am", title: "Skin care (mañana)", icon: Droplet, area: "skincare" },
  { id: "habit-skincare-pm", title: "Skin care (noche)", icon: Droplet, area: "skincare" },
  { id: "habit-rutina-desactivacion", title: "Rutina de desactivación", icon: Moon, area: "rutina-desactivacion" },
  { id: "habit-alimentacion", title: "Alimentación y agua", icon: Target, area: "cuidado-personal" },
  { id: "habit-finanzas", title: "Control financiero diario", icon: Target, area: "finanzas" },
];

const FOCUS_HABITS = [
  { id: "habit-foco", title: "Foco", icon: Target, area: "focus" },
  { id: "habit-universidad", title: "Universidad", icon: GraduationCap, area: "universidad" },
  { id: "habit-emprendimiento", title: "Emprendimiento", icon: Briefcase, area: "emprendimiento" },
  { id: "habit-proyectos", title: "Proyectos y tareas", icon: Code, area: "proyectos-personales" },
];

const HOBBY_HABITS = [
  { id: "habit-lectura", title: "Lectura", icon: Book, area: "lectura" },
  { id: "habit-ajedrez", title: "Ajedrez", icon: Crown, area: "ajedrez" },
  { id: "habit-piano", title: "Piano", icon: Music, area: "musica" },
  { id: "habit-guitarra", title: "Guitarra", icon: Music, area: "musica" },
  { id: "habit-ingles", title: "Inglés", icon: Globe, area: "idiomas" },
  { id: "habit-italiano", title: "Italiano", icon: Globe, area: "idiomas" },
];

const HabitCategory = ({ title, habits, habitHistory }: { title: string; habits: typeof STRUCTURAL_HABITS; habitHistory: any }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getCompletedToday = (habitId: string) => {
    const entry = habitHistory.find((h: any) => h.habit_id === habitId);
    if (!entry?.completed_dates) return false;
    const dates = Array.isArray(entry.completed_dates) ? entry.completed_dates : [];
    return dates.includes(today);
  };

  const completedCount = habits.filter(h => getCompletedToday(h.id)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          {title}
          <Badge variant={completedCount === habits.length ? "default" : "secondary"}>
            {completedCount}/{habits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {habits.map(habit => {
            const completed = getCompletedToday(habit.id);
            const Icon = habit.icon;
            return (
              <div key={habit.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${completed ? 'bg-primary/10' : 'bg-muted/30'}`}>
                <Icon className={`w-4 h-4 ${completed ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm flex-1 ${completed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {habit.title}
                </span>
                {completed && <Badge variant="default" className="text-xs">✓</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const Habits = () => {
  const { habitHistory, setHabitHistory, isLoading } = useHabitHistory();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold">Hábitos Estructurales</h1>
          <p className="text-muted-foreground">Cargando...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">Hábitos Estructurales</h1>
        <p className="text-muted-foreground">El centro de control para tu disciplina diaria</p>
      </header>

      <HabitAreasSummary habitHistory={habitHistory} />

      <Tabs defaultValue="categories">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="categories">Por Categorías</TabsTrigger>
          <TabsTrigger value="tracker">Tracker Detallado</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <HabitCategory title="🏗️ Hábitos Estructurales (Base)" habits={STRUCTURAL_HABITS} habitHistory={habitHistory} />
          <HabitCategory title="🎯 Áreas de Enfoque" habits={FOCUS_HABITS} habitHistory={habitHistory} />
          <HabitCategory title="🎨 Hobbies" habits={HOBBY_HABITS} habitHistory={habitHistory} />
        </TabsContent>

        <TabsContent value="tracker" className="mt-4">
          <HabitTrackerMain habitHistory={habitHistory} setHabitHistory={setHabitHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Habits;