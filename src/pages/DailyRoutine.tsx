import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, Circle, Sun, Moon, Coffee, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutineTask {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  period: 'mañana' | 'tarde' | 'noche';
}

const DailyRoutine = () => {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);

  useEffect(() => {
    const storedTasks = localStorage.getItem('routineTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      const initialTasks: RoutineTask[] = [
        { id: "1", title: "Despertarse", time: "06:00", completed: false, period: 'mañana' },
        { id: "2", title: "Ducha fría", time: "06:15", completed: false, period: 'mañana' },
        { id: "3", title: "Desayuno saludable", time: "06:30", completed: false, period: 'mañana' },
        { id: "4", title: "Planificar el día", time: "07:00", completed: false, period: 'mañana' },
        { id: "5", title: "Sesión de trabajo enfocado", time: "09:00", completed: false, period: 'mañana' },
        { id: "6", title: "Almuerzo", time: "13:00", completed: false, period: 'tarde' },
        { id: "7", title: "Ejercicio", time: "17:00", completed: false, period: 'tarde' },
        { id: "8", title: "Cena", time: "19:00", completed: false, period: 'noche' },
        { id: "9", title: "Lectura", time: "20:30", completed: false, period: 'noche' },
        { id: "10", title: "Prepararse para dormir", time: "22:00", completed: false, period: 'noche' },
      ];
      setTasks(initialTasks);
      localStorage.setItem('routineTasks', JSON.stringify(initialTasks));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('routineTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const periodIcons = {
    mañana: Sun,
    tarde: Coffee,
    noche: Moon,
  };

  const periodColors = {
    mañana: "text-warning",
    tarde: "text-primary",
    noche: "text-purple-500",
  };

  const tasksByPeriod = {
    mañana: tasks.filter(t => t.period === 'mañana'),
    tarde: tasks.filter(t => t.period === 'tarde'),
    noche: tasks.filter(t => t.period === 'noche'),
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const PeriodSection = ({ 
    period, 
    periodTasks 
  }: { 
    period: 'mañana' | 'tarde' | 'noche', 
    periodTasks: RoutineTask[] 
  }) => {
    const Icon = periodIcons[period];
    const colorClass = periodColors[period];
    const completed = periodTasks.filter(t => t.completed).length;
    const total = periodTasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-xl font-semibold flex items-center gap-2", colorClass)}>
            <Icon className="h-5 w-5" />
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </h3>
          <Badge variant="outline">
            {completed}/{total}
          </Badge>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="space-y-2">
          {periodTasks.map(task => (
            <Card 
              key={task.id} 
              className={cn(
                "transition-all cursor-pointer hover:shadow-md",
                task.completed && "bg-muted/50"
              )}
              onClick={() => toggleTask(task.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox 
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <div className={cn(
                    "font-medium",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {task.time}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const getCurrentPeriod = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return 'mañana';
    if (hour >= 13 && hour < 19) return 'tarde';
    return 'noche';
  };

  const currentPeriod = getCurrentPeriod();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Rutina Diaria
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            La excelencia es un hábito, no un acto
          </p>
        </header>

        {/* Progreso general */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progreso del Día</span>
              <Badge variant="outline" className="text-lg">
                {completedTasks}/{tasks.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Estás en el período: <strong>{currentPeriod}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground text-right">
                {Math.round(progressPercentage)}% completado
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Rutinas por período */}
        <div className="space-y-8">
          <PeriodSection period="mañana" periodTasks={tasksByPeriod.mañana} />
          <Separator />
          <PeriodSection period="tarde" periodTasks={tasksByPeriod.tarde} />
          <Separator />
          <PeriodSection period="noche" periodTasks={tasksByPeriod.noche} />
        </div>

        {/* Mensaje motivacional */}
        {progressPercentage === 100 && (
          <Card className="border-2 border-success">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¡Día Completado!</h3>
              <p className="text-muted-foreground">
                Has cumplido toda tu rutina. Eres la versión más disciplinada de ti mismo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyRoutine;
