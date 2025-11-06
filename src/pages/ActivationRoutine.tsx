import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Heart, Dumbbell, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskGroup {
  id: string;
  title: string;
  icon: any;
  color: string;
  tasks: string[];
}

const ActivationRoutine = () => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const taskGroups: TaskGroup[] = [
    {
      id: "inicio",
      title: "Inicio Energético",
      icon: Zap,
      color: "text-yellow-500",
      tasks: [
        "Poner audífonos y podcast o música",
        "Encender Entorno (Luces, TV, laptop, equipo)",
        "Abrir Notion en tablet y Notion Calendar",
        "Poner reloj en TV o móvil",
        "Tender Cama",
        "Recoger Cuarto y poner ropa de Gym sobre la cama"
      ]
    },
    {
      id: "salud",
      title: "Salud y Nutrición",
      icon: Heart,
      color: "text-red-500",
      tasks: [
        "Orinar",
        "Llenar pomo de agua y tomar un vaso",
        "Tomar vitaminas y cucharada de miel",
        "Sacar pozuelos y pomos"
      ]
    },
    {
      id: "energia",
      title: "Energizadores",
      icon: Dumbbell,
      color: "text-orange-500",
      tasks: [
        "Ejercicio",
        "Poner a hacer café",
        "Ducha fría rápida"
      ]
    },
    {
      id: "planificacion",
      title: "Planificación y Foco",
      icon: Target,
      color: "text-blue-500",
      tasks: [
        "Afirmaciones positivas",
        "Práctica de gratitud y Journaling",
        "Leer autocrítica del día anterior e implantar mejoras",
        "Leer metas, objetivos y visualización",
        "Ver mi porqué y mi propósito (motivación)",
        "Planificar el día si no está hecho",
        "Vestirme para el Gym",
        "Preparar y tomar pre-entreno",
        "Preparar merienda"
      ]
    }
  ];

  useEffect(() => {
    const stored = localStorage.getItem('activationRoutine');
    if (stored) {
      setCompletedTasks(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('activationRoutine', JSON.stringify(Array.from(completedTasks)));
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
          Rutina de Activación
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          5:00 AM - 5:30 AM | Empieza tu día con energía y enfoque
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
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-6 w-6", group.color)} />
                    <CardTitle>{group.title}</CardTitle>
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

export default ActivationRoutine;
