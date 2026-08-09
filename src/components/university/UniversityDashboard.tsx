import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { AlertTriangle, Award, BookOpen, CheckCircle2, ClipboardList, GraduationCap, Target, TrendingUp } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Subject, GPAData } from '@/hooks/useUniversity';

interface UniversityDashboardProps {
  subjects: Subject[];
  gpaData: GPAData[];
  overallGPA: number | null;
  studyByDay: { day: string; minutes: number }[];
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

interface AlertItem {
  id: string;
  type: 'delivery' | 'exam';
  title: string;
  subject: string;
  days: number;
  urgency: 'danger' | 'warning';
}

const getUrgency = (days: number): 'danger' | 'warning' =>
  days <= 1 ? 'danger' : 'warning';

export function UniversityDashboard({ subjects, gpaData, overallGPA, studyByDay }: UniversityDashboardProps) {
  const stats = useMemo(() => {
    const allTasks = subjects.flatMap(s => s.tasks);
    const completedTasks = allTasks.filter(t => t.completed);
    const approved = subjects.filter(s => s.approved);
    const inProgress = subjects.filter(s => !s.approved);
    const avg = overallGPA;

    return {
      approved: approved.length,
      inProgress: inProgress.length,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
      avg,
    };
  }, [subjects, overallGPA]);

  const alerts = useMemo((): AlertItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list: AlertItem[] = [];

    subjects.forEach(s => {
      if (s.approved) return;

      s.tasks.forEach(t => {
        if (t.completed || t.task_type !== 'delivery' || !t.due_date) return;
        const days = differenceInCalendarDays(parseISO(t.due_date), today);
        if (days < 0 || days <= 3) {
          list.push({
            id: t.id,
            type: 'delivery',
            title: t.title,
            subject: s.name,
            days,
            urgency: getUrgency(days),
          });
        }
      });

      s.partialExams.forEach(p => {
        if (p.grade !== null && p.grade !== undefined) return;
        if (!p.exam_date) return;
        const days = differenceInCalendarDays(parseISO(p.exam_date), today);
        if (days < 0 || days <= 7) {
          list.push({
            id: p.id,
            type: 'exam',
            title: p.title,
            subject: s.name,
            days,
            urgency: getUrgency(days),
          });
        }
      });
    });

    return list.sort((a, b) => a.days - b.days).slice(0, 8);
  }, [subjects]);

  const gradeData = useMemo(() => {
    return gpaData
      .filter(g => g.weightedAverage !== null)
      .map(g => ({ name: g.subjectName, promedio: Number(g.weightedAverage!.toFixed(1)) }));
  }, [gpaData]);

  const taskPie = useMemo(() => {
    const pending = stats.totalTasks - stats.completedTasks;
    return [
      { name: 'Completadas', value: stats.completedTasks },
      { name: 'Pendientes', value: pending },
    ].filter(d => d.value > 0);
  }, [stats]);

  const subjectProgress = useMemo(() => {
    const inProgress = subjects.filter(s => !s.approved);
    return inProgress.length > 0
      ? inProgress.map(s => {
          const done = s.tasks.filter(t => t.completed).length;
          const total = s.tasks.length;
          return {
            name: s.name,
            progress: total > 0 ? Math.round((done / total) * 100) : 0,
            done,
            total,
          };
        }).sort((a, b) => b.progress - a.progress)
      : [];
  }, [subjects]);

  const studyTotal = studyByDay.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Alertas próximas
              <Badge variant="outline" className="text-[10px]">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {alerts.map(a => (
              <div
                key={a.id}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  a.urgency === 'danger'
                    ? 'bg-destructive/10 border border-destructive/30'
                    : 'bg-yellow-500/10 border border-yellow-500/30'
                }`}
              >
                {a.type === 'delivery'
                  ? <ClipboardList className={`h-3.5 w-3.5 shrink-0 ${a.urgency === 'danger' ? 'text-destructive' : 'text-yellow-600'}`} />
                  : <GraduationCap className={`h-3.5 w-3.5 shrink-0 ${a.urgency === 'danger' ? 'text-destructive' : 'text-yellow-600'}`} />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">{a.type === 'delivery' ? 'Entrega' : 'Examen'} · {a.subject}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${
                    a.days < 0
                      ? 'border-destructive/50 text-destructive'
                      : a.urgency === 'danger'
                        ? 'border-destructive/40 text-destructive'
                        : 'border-yellow-500/40 text-yellow-600'
                  }`}
                >
                  {a.days < 0 ? `${Math.abs(a.days)}d atrasado` : a.days === 0 ? 'Hoy' : `${a.days}d`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{stats.approved}</p>
              <p className="text-[10px] text-muted-foreground">Aprobadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{stats.inProgress}</p>
              <p className="text-[10px] text-muted-foreground">En curso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
              <Target className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{Math.round(stats.completionRate)}%</p>
              <p className="text-[10px] text-muted-foreground">Tareas completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{stats.avg !== null ? stats.avg.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Promedio general</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Grades per subject */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Promedio por Asignatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                      formatter={(v: any) => [`${v}`, 'Promedio']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="promedio" radius={[0, 4, 4, 0]}>
                      {gradeData.map((d, i) => (
                        <Cell key={i} fill={d.promedio >= 60 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Registra notas en tus parciales para ver tu rendimiento
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task distribution pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Progreso de Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskPie.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3}>
                        {taskPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {taskPie.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="flex-1 text-muted-foreground">{d.name}</span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {stats.completedTasks}/{stats.totalTasks} tareas completadas
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin tareas aún</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Study time bar */}
      {studyByDay.some(d => d.minutes > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Minutos de estudio (últimos {studyByDay.length} días)
              <Badge variant="secondary" className="text-[10px] ml-auto">{Math.round(studyTotal / 60)}h total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} min`, 'Estudio']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress per in-progress subject */}
      {subjectProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Avance por Asignatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectProgress.map(sp => (
              <div key={sp.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate">{sp.name}</span>
                  <span className="text-muted-foreground shrink-0">{sp.done}/{sp.total} · {sp.progress}%</span>
                </div>
                <Progress value={sp.progress} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}