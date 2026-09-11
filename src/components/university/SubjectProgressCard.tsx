import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BadgeCheck, BookOpen, CheckCircle2, Clock, FileText, GraduationCap, Star, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from '@/hooks/useUniversity';
import { SubjectCover } from './SubjectCover';

interface SubjectProgressCardProps {
  subject: Subject;
  weightedAverage: number | null;
  onClick?: () => void;
  isActive?: boolean;
  onToggleActive?: () => void;
  onToggleApproved?: () => void;
  cover?: string | null;
  uploadingCover?: boolean;
  onUploadCover?: (file: File) => void;
  onRemoveCover?: () => void;
}

export function SubjectProgressCard({
  subject,
  weightedAverage,
  onClick,
  isActive,
  onToggleActive,
  onToggleApproved,
  cover,
  uploadingCover,
  onUploadCover,
  onRemoveCover,
}: SubjectProgressCardProps) {
  const totalTasks = subject.tasks.length;
  const completedTasks = subject.tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const studyTasks = subject.tasks.filter(t => t.task_type === 'study');
  const studySessions = studyTasks.reduce((acc, t) => ({
    count: acc.count + (t.studySessions?.count || 0),
    minutes: acc.minutes + (t.studySessions?.minutes || 0),
  }), { count: 0, minutes: 0 });
  const studyTarget = studyTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);
  const studyProgress = studyTarget > 0 ? Math.min(100, Math.round((studySessions.minutes / studyTarget) * 100)) : 0;

  const gradedExams = subject.partialExams.filter(p => p.grade !== null && p.grade !== undefined);
  const pendingExams = subject.partialExams.filter(p => p.status === 'pending');
  const upcomingExams = subject.partialExams.filter(p => p.grade === null && p.status === 'pending');

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden rounded-2xl border-muted/60",
        isActive && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <SubjectCover
        subjectId={subject.id}
        label={subject.name}
        cover={cover}
        uploading={uploadingCover}
        onUpload={onUploadCover}
        onRemove={onRemoveCover}
        className="h-24 shrink-0"
      />
      <CardContent className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {subject.approved ? (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-600">
                <BadgeCheck className="h-3 w-3 mr-0.5 inline" />
                Aprobada
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground">En curso</span>
            )}
            {subject.code && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">{subject.code}</Badge>
            )}
            {pendingExams.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 text-yellow-600 border-yellow-500/30">
                {pendingExams.length} parcial{pendingExams.length > 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 -mt-1">
            {onToggleApproved && (
              <span
                role="button"
                title={subject.approved ? "Quitar aprobación" : "Marcar como aprobada 🎉"}
                className={cn("p-1 rounded-md cursor-pointer hover:bg-muted/60 text-muted-foreground", subject.approved && "text-green-600")}
                onClick={(e) => { e.stopPropagation(); onToggleApproved(); }}
              >
                <BadgeCheck className={cn("h-4 w-4", subject.approved && "fill-green-600 text-white")} />
              </span>
            )}
            {onToggleActive && (
              <span
                role="button"
                title={isActive ? "Quitar como activa" : "Marcar como activa"}
                className="p-1 rounded-md cursor-pointer hover:bg-muted/60 text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
              >
                <Star className={cn("h-4 w-4", isActive ? "fill-primary text-primary" : "")} />
              </span>
            )}
          </div>
        </div>

        {weightedAverage !== null && (
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold",
              weightedAverage >= 70 ? 'bg-green-500/10 text-green-600' :
              weightedAverage >= 50 ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-destructive/10 text-destructive'
            )}>
              <Target className="h-3 w-3" />
              {Math.round(weightedAverage)}
            </span>
            <span className="text-[10px] text-muted-foreground">promedio</span>
          </div>
        )}

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

        {/* Study sessions accumulated */}
        {(studyTasks.length > 0 || studySessions.count > 0) && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" />
                Estudio acumulado
              </span>
              <span className="font-bold tabular-nums">
                {studySessions.count} ses · {studySessions.minutes}m
                {studyTarget > 0 && <span className="text-muted-foreground font-normal"> / {studyTarget}m</span>}
              </span>
            </div>
            {studyTarget > 0 && <Progress value={studyProgress} className="h-1 bg-blue-500/20" />}
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
          {upcomingExams.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <BookOpen className="h-3 w-3" />
              {upcomingExams.length} próximos
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}