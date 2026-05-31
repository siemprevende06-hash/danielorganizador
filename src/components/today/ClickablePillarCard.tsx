import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ClickablePillarCardProps {
  id: string;
  name: string;
  icon: string;
  progress: number;
  todayCompleted: number;
  todayTotal: number;
  route: string;
  color?: string;
}

export const ClickablePillarCard = ({
  id,
  name,
  icon,
  progress,
  todayCompleted,
  todayTotal,
  route,
  color,
}: ClickablePillarCardProps) => {
  return (
    <Link to={route} className="block group">
      <div className={cn(
        "p-3 rounded-lg border transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 hover:scale-105",
        "cursor-pointer bg-background",
        progress >= 80 && "border-green-500/30 bg-green-500/5"
      )}>
        <div className="text-center space-y-2">
          <div className="text-2xl">{icon}</div>
          <p className="text-xs font-medium truncate">{name}</p>
          <div className="text-lg font-bold">{progress}%</div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {todayCompleted}/{todayTotal} ✓
          </p>
        </div>
      </div>
    </Link>
  );
};
