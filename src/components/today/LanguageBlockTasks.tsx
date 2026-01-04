import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useLanguageLearning, LanguageSubTask, BlockType } from '@/hooks/useLanguageLearning';
import { cn } from '@/lib/utils';

interface LanguageBlockTasksProps {
  blockDurationMinutes: number;
  blockType: BlockType;
}

export function LanguageBlockTasks({ blockDurationMinutes, blockType }: LanguageBlockTasksProps) {
  const { 
    currentLanguage, 
    getSubTasksForDuration, 
    toggleSubTask, 
    getProgress,
    isLoading 
  } = useLanguageLearning();

  const subTasks = getSubTasksForDuration(blockDurationMinutes);
  const progress = getProgress();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const languageLabel = currentLanguage === 'english' ? '🇬🇧 Inglés' : '🇮🇹 Italiano';
  const totalMinutes = subTasks.reduce((acc, t) => acc + t.durationMinutes, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {languageLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {blockType === 'morning' ? 'Bloque completo' : 'Bloque reducido'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{totalMinutes} min</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progreso de idiomas</span>
          <span className="font-medium">{progress.completed}/{progress.total} tareas</span>
        </div>
        <Progress value={progress.percentage} className="h-1.5" />
      </div>

      {/* Sub-tasks list */}
      <div className="space-y-2">
        {subTasks.map((task) => (
          <LanguageSubTaskItem
            key={task.id}
            task={task}
            onToggle={() => toggleSubTask(task.id, blockType)}
          />
        ))}
      </div>
    </div>
  );
}

interface LanguageSubTaskItemProps {
  task: LanguageSubTask;
  onToggle: () => void;
}

function LanguageSubTaskItem({ task, onToggle }: LanguageSubTaskItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
        task.completed 
          ? "bg-muted/50 border-border" 
          : "bg-card border-border hover:bg-muted/30"
      )}
      onClick={onToggle}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{task.icon}</span>
          <span className={cn(
            "font-medium",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {task.durationMinutes} min
          </Badge>
          {task.completed && (
            <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
          )}
        </div>
        
        <p className={cn(
          "text-xs mt-1",
          task.completed ? "text-muted-foreground/60" : "text-muted-foreground"
        )}>
          {task.description}
        </p>
        
        {task.resource && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            task.completed ? "text-muted-foreground/60" : "text-primary/80"
          )}>
            📱 {task.resource}
          </p>
        )}
      </div>
    </div>
  );
}
