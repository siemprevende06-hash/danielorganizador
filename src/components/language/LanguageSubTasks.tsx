import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LanguageSubTask, BlockType } from '@/hooks/useLanguageLearning';

interface LanguageSubTasksProps {
  subTasks: LanguageSubTask[];
  onToggleTask: (taskId: string, blockType: BlockType) => void;
  blockType: BlockType;
  currentLanguage: string;
}

export const LanguageSubTasks: React.FC<LanguageSubTasksProps> = ({
  subTasks,
  onToggleTask,
  blockType,
  currentLanguage,
}) => {
  const completedCount = subTasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / subTasks.length) * 100);
  const totalMinutes = subTasks.reduce((acc, t) => acc + t.durationMinutes, 0);

  const languageLabel = currentLanguage === 'english' ? '🇬🇧 Inglés' : '🇮🇹 Italiano';

  return (
    <div className="space-y-4">
      {/* Header con progreso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{languageLabel}</span>
            <Badge variant="outline" className="text-xs">
              {blockType === 'morning' ? '90 min' : '30 min'}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{subTasks.length} completadas
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Lista de sub-tareas */}
      <div className="space-y-2">
        {subTasks.map((task, index) => {
          const isActive = !task.completed && index === subTasks.findIndex(t => !t.completed);
          
          return (
            <Card
              key={task.id}
              className={cn(
                "p-3 transition-all",
                task.completed && "bg-muted/50 opacity-75",
                isActive && "ring-2 ring-primary bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleTask(task.id, blockType)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{task.icon}</span>
                    <span className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.name}
                    </span>
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {task.durationMinutes} min
                    </Badge>
                    {isActive && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        ▶ Activo
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                  
                  {task.resource && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📱 {task.resource}
                    </p>
                  )}
                </div>

                {task.completed && (
                  <span className="text-green-500 text-lg">✅</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="text-center text-sm text-muted-foreground pt-2 border-t">
        Tiempo total: {totalMinutes} minutos • Progreso: {progress}%
      </div>
    </div>
  );
};
