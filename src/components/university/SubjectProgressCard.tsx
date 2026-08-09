import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BadgeCheck, CheckCircle2, FileText, GraduationCap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from '@/hooks/useUniversity';

interface SubjectProgressCardProps {
  subject: Subject;
  weightedAverage: number | null;
  onClick?: () => void;
  isActive?: boolean;
  onToggleActive?: () => void;
  onToggleApproved?: () => void;
}

export function SubjectProgressCard({ subject, weightedAverage, onClick, isActive, onToggleActive, onToggleApproved }: SubjectProgressCardProps) {
  const totalTasks = subject.tasks.length;
  const completedTasks = subject.tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const gradedExams = subject.partialExams.filter(p => p.grade !== null && p.grade !== undefined);
  const pendingExams = subject.partialExams.filter(p => p.status === 'pending');

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:border-primary/40 border-l-4",
        subject.approved ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/20" : "border-l-primary/60",
        isActive && "ring-2 ring-primary border-l-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {subject.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {subject.approved ? (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-600">
                  <BadgeCheck className="h-3 w-3 mr-0.5 inline" />
                  Aprobada
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">En curso</span>
              )}
              {subject.professor && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {subject.professor}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleApproved && (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", subject.approved ? "text-green-600" : "text-muted-foreground")}
                onClick={(e) => { e.stopPropagation(); onToggleApproved(); }}
                title={subject.approved ? "Quitar aprobación" : "Marcar como aprobada 🎉"}
              >
                <BadgeCheck className={cn("h-4 w-4", subject.approved && "fill-green-600 text-white")} />
              </Button>
            )}
            {onToggleActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                title={isActive ? "Quitar como activa" : "Marcar como activa"}
              >
                <Star className={cn("h-4 w-4", isActive ? "fill-primary text-primary" : "text-muted-foreground")} />
              </Button>
            )}
            {weightedAverage !== null && (
              <div className={`text-right px-2 py-1 rounded-md ${
                weightedAverage >= 70 ? 'bg-green-500/10 text-green-600' :
                weightedAverage >= 50 ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-destructive/10 text-destructive'
              }`}>
                <p className="text-lg font-bold leading-none">{Math.round(weightedAverage)}</p>
                <p className="text-[10px]">promedio</p>
              </div>
            )}
          </div>
        </div>

        {/* Task progress */}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Tareas
              </span>
              <span className="font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={taskProgress} className="h-1.5" />
          </div>
        )}

        {/* Quick stats row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {subject.topics.length} temas
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            {gradedExams.length}/{subject.partialExams.length} parciales
          </span>
          {pendingExams.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-yellow-600 border-yellow-500/30">
              {pendingExams.length} pendiente{pendingExams.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
