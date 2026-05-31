import { Target, CheckSquare, Zap, Clock } from "lucide-react";

interface Props {
  blocksCompleted: number;
  blocksTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
}

export function ObjectiveSummary({
  blocksCompleted,
  blocksTotal,
  tasksCompleted,
  tasksTotal,
  habitsCompleted,
  habitsTotal,
  focusMinutes
}: Props) {
  const calculatePercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 50) return 'text-foreground';
    return 'text-destructive';
  };

  const stats = [
    {
      icon: Target,
      label: 'Bloques completados',
      value: `${blocksCompleted}/${blocksTotal}`,
      percentage: calculatePercentage(blocksCompleted, blocksTotal)
    },
    {
      icon: CheckSquare,
      label: 'Tareas completadas',
      value: `${tasksCompleted}/${tasksTotal}`,
      percentage: calculatePercentage(tasksCompleted, tasksTotal)
    },
    {
      icon: Zap,
      label: 'Hábitos realizados',
      value: `${habitsCompleted}/${habitsTotal}`,
      percentage: calculatePercentage(habitsCompleted, habitsTotal)
    },
    {
      icon: Clock,
      label: 'Tiempo de foco',
      value: `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}min`,
      percentage: null
    }
  ];

  const overallPercentage = Math.round(
    (calculatePercentage(blocksCompleted, blocksTotal) +
     calculatePercentage(tasksCompleted, tasksTotal) +
     calculatePercentage(habitsCompleted, habitsTotal)) / 3
  );

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Resumen Objetivo
      </h3>

      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-foreground">{stat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{stat.value}</span>
              {stat.percentage !== null && (
                <span className={`text-sm font-medium ${getPercentageColor(stat.percentage)}`}>
                  ({stat.percentage}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall Score */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Productividad General</span>
          <span className={`text-2xl font-bold ${getPercentageColor(overallPercentage)}`}>
            {overallPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}
