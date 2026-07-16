import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { GoalDistribution } from '@/components/planning/GoalDistribution';
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
  } = useTrimestralPlan(quarter, year);
  const { toast } = useToast();

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
  const songItems = songs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist ? `${s.artist} ┬À ${s.instrument}` : s.instrument }));
  const projectItems = projects.map(p => ({ id: p.id, title: p.name }));
  const subjectItems = subjects.map(s => ({ id: s.id, title: s.name }));
  const eventItems = events.map(e => ({ id: e.id, title: e.title, subtitle: `${format(new Date(e.event_date), 'd MMM', { locale: es })} ┬À ${e.category}` }));

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

          {(planData.books.goal > 0 || planData.songs.goal > 0) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-indigo-400" />
                <span className="text-sm font-semibold">Distribuci├│n por meses</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500" onClick={autoDistribute}>
                  Auto-distribuir
                </Button>
              </div>
              <GoalDistribution
                label="libros"
                icon={<span className="text-xs">­ƒôÜ</span>}
                total={planData.books.goal}
                distribution={{
                  month1: planData.distribution.month1.books,
                  month2: planData.distribution.month2.books,
                  month3: planData.distribution.month3.books,
                }}
                onChange={dist => updatePlanData(p => ({ ...p, distribution: { ...p.distribution, month1: { ...p.distribution.month1, books: dist.month1 }, month2: { ...p.distribution.month2, books: dist.month2 }, month3: { ...p.distribution.month3, books: dist.month3 } } }))}
                monthLabels={Q_MONTHS}
              />
              <GoalDistribution
                label="canciones"
                icon={<span className="text-xs">­ƒÄÁ</span>}
                total={planData.songs.goal}
                distribution={{
                  month1: planData.distribution.month1.songs,
                  month2: planData.distribution.month2.songs,
                  month3: planData.distribution.month3.songs,
                }}
                onChange={dist => updatePlanData(p => ({ ...p, distribution: { ...p.distribution, month1: { ...p.distribution.month1, songs: dist.month1 }, month2: { ...p.distribution.month2, songs: dist.month2 }, month3: { ...p.distribution.month3, songs: dist.month3 } } }))}
                monthLabels={Q_MONTHS}
              />
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Define tus metas para el trimestre y distrib├║yelas por mes
      </p>
    </div>
  );
}
