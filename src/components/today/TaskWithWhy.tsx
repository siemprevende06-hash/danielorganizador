import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkedGoal {
  id: string;
  title: string;
  category: string;
  progress: number;
  contribution?: string;
}

interface TaskWithWhyProps {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  linkedGoal?: LinkedGoal;
  onToggle: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  universidad: "text-blue-600 bg-blue-500/10",
  emprendimiento: "text-purple-600 bg-purple-500/10",
  gym: "text-green-600 bg-green-500/10",
  idiomas: "text-orange-600 bg-orange-500/10",
  proyectos: "text-cyan-600 bg-cyan-500/10",
};

export function TaskWithWhy({ 
  id, 
  title, 
  completed, 
  priority, 
  linkedGoal, 
  onToggle 
}: TaskWithWhyProps) {
  return (
    <div className={cn(
      "group rounded-lg border p-3 transition-all",
      completed 
        ? "bg-muted/50 border-muted" 
        : priority === "high" 
          ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" 
          : "hover:bg-muted/50"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={completed}
          onCheckedChange={() => onToggle(id)}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={id}
              className={cn(
                "text-sm font-medium cursor-pointer",
                completed && "line-through text-muted-foreground"
              )}
            >
              {title}
            </label>
            
            {priority === "high" && !completed && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 border-destructive/50 text-destructive"
              >
                ALTA PRIORIDAD
              </Badge>
            )}
          </div>
          
          {/* Goal Connection - The "Why" */}
          {linkedGoal && !completed && (
            <div className="mt-2 flex items-start gap-2 text-xs">
              <Target className={cn(
                "w-3.5 h-3.5 mt-0.5 shrink-0",
                CATEGORY_COLORS[linkedGoal.category]?.split(' ')[0] || "text-primary"
              )} />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className={cn(
                    "font-medium",
                    CATEGORY_COLORS[linkedGoal.category]?.split(' ')[0]
                  )}>
                    {linkedGoal.title}
                  </span>
                  <span className="text-muted-foreground">
                    ({linkedGoal.progress}%)
                  </span>
                </div>
                {linkedGoal.contribution && (
                  <p className="text-muted-foreground italic flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {linkedGoal.contribution}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
