import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  id: string;
  title: string;
  streak: number;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const HabitCard = ({ id, title, streak, completed, onToggle }: HabitCardProps) => {
  return (
    <Card className={cn(
      "p-4 transition-all duration-300 hover:shadow-md card-glass",
      completed && "border-success"
    )}>
      <div className="flex items-center gap-4">
        <Checkbox 
          checked={completed}
          onCheckedChange={() => onToggle(id)}
          className="h-6 w-6"
        />
        <div className="flex-1">
          <h3 className={cn(
            "font-semibold text-lg transition-colors",
            completed && "text-success"
          )}>
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">
              {streak} días de racha
            </span>
          </div>
        </div>
        {completed && (
          <div className="flex items-center gap-1 text-success">
            <TrendingUp className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
};
