import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function LanguageQuickStats({
  progress,
  todayMinutes,
  dailyGoal,
  weeklyTotal,
  weeklyPercent,
}: {
  progress: { completed: number; total: number; percentage: number };
  todayMinutes: number;
  dailyGoal: number;
  weeklyTotal: number;
  weeklyPercent: number;
}) {
  const todayPercent = dailyGoal > 0 ? Math.min((todayMinutes / dailyGoal) * 100, 100) : 0;

  const cards = [
    {
      key: 'skills',
      label: 'Habilidades hoy',
      value: `${progress.completed}/${progress.total}`,
      suffix: '',
      percent: progress.percentage,
      icon: CheckCircle2,
      tone: 'text-success',
      bg: 'bg-success/10',
    },
    {
      key: 'today',
      label: 'Tiempo hoy',
      value: `${todayMinutes}`,
      suffix: 'min',
      percent: todayPercent,
      icon: Clock3,
      tone: 'text-info',
      bg: 'bg-info/10',
      hint: dailyGoal > 0 ? `Meta: ${dailyGoal} min` : 'Sin meta diaria',
    },
    {
      key: 'week',
      label: 'Esta semana',
      value: `${weeklyTotal}`,
      suffix: 'min',
      percent: weeklyPercent,
      icon: CalendarDays,
      tone: 'text-focus',
      bg: 'bg-focus/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(card => (
        <Card key={card.key} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.tone)} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">
              {card.value}
              {card.suffix && <span className="ml-1 text-xs font-medium text-muted-foreground">{card.suffix}</span>}
            </p>
            <p className="min-h-[16px] text-[11px] text-muted-foreground">{'hint' in card ? card.hint : '\u00A0'}</p>
            <Progress value={card.percent} className="mt-1.5 h-1.5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
