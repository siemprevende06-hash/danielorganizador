import { differenceInDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Clock, BookOpen, PenTool, TrendingUp, Calendar } from 'lucide-react';
import type { Exam } from '@/hooks/useExams';

interface ExamCardProps {
  exam: Exam;
  onUpdateProgress: (exam: Exam) => void;
  onDelete: (examId: string) => void;
}

export function ExamCard({ exam, onUpdateProgress, onDelete }: ExamCardProps) {
  const examDate = parseISO(exam.exam_date);
  const daysRemaining = differenceInDays(examDate, new Date());
  
  const studyProgress = exam.target_study_hours > 0 
    ? Math.min(100, (exam.current_study_hours / exam.target_study_hours) * 100)
    : 0;
  const exerciseProgress = exam.target_exercises > 0 
    ? Math.min(100, (exam.current_exercises / exam.target_exercises) * 100)
    : 0;
  const overallProgress = (studyProgress + exerciseProgress) / 2;

  const getUrgencyColor = () => {
    if (daysRemaining < 0) return 'text-muted-foreground';
    if (daysRemaining <= 3) return 'text-destructive';
    if (daysRemaining <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getUrgencyBg = () => {
    if (daysRemaining < 0) return 'bg-muted';
    if (daysRemaining <= 3) return 'bg-destructive/10';
    if (daysRemaining <= 7) return 'bg-yellow-500/10';
    return 'bg-green-500/10';
  };

  const getStatusText = () => {
    if (exam.status === 'completed') return 'Completado';
    if (exam.status === 'passed') return `Aprobado: ${exam.grade}`;
    if (exam.status === 'failed') return `Reprobado: ${exam.grade}`;
    if (daysRemaining < 0) return 'Examen pasado';
    if (daysRemaining === 0) return '¡Hoy es el examen!';
    if (daysRemaining === 1) return 'Mañana';
    return `${daysRemaining} días restantes`;
  };

  return (
    <Card className={`${getUrgencyBg()} border-l-4 ${daysRemaining <= 3 && daysRemaining >= 0 ? 'border-l-destructive' : daysRemaining <= 7 && daysRemaining >= 0 ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              {exam.title}
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {format(examDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${getUrgencyColor()}`}>
              {getStatusText()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(exam.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {exam.status === 'pending' && daysRemaining >= 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{exam.current_study_hours}</span>
                  <span className="text-muted-foreground">/{exam.target_study_hours}h</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>
                  <span className="font-medium">{exam.current_exercises}</span>
                  <span className="text-muted-foreground">/{exam.target_exercises} ejercicios</span>
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Progreso
                </span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {exam.topics && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Temas:</span> {exam.topics}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onUpdateProgress(exam)}
            >
              Actualizar Progreso
            </Button>
          </>
        )}

        {exam.grade !== null && (
          <div className="text-center py-2">
            <span className="text-2xl font-bold">{exam.grade}</span>
            <span className="text-muted-foreground">/100</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
