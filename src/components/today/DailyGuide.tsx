import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, ArrowRight, Lightbulb, Target, AlertTriangle } from 'lucide-react';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useBlockCompletions } from '@/hooks/useBlockCompletions';
import { useWeeklyObjectives } from '@/hooks/useWeeklyObjectives';
import { format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const DailyGuide = () => {
  const { blocks } = useRoutineBlocksDB();
  const { completions } = useBlockCompletions();
  const { objectives } = useWeeklyObjectives();
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;
  const weekStartStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Find current block
  const currentBlock = blocks.find(block => {
    const [startH, startM] = block.startTime.split(':').map(Number);
    const [endH, endM] = block.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
  });

  // Find next block
  const nextBlock = blocks.find(block => {
    const [startH, startM] = block.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    return startMinutes > currentTimeMinutes;
  });

  // Get completed blocks for today
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCompletions = completions.filter(c => c.completion_date === today && c.completed);
  const completedBlockNames = todayCompletions.map(c => {
    const block = blocks.find(b => b.id === c.block_id);
    return block?.title || '';
  }).filter(Boolean);

  // Get current week objectives
  const weekObjectives = objectives.filter(o => o.week_start_date === weekStartStr);
  const lowProgressObjectives = weekObjectives.filter(o => {
    const percent = o.target_value ? ((o.current_value || 0) / o.target_value) * 100 : 0;
    return percent < 40;
  });

  // Calculate time remaining in current block
  const getTimeRemaining = () => {
    if (!currentBlock) return null;
    const [endH, endM] = currentBlock.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const remaining = endMinutes - currentTimeMinutes;
    return remaining;
  };

  const timeRemaining = getTimeRemaining();

  // Find related weekly objective for current block
  const getRelatedObjective = () => {
    if (!currentBlock) return null;
    const blockTitle = currentBlock.title.toLowerCase();
    
    const areaMapping: Record<string, string[]> = {
      'universidad': ['estudio', 'study', 'universidad', 'uni', 'fisica', 'math'],
      'emprendimiento': ['emprendimiento', 'trabajo', 'project', 'siemprevende', 'business'],
      'gym': ['gym', 'ejercicio', 'workout', 'fitness', 'entreno'],
      'idiomas': ['idiomas', 'english', 'ingles', 'italiano', 'language'],
    };

    for (const [area, keywords] of Object.entries(areaMapping)) {
      if (keywords.some(kw => blockTitle.includes(kw))) {
        return weekObjectives.find(o => o.area?.toLowerCase() === area);
      }
    }
    return null;
  };

  const relatedObjective = getRelatedObjective();

  // Get motivational tip based on context
  const getMotivationalTip = () => {
    if (!currentBlock) return "¡Aprovecha cada momento del día!";
    
    const blockTitle = currentBlock.title.toLowerCase();
    
    if (blockTitle.includes('gym')) {
      return "💪 Después del gym, no olvides tu proteína para maximizar la recuperación muscular.";
    }
    if (blockTitle.includes('desayuno') || blockTitle.includes('almuerzo') || blockTitle.includes('comida')) {
      return "🍽️ Recuerda comer suficiente para alcanzar tu meta de 3200 kcal. ¡Cada caloría cuenta!";
    }
    if (blockTitle.includes('deep work') || blockTitle.includes('focus')) {
      return "🎯 Elimina distracciones. Un Pomodoro de 25 minutos de focus profundo vale más que 2 horas distraído.";
    }
    if (blockTitle.includes('idiomas')) {
      return "🌍 La práctica diaria es la clave. 30 minutos hoy te acercan a la fluidez.";
    }
    if (blockTitle.includes('activación')) {
      return "☀️ Gran inicio! La rutina matutina define tu energía para todo el día.";
    }
    
    return "🚀 Mantén el momentum. Cada bloque completado te acerca a tu mejor versión.";
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {format(now, "h:mm a", { locale: es })}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            🧭 Guía del Día
          </Badge>
        </div>

        {/* Current Block */}
        <div className="space-y-2">
          {currentBlock ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estás en:</span>
                <span className="font-bold text-lg">{currentBlock.title}</span>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    ⏳ {timeRemaining} min restantes
                  </Badge>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Sin bloque activo en este momento
            </div>
          )}
        </div>

        {/* Related Weekly Objective */}
        {relatedObjective && (
          <div className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-lg">
            <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Objetivo semanal: </span>
              <span className="font-medium">{relatedObjective.title}</span>
              <span className="text-muted-foreground"> — </span>
              <span className="font-mono text-xs">
                {relatedObjective.current_value || 0}/{relatedObjective.target_value || 1} 
                ({Math.round(((relatedObjective.current_value || 0) / (relatedObjective.target_value || 1)) * 100)}%)
              </span>
            </div>
          </div>
        )}

        {/* Completed blocks */}
        {completedBlockNames.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Ya completaste: </span>
              <span className="text-foreground">
                {completedBlockNames.slice(0, 3).join(', ')}
                {completedBlockNames.length > 3 && ` y ${completedBlockNames.length - 3} más`}
              </span>
            </div>
          </div>
        )}

        {/* Next block */}
        {nextBlock && (
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Próximo:</span>
            <span className="font-medium">{nextBlock.title}</span>
            <span className="text-muted-foreground">({nextBlock.startTime})</span>
          </div>
        )}

        {/* Low progress warning */}
        {lowProgressObjectives.length > 0 && (
          <div className={cn(
            "flex items-start gap-2 p-2 rounded-lg",
            "bg-destructive/10 border border-destructive/20"
          )}>
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Objetivos con bajo progreso:</p>
              <ul className="text-muted-foreground text-xs mt-1">
                {lowProgressObjectives.slice(0, 2).map(o => (
                  <li key={o.id}>• {o.title} ({Math.round(((o.current_value || 0) / (o.target_value || 1)) * 100)}%)</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AI Tip */}
        <div className={cn(
          "flex items-start gap-2 p-3 rounded-lg",
          "bg-amber-500/10 border border-amber-500/20"
        )}>
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {getMotivationalTip()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};