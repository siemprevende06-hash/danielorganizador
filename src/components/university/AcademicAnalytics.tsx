import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, BookOpen, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import type { Subject, GPAData } from '@/hooks/useUniversity';

interface AcademicAnalyticsProps {
  subjects: Subject[];
  gpaData: GPAData[];
}

export function AcademicAnalytics({ subjects, gpaData }: AcademicAnalyticsProps) {
  const stats = useMemo(() => {
    const allTasks = subjects.flatMap(s => s.tasks);
    const completedTasks = allTasks.filter(t => t.completed);
    const deliveryTasks = allTasks.filter(t => t.task_type === 'delivery');
    const completedDelivery = deliveryTasks.filter(t => t.completed);
    const studyTasks = allTasks.filter(t => t.task_type === 'study');
    const completedStudy = studyTasks.filter(t => t.completed);

    const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
    const allPartials = subjects.flatMap(s => s.partialExams);
    const gradedPartials = allPartials.filter(p => p.grade !== null && p.grade !== undefined);
    const passedPartials = gradedPartials.filter(p => p.grade! >= 60);

    const avgGrade = gradedPartials.length > 0
      ? gradedPartials.reduce((sum, p) => sum + p.grade!, 0) / gradedPartials.length
      : null;

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      taskCompletionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
      deliveryTotal: deliveryTasks.length,
      deliveryDone: completedDelivery.length,
      studyTotal: studyTasks.length,
      studyDone: completedStudy.length,
      totalTopics,
      totalPartials: allPartials.length,
      gradedPartials: gradedPartials.length,
      passedPartials: passedPartials.length,
      passRate: gradedPartials.length > 0 ? (passedPartials.length / gradedPartials.length) * 100 : null,
      avgGrade,
    };
  }, [subjects]);

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
            <p className="text-[10px] text-muted-foreground">Tareas Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{Math.round(stats.taskCompletionRate)}%</p>
            <p className="text-[10px] text-muted-foreground">Tasa de Completación</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
            <p className="text-xl font-bold">
              {stats.avgGrade !== null ? stats.avgGrade.toFixed(1) : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Nota Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-xl font-bold">
              {stats.passRate !== null ? `${Math.round(stats.passRate)}%` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Tasa de Aprobación</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Subject Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Rendimiento por Asignatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.map(subject => {
            const tasks = subject.tasks;
            const completedCount = tasks.filter(t => t.completed).length;
            const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
            const gpa = gpaData.find(g => g.subjectId === subject.id);

            return (
              <div key={subject.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{subject.name}</span>
                  <div className="flex items-center gap-2">
                    {gpa?.weightedAverage !== null && gpa?.weightedAverage !== undefined && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          gpa.weightedAverage >= 70
                            ? 'border-green-500/40 text-green-600'
                            : gpa.weightedAverage >= 50
                              ? 'border-yellow-500/40 text-yellow-600'
                              : 'border-destructive/40 text-destructive'
                        }`}
                      >
                        {gpa.weightedAverage.toFixed(1)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{tasks.length}
                    </span>
                  </div>
                </div>
                <Progress value={progress} className="h-1.5" />
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>{subject.topics.length} temas</span>
                  <span>{subject.partialExams.length} parciales</span>
                  <span>{tasks.filter(t => t.task_type === 'delivery').length} entregas</span>
                </div>
              </div>
            );
          })}

          {subjects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin asignaturas registradas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
