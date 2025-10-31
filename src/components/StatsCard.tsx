import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export const StatsCard = ({ title, value, icon: Icon, iconColor = "text-primary" }: StatsCardProps) => {
  return (
    <Card className="p-6 card-glass">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg bg-secondary", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
