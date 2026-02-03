import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar, CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyGoalsSection } from '@/components/today/MonthlyGoalsSection';

interface DayData {
  date: Date;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  score: number;
  isToday: boolean;
  isFuture: boolean;
  dailyReview?: {
    overall_rating: number;
    blocks_completed: number;
    blocks_total: number;
  };
}

interface MonthStats {
  totalTasksCompleted: number;
  totalTasks: number;
  productiveDays: number;
  totalDays: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  bestDay: { date: Date; score: number } | null;
}

export default function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);

    const [tasksRes, entrepreneurshipRes, habitHistoryRes, dailyReviewsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, completed, due_date')
        .gte('due_date', `${monthStartStr}T00:00:00`)
        .lte('due_date', `${monthEndStr}T23:59:59`),
      supabase
        .from('entrepreneurship_tasks')
        .select('id, completed, due_date')
        .gte('due_date', monthStartStr)
        .lte('due_date', monthEndStr),
      supabase.from('habit_history').select('habit_id, completed_dates'),
      supabase
        .from('daily_reviews')
        .select('*')
        .gte('review_date', monthStartStr)
        .lte('review_date', monthEndStr),
    ]);

    const allTasks = [...(tasksRes.data || []), ...(entrepreneurshipRes.data || [])];
    const habitHistory = habitHistoryRes.data || [];
    const dailyReviews = dailyReviewsRes.data || [];
    const today = new Date();

    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const totalHabits = habitHistory.length || 6;

    const daysWithData: DayData[] = monthDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isToday = isSameDay(day, today);
      const isFuture = day > today;

      const dayTasks = allTasks.filter(t => {
        const taskDate = t.due_date?.split('T')[0];
        return taskDate === dayStr;
      });
      const tasksCompleted = dayTasks.filter(t => t.completed).length;
      const tasksTotal = dayTasks.length;

      let habitsCompleted = 0;
      habitHistory.forEach(h => {
        const dates = (h.completed_dates as any[]) || [];
        if (dates.some((d: any) => d.date === dayStr && d.status === 'completed')) {
          habitsCompleted++;
        }
      });

      const review = dailyReviews.find(r => r.review_date === dayStr);

      const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 50 : 25;
      const habitScore = totalHabits > 0 ? (habitsCompleted / totalHabits) * 50 : 25;
      const score = Math.round(taskScore + habitScore);

      return {
        date: day,
        tasksCompleted,
        tasksTotal,
        habitsCompleted,
        habitsTotal: totalHabits,
        score: isFuture ? 0 : score,
        isToday,
        isFuture,
        dailyReview: review ? {
          overall_rating: review.overall_rating || 0,
          blocks_completed: review.blocks_completed || 0,
          blocks_total: review.blocks_total || 0,
        } : undefined,
      };
    });

    setDaysData(daysWithData);
    setLoading(false);
  };

  const monthStats = useMemo((): MonthStats => {
    const pastDays = daysData.filter(d => !d.isFuture);
    
    const totalTasksCompleted = pastDays.reduce((sum, d) => sum + d.tasksCompleted, 0);
    const totalTasks = pastDays.reduce((sum, d) => sum + d.tasksTotal, 0);
    const productiveDays = pastDays.filter(d => d.score >= 50).length;
    const totalDays = pastDays.length;
    const averageScore = totalDays > 0 
      ? Math.round(pastDays.reduce((sum, d) => sum + d.score, 0) / totalDays)
      : 0;

    const mid = Math.floor(pastDays.length / 2);
    const firstHalf = pastDays.slice(0, mid);
    const secondHalf = pastDays.slice(mid);
    
    const firstAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length 
      : 0;
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length 
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 5) trend = 'up';
    else if (secondAvg < firstAvg - 5) trend = 'down';

    const bestDay = pastDays.length > 0
      ? pastDays.reduce((best, d) => d.score > best.score ? d : best, pastDays[0])
      : null;

    return {
      totalTasksCompleted,
      totalTasks,
      productiveDays,
      totalDays,
      averageScore,
      trend,
      bestDay: bestDay ? { date: bestDay.date, score: bestDay.score } : null,
    };
  }, [daysData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const firstDayOfMonth = monthStart.getDay();
  const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getScoreColor = (score: number, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30';
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-emerald-500/20 border-emerald-500/50';
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/50';
    if (score >= 20) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-destructive/20 border-destructive/50';
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Vista Mensual</h1>
          <p className="text-muted-foreground">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Monthly Goals - Books, Piano, Guitar */}
      <MonthlyGoalsSection />

      {/* Month Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{monthStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Score Promedio</p>
            <div className="flex justify-center mt-1">
              {monthStats.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {monthStats.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
              {monthStats.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{monthStats.productiveDays}/{monthStats.totalDays}</div>
            <p className="text-xs text-muted-foreground">Días Productivos</p>
            <Progress 
              value={(monthStats.productiveDays / Math.max(1, monthStats.totalDays)) * 100} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{monthStats.totalTasksCompleted}</div>
            <p className="text-xs text-muted-foreground">Tareas Completadas</p>
            <p className="text-xs text-muted-foreground">de {monthStats.totalTasks} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            {monthStats.bestDay ? (
              <>
                <div className="text-2xl font-bold">{monthStats.bestDay.score}%</div>
                <p className="text-xs text-muted-foreground">Mejor Día</p>
                <p className="text-xs text-muted-foreground">
                  {format(monthStats.bestDay.date, 'd MMM', { locale: es })}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Mejor Día</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold py-2 text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Padding for days before month starts */}
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[80px]" />
                ))}

                {/* Actual days */}
                {daysData.map((day) => (
                  <Card 
                    key={day.date.toISOString()} 
                    className={cn(
                      "min-h-[80px] transition-all hover:scale-105 cursor-pointer",
                      getScoreColor(day.score, day.isFuture),
                      day.isToday && "ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-bold",
                          day.isToday && "text-primary"
                        )}>
                          {format(day.date, 'd')}
                        </span>
                        {!day.isFuture && day.score > 0 && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1",
                              day.score >= 70 && "border-green-500 text-green-600",
                              day.score < 70 && day.score >= 40 && "border-amber-500 text-amber-600",
                              day.score < 40 && "border-destructive text-destructive"
                            )}
                          >
                            {day.score}%
                          </Badge>
                        )}
                      </div>

                      {!day.isFuture && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{day.tasksCompleted}/{day.tasksTotal}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Target className="w-3 h-3" />
                            <span>{day.habitsCompleted}/{day.habitsTotal}</span>
                          </div>
                        </div>
                      )}

                      {day.dailyReview && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div 
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                i < day.dailyReview!.overall_rating 
                                  ? "bg-primary" 
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Leyenda de Colores</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
              <span>80-100% Excelente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span>60-79% Bueno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/50" />
              <span>40-59% Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/50" />
              <span>20-39% Bajo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/50" />
              <span>0-19% Crítico</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
