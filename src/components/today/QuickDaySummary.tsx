import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CheckCircle2, Clock, Target, Zap } from 'lucide-react';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay } from 'date-fns';

interface DaySummary {
  tasksCompleted: number;
  tasksTotal: number;
  blocksCompleted: number;
  blocksTotal: number;
  dayScore: number;
}

export function QuickDaySummary() {
  const { blocks, getCurrentBlock, getBlockProgress } = useRoutineBlocksDB();
  const [summary, setSummary] = useState<DaySummary>({
    tasksCompleted: 0,
    tasksTotal: 0,
    blocksCompleted: 0,
    blocksTotal: 0,
    dayScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDaySummary();
  }, [blocks]);

  const loadDaySummary = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStart = startOfDay(new Date()).toISOString();

      // Load tasks for today
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('due_date', today);

      const { data: entTasks } = await supabase
        .from('entrepreneurship_tasks')
        .select('id, completed')
        .eq('due_date', today);

      const allTasks = [...(tasksData || []), ...(entTasks || [])];
      const tasksCompleted = allTasks.filter(t => t.completed).length;
      const tasksTotal = allTasks.length;

      // Load block completions for today
      const { data: completionsData } = await supabase
        .from('block_completions')
        .select('block_id')
        .eq('completion_date', today)
        .eq('completed', true);

      const blocksCompleted = (completionsData || []).length;
      const blocksTotal = blocks.length;

      // Calculate day score
      const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 50 : 0;
      const blockScore = blocksTotal > 0 ? (blocksCompleted / blocksTotal) * 50 : 0;
      const dayScore = Math.round(taskScore + blockScore);

      setSummary({
        tasksCompleted,
        tasksTotal,
        blocksCompleted,
        blocksTotal,
        dayScore,
      });
    } catch (error) {
      console.error('Error loading day summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentBlock = getCurrentBlock();
  const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '💪';
    if (score >= 40) return '📈';
    return '⚡';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Day Score */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Score</span>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(summary.dayScore)}`}>
              {summary.dayScore}
              <span className="text-lg ml-1">{getScoreEmoji(summary.dayScore)}</span>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Tareas</span>
            </div>
            <div className="text-2xl font-bold">
              {summary.tasksCompleted}/{summary.tasksTotal}
            </div>
            <span className="text-xs text-muted-foreground">
              {summary.tasksTotal - summary.tasksCompleted} pendientes
            </span>
          </div>

          {/* Current Block */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Ahora</span>
            </div>
            {currentBlock ? (
              <>
                <div className="text-sm font-semibold truncate max-w-[150px]">
                  {currentBlock.title}
                </div>
                <div className="w-full mt-1">
                  <Progress value={currentProgress} className="h-1.5" />
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Sin bloque activo</span>
            )}
          </div>

          {/* CTA */}
          <div className="p-4 flex items-center justify-center">
            <Link to="/daily" className="w-full">
              <Button className="w-full gap-2" size="lg">
                <Zap className="h-4 w-4" />
                Ver mi día completo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
