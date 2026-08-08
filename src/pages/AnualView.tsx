import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PeriodSections from '@/components/hierarchy/PeriodSections';
import { loadQuarterPlan, QUARTER_MONTH_KEYS } from '@/lib/hierarchy';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle, ResultadosPlaceholder, type PeriodViewMode } from '@/components/control/EsfuerzoResultadosToggle';

const QUARTERS = [
  { id: 1, name: 'Q1', dates: 'Ene – Mar' },
  { id: 2, name: 'Q2', dates: 'Abr – Jun' },
  { id: 3, name: 'Q3', dates: 'Jul – Sep' },
  { id: 4, name: 'Q4', dates: 'Oct – Dic' },
];

export default function AnualView() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState<PeriodViewMode>('esfuerzo');
  const currentQuarter = useMemo(() => Math.ceil((new Date().getMonth() + 1) / 3), []);

  const quarterStats = useMemo(() => QUARTERS.map(q => {
    const plan = loadQuarterPlan(q.id, year);
    let minutes = 0;
    QUARTER_MONTH_KEYS.forEach(mk => {
      Object.entries((plan?.timeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
      Object.entries((plan?.areaTimeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
    });
    const books = plan?.distribution
      ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.books || []).length), 0)
      : (plan?.books?.goal || 0);
    const songs = plan?.distribution
      ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.songs || []).length), 0)
      : (plan?.songs?.goal || 0);
    return { ...q, minutes, books, songs, hasPlan: !!plan };
  }), [year]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex justify-center">
          <EsfuerzoResultadosToggle value={viewMode} onChange={setViewMode} withPlan={false} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Año {year}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Vista anual · acumulado de los 4 trimestres</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setYear(new Date().getFullYear())}>Actual</Button>
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'esfuerzo' ? (
          <>
        {/* Panel de control del año */}
        <PeriodControlSection scope="year" start={new Date(year, 0, 1)} end={new Date(year, 11, 31)} />

        {/* Trimestres del año */}
        <div className="grid grid-cols-4 gap-2.5">
          {quarterStats.map(q => {
            const isCurrent = q.id === currentQuarter && year === new Date().getFullYear();
            return (
              <Link
                key={q.id}
                to={`/12-week-year?q=${q.id}`}
                className={cn(
                  "relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"
                )}
                title="Abrir trimestre en 3 Meses"
              >
                <div className="text-lg font-bold">{q.name}</div>
                <div className={cn("text-[10px] mt-0.5", isCurrent ? "text-primary-foreground/70" : "text-muted-foreground")}>{q.dates}</div>
                <div className={cn("mt-2 space-y-0.5 text-[10px]", isCurrent ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  <p>{q.minutes > 0 ? `${q.minutes}min meta` : 'Sin metas'}</p>
                  <p>{q.books > 0 || q.songs > 0 ? `${q.books} libros · ${q.songs} canciones` : 'Sin libros/canciones'}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Secciones del Año (mismo diseño que 3 Meses) */}
        <PeriodSections scope="year" year={year} quarter={currentQuarter} />
          </>
        ) : (
          <ResultadosPlaceholder />
        )}
      </div>
    </div>
  );
}