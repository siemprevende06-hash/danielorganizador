import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { WeeklyObjectives } from '@/components/weekly/WeeklyObjectives';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function WeeklyView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);
  
  const { objectives, loading: objectivesLoading, incrementProgress } = useWeeklyObjectives();

  // Fetch tasks and activities for the week
  const { data: weekData, isLoading: weekDataLoading } = useQuery({
    queryKey: ['weeklyData', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');

      const [tasksResult, dailyReviewsResult, activityResult] = await Promise.all([
        supabase.from('tasks').select('*')
          .gte('due_date', `${startStr}T00:00:00`)
          .lte('due_date', `${endStr}T23:59:59`),
        supabase.from('daily_reviews').select('*')
          .gte('review_date', startStr)
          .lte('review_date', endStr),
        supabase.from('activity_tracking').select('*')
          .gte('activity_date', startStr)
          .lte('activity_date', endStr)
      ]);

      return {
        tasks: tasksResult.data || [],
        reviews: dailyReviewsResult.data || [],
        activities: activityResult.data || []
      };
    }
  });

  const getDataForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTasks = weekData?.tasks.filter(t => {
      const taskDate = t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd') : '';
      return taskDate === dateStr;
    }) || [];
    
    const review = weekData?.reviews.find(r => r.review_date === dateStr);
    const activities = weekData?.activities.filter(a => a.activity_date === dateStr) || [];
    
    const completedTasks = dayTasks.filter(t => t.completed).length;
    const completedActivities = activities.filter(a => a.completed).length;
    
    const score = review?.overall_rating 
      ? review.overall_rating * 20 
      : (dayTasks.length > 0 ? Math.round((completedTasks / dayTasks.length) * 100) : 0);

    return {
      tasks: dayTasks,
      completedTasks,
      activities,
      completedActivities,
      score,
      review
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-black';
    if (score >= 40) return 'bg-orange-500 text-white';
    if (score > 0) return 'bg-red-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  // Calculate connection between daily tasks and weekly objectives
  const getDailyToWeeklyConnections = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayTasks = weekData?.tasks.filter(t => {
      const taskDate = t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd') : '';
      return taskDate === todayStr;
    }) || [];

    return objectives.map(obj => {
      // Find tasks that match this objective's area
      const relatedTasks = todayTasks.filter(t => 
        t.area_id?.toLowerCase().includes(obj.area.toLowerCase()) ||
        t.source?.toLowerCase().includes(obj.area.toLowerCase())
      );

      return {
        objective: obj,
        todayTasks: relatedTasks,
        todayCompleted: relatedTasks.filter(t => t.completed).length
      };
    });
  };

  const connections = getDailyToWeeklyConnections();

  return (
    <div className="container mx-auto px-4 py-24 pb-24 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Vista Semanal
          </h1>
          <p className="text-muted-foreground">
            {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Weekly Objectives - Use the standalone component */}
      <WeeklyObjectives />

      {/* Daily to Weekly Connection */}
      {connections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" />
              Conexión: Hoy → Objetivos Semanales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.filter(c => c.todayTasks.length > 0).map(conn => (
                <div key={conn.objective.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{conn.objective.area}</Badge>
                      <span className="text-sm">{conn.objective.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Tareas de hoy: {conn.todayCompleted}/{conn.todayTasks.length} completadas
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{conn.objective.current_value || 0}/{conn.objective.target_value || 0}</div>
                    <Progress 
                      value={conn.objective.target_value ? ((conn.objective.current_value || 0) / conn.objective.target_value) * 100 : 0} 
                      className="h-1.5 w-24 mt-1" 
                    />
                  </div>
                </div>
              ))}
              {connections.filter(c => c.todayTasks.length > 0).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No hay tareas de hoy vinculadas a objetivos semanales
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Calendario Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayData = getDataForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "min-h-[140px] p-3 rounded-lg border transition-all",
                    isCurrentDay && "ring-2 ring-primary border-primary",
                    !isCurrentDay && "hover:border-primary/50"
                  )}
                >
                  {/* Day header */}
                  <div className="text-center mb-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      isCurrentDay && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Score badge */}
                  <div className="text-center mb-2">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                      getScoreColor(dayData.score)
                    )}>
                      {dayData.score > 0 ? `${dayData.score}%` : '-'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1 text-xs text-center text-muted-foreground">
                    <div>
                      T: {dayData.completedTasks}/{dayData.tasks.length}
                    </div>
                    <div>
                      A: {dayData.completedActivities}/{dayData.activities.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">
              {weekData?.tasks.filter(t => t.completed).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Tareas completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-500">
              {weekData?.activities.filter(a => a.completed).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Actividades hechas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {objectives.filter(o => o.completed).length}/{objectives.length}
            </div>
            <p className="text-sm text-muted-foreground">Objetivos logrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">
              {weekData?.reviews.length || 0}/7
            </div>
            <p className="text-sm text-muted-foreground">Días con revisión</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
