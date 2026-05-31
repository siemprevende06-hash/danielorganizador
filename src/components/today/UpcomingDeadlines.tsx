import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Calendar, GraduationCap, Briefcase } from "lucide-react";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

interface Deadline {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'task' | 'entrepreneurship';
  daysUntil: number;
  isUrgent: boolean;
}

export function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const allDeadlines: Deadline[] = [];

    // Load exams
    const { data: exams } = await supabase
      .from('exams')
      .select('id, title, exam_date')
      .gte('exam_date', today.toISOString().split('T')[0])
      .lte('exam_date', nextWeek.toISOString().split('T')[0])
      .eq('status', 'pending');

    exams?.forEach(exam => {
      const examDate = new Date(exam.exam_date);
      const daysUntil = differenceInDays(examDate, today);
      allDeadlines.push({
        id: exam.id,
        title: exam.title,
        date: examDate,
        type: 'exam',
        daysUntil,
        isUrgent: daysUntil <= 2
      });
    });

    // Load high priority tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('priority', 'high')
      .eq('completed', false)
      .gte('due_date', today.toISOString())
      .lte('due_date', nextWeek.toISOString());

    tasks?.forEach(task => {
      if (task.due_date) {
        const taskDate = new Date(task.due_date);
        const daysUntil = differenceInDays(taskDate, today);
        allDeadlines.push({
          id: task.id,
          title: task.title,
          date: taskDate,
          type: 'task',
          daysUntil,
          isUrgent: daysUntil <= 1
        });
      }
    });

    // Load entrepreneurship tasks
    const { data: entTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, title, due_date')
      .eq('completed', false)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0]);

    entTasks?.forEach(task => {
      if (task.due_date) {
        const taskDate = new Date(task.due_date);
        const daysUntil = differenceInDays(taskDate, today);
        allDeadlines.push({
          id: task.id,
          title: task.title,
          date: taskDate,
          type: 'entrepreneurship',
          daysUntil,
          isUrgent: daysUntil <= 1
        });
      }
    });

    // Sort by date
    allDeadlines.sort((a, b) => a.daysUntil - b.daysUntil);

    setDeadlines(allDeadlines.slice(0, 5));
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <GraduationCap className="w-4 h-4" />;
      case 'entrepreneurship':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getDateLabel = (deadline: Deadline) => {
    if (isToday(deadline.date)) return 'HOY';
    if (isTomorrow(deadline.date)) return 'MAÑANA';
    return format(deadline.date, 'EEE d', { locale: es });
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-muted rounded" />;
  }

  if (deadlines.length === 0) {
    return null;
  }

  const hasUrgent = deadlines.some(d => d.isUrgent);

  return (
    <div className={`rounded-lg p-4 ${hasUrgent ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'}`}>
      <div className="flex items-center gap-2 mb-3">
        {hasUrgent && <AlertTriangle className="w-4 h-4 text-destructive" />}
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Próximas Fechas Límite
        </span>
      </div>

      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <div 
            key={`${deadline.type}-${deadline.id}`}
            className={`flex items-center justify-between p-2 rounded ${
              deadline.isUrgent ? 'bg-destructive/20' : 'bg-background'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={deadline.isUrgent ? 'text-destructive' : 'text-muted-foreground'}>
                {getTypeIcon(deadline.type)}
              </span>
              <span className={`text-sm ${deadline.isUrgent ? 'font-medium' : ''}`}>
                {deadline.title}
              </span>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              deadline.isUrgent 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {getDateLabel(deadline)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
