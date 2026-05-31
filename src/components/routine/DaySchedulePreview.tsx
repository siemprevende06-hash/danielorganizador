import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Moon, GraduationCap, Briefcase, FolderKanban, Dumbbell, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RoutineBlock } from "@/hooks/useRoutineBlocksDB";

interface DaySchedulePreviewProps {
  date: Date;
  blocks: RoutineBlock[];
  excludedBlockIds: string[];
  wakeTime: string;
  sleepTime: string;
  sleepHours: number;
}

const FOCUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  universidad: GraduationCap,
  emprendimiento: Briefcase,
  proyectos: FolderKanban,
};

const FOCUS_COLORS: Record<string, string> = {
  universidad: 'text-blue-500',
  emprendimiento: 'text-purple-500',
  proyectos: 'text-green-500',
};

export function DaySchedulePreview({
  date,
  blocks,
  excludedBlockIds,
  wakeTime,
  sleepTime,
  sleepHours,
}: DaySchedulePreviewProps) {
  const activeBlocks = useMemo(() => {
    return blocks.filter(block => !excludedBlockIds.includes(block.id));
  }, [blocks, excludedBlockIds]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${minutes} ${period}`;
  };

  const stats = useMemo(() => {
    let deepWorkBlocks = 0;
    let productiveHours = 0;

    activeBlocks.forEach(block => {
      if (block.blockType === 'configurable' || block.blockType === 'dinamico') {
        deepWorkBlocks++;
        const [startH, startM] = block.startTime.split(':').map(Number);
        let [endH, endM] = block.endTime.split(':').map(Number);
        if (endH < startH) endH += 24;
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        productiveHours += duration / 60;
      }
    });

    return { deepWorkBlocks, productiveHours, sleepHours };
  }, [activeBlocks, sleepHours]);

  const getBlockIcon = (block: RoutineBlock) => {
    const focus = block.currentFocus || block.defaultFocus;
    if (focus && FOCUS_ICONS[focus]) {
      return FOCUS_ICONS[focus];
    }
    if (block.title.includes('Gym')) return Dumbbell;
    if (block.title.includes('Desayuno') || block.title.includes('Almuerzo')) return Coffee;
    return Clock;
  };

  const getBlockColor = (block: RoutineBlock) => {
    const focus = block.currentFocus || block.defaultFocus;
    if (focus && FOCUS_COLORS[focus]) {
      return FOCUS_COLORS[focus];
    }
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Vista Previa: {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
          <Badge variant="secondary" className="text-blue-500">
            🎯 {stats.deepWorkBlocks} bloques productivos
          </Badge>
          <Badge variant="secondary" className="text-purple-500">
            ⏰ {stats.productiveHours.toFixed(1)}h trabajo
          </Badge>
          <Badge variant="secondary" className="text-indigo-500">
            😴 {stats.sleepHours}h sueño
          </Badge>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1">
            {/* Wake time indicator */}
            <div className="flex items-center gap-3 py-2 px-3 bg-amber-500/10 rounded-lg">
              <span className="text-sm font-mono text-amber-500 w-20">{formatTime(wakeTime)}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-amber-500">☀️</span>
                <span className="font-medium">Despertar</span>
              </div>
            </div>

            {activeBlocks.map((block, index) => {
              const Icon = getBlockIcon(block);
              const color = getBlockColor(block);
              const isExcluded = excludedBlockIds.includes(block.id);
              const focus = block.currentFocus || block.defaultFocus;

              if (isExcluded) return null;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
                    (block.blockType === 'configurable' || block.blockType === 'dinamico')
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <span className="text-sm font-mono text-muted-foreground w-20">
                    {formatTime(block.startTime)}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", color)} />
                    <span className={cn(
                      "font-medium",
                      block.blockType === 'evitar' && 'text-red-500'
                    )}>
                      {block.title}
                    </span>
                    {focus && focus !== 'none' && (
                      <Badge variant="outline" className={cn("text-xs", FOCUS_COLORS[focus])}>
                        {focus === 'universidad' ? 'UNI' : focus === 'emprendimiento' ? 'EMP' : 'PROJ'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(block.endTime)}
                  </span>
                </div>
              );
            })}

            {/* Sleep time indicator */}
            <div className="flex items-center gap-3 py-2 px-3 bg-indigo-500/10 rounded-lg">
              <span className="text-sm font-mono text-indigo-500 w-20">{formatTime(sleepTime)}</span>
              <div className="flex-1 flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-indigo-500">Sueño ({sleepHours}h)</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {excludedBlockIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500">❌</span> {excludedBlockIds.length} bloque{excludedBlockIds.length > 1 ? 's' : ''} excluido{excludedBlockIds.length > 1 ? 's' : ''} en esta configuración
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
