import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useGoalProgress, GoalTask } from '@/hooks/useGoalProgress';
import { Target, CheckCircle2, Calendar, Book, Music, TrendingUp, FolderKanban, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { MonthlyAreaGoals } from './MonthlyAreaGoals';

interface MonthlyGoalsProps {
  currentMonth: Date;
}

export function MonthlyGoals({ currentMonth }: MonthlyGoalsProps) {
  const { goals, loading: goalsLoading, fetchGoalTasks } = useGoalProgress();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });

  const [goalTasksMap, setGoalTasksMap] = useState<Map<string, GoalTask[]>>(new Map());
  const [twelveWeekGoals, setTwelveWeekGoals] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any[]>([]);

  const activeGoals = goals.filter(g => g.status === 'active');

  useEffect(() => {
    if (activeGoals.length > 0) {
      activeGoals.forEach(async (goal) => {
        const tasks = await fetchGoalTasks(goal.id);
        setGoalTasksMap(prev => new Map(prev).set(goal.id, tasks));
      });
    }
  }, [goals]);

  useEffect(() => {
    const loadIndicators = async () => {
      const [booksRes, songsRes, projectsRes, twelveRes, systemsRes] = await Promise.all([
        supabase.from('reading_library').select('*'),
        supabase.from('music_repertoire').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('twelve_week_goals').select('*').eq('year', 2026).order('category'),
        supabase.from('daily_systems_tracking').select('*').gte('tracking_date', monthStartStr).lte('tracking_date', monthEndStr),
      ]);
      setBooks(booksRes.data || []);
      setSongs(songsRes.data || []);
      setProjects(projectsRes.data || []);
      setTwelveWeekGoals(twelveRes.data || []);
      setSystemStats(systemsRes.data || []);
    };
    loadIndicators();
  }, [currentMonth]);

  const getMonthTasks = (tasks: GoalTask[]) => {
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const d = parseISO(t.due_date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  };

  const currentBooks = books.filter(b => b.status === 'reading');
  const completedBooks = books.filter(b => b.status === 'read' && b.finish_date && b.finish_date >= monthStartStr && b.finish_date <= monthEndStr);
  const pianoSongs = songs.filter(s => s.instrument === 'piano');
  const guitarSongs = songs.filter(s => s.instrument === 'guitar');

  const gymTrackedDays = systemStats.length;

  if (goalsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground animate-pulse">Cargando...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Indicators */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Indicadores del Mes — {monthName}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">Libros</span>
              </div>
              <p className="text-lg font-bold">{completedBooks.length}<span className="text-sm text-muted-foreground font-normal">/2</span></p>
              <Progress value={Math.min(100, (completedBooks.length / 2) * 100)} className="h-1" />
              {currentBooks.length > 0 && <p className="text-[9px] text-muted-foreground truncate">Leyendo: {currentBooks[0].title}</p>}
            </div>
            <div className="p-3 rounded-xl bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎹</span>
                <span className="text-xs font-medium">Piano</span>
              </div>
              <p className="text-lg font-bold">{pianoSongs.filter(s => s.status === 'mastered').length}<span className="text-sm text-muted-foreground font-normal">/1</span></p>
              <Progress value={Math.min(100, pianoSongs.filter(s => s.status === 'mastered').length * 100)} className="h-1" />
              {pianoSongs.filter(s => s.status === 'learning').length > 0 && <p className="text-[9px] text-muted-foreground truncate">Aprendiendo: {pianoSongs.find(s => s.status === 'learning')?.title}</p>}
            </div>
            <div className="p-3 rounded-xl bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎸</span>
                <span className="text-xs font-medium">Guitarra</span>
              </div>
              <p className="text-lg font-bold">{guitarSongs.filter(s => s.status === 'mastered').length}<span className="text-sm text-muted-foreground font-normal">/1</span></p>
              <Progress value={Math.min(100, guitarSongs.filter(s => s.status === 'mastered').length * 100)} className="h-1" />
              {guitarSongs.filter(s => s.status === 'learning').length > 0 && <p className="text-[9px] text-muted-foreground truncate">Aprendiendo: {guitarSongs.find(s => s.status === 'learning')?.title}</p>}
            </div>
            <div className="p-3 rounded-xl bg-muted/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Proyectos</span>
              </div>
              <p className="text-lg font-bold">{projects.filter(p => p.status !== 'completed').length}<span className="text-sm text-muted-foreground font-normal"> activos</span></p>
              <Progress value={projects.length > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100) : 0} className="h-1" />
              <p className="text-[9px] text-muted-foreground">{projects.filter(p => p.status === 'completed').length}/{projects.length} completados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Goals with month tasks */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Metas Trimestrales — Tareas del Mes
        </h3>
        <Link to="/goals">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {activeGoals.length === 0 ? (
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
          <CardContent className="p-8 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay metas activas este trimestre</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeGoals.map(goal => {
            const allTasks = goalTasksMap.get(goal.id) || [];
            const monthTasks = getMonthTasks(allTasks);
            const completedInMonth = monthTasks.filter(t => t.completed).length;

            return (
              <Card key={goal.id} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{goal.title}</p>
                      {goal.area_id && <p className="text-[10px] text-muted-foreground capitalize">{goal.area_id}</p>}
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">{goal.progress_percentage}%</Badge>
                  </div>
                  <Progress value={goal.progress_percentage} className="h-1.5" />
                  {monthTasks.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Este mes ({completedInMonth}/{monthTasks.length})
                      </p>
                      {monthTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className={cn("w-3 h-3 shrink-0", task.completed ? "text-green-500" : "text-muted-foreground/30")} />
                          <span className={cn("truncate", task.completed && "line-through")}>{task.title}</span>
                          {task.due_date && (
                            <span className="text-[9px] text-muted-foreground/60 ml-auto">{format(parseISO(task.due_date), 'd MMM', { locale: es })}</span>
                          )}
                        </div>
                      ))}
                      {monthTasks.length > 3 && <p className="text-[10px] text-muted-foreground/60 pl-5">+{monthTasks.length - 3} más</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 12-Week Goals */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
              Metas 12 Semanas
            </h3>
            <Link to="/12-week-year">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">Ver <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </div>
          <div className="space-y-2">
            {twelveWeekGoals.filter(g => g.status !== 'completed' || g.progress_percentage > 0).slice(0, 6).map(goal => (
              <div key={goal.id} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{goal.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{goal.progress_percentage}%</span>
                  </div>
                  <Progress value={goal.progress_percentage} className="h-1 mt-0.5" />
                </div>
              </div>
            ))}
            {twelveWeekGoals.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Sin metas configuradas</p>}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Area Goals (existing component) */}
      <MonthlyAreaGoals currentMonth={currentMonth} />
    </div>
  );
}
