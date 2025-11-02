import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, TrendingUp, Flame, Calendar, Brain, Heart, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  title: string;
  streak: number;
  completed: boolean;
  category: 'salud' | 'mental' | 'profesional';
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'salud' | 'mental' | 'profesional';
}

const categoryIcons = {
  salud: Heart,
  mental: Brain,
  profesional: Briefcase,
};

const categoryColors = {
  salud: "text-success",
  mental: "text-primary",
  profesional: "text-warning",
};

const ControlRoom = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Cargar datos del localStorage
    const storedHabits = localStorage.getItem('habits');
    const storedTasks = localStorage.getItem('tasks');
    
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    } else {
      // Datos de ejemplo
      setHabits([
        { id: "1", title: "Hacer ejercicio", streak: 7, completed: false, category: 'salud' },
        { id: "2", title: "Meditar 10 minutos", streak: 12, completed: false, category: 'mental' },
        { id: "3", title: "Leer 30 minutos", streak: 5, completed: false, category: 'mental' },
        { id: "4", title: "Revisar emails", streak: 3, completed: true, category: 'profesional' },
      ]);
    }

    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      setTasks([
        { id: "1", title: "Revisar proyecto", completed: false, category: 'profesional' },
        { id: "2", title: "Llamar al dentista", completed: false, category: 'salud' },
        { id: "3", title: "Planificar semana", completed: true, category: 'mental' },
      ]);
    }
  }, []);

  const stats = useMemo(() => {
    const habitsByCat = {
      salud: habits.filter(h => h.category === 'salud'),
      mental: habits.filter(h => h.category === 'mental'),
      profesional: habits.filter(h => h.category === 'profesional'),
    };

    const tasksByCat = {
      salud: tasks.filter(t => t.category === 'salud'),
      mental: tasks.filter(t => t.category === 'mental'),
      profesional: tasks.filter(t => t.category === 'profesional'),
    };

    const calculateProgress = (category: keyof typeof habitsByCat) => {
      const catHabits = habitsByCat[category];
      const catTasks = tasksByCat[category];
      const total = catHabits.length + catTasks.length;
      const completed = catHabits.filter(h => h.completed).length + catTasks.filter(t => t.completed).length;
      return total > 0 ? (completed / total) * 100 : 0;
    };

    const totalProgress = habits.length + tasks.length > 0
      ? ((habits.filter(h => h.completed).length + tasks.filter(t => t.completed).length) / (habits.length + tasks.length)) * 100
      : 0;

    return {
      salud: calculateProgress('salud'),
      mental: calculateProgress('mental'),
      profesional: calculateProgress('profesional'),
      total: totalProgress,
      habitosCompletados: habits.filter(h => h.completed).length,
      totalHabitos: habits.length,
      tareasCompletadas: tasks.filter(t => t.completed).length,
      totalTareas: tasks.length,
      rachaTotal: habits.reduce((sum, h) => sum + h.streak, 0),
    };
  }, [habits, tasks]);

  const CategoryCard = ({ category, progress }: { category: keyof typeof categoryIcons, progress: number }) => {
    const Icon = categoryIcons[category];
    const colorClass = categoryColors[category];

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className={cn("h-5 w-5", colorClass)} />
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progress)}% completado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getVerdict = (score: number) => {
    if (score >= 80) {
      return {
        title: "¡Día Excepcional!",
        message: "Has honrado tu palabra. Cada acción te acerca a la persona que quieres ser.",
        color: "border-success",
      };
    }
    if (score >= 50) {
      return {
        title: "Buen Progreso",
        message: "Has ganado terreno hoy. La consistencia no es perfección, es persistencia.",
        color: "border-primary",
      };
    }
    return {
      title: "Día para Reflexionar",
      message: "Hoy no fue tu mejor día, pero mañana es una nueva oportunidad.",
      color: "border-warning",
    };
  };

  const verdict = getVerdict(stats.total);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Sala de Control
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Un vistazo rápido al estado de todos los sistemas de tu vida
          </p>
        </header>

        {/* Stats generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Progreso Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{Math.round(stats.total)}%</div>
                <Progress value={stats.total} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.habitosCompletados}/{stats.totalHabitos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tareas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.tareasCompletadas}/{stats.totalTareas}
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
              <div className="text-3xl font-bold">{stats.rachaTotal}</div>
            </CardContent>
          </Card>
        </div>

        {/* Áreas de vida */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Áreas de Vida</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CategoryCard category="salud" progress={stats.salud} />
            <CategoryCard category="mental" progress={stats.mental} />
            <CategoryCard category="profesional" progress={stats.profesional} />
          </div>
        </section>

        {/* Veredicto del día */}
        <Card className={cn("border-2", verdict.color)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <TrendingUp className="h-6 w-6" />
              Veredicto del Día
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <h3 className="text-lg font-semibold">{verdict.title}</h3>
            <p className="text-muted-foreground italic">{verdict.message}</p>
          </CardContent>
        </Card>

        {/* Lista rápida de pendientes */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Estado Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Hábitos Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {habits.filter(h => !h.completed).length === 0 ? (
                    <p className="text-sm text-muted-foreground">¡Todos completados! 🎉</p>
                  ) : (
                    habits.filter(h => !h.completed).map(habit => (
                      <div key={habit.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                        <span className="text-sm">{habit.title}</span>
                        <Badge variant="outline">{habit.streak} días</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Tareas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.filter(t => !t.completed).length === 0 ? (
                    <p className="text-sm text-muted-foreground">¡Todas completadas! ✓</p>
                  ) : (
                    tasks.filter(t => !t.completed).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                        <span className="text-sm">{task.title}</span>
                        <Badge variant="outline" className={cn(categoryColors[task.category])}>
                          {task.category}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ControlRoom;
