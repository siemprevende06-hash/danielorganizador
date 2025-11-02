import { useState } from "react";
import { Link } from "react-router-dom";
import { HabitCard } from "@/components/HabitCard";
import { TaskCard } from "@/components/TaskCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, TrendingUp, Calendar, LayoutDashboard, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  title: string;
  streak: number;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", title: "Hacer ejercicio", streak: 7, completed: false },
    { id: "2", title: "Meditar 10 minutos", streak: 12, completed: false },
    { id: "3", title: "Leer 30 minutos", streak: 5, completed: false },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Revisar emails", completed: false },
    { id: "2", title: "Llamar al dentista", completed: false },
    { id: "3", title: "Preparar presentación", completed: false },
  ]);

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

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id && !task.completed) {
        toast({
          title: "¡Tarea completada! ✓",
          description: "Sigue así",
        });
      }
      return task.id === id ? { ...task, completed: !task.completed } : task;
    }));
  };

  const addHabit = (title: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title,
      streak: 0,
      completed: false,
    };
    setHabits([...habits, newHabit]);
    toast({
      title: "Hábito añadido",
      description: "¡Empieza tu racha hoy!",
    });
  };

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    toast({
      title: "Tarea añadida",
      description: "¡A por ella!",
    });
  };

  const completedHabits = habits.filter(h => h.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalStreak = habits.reduce((sum, habit) => sum + habit.streak, 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-primary bg-clip-text text-transparent">
            Mis Hábitos y Tareas
          </h1>
          <p className="text-lg text-muted-foreground">
            Construye una mejor versión de ti mismo, día a día
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link to="/control-room">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Sala de Control
              </Button>
            </Link>
            <Link to="/habits">
              <Button variant="outline" className="gap-2">
                <Target className="h-4 w-4" />
                Hábitos
              </Button>
            </Link>
            <Link to="/routine">
              <Button variant="outline" className="gap-2">
                <Repeat className="h-4 w-4" />
                Rutina Diaria
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard 
            title="Hábitos Hoy" 
            value={`${completedHabits}/${habits.length}`} 
            icon={Target}
            iconColor="text-primary"
          />
          <StatsCard 
            title="Tareas Hoy" 
            value={`${completedTasks}/${tasks.length}`} 
            icon={CheckCircle2}
            iconColor="text-success"
          />
          <StatsCard 
            title="Racha Total" 
            value={totalStreak} 
            icon={TrendingUp}
            iconColor="text-warning"
          />
          <StatsCard 
            title="Fecha" 
            value={new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} 
            icon={Calendar}
            iconColor="text-primary"
          />
        </div>

        {/* Habits Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Hábitos Diarios
            </h2>
            <AddItemDialog type="habit" onAdd={addHabit} />
          </div>
          <div className="grid gap-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                {...habit}
                onToggle={toggleHabit}
              />
            ))}
          </div>
        </section>

        {/* Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Tareas del Día
            </h2>
            <AddItemDialog type="task" onAdd={addTask} />
          </div>
          <div className="grid gap-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onToggle={toggleTask}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
