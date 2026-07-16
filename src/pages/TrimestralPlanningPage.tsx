import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTrimestralPlan, getQuarterFromDate, type TrimestralPlanData } from '@/hooks/useTrimestralPlan';
import {
  BookPlannerWidget,
  SongPlannerWidget,
  ProjectPlannerWidget,
  SubjectPlannerWidget,
  EventPlannerWidget,
  GoalPlannerWidget,
} from '@/components/monthly-planning/MonthlyPlanWidgets';
import { DragDropDistribution } from '@/components/planning/DragDropDistribution';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Q_MONTHS = ['Primer mes', 'Segundo mes', 'Tercer mes'];

export default function TrimestralPlanningPage() {
  const now = new Date();
  const { quarter: currentQ, year: currentY } = getQuarterFromDate(now);
  const [quarter, setQuarter] = useState(currentQ);
  const [year, setYear] = useState(currentY);

  const {
    planData, loading, saving,
    books, songs, projects, subjects, events,
    updatePlanData, savePlan, autoDistribute,
    getMonthNamesForQuarter,
  } = useTrimestralPlan(quarter, year);
  const { toast } = useToast();

  const monthLabels = getMonthNamesForQuarter();

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
    const distributed = autoDistribute();
    await savePlan(distributed || undefined);
    toast({ title: 'Plan trimestral guardado', description: `Q${quarter} ${year} actualizado.` });
  };

  const bookItems = books.map(b => ({ id: b.id, title: b.title, subtitle: b.author || undefined }));
  const songItems = songs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist ? `${s.artist} · ${s.instrument}` : s.instrument }));
  const projectItems = projects.map(p => ({ id: p.id, title: p.name }));
  const subjectItems = subjects.map(s => ({ id: s.id, title: s.name }));
  const eventItems = events.map(e => ({ id: e.id, title: e.title, subtitle: `${format(new Date(e.event_date), 'd MMM', { locale: es })} · ${e.category}` }));

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <BookPlannerWidget planData={planData} updatePlanData={updatePlanData} items={bookItems} />
            <SongPlannerWidget planData={planData} updatePlanData={updatePlanData} items={songItems} />
            <ProjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={projectItems} />
            <SubjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={subjectItems} topics={[]} />
            <EventPlannerWidget planData={planData} updatePlanData={updatePlanData} items={eventItems} />
            <GoalPlannerWidget planData={planData} updatePlanData={updatePlanData} />
          </div>

          {(planData.books.selected.length > 0 || planData.songs.selected.length > 0) && (
            <DragDropDistribution
              distribution={planData.distribution}
              books={books}
              songs={songs}
              monthLabels={monthLabels}
              onDistributionChange={dist => updatePlanData(p => ({ ...p, distribution: dist }))}
              onAutoDistribute={() => {
                const result = autoDistribute();
                if (result) updatePlanData(() => result);
              }}
            />
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Define tus metas para el trimestre y distribúyelas por mes
      </p>
    </div>
  );
}
