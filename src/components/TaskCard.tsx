import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
}

export const TaskCard = ({ id, title, completed, onToggle }: TaskCardProps) => {
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
            "font-medium text-lg transition-colors",
            completed && "line-through text-muted-foreground"
          )}>
            {title}
          </h3>
        </div>
        {completed && (
          <CheckCircle2 className="h-5 w-5 text-success" />
        )}
      </div>
    </Card>
  );
};
