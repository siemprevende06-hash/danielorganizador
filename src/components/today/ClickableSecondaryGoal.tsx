import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check, ExternalLink } from 'lucide-react';

interface ClickableSecondaryGoalProps {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  route?: string;
  onToggle?: () => void;
}

export const ClickableSecondaryGoal = ({
  id,
  name,
  icon,
  completed,
  route,
  onToggle,
}: ClickableSecondaryGoalProps) => {
  const content = (
    <div className={cn(
      "p-3 rounded-lg border transition-all duration-200 text-center",
      "hover:shadow-md hover:border-primary/30 cursor-pointer",
      completed && "border-green-500/30 bg-green-500/5"
    )}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs font-medium">{name}</p>
      {completed ? (
        <div className="mt-1 flex items-center justify-center gap-1 text-green-600">
          <Check className="w-3 h-3" />
          <span className="text-xs">Hecho</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
      )}
      {route && (
        <ExternalLink className="w-3 h-3 mx-auto mt-1 text-muted-foreground" />
      )}
    </div>
  );

  if (route) {
    return <Link to={route} className="block">{content}</Link>;
  }

  return (
    <div onClick={onToggle}>
      {content}
    </div>
  );
};
