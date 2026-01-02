import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { CheckCircle2, Circle, Play } from "lucide-react";

export function DayTimeline() {
  const { blocks, getCurrentBlock, isLoaded } = useRoutineBlocksDB();

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const currentBlock = getCurrentBlock();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getBlockStatus = (block: typeof blocks[0]) => {
    const [startH, startM] = block.startTime.split(':').map(Number);
    const [endH, endM] = block.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentBlock?.id === block.id) return 'current';
    if (currentMinutes >= endMinutes) return 'completed';
    return 'upcoming';
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        const status = getBlockStatus(block);
        
        return (
          <div
            key={block.id}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-all
              ${status === 'current' 
                ? 'bg-foreground text-background font-medium' 
                : status === 'completed'
                  ? 'bg-muted/50 text-muted-foreground'
                  : 'hover:bg-muted/50'
              }
            `}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : status === 'current' ? (
                <Play className="w-5 h-5 fill-current" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Time */}
            <span className={`font-mono text-sm w-20 flex-shrink-0 ${
              status === 'current' ? 'text-background' : 'text-muted-foreground'
            }`}>
              {formatTime(block.startTime)}
            </span>

            {/* Title */}
            <span className={`flex-1 truncate ${
              status === 'completed' ? 'line-through' : ''
            }`}>
              {block.title}
            </span>

            {/* Current indicator */}
            {status === 'current' && (
              <span className="text-xs px-2 py-0.5 bg-background text-foreground rounded">
                AHORA
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
