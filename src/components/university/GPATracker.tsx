import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, BookOpen } from 'lucide-react';
import type { GPAData } from '@/hooks/useUniversity';

interface GPATrackerProps {
  gpaData: GPAData[];
  overallGPA: number | null;
}

export function GPATracker({ gpaData, overallGPA }: GPATrackerProps) {
  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-muted-foreground';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getGradeBg = (grade: number | null) => {
    if (grade === null) return 'bg-muted';
    if (grade >= 80) return 'bg-green-500/10';
    if (grade >= 60) return 'bg-yellow-500/10';
    return 'bg-destructive/10';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-primary" />
          Rendimiento Académico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall GPA */}
        <div className={`p-4 rounded-lg text-center ${getGradeBg(overallGPA)}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Promedio General</p>
          <p className={`text-4xl font-bold mt-1 ${getGradeColor(overallGPA)}`}>
            {overallGPA !== null ? overallGPA.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {gpaData.length} asignaturas inscritas
          </p>
        </div>

        {/* Per-subject breakdown */}
        <div className="space-y-3">
          {gpaData.map(subject => (
            <div key={subject.subjectId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{subject.subjectName}</span>
                </div>
                <span className={`text-sm font-bold ${getGradeColor(subject.weightedAverage)}`}>
                  {subject.weightedAverage !== null ? subject.weightedAverage.toFixed(1) : '—'}
                </span>
              </div>

              {/* Partial grades */}
              <div className="flex gap-1.5 flex-wrap ml-5">
                {subject.partialGrades.map((partial, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[10px] ${
                      partial.grade !== null
                        ? partial.grade >= 60
                          ? 'border-green-500/30 text-green-600'
                          : 'border-destructive/30 text-destructive'
                        : ''
                    }`}
                  >
                    {partial.title}: {partial.grade !== null ? partial.grade : '—'} ({partial.weight}%)
                  </Badge>
                ))}
              </div>

              {subject.weightedAverage !== null && (
                <Progress
                  value={Math.min(100, subject.weightedAverage)}
                  className="h-1 ml-5"
                />
              )}
            </div>
          ))}

          {gpaData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Agrega asignaturas para ver tu rendimiento
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
