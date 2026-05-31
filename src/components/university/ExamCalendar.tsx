import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Subject, PartialExam } from '@/hooks/useUniversity';

interface ExamCalendarProps {
  subjects: Subject[];
}

interface ExamWithSubject extends PartialExam {
  subjectName: string;
}

export function ExamCalendar({ subjects }: ExamCalendarProps) {
  const allExams: ExamWithSubject[] = subjects.flatMap(s =>
    s.partialExams
      .filter(p => p.exam_date && p.status === 'pending')
      .map(p => ({ ...p, subjectName: s.name }))
  ).sort((a, b) => {
    if (!a.exam_date || !b.exam_date) return 0;
    return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
  });

  const getUrgency = (examDate: string) => {
    const days = differenceInDays(parseISO(examDate), new Date());
    if (days < 0) return { level: 'past', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted' };
    if (days <= 3) return { level: 'urgent', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' };
    if (days <= 7) return { level: 'soon', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
    return { level: 'later', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  };

  if (allExams.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Sin exámenes pendientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Próximos Exámenes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allExams.slice(0, 8).map(exam => {
          const urgency = getUrgency(exam.exam_date!);
          const days = differenceInDays(parseISO(exam.exam_date!), new Date());

          return (
            <div
              key={exam.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${urgency.bg} ${urgency.border}`}
            >
              <div className={`text-center shrink-0 w-12 ${urgency.color}`}>
                <p className="text-lg font-bold leading-none">
                  {format(parseISO(exam.exam_date!), 'd')}
                </p>
                <p className="text-[10px] uppercase">
                  {format(parseISO(exam.exam_date!), 'MMM', { locale: es })}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{exam.title}</p>
                <p className="text-xs text-muted-foreground truncate">{exam.subjectName}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">{exam.weight_percentage}%</Badge>
                {days <= 3 && days >= 0 && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-xs font-medium ${urgency.color}`}>
                  {days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `${days}d`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
