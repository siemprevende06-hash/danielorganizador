import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Target, Book, Music, Gamepad2, Palette, Globe, Code, Briefcase, ListTodo, GraduationCap, FolderKanban, Calendar, Heart, Brain, BookOpen, ChevronDown, ChevronUp, CheckCircle2, Circle, Dumbbell, Zap, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTrimestralPlan, getQuarterFromDate } from '@/hooks/useTrimestralPlan';
import { ItemSelector } from '@/components/monthly-planning/ItemSelector';
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
        <div className="min-h-[36px]">
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Meta para ${label.toLowerCase()}...`}
            className="h-7 text-xs"
          />
        </div>
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
    books, songs, projects, subjects, events, quarterTasks,
    updatePlanData, savePlan,
    getMonthNamesForQuarter, toggleTaskCompletion, toggleEventCompletion, getMonthRange,
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

  // Split songs by instrument
  const pianoSongs = songs.filter(s => s.instrument === 'piano');
  const guitarSongs = songs.filter(s => s.instrument === 'guitar');

  const activeMonthSongs = planData.distribution[activeMonthKey]?.songs || [];
  const activePianoSelected = pianoSongs.filter(s => activeMonthSongs.includes(s.id)).map(s => s.id);
  const activeGuitarSelected = guitarSongs.filter(s => activeMonthSongs.includes(s.id)).map(s => s.id);

  // Tasks for active month
  const { start: monthStart, end: monthEnd } = getMonthRange(activeMonth);
  const monthTasks = useMemo(() =>
    quarterTasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d >= monthStart && d <= monthEnd;
    }),
    [quarterTasks, monthStart, monthEnd]
  );

  // Events for active month
  const monthEvents = useMemo(() =>
    events.filter(e => {
      const d = new Date(e.event_date);
      return d >= monthStart && d <= monthEnd;
    }),
    [events, monthStart, monthEnd]
  );

  const handleSongChange = (sectionIds: string[], section: "piano" | "guitar") => {
    const sectionItems = section === "piano" ? pianoSongs : guitarSongs;
    const otherIds = section === "piano" ? activeGuitarSelected : activePianoSelected;
    const merged = [...new Set([...sectionIds, ...otherIds])];
    updatePlanData(p => ({
      ...p,
      distribution: {
        ...p.distribution,
        [activeMonthKey]: { ...p.distribution[activeMonthKey], songs: merged },
      },
    }));
  };

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
            {monthLabels.map((label, i) => (
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
                  Mes {i + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Active month label */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Organizando <span className="font-semibold text-indigo-500">{monthLabels[activeMonth]}</span>
            </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ItemSelector
                  items={bookItems}
                  selected={planData.distribution[activeMonthKey]?.books || []}
                  onChange={ids => updatePlanData(p => ({
                    ...p,
                    distribution: {
                      ...p.distribution,
                      [activeMonthKey]: { ...p.distribution[activeMonthKey], books: ids },
                    },
                  }))}
                  placeholder="Seleccionar libros..."
                  searchPlaceholder="Buscar libro..."
                />
              </div>
            </div>

            {/* Sub-área: Hobbies Intelectuales */}
            <div className="space-y-2 pl-4 border-l-2 border-sky-200/50">
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-sky-500" />
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Hobbies Intelectuales</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Ajedrez" value={planData.notes.ajedrez || ''} onChange={v => setNote('ajedrez', v)} />
                <NoteCard icon={<Globe className="h-3.5 w-3.5" />} label="Italiano" value={planData.notes.italiano || ''} onChange={v => setNote('italiano', v)} />
                <NoteCard icon={<Globe className="h-3.5 w-3.5" />} label="Inglés" value={planData.notes.ingles || ''} onChange={v => setNote('ingles', v)} />
                <NoteCard icon={<Sword className="h-3.5 w-3.5" />} label="Game Seducción" value={planData.notes.game_seduccion || ''} onChange={v => setNote('game_seduccion', v)} />
              </div>
            </div>

            {/* Sub-área: Hobbies Artísticos — Canciones */}
            <div className="space-y-2 pl-4 border-l-2 border-rose-200/50">
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Canciones</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">Piano ({pianoSongs.length})</p>
                  <ItemSelector
                    items={pianoSongs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined }))}
                    selected={activePianoSelected}
                    onChange={ids => handleSongChange(ids, "piano")}
                    placeholder="Seleccionar piano..."
                    searchPlaceholder="Buscar canción de piano..."
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">Guitarra ({guitarSongs.length})</p>
                  <ItemSelector
                    items={guitarSongs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined }))}
                    selected={activeGuitarSelected}
                    onChange={ids => handleSongChange(ids, "guitar")}
                    placeholder="Seleccionar guitarra..."
                    searchPlaceholder="Buscar canción de guitarra..."
                  />
                </div>
              </div>
            </div>

            {/* Sub-área: Habilidades Valiosas */}
            <div className="space-y-2 pl-4 border-l-2 border-cyan-200/50">
              <div className="flex items-center gap-2">
                <Code className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Habilidades Valiosas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <NoteCard icon={<Code className="h-3.5 w-3.5" />} label="Habilidades Técnicas" value={planData.notes.habilidades_tecnicas || ''} onChange={v => setNote('habilidades_tecnicas', v)} />
              </div>
            </div>

            {/* Sub-área: Metas Personales */}
            <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Metas Personales</span>
              </div>
              <div className="max-w-md space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar meta personal..."
                    className="h-8 text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                        updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: (e.target as HTMLInputElement).value.trim() }] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                {planData.personal_goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <p className="text-xs flex-1 truncate">{goal.title}</p>
                    <button onClick={() => updatePlanData(p => ({ ...p, personal_goals: p.personal_goals.filter((_, idx) => idx !== i) }))} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-destructive">
                      Eliminar
                    </button>
                  </div>
                ))}
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

            {/* Sub-área: Universidad — Asignaturas */}
            <div className="space-y-2 pl-4 border-l-2 border-blue-200/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Asignaturas</span>
              </div>
              <div className="max-w-md">
                <ItemSelector
                  items={subjects.map(s => ({ id: s.id, title: s.name }))}
                  selected={planData.monthSubjects[activeMonthKey] || []}
                  onChange={ids => updatePlanData(p => ({
                    ...p,
                    monthSubjects: { ...p.monthSubjects, [activeMonthKey]: ids },
                  }))}
                  placeholder="Asignaturas a estudiar este mes..."
                  searchPlaceholder="Buscar asignatura..."
                />
              </div>
            </div>

            {/* Sub-área: Proyectos */}
            <div className="space-y-2 pl-4 border-l-2 border-amber-200/50">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Proyectos</span>
              </div>
              <div className="max-w-md">
                <ItemSelector
                  items={projectItems}
                  selected={planData.monthProjects[activeMonthKey] || []}
                  onChange={ids => updatePlanData(p => ({
                    ...p,
                    monthProjects: { ...p.monthProjects, [activeMonthKey]: ids },
                  }))}
                  placeholder="Seleccionar proyectos para este mes..."
                  searchPlaceholder="Buscar proyecto..."
                />
              </div>
            </div>

            {/* Sub-área: Emprendimiento */}
            <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Emprendimiento</span>
              </div>
              <div className="max-w-md">
                <NoteCard icon={<Briefcase className="h-3.5 w-3.5" />} label="Enfoque del Mes" value={planData.notes.emprendimiento || ''} onChange={v => setNote('emprendimiento', v)} />
              </div>
            </div>

            {/* Sub-área: Tareas del Mes */}
            <div className="space-y-2 pl-4 border-l-2 border-emerald-200/50">
              <div className="flex items-center gap-2">
                <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tareas del Mes</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {monthTasks.filter(t => (planData.completedTasks[activeMonthKey] || []).includes(t.id)).length}/{monthTasks.length} completadas
                </Badge>
              </div>
              {monthTasks.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic pl-1">Sin tareas con fecha en {monthLabels[activeMonth]}</p>
              ) : (
                <div className="space-y-1 max-w-lg">
                  {monthTasks.map(task => {
                    const done = (planData.completedTasks[activeMonthKey] || []).includes(task.id);
                    return (
                      <div key={task.id}
                        className={cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-xs cursor-pointer transition-colors",
                          done ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200" : "hover:bg-muted/30"
                        )}
                        onClick={() => toggleTaskCompletion(activeMonthKey, task.id)}
                      >
                        <Checkbox checked={done} />
                        <span className={cn("flex-1 truncate", done && "line-through text-muted-foreground")}>{task.title}</span>
                        <Badge variant="outline" className="text-[9px] px-1">{task.source}</Badge>
                        {task.due_date && <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(task.due_date), 'd MMM', { locale: es })}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-área: Eventos del Mes */}
            <div className="space-y-2 pl-4 border-l-2 border-red-200/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Eventos del Mes</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {monthEvents.filter(e => (planData.completedEvents[activeMonthKey] || []).includes(e.id)).length}/{monthEvents.length} realizados
                </Badge>
              </div>
              {monthEvents.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic pl-1">Sin eventos en {monthLabels[activeMonth]}</p>
              ) : (
                <div className="space-y-1 max-w-lg">
                  {monthEvents.map(ev => {
                    const done = (planData.completedEvents[activeMonthKey] || []).includes(ev.id);
                    return (
                      <div key={ev.id}
                        className={cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-xs cursor-pointer transition-colors",
                          done ? "bg-red-50/40 dark:bg-red-950/20 border-red-200" : "hover:bg-muted/30"
                        )}
                        onClick={() => toggleEventCompletion(activeMonthKey, ev.id)}
                      >
                        <Checkbox checked={done} />
                        <span className={cn("flex-1 truncate", done && "line-through text-muted-foreground")}>{ev.title}</span>
                        <Badge variant="outline" className="text-[9px] px-1">{ev.category}</Badge>
                        <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(ev.event_date), 'd MMM', { locale: es })}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}