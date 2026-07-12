import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import {
  BookPlannerWidget,
  SongPlannerWidget,
  ProjectPlannerWidget,
  SubjectPlannerWidget,
  EventPlannerWidget,
  GoalPlannerWidget,
} from '@/components/monthly-planning/MonthlyPlanWidgets';
import { InheritedBanner } from '@/components/planning/InheritedBanner';

export default function MonthlyPlanningPage() {
  const [month, setMonth] = useState(new Date());
  const {
    planData, loading, saving,
    books, songs, projects, subjects, topics, events,
    trimestralData,
    updatePlanData, savePlan,
  } = useMonthlyPlan(month);
  const { toast } = useToast();

  const navigateMonth = (dir: 'prev' | 'next') => {
    setMonth(prev => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() + (dir === 'prev' ? -1 : 1));
      return n;
    });
  };

  const handleSave = async () => {
    await savePlan();
    toast({ title: 'Plan guardado', description: `Planificaci├│n de ${format(month, 'MMMM', { locale: es })} actualizada.` });
  };

  const bookItems = books.map(b => ({ id: b.id, title: b.title, subtitle: b.author || undefined }));
  const songItems = songs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist ? `${s.artist} ┬À ${s.instrument}` : s.instrument }));
  const projectItems = projects.map(p => ({ id: p.id, title: p.name }));
  const subjectItems = subjects.map(s => ({ id: s.id, title: s.name }));
  const topicItems = topics.map(t => ({ id: t.id, title: t.title, subtitle: t.subject_id || undefined }));
  const eventItems = events.map(e => ({
    id: e.id,
    title: e.title,
    subtitle: `${format(new Date(e.event_date), 'd MMM', { locale: es })} ┬À ${e.category}`,
  }));

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Planificaci├│n Mensual</h1>
            <p className="text-sm text-muted-foreground">Organiza tu mes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[120px] text-center capitalize">
              {format(month, 'MMMM yyyy', { locale: es })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8">
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
        <div className="space-y-4">
          <InheritedBanner
            trimestral={trimestralData}
            onImport={(action) => {
              if (!trimestralData) return;
              if (action === 'all') {
                updatePlanData(p => ({
                  ...p,
                  books: { ...p.books, goal: trimestralData.books.goal },
                  songs: { ...p.songs, goal: trimestralData.songs.goal },
                }));
              } else if (action === 'auto') {
                const totalBooks = trimestralData.books.goal;
                const totalSongs = trimestralData.songs.goal;
                updatePlanData(p => ({
                  ...p,
                  books: { ...p.books, goal: Math.round(totalBooks / 3) },
                  songs: { ...p.songs, goal: Math.round(totalSongs / 3) },
                }));
              }
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <BookPlannerWidget planData={planData} updatePlanData={updatePlanData} items={bookItems} />
            <SongPlannerWidget planData={planData} updatePlanData={updatePlanData} items={songItems} />
            <ProjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={projectItems} />
            <SubjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={subjectItems} topics={topicItems} />
            <EventPlannerWidget planData={planData} updatePlanData={updatePlanData} items={eventItems} />
            <GoalPlannerWidget planData={planData} updatePlanData={updatePlanData} />
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Los cambios se guardan localmente hasta que presiones "Guardar"
      </p>
    </div>
  );
}
