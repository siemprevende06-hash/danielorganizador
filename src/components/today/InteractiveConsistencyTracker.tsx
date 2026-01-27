import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { 
  GraduationCap, 
  Briefcase, 
  Rocket, 
  Dumbbell, 
  Globe, 
  Music, 
  BookOpen,
  Gamepad2,
  Tv,
  X,
  Plus,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PillarMetrics {
  university: { tasks: number; hours: number };
  entrepreneurship: { tasks: number };
  project: { tasks: number };
}

export function InteractiveConsistencyTracker() {
  const { 
    getActivity, 
    getActivityStatus, 
    getTotalMinutes,
    markComplete, 
    addBonusTime, 
    unmarkActivity,
    isLoading: activitiesLoading 
  } = useActivityTracking();

  const [pillarMetrics, setPillarMetrics] = useState<PillarMetrics>({
    university: { tasks: 0, hours: 0 },
    entrepreneurship: { tasks: 0 },
    project: { tasks: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [bonusActivity, setBonusActivity] = useState<string | null>(null);
  const [bonusMinutes, setBonusMinutes] = useState('15');

  const loadPillarMetrics = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    // University tasks
    const { data: uniTasks } = await supabase
      .from('tasks')
      .select('id, completed')
      .eq('area_id', 'universidad')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    // Entrepreneurship tasks
    const { data: entTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, completed')
      .eq('due_date', today);

    // Project tasks
    const { data: projTasks } = await supabase
      .from('tasks')
      .select('id, completed')
      .eq('area_id', 'proyectos-personales')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    // Language sessions
    const { data: langSession } = await supabase
      .from('language_sessions')
      .select('total_duration')
      .eq('session_date', today)
      .maybeSingle();

    setPillarMetrics({
      university: {
        tasks: (uniTasks || []).filter(t => t.completed).length,
        hours: 0, // Would need block completion tracking
      },
      entrepreneurship: {
        tasks: (entTasks || []).filter(t => t.completed).length,
      },
      project: {
        tasks: (projTasks || []).filter(t => t.completed).length,
      },
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPillarMetrics();
  }, [loadPillarMetrics]);

  const handleActivityTap = (activityType: string) => {
    const status = getActivityStatus(activityType);
    
    if (status === 'incomplete') {
      markComplete(activityType);
    } else {
      // Open bonus dialog
      setBonusActivity(activityType);
      setBonusDialogOpen(true);
    }
  };

  const handleAddBonus = () => {
    if (bonusActivity && bonusMinutes) {
      addBonusTime(bonusActivity, parseInt(bonusMinutes));
      setBonusDialogOpen(false);
      setBonusActivity(null);
      setBonusMinutes('15');
    }
  };

  const handleUnmark = (activityType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unmarkActivity(activityType);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-success/20 border-success text-success';
      case 'bonus': return 'bg-success/20 border-amber-500 text-success ring-2 ring-amber-500/50';
      case 'partial': return 'bg-warning/20 border-warning text-warning';
      default: return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    }
  };

  const getPillarColor = (hasActivity: boolean) => {
    return hasActivity ? 'bg-success/20 border-success' : 'bg-muted border-muted-foreground/20';
  };

  // Calculate overall score
  const calculateScore = () => {
    let score = 0;
    const maxScore = 100;

    // Pillars (50 points max)
    if (pillarMetrics.university.tasks > 0) score += 10;
    if (pillarMetrics.entrepreneurship.tasks > 0) score += 10;
    if (pillarMetrics.project.tasks > 0) score += 10;
    if (getActivityStatus('gym') !== 'incomplete') score += 10;
    if (getActivityStatus('idiomas') !== 'incomplete') score += 10;

    // Secondary (50 points max)
    const pianoStatus = getActivityStatus('piano');
    const guitarStatus = getActivityStatus('guitarra');
    if (pianoStatus !== 'incomplete' || guitarStatus !== 'incomplete') score += 12.5;
    if (getActivityStatus('ajedrez') !== 'incomplete') score += 12.5;
    if (getActivityStatus('lectura') !== 'incomplete') score += 12.5;
    if (getActivityStatus('got') !== 'incomplete') score += 12.5;

    return Math.round(score);
  };

  if (isLoading || activitiesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const score = calculateScore();

  return (
    <div className="space-y-4">
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">Mi Constancia Hoy</h3>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-lg font-bold px-3 py-1",
            score >= 80 ? "border-success text-success" : 
            score >= 50 ? "border-warning text-warning" : 
            "border-muted-foreground"
          )}
        >
          {score}/100
        </Badge>
      </div>

      <Progress value={score} className="h-2" />

      {/* Main Pillars */}
      <div className="space-y-2">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Pilares Principales</h4>
        <div className="grid grid-cols-1 gap-2">
          {/* University */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            getPillarColor(pillarMetrics.university.tasks > 0)
          )}>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Universidad</span>
                <p className="text-xs text-muted-foreground">
                  {pillarMetrics.university.tasks} tareas
                </p>
              </div>
            </div>
            {pillarMetrics.university.tasks > 0 && (
              <Badge variant="outline" className="bg-success/20 border-success text-success">
                ✓
              </Badge>
            )}
          </div>

          {/* Entrepreneurship */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            getPillarColor(pillarMetrics.entrepreneurship.tasks > 0)
          )}>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Emprendimiento</span>
                <p className="text-xs text-muted-foreground">
                  {pillarMetrics.entrepreneurship.tasks} tareas
                </p>
              </div>
            </div>
            {pillarMetrics.entrepreneurship.tasks > 0 && (
              <Badge variant="outline" className="bg-success/20 border-success text-success">
                ✓
              </Badge>
            )}
          </div>

          {/* Project */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all",
            getPillarColor(pillarMetrics.project.tasks > 0)
          )}>
            <div className="flex items-center gap-3">
              <Rocket className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Proyecto</span>
                <p className="text-xs text-muted-foreground">
                  {pillarMetrics.project.tasks} tareas
                </p>
              </div>
            </div>
            {pillarMetrics.project.tasks > 0 && (
              <Badge variant="outline" className="bg-success/20 border-success text-success">
                ✓
              </Badge>
            )}
          </div>

          {/* Gym - Interactive */}
          <button
            onClick={() => handleActivityTap('gym')}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
              getStatusColor(getActivityStatus('gym'))
            )}
          >
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Gym</span>
                <p className="text-xs opacity-70">
                  {getTotalMinutes('gym') > 0 ? `${getTotalMinutes('gym')} min` : '60 min objetivo'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getActivityStatus('gym') !== 'incomplete' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleUnmark('gym', e)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </button>

          {/* Languages - Interactive */}
          <button
            onClick={() => handleActivityTap('idiomas')}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
              getStatusColor(getActivityStatus('idiomas'))
            )}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Idiomas</span>
                <p className="text-xs opacity-70">
                  {getTotalMinutes('idiomas') > 0 ? `${getTotalMinutes('idiomas')} min` : '30-90 min'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getActivityStatus('idiomas') !== 'incomplete' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleUnmark('idiomas', e)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Secondary Goals */}
      <div className="space-y-2">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Metas Secundarias</h4>
        <div className="grid grid-cols-2 gap-2">
          {/* Music (Piano/Guitarra) */}
          <button
            onClick={() => {
              const pianoStatus = getActivityStatus('piano');
              if (pianoStatus === 'incomplete') {
                markComplete('piano');
              } else {
                handleActivityTap('piano');
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]",
              getStatusColor(
                getActivityStatus('piano') !== 'incomplete' || getActivityStatus('guitarra') !== 'incomplete' 
                  ? 'complete' 
                  : 'incomplete'
              )
            )}
          >
            <Music className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">🎹/🎸 Música</span>
            <span className="text-[10px] opacity-70">30 min</span>
            {(getActivityStatus('piano') !== 'incomplete' || getActivityStatus('guitarra') !== 'incomplete') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  unmarkActivity('piano');
                  unmarkActivity('guitarra');
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </button>

          {/* Chess */}
          <button
            onClick={() => handleActivityTap('ajedrez')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]",
              getStatusColor(getActivityStatus('ajedrez'))
            )}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">♟️ Ajedrez</span>
            <span className="text-[10px] opacity-70">1 partida</span>
            {getActivityStatus('ajedrez') !== 'incomplete' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 mt-1"
                onClick={(e) => handleUnmark('ajedrez', e)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </button>

          {/* Reading */}
          <button
            onClick={() => handleActivityTap('lectura')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]",
              getStatusColor(getActivityStatus('lectura'))
            )}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">📖 Lectura</span>
            <span className="text-[10px] opacity-70">
              {getTotalMinutes('lectura') > 0 ? `${getTotalMinutes('lectura')} min` : '30 min'}
            </span>
            {getActivityStatus('lectura') !== 'incomplete' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 mt-1"
                onClick={(e) => handleUnmark('lectura', e)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </button>

          {/* Game of Thrones */}
          <button
            onClick={() => handleActivityTap('got')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg border transition-all min-h-[80px]",
              getStatusColor(getActivityStatus('got'))
            )}
          >
            <Tv className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">🎬 GoT</span>
            <span className="text-[10px] opacity-70">1 capítulo</span>
            {getActivityStatus('got') !== 'incomplete' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 mt-1"
                onClick={(e) => handleUnmark('got', e)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </button>
        </div>
      </div>

      {/* Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Añadir tiempo bonus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={bonusMinutes}
                onChange={(e) => setBonusMinutes(e.target.value)}
                placeholder="15"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutos extra</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBonusDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddBonus} className="flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
