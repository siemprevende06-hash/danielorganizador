import { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Target, Book, Music, Gamepad2, Palette, Globe, Code, Briefcase, ListTodo, GraduationCap, FolderKanban, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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

function NoteCard({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Card className="overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0">
            {icon}
          </div>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Meta para ${label.toLowerCase()}...`}
          className="h-7 text-xs"
        />
      </CardContent>
    </Card>
  );
}

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

  const setNote = (key: string, value: string) => {
    updatePlanData(p => ({ ...p, notes: { ...p.notes, [key]: value } }));
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

          {/* ===== ÁREA: DESARROLLO PERSONAL ===== */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
              <div>
                <h2 className="text-base font-bold">Desarrollo Personal</h2>
                <p className="text-[10px] text-muted-foreground">Crecimiento intelectual, creatividad y bienestar</p>
              </div>
            </div>

            {/* Sub-área: Lectura */}
            <div className="space-y-2 pl-4 border-l-2 border-emerald-200/50">
              <div className="flex items-center gap-2">
                <Book className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Lectura</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <BookPlannerWidget planData={planData} updatePlanData={updatePlanData} items={bookItems} monthKey={activeMonthKey} />
              </div>
            </div>

            {/* Sub-área: Música */}
            <div className="space-y-2 pl-4 border-l-2 border-rose-200/50">
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Música</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <SongPlannerWidget planData={planData} updatePlanData={updatePlanData} items={songItems} monthKey={activeMonthKey} />
              </div>
            </div>

            {/* Sub-área: Hobbies */}
            <div className="space-y-2 pl-4 border-l-2 border-amber-200/50">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Hobbies</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Ajedrez" value={planData.notes.ajedrez || ''} onChange={v => setNote('ajedrez', v)} />
                <NoteCard icon={<Palette className="h-3.5 w-3.5" />} label="Dibujo" value={planData.notes.dibujo || ''} onChange={v => setNote('dibujo', v)} />
              </div>
            </div>

            {/* Sub-área: Habilidades Valiosas */}
            <div className="space-y-2 pl-4 border-l-2 border-cyan-200/50">
              <div className="flex items-center gap-2">
                <Code className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Habilidades Valiosas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<Globe className="h-3.5 w-3.5" />} label="Idiomas" value={planData.notes.idiomas || ''} onChange={v => setNote('idiomas', v)} />
                <NoteCard icon={<Code className="h-3.5 w-3.5" />} label="Habilidades Técnicas" value={planData.notes.habilidades_tecnicas || ''} onChange={v => setNote('habilidades_tecnicas', v)} />
              </div>
            </div>

            {/* Sub-área: Metas Personales */}
            <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Metas Personales</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <GoalPlannerWidget planData={planData} updatePlanData={updatePlanData} />
              </div>
            </div>
          </div>

          {/* ===== ÁREA: PROFESIONAL ACADÉMICO ===== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" />
              <div>
                <h2 className="text-base font-bold">Profesional Académico</h2>
                <p className="text-[10px] text-muted-foreground">Carrera, estudios y proyectos</p>
              </div>
            </div>

            {/* Sub-área: Universidad */}
            <div className="space-y-2 pl-4 border-l-2 border-blue-200/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Universidad</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <SubjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={subjectItems} topics={[]} />
              </div>
            </div>

            {/* Sub-área: Proyectos */}
            <div className="space-y-2 pl-4 border-l-2 border-amber-200/50">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Proyectos</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ProjectPlannerWidget planData={planData} updatePlanData={updatePlanData} items={projectItems} />
              </div>
            </div>

            {/* Sub-área: Emprendimiento */}
            <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Emprendimiento</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<Briefcase className="h-3.5 w-3.5" />} label="Enfoque" value={planData.notes.emprendimiento || ''} onChange={v => setNote('emprendimiento', v)} />
              </div>
            </div>

            {/* Sub-área: Tareas */}
            <div className="space-y-2 pl-4 border-l-2 border-emerald-200/50">
              <div className="flex items-center gap-2">
                <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tareas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<ListTodo className="h-3.5 w-3.5" />} label="Áreas de enfoque" value={planData.notes.tareas || ''} onChange={v => setNote('tareas', v)} />
              </div>
            </div>

            {/* Sub-área: Eventos */}
            <div className="space-y-2 pl-4 border-l-2 border-red-200/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Eventos</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <EventPlannerWidget planData={planData} updatePlanData={updatePlanData} items={eventItems} />
              </div>
            </div>
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
        Selecciona un mes arriba y organiza tus áreas de vida
      </p>
    </div>
  );
}
