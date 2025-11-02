import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitCard } from "@/components/HabitCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, Flame, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  title: string;
  streak: number;
  completed: boolean;
  category: 'salud' | 'mental' | 'profesional';
}

const Habits = () => {
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    } else {
      const initialHabits: Habit[] = [
        { id: "1", title: "Hacer ejercicio", streak: 7, completed: false, category: 'salud' },
        { id: "2", title: "Meditar 10 minutos", streak: 12, completed: false, category: 'mental' },
        { id: "3", title: "Leer 30 minutos", streak: 5, completed: false, category: 'mental' },
        { id: "4", title: "Revisar objetivos", streak: 3, completed: false, category: 'profesional' },
      ];
      setHabits(initialHabits);
      localStorage.setItem('habits', JSON.stringify(initialHabits));
    }
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const newCompleted = !habit.completed;
        if (newCompleted) {
          toast({
            title: "¡Genial! 🎉",
            description: `Racha de ${habit.streak + 1} días`,
          });
          return { ...habit, completed: newCompleted, streak: habit.streak + 1 };
        }
        return { ...habit, completed: newCompleted };
      }
      return habit;
    }));
  };

  const addHabit = (title: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title,
      streak: 0,
      completed: false,
      category: 'mental',
    };
    setHabits([...habits, newHabit]);
    toast({
      title: "Hábito añadido",
      description: "¡Empieza tu racha hoy!",
    });
  };

  const habitsByCategory = {
    salud: habits.filter(h => h.category === 'salud'),
    mental: habits.filter(h => h.category === 'mental'),
    profesional: habits.filter(h => h.category === 'profesional'),
  };

  const completedHabits = habits.filter(h => h.completed).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const progressPercentage = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Seguimiento de Hábitos
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Tu centro de mando para la disciplina diaria
          </p>
        </header>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progreso de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {completedHabits}/{habits.length}
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Racha Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStreak} días</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tasa de Éxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Hábitos por categoría */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Todos los Hábitos</h2>
            <AddItemDialog type="habit" onAdd={addHabit} />
          </div>

          {/* Salud */}
          {habitsByCategory.salud.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-success flex items-center gap-2">
                💪 Salud
              </h3>
              <div className="grid gap-3">
                {habitsByCategory.salud.map((habit) => (
                  <HabitCard key={habit.id} {...habit} onToggle={toggleHabit} />
                ))}
              </div>
            </div>
          )}

          {/* Mental */}
          {habitsByCategory.mental.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                🧠 Mental
              </h3>
              <div className="grid gap-3">
                {habitsByCategory.mental.map((habit) => (
                  <HabitCard key={habit.id} {...habit} onToggle={toggleHabit} />
                ))}
              </div>
            </div>
          )}

          {/* Profesional */}
          {habitsByCategory.profesional.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-warning flex items-center gap-2">
                💼 Profesional
              </h3>
              <div className="grid gap-3">
                {habitsByCategory.profesional.map((habit) => (
                  <HabitCard key={habit.id} {...habit} onToggle={toggleHabit} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Habits;
