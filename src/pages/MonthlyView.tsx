import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyTasks } from '@/components/monthly/MonthlyTasks';
import { MonthlySystemsStats } from '@/components/systems/MonthlySystemsStats';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { getQuarterFromDate } from '@/lib/hierarchy';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';

export default function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { quarter, year } = getQuarterFromDate(currentMonth);
  const monthIndex = currentMonth.getMonth() - (quarter - 1) * 3;

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() + (dir === 'prev' ? -1 : 1));
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mes {monthIndex + 1} de Q{quarter} · {year}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <PeriodControlSection scope="month" start={monthStart} end={monthEnd} />

        {/* Eventos section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Eventos</h2>
          <NotionCalendar />
        </section>

        {/* Tareas section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Tareas</h2>
          <MonthlyTasks currentMonth={currentMonth} />
        </section>

        {/* Sistemas section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Sistemas</h2>
          <MonthlySystemsStats monthDate={currentMonth} />
        </section>

        {/* Mejora section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Mejora</h2>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <MejoraProcessPanel anchorDate={monthStart} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}