import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SplitSquareVertical, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubBlock {
  id: string;
  title: string;
  duration: number; // in minutes
  completed?: boolean;
  focus?: string;
}

interface SubBlockDividerProps {
  canSubdivide: boolean;
  subBlocks: SubBlock[];
  totalDuration: number; // in minutes
  onSubBlocksChange: (subBlocks: SubBlock[]) => void;
  onToggleSubBlockComplete?: (subBlockId: string) => void;
}

export const SubBlockDivider = ({
  canSubdivide,
  subBlocks,
  totalDuration,
  onSubBlocksChange,
  onToggleSubBlockComplete,
}: SubBlockDividerProps) => {
  const [isExpanded, setIsExpanded] = useState(subBlocks.length > 0);

  if (!canSubdivide) return null;

  const generateSubBlocks = (count: number) => {
    const durationPerBlock = Math.floor(totalDuration / count);
    const newSubBlocks: SubBlock[] = [];
    
    for (let i = 0; i < count; i++) {
      newSubBlocks.push({
        id: `sub-${Date.now()}-${i}`,
        title: `Pomodoro ${i + 1}`,
        duration: durationPerBlock,
        completed: false,
      });
    }
    
    onSubBlocksChange(newSubBlocks);
  };

  const updateSubBlockTitle = (id: string, title: string) => {
    onSubBlocksChange(
      subBlocks.map((sb) => (sb.id === id ? { ...sb, title } : sb))
    );
  };

  const removeSubBlock = (id: string) => {
    onSubBlocksChange(subBlocks.filter((sb) => sb.id !== id));
  };

  const completedCount = subBlocks.filter((sb) => sb.completed).length;
  const progress = subBlocks.length > 0 ? (completedCount / subBlocks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SplitSquareVertical className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Sub-bloques (30 min c/u)</label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Ocultar" : "Mostrar"}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          {subBlocks.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Divide este bloque en intervalos de 30 minutos
              </p>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    variant="outline"
                    size="sm"
                    onClick={() => generateSubBlocks(count)}
                    disabled={totalDuration < count * 30}
                  >
                    {count}x {Math.floor(totalDuration / count)} min
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span>{completedCount}/{subBlocks.length}</span>
              </div>

              {/* Sub-blocks list */}
              <div className="space-y-2">
                {subBlocks.map((subBlock, index) => (
                  <div
                    key={subBlock.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md border transition-all",
                      subBlock.completed
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-background border-border/50 hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={subBlock.completed}
                      onCheckedChange={() => onToggleSubBlockComplete?.(subBlock.id)}
                    />
                    <Input
                      value={subBlock.title}
                      onChange={(e) => updateSubBlockTitle(subBlock.id, e.target.value)}
                      className={cn(
                        "flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0",
                        subBlock.completed && "line-through text-muted-foreground"
                      )}
                    />
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {subBlock.duration}m
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSubBlock(subBlock.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Clear button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => onSubBlocksChange([])}
              >
                Eliminar división
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
