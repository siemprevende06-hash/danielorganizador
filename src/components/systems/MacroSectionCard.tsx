import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  completed: number;
  total: number;
  description: string;
  children: React.ReactNode;
}

export function MacroSectionCard({
  title, subtitle, icon: Icon, gradient, borderColor,
  completed, total, description, children,
}: Props) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className={cn("border-2 overflow-hidden", borderColor)}>
      <div className={cn("p-4 md:p-5 bg-gradient-to-r", gradient)}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-background/80 backdrop-blur">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">{title}</h2>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-base font-bold shrink-0">
            {percent}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2 italic">{description}</p>
        <div className="flex items-center gap-2">
          <Progress value={percent} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{completed}/{total}</span>
        </div>
      </div>
      <div className="p-3 md:p-4 space-y-3 bg-card">
        {children}
      </div>
    </Card>
  );
}
