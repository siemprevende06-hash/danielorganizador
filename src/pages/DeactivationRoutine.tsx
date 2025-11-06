import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, BookOpen, Sparkles, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskGroup {
  id: string;
  title: string;
  timeRange: string;
  icon: any;
  color: string;
  tasks: string[];
}

const DeactivationRoutine = () => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const taskGroups: TaskGroup[] = [
    {
      id: "activador",
      title: "Activador",
      timeRange: "8:30 PM",
      icon: Bell,
      color: "text-orange-500",
      tasks: [
        "Activar Alarma y poner música con audífonos"
      ]
    },
    {
      id: "organizacion",
      title: "Organización y Planificación",
      timeRange: "7:30 PM - 7:45 PM",
      icon: Calendar,
      color: "text-blue-500",
      tasks: [
        "Organizar cuarto, ropa del día siguiente, ropa de Gym, alimentación, pomos de agua",
        "Escoger modo de progreso, mirar tareas de la semana, poner tareas del día",
        "Organizar Google Calendar, control de hábitos, comprometerse en 'I Am Sober', poner a calentar agua"
      ]
    },
    {
      id: "rendicion",
      title: "Rendición de Cuentas",
      timeRange: "7:45 PM - 8:00 PM",
      icon: BookOpen,
      color: "text-green-500",
      tasks: [
        "Journaling (autocrítica, mejoras, gratitud)",
        "Revisión del día y calificación RC",
        "Visualización 21 años, control de finanzas",
        "Ver estado de proyectos (avance diario y pasos)"
      ]
    },
    {
      id: "cuidados",
      title: "Cuidados Personales",
      timeRange: "9:20 PM - 9:40 PM",
      icon: Sparkles,
      color: "text-purple-500",
      tasks: [
        "Poner música instrumental",
        "Lavar cara y boca, exfoliar (L, M, V)",
        "Echar crema hidratante, bañarse con agua caliente, ponerse pijama"
      ]
    },
    {
      id: "ritual",
      title: "Ritual de Autocuidado Nocturno",
      timeRange: "9:40 PM - 10:00 PM",
      icon: Moon,
      color: "text-indigo-500",
      tasks: [
        "Encender vela, Led en rojo, revisar metas, visualización y afirmaciones",
        "Apagar equipos, oscuridad total, música relajante",
        "Preparar cama, poner móvil a cargar, hidratación, estiramientos y meditación",
        "Dormir 9:00 PM"
      ]
    }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('deactivationRoutine');
    if (stored) {
      setCompletedTasks(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('deactivationRoutine', JSON.stringify(Array.from(completedTasks)));
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const totalTasks = taskGroups.reduce((sum, group) => sum + group.tasks.length, 0);
  const completedCount = completedTasks.size;
  const progress = (completedCount / totalTasks) * 100;

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      <header>
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          Rutina de Desactivación
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          8:30 PM - 10:00 PM | Prepárate para un sueño reparador
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso</span>
            <Badge variant="outline" className="text-lg">
              {completedCount}/{totalTasks}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground text-right mt-2">
            {Math.round(progress)}% completado
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {taskGroups.map((group) => {
          const Icon = group.icon;
          const groupCompleted = group.tasks.filter(task => 
            completedTasks.has(`${group.id}-${group.tasks.indexOf(task)}`)
          ).length;
          const groupProgress = (groupCompleted / group.tasks.length) * 100;

          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-6 w-6", group.color)} />
                      <CardTitle>{group.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{group.timeRange}</p>
                  </div>
                  <Badge variant="outline">
                    {groupCompleted}/{group.tasks.length}
                  </Badge>
                </div>
                <Progress value={groupProgress} className="h-2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.tasks.map((task, index) => {
                    const taskId = `${group.id}-${index}`;
                    const isCompleted = completedTasks.has(taskId);
                    
                    return (
                      <div
                        key={taskId}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                          "hover:bg-muted/50",
                          isCompleted && "bg-muted/30"
                        )}
                        onClick={() => toggleTask(taskId)}
                      >
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleTask(taskId)}
                        />
                        <span className={cn(
                          "text-sm",
                          isCompleted && "line-through text-muted-foreground"
                        )}>
                          {task}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DeactivationRoutine;
