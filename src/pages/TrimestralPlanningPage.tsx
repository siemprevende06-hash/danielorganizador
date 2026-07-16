import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTrimestralPlan, getQuarterFromDate } from '@/hooks/useTrimestralPlan';
import {
  BookPlannerWidget,
  SongPlannerWidget,
  ProjectPlannerWidget,
  SubjectPlannerWidget,
  EventPlannerWidget,
  GoalPlannerWidget,
} from '@/components/monthly-planning/MonthlyPlanWidgets';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

export default function TrimestralPlanningPage() {
  const now = new Date();
  const { quarter: currentQ, year: currentY } = getQuarterFromDate(now);
  const [quarter, setQuarter] = useState(currentQ);
  const [year, setYear] = useState(currentY);
  const [activeMonth, setActiveMonth] = useState(0);

  const {
    planData, loading, saving,
    books, songs, projects, subjects, events,
    updatePlanData, savePlan, autoDistribute,
    getMonthNamesForQuarter,
  } = useTrimestralPlan(quarter, year);
  const { toast } = useToast();

  const monthLabels = getMonthNamesForQuarter();
  const activeMonthKey = MONTH_KEYS[activeMonth];

  const navigateQ = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
      if (quarter === 1) { setQuarter(4); setYear(y => y - 1); }
      else setQuarter(q => q - 1);
    } else {
      if (quarter === 4) { setQuarter(1); setYear(y => y + 1); }
      else setQuarter(q => q + 1);
    }
  };

  const handleSave = async () => {
    await savePlan();
    toast({ title: 'Plan trimestral guardado', description: `Q${quarter} ${year} actualizado.` });
  };

  const bookItems = books.map(b => ({ id: b.id, title: b.title, subtitle: b.author || undefined }));
  const songItems = songs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist ? `${s.artist} · ${s.instrument}` : s.instrument }));
  const projectItems = projects.map(p => ({ id: p.id, title: p.name }));
  const subjectItems = subjects.map(s => ({ id: s.id, title: s.name }));
  const eventItems = events.map(e => ({ id: e.id, title: e.title, subtitle: `${format(new Date(e.event_date), 'd MMM', { locale: es })} · ${e.category}` }));

  const distTotals = MONTH_KEYS.map(k => ({
    books: (planData.distribution[k].books || []).length,
    songs: (planData.distribution[k].songs || []).length,
  }));

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Plan Trimestral</h1>
            <p className="text-sm text-muted-foreground">Metas para 3 meses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" onClick={() => navigateQ('prev')} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[100px] text-center">
              Q{quarter} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateQ('next')} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Month tabs */}
          <div className="flex gap-2">
            {monthLabels.map((label, i) => {
              const total = distTotals[i].books + distTotals[i].songs;
              return (
                <button
                  key={i}
                  onClick={() => setActiveMonth(i)}
                  className={cn(
                    "flex-1 relative rounded-2xl p-3.5 text-left transition-all border-0",
                    activeMonth === i
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                      : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="text-base font-bold">{label}</div>
                  <div className={cn("text-[10px] mt-0.5", activeMonth === i ? "text-white/70" : "text-muted-foreground")}>
                    {total > 0 ? `${total} items` : "Sin asignar"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active month label + quick actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Asignando a <span className="font-semibold text-indigo-500">{monthLabels[activeMonth]}</span>
              {distTotals[activeMonth].books > 0 && <> · {distTotals[activeMonth].books} libros</>}
              {distTotals[activeMonth].songs > 0 && <> · {distTotals[activeMonth].songs} canciones</>}
            </p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500" onClick={autoDistribute}>
              Auto-distribuir
            </Button>
          </div>

          {/* Widgets — book/song use monthKey for per-month assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <BookPlannerWidget planData={planData} updatePlanData={updatePlanData} items={bookItems} monthKey={activeMonthKey} />
            <SongPlannerWidget planData={planData} updatePlanData={updatePlanData} items={songItems} monthKey={activeMonthKey} />
            <ProjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={projectItems} />
            <SubjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={subjectItems} topics={[]} />
            <EventPlannerWidget planData={planData} updatePlanData={updatePlanData} items={eventItems} />
            <GoalPlannerWidget planData={planData} updatePlanData={updatePlanData} />
          </div>

          {/* Distribution summary */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
            {monthLabels.map((label, i) => {
              const t = distTotals[i].books + distTotals[i].songs;
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", activeMonth === i ? "bg-indigo-500" : "bg-muted-foreground/30")} />
                  <span>{label}: <strong>{t}</strong> items</span>
                </div>
              );
            })}
            <span className="text-muted-foreground/40">|</span>
            <span>Total: <strong>{distTotals.reduce((s, d) => s + d.books + d.songs, 0)}</strong></span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Selecciona un mes arriba y elige los libros y canciones para ese mes
      </p>
    </div>
  );
}
