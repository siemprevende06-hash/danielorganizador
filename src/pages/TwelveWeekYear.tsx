import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AreaEffortResultsPanel } from "@/components/areas/AreaEffortResultsPanel";
import { LifeAreaScoresPanel } from "@/components/areas/LifeAreaScoresPanel";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";
import { useTrimestralPlan, getMonthNamesForQuarter, loadTrimestralPlanFromLocal } from "@/hooks/useTrimestralPlan";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BookOpen, Music, Target, Calendar, Flame,
  Zap, BarChart3, Check, Piano, Guitar, LayoutDashboard,
  Brain, Gamepad2, Globe, Code, Sword, Book,
  GraduationCap, FolderKanban, Briefcase, ListTodo,
  Clock, Timer, Heart
} from "lucide-react";
import { ItemSelector } from '@/components/monthly-planning/ItemSelector';

interface TrimestralPlan {
  books: { goal: number; selected: string[] };
  songs: { goal: number; selected: string[] };
  projects: string[];
  monthProjects: Record<string, string[]>;
  monthEntrepreneurships: Record<string, string[]>;
  subjects: { subject_id: string; topics: string[] }[];
  monthSubjects: Record<string, string[]>;
  events: string[];
  personal_goals: { title: string; target?: string }[];
  completedTasks: Record<string, string[]>;
  completedEvents: Record<string, string[]>;
  distribution: {
    month1: { books: string[]; songs: string[] };
    month2: { books: string[]; songs: string[] };
    month3: { books: string[]; songs: string[] };
  };
  notes: Record<string, string>;
}

interface BookDetail { id: string; title: string; author: string | null; cover_image_url: string | null; }
interface SongDetail { id: string; title: string; artist: string | null; instrument: string; }
interface TaskItem { id: string; title: string; source: string; due_date: string; completed: boolean; priority?: string; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }
interface ProjectItem { id: string; name: string; }
interface SubjectItem { id: string; name: string; }
interface MonthlyTimeData { totalMinutes: number; byArea: Record<string, number>; }

interface ProgressData {
  completedBooks: string[];
  completedSongs: string[];
  completedGoals: string[];
  bookProgress: Record<string, number>;
  songProgress: Record<string, number>;
}

const QUARTERS = [
  { id: 1, name: "Q1", dates: "Ene – Mar" },
  { id: 2, name: "Q2", dates: "Abr – Jun" },
  { id: 3, name: "Q3", dates: "Jul – Sep" },
  { id: 4, name: "Q4", dates: "Oct – Dic" },
];

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

const PROGRESS_KEY = "trimestral_progress_Q";

const AREA_LABELS: Record<string, string> = {
  lectura: 'Lectura', musica: 'Música', ajedrez: 'Ajedrez',
  idiomas: 'Idiomas', gym: 'Gimnasio', piano: 'Piano', guitarra: 'Guitarra',
  dibujo: 'Dibujo', italiano: 'Italiano', ingles: 'Inglés',
};

export default function TwelveWeekYear() {
  const [loading, setLoading] = useState(true);
  const { streak: overallStreak } = useOverallSystemStreak();
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  });

  const monthLabels = getMonthNamesForQuarter(selectedQuarter);

  const [plan, setPlan] = useState<TrimestralPlan | null>(null);
  const [books, setBooks] = useState<BookDetail[]>([]);
  const [songs, setSongs] = useState<SongDetail[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [monthTasks, setMonthTasks] = useState<Record<string, TaskItem[]>>({});
  const [monthEvents, setMonthEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [monthlyTimeData, setMonthlyTimeData] = useState<Record<string, MonthlyTimeData>>({});
  const [progress, setProgress] = useState<ProgressData>({
    completedBooks: [], completedSongs: [], completedGoals: [],
    bookProgress: {}, songProgress: {},
  });

  const storageKey = `${PROGRESS_KEY}${selectedQuarter}_2026`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const parsed = loadTrimestralPlanFromLocal(`Q${selectedQuarter}_2026`);
        setPlan(parsed as TrimestralPlan | null);

        const progRaw = localStorage.getItem(storageKey);
        if (progRaw) setProgress(JSON.parse(progRaw));
        else setProgress({ completedBooks: [], completedSongs: [], completedGoals: [], bookProgress: {}, songProgress: {} });

        if (!parsed) { setBooks([]); setSongs([]); setLoading(false); return; }

        const allBookIds = [...new Set([
          ...(parsed.distribution?.month1?.books || []),
          ...(parsed.distribution?.month2?.books || []),
          ...(parsed.distribution?.month3?.books || []),
        ])];
        const allSongIds = [...new Set([
          ...(parsed.distribution?.month1?.songs || []),
          ...(parsed.distribution?.month2?.songs || []),
          ...(parsed.distribution?.month3?.songs || []),
        ])];

        const qStartMonth = (selectedQuarter - 1) * 3;
        const year = 2026;
        const quarterStart = new Date(year, qStartMonth, 1);
        const quarterEnd = new Date(year, qStartMonth + 3, 0);
        const qs = format(quarterStart, 'yyyy-MM-dd');
        const qe = format(quarterEnd, 'yyyy-MM-dd');

        const [booksRes, songsRes, tasksRes, eventsRes] = await Promise.all([
          allBookIds.length > 0
            ? supabase.from("reading_library").select("id, title, author, cover_image_url").in("id", allBookIds)
            : Promise.resolve({ data: [] }),
          allSongIds.length > 0
            ? supabase.from("music_repertoire").select("id, title, artist, instrument").in("id", allSongIds)
            : Promise.resolve({ data: [] }),
          supabase.from('tasks').select('id, title, source, due_date, completed, priority')
            .gte('due_date', qs).lte('due_date', qe),
          supabase.from('calendar_events').select('*')
            .gte('event_date', qs).lte('event_date', qe).order('event_date'),
        ]);
        if (booksRes.data) setBooks(booksRes.data);
        if (songsRes.data) setSongs(songsRes.data);

        try {
          const { data: projData } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'user_projects').maybeSingle();
          if (projData?.setting_value && Array.isArray(projData.setting_value)) {
            setProjects(projData.setting_value.map((p: any) => ({ id: p.id, name: p.name })));
          }
        } catch {}
        const storedSubjects = localStorage.getItem('university_subjects');
        if (storedSubjects) setSubjects(JSON.parse(storedSubjects));

        // Group tasks and events by month
        const tasksByMonth: Record<string, TaskItem[]> = { month1: [], month2: [], month3: [] };
        const eventsByMonth: Record<string, CalendarEvent[]> = { month1: [], month2: [], month3: [] };
        (tasksRes.data || []).forEach((t: any) => {
          if (!t.due_date) return;
          const d = new Date(t.due_date);
          for (let mi = 0; mi < 3; mi++) {
            const ms = new Date(year, qStartMonth + mi, 1);
            const me = new Date(year, qStartMonth + mi + 1, 0);
            if (d >= ms && d <= me) {
              tasksByMonth[`month${mi + 1}`].push(t);
              break;
            }
          }
        });
        (eventsRes.data || []).forEach((e: any) => {
          const d = new Date(e.event_date);
          for (let mi = 0; mi < 3; mi++) {
            const ms = new Date(year, qStartMonth + mi, 1);
            const me = new Date(year, qStartMonth + mi + 1, 0);
            if (d >= ms && d <= me) {
              eventsByMonth[`month${mi + 1}`].push(e);
              break;
            }
          }
        });
        setMonthTasks(tasksByMonth);
        setMonthEvents(eventsByMonth);

        // Load time data per month
        const monthTimes: Record<string, MonthlyTimeData> = {};
        for (let mi = 0; mi < 3; mi++) {
          const ms = new Date(year, qStartMonth + mi, 1);
          const me = new Date(year, qStartMonth + mi + 1, 0);
          const { data: timeRows } = await supabase
            .from('daily_systems_tracking')
            .select('tracking_date, time_data')
            .gte('tracking_date', format(ms, 'yyyy-MM-dd'))
            .lte('tracking_date', format(me, 'yyyy-MM-dd'));
          const byArea: Record<string, number> = {};
          let total = 0;
          (timeRows || []).forEach((row: any) => {
            const td = row.time_data || {};
            Object.entries(td).forEach(([key, val]) => {
              const v = val as number;
              byArea[key] = (byArea[key] || 0) + v;
              total += v;
            });
          });
          monthTimes[`month${mi + 1}`] = { totalMinutes: total, byArea };
        }
        setMonthlyTimeData(monthTimes);

      } catch { toast.error("Error al cargar plan"); }
      setLoading(false);
    };
    load();
  }, [selectedQuarter]);

  const saveProgress = (p: ProgressData) => {
    setProgress(p);
    localStorage.setItem(storageKey, JSON.stringify(p));
  };

  const toggleBook = (id: string) => {
    const next = { ...progress };
    if (next.completedBooks.includes(id)) {
      next.completedBooks = next.completedBooks.filter(i => i !== id);
    } else {
      next.completedBooks.push(id);
    }
    saveProgress(next);
  };

  const toggleSong = (id: string) => {
    const next = { ...progress };
    if (next.completedSongs.includes(id)) {
      next.completedSongs = next.completedSongs.filter(i => i !== id);
    } else {
      next.completedSongs.push(id);
    }
    saveProgress(next);
  };

  const toggleGoal = (title: string) => {
    const next = { ...progress };
    if (next.completedGoals.includes(title)) {
      next.completedGoals = next.completedGoals.filter(g => g !== title);
    } else {
      next.completedGoals.push(title);
    }
    saveProgress(next);
  };

  const getWeekInQuarter = () => {
    const now = new Date();
    const startOfYear = new Date(2026, 0, 1);
    const week = Math.min(Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)), 52);
    return ((week - 1) % 12) + 1;
  };
  const weekInQ = getWeekInQuarter();
  const weekProgress = (weekInQ / 12) * 100;

  const totalBooksTarget = plan?.books?.goal || 0;
  const totalSongsTarget = plan?.songs?.goal || 0;
  const completedBooksCount = progress.completedBooks.length;
  const completedSongsCount = progress.completedSongs.length;
  const completedGoalsCount = progress.completedGoals.length;
  const totalGoalsCount = plan?.personal_goals?.length || 0;

  const bookPct = totalBooksTarget > 0 ? Math.round((completedBooksCount / totalBooksTarget) * 100) : 0;
  const songPct = totalSongsTarget > 0 ? Math.round((completedSongsCount / totalSongsTarget) * 100) : 0;
  const goalsPct = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;
  const overallPct = totalBooksTarget + totalSongsTarget + totalGoalsCount > 0
    ? Math.round((completedBooksCount + completedSongsCount + completedGoalsCount) / (totalBooksTarget + totalSongsTarget + totalGoalsCount) * 100)
    : 0;

  const getMonthProgress = (monthKey: typeof MONTH_KEYS[number]) => {
    if (!plan) return { books: [], songs: [], booksPct: 0, songsPct: 0, booksCount: 0, songsCount: 0, completedBooks: 0, completedSongs: 0 };
    const monthBooks = plan.distribution?.[monthKey]?.books || [];
    const monthSongs = plan.distribution?.[monthKey]?.songs || [];
    const completedB = monthBooks.filter(id => progress.completedBooks.includes(id)).length;
    const completedS = monthSongs.filter(id => progress.completedSongs.includes(id)).length;
    return {
      books: monthBooks, songs: monthSongs,
      booksCount: monthBooks.length, songsCount: monthSongs.length,
      completedBooks: completedB, completedSongs: completedS,
      booksPct: monthBooks.length > 0 ? Math.round((completedB / monthBooks.length) * 100) : 0,
      songsPct: monthSongs.length > 0 ? Math.round((completedS / monthSongs.length) * 100) : 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">3 Meses</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {QUARTERS.find(q => q.id === selectedQuarter)?.name} · Semana {weekInQ}/12
            </p>
          </div>
        </div>

        {/* Quarter selector */}
        <div className="grid grid-cols-4 gap-2.5">
          {QUARTERS.map(q => {
            const isActive = selectedQuarter === q.id;
            return (
              <button key={q.id} onClick={() => setSelectedQuarter(q.id)}
                className={cn(
                  "relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md"
                )}>
                <div className="text-lg font-bold">{q.name}</div>
                <div className={cn("text-[10px] mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{q.dates}</div>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2.5">
          {[
            { icon: <Zap className="h-4 w-4 text-blue-500" />, label: "Semana", value: weekInQ, gradient: "from-blue-500 to-cyan-400" },
            { icon: <BarChart3 className="h-4 w-4 text-purple-500" />, label: "Progreso", value: `${overallPct}%`, gradient: "from-purple-500 to-pink-400" },
            { icon: <BookOpen className="h-4 w-4 text-emerald-500" />, label: "Libros", value: `${completedBooksCount}/${totalBooksTarget}`, gradient: "from-emerald-500 to-teal-400" },
            { icon: <Music className="h-4 w-4 text-rose-500" />, label: "Canciones", value: `${completedSongsCount}/${totalSongsTarget}`, gradient: "from-rose-500 to-pink-400" },
            { icon: <Flame className="h-4 w-4 text-orange-500" />, label: `Racha ${overallStreak.current}d`, value: overallStreak.longest > 0 ? `${overallStreak.longest}` : `${overallStreak.current}d`, gradient: "from-orange-500 to-amber-400" },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <div className="text-xl font-bold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Time progress */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Tiempo del trimestre</span>
              <span className="text-sm font-bold tabular-nums">{Math.round(weekProgress)}%</span>
            </div>
            <Progress value={weekProgress} className="h-1.5" />
            <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground/60">
              <span>Sem 1</span><span>Sem 6</span><span>Sem 12</span>
            </div>
          </CardContent>
        </Card>

        {!plan ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin plan trimestral</p>
              <p className="text-xs text-muted-foreground text-center mb-2">Ve a Plan Trimestral y crea un plan para {QUARTERS.find(q => q.id === selectedQuarter)?.name}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall progress */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
              <CardContent className="p-4 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" /> Progreso General
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Libros", pct: bookPct, count: `${completedBooksCount}/${totalBooksTarget}`, color: "text-emerald-500" },
                    { label: "Canciones", pct: songPct, count: `${completedSongsCount}/${totalSongsTarget}`, color: "text-rose-500" },
                    { label: "Metas", pct: goalsPct, count: `${completedGoalsCount}/${totalGoalsCount}`, color: "text-amber-500" },
                  ].map(m => (
                    <div key={m.label} className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className={cn("text-lg font-bold", m.color)}>{m.pct}%</p>
                      <Progress value={m.pct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">{m.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personal goals - shown once */}
            {plan.personal_goals?.length > 0 && (
              <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold">Metas Personales</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">{completedGoalsCount}/{totalGoalsCount}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {plan.personal_goals.map((g, i) => {
                      const done = progress.completedGoals.includes(g.title);
                      return (
                        <label key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-border/40">
                          <Checkbox checked={done} onCheckedChange={() => toggleGoal(g.title)} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-medium", done && "line-through text-muted-foreground")}>{g.title}</p>
                            {g.target && <p className="text-[10px] text-muted-foreground">Meta: {g.target}</p>}
                          </div>
                          {done && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Month sections */}
            {MONTH_KEYS.map((monthKey, mi) => {
              const mp = getMonthProgress(monthKey);
              const monthBooks = mp.books.map(id => books.find(b => b.id === id)).filter(Boolean) as BookDetail[];
              const monthSongsData = mp.songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as SongDetail[];
              const timeData = monthlyTimeData[monthKey];
              const tasks = monthTasks[monthKey] || [];
              const events = monthEvents[monthKey] || [];
              const completedTaskIds: string[] = plan.completedTasks?.[monthKey] || [];
              const completedEventIds: string[] = plan.completedEvents?.[monthKey] || [];

              const monthSubjectIds = plan.monthSubjects?.[monthKey] || [];
              const monthProjectIds = plan.monthProjects?.[monthKey] || [];

              return (
                <Card key={monthKey} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                  <div className={cn("h-1 bg-gradient-to-r", mi === 0 ? "from-sky-500 to-cyan-400" : mi === 1 ? "from-violet-500 to-purple-400" : "from-amber-500 to-orange-400")} />
                  <CardContent className="p-4 space-y-5">
                    {/* Month header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold">{monthLabels[mi]}</h2>
                        {timeData && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {timeData.totalMinutes} min registrados
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{mp.completedBooks}/{mp.booksCount}</span>
                        <span className="flex items-center gap-1"><Music className="h-3 w-3" />{mp.completedSongs}/{mp.songsCount}</span>
                      </div>
                    </div>

                    {/* ===== DESARROLLO PERSONAL ===== */}

                    {/* Lectura */}
                    {monthBooks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Book className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Lectura</span>
                          <Progress value={mp.booksPct} className="h-1 flex-1 max-w-[80px]" />
                          <span className="text-[10px] font-medium text-emerald-600">{mp.booksPct}%</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {monthBooks.map(book => {
                            const done = progress.completedBooks.includes(book.id);
                            return (
                              <div key={book.id} className={cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border/50 bg-card/30 hover:border-emerald-200")}
                                onClick={() => toggleBook(book.id)}>
                                <div className="aspect-[2/3] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative">
                                  {book.cover_image_url ? (
                                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <BookOpen className="w-8 h-8 text-emerald-400/60" />
                                  )}
                                  {done && (
                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                                        <Check className="h-5 w-5" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className={cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground")}>{book.title}</p>
                                {book.author && <p className="text-[9px] text-muted-foreground truncate">{book.author}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Hobbies Intelectuales */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5 text-sky-500" />
                        <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Hobbies Intelectuales</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'ajedrez', icon: <Gamepad2 className="h-3 w-3" />, label: 'Ajedrez' },
                          { key: 'italiano', icon: <Globe className="h-3 w-3" />, label: 'Italiano' },
                          { key: 'ingles', icon: <Globe className="h-3 w-3" />, label: 'Inglés' },
                          { key: 'game_seduccion', icon: <Sword className="h-3 w-3" />, label: 'Game Seducción' },
                        ].map(h => {
                          const note = plan.notes?.[h.key] || '';
                          return (
                            <div key={h.key} className="p-2 rounded-lg border border-border/40 bg-card/20">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-sky-500">{h.icon}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">{h.label}</span>
                              </div>
                              <p className="text-[11px] leading-snug">{note || '—'}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Canciones */}
                    {monthSongsData.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Music className="h-3.5 w-3.5 text-rose-500" />
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Canciones</span>
                          <Progress value={mp.songsPct} className="h-1 flex-1 max-w-[80px]" />
                          <span className="text-[10px] font-medium text-rose-600">{mp.songsPct}%</span>
                        </div>
                        <div className="space-y-1.5">
                          {(["piano", "guitar"] as const).map(inst => {
                            const instSongs = monthSongsData.filter(s => s.instrument === inst);
                            if (!instSongs.length) return null;
                            return (
                              <div key={inst} className="space-y-1">
                                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                  {inst === "piano" ? <Piano className="h-3 w-3" /> : <Guitar className="h-3 w-3" />}
                                  {inst === "piano" ? "Piano" : "Guitarra"} ({instSongs.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {instSongs.map(song => {
                                    const done = progress.completedSongs.includes(song.id);
                                    return (
                                      <Badge key={song.id} variant={done ? "default" : "secondary"}
                                        className={cn("text-[10px] px-2 py-0.5 cursor-pointer transition-all gap-1", done && "bg-rose-500 hover:bg-rose-600")}
                                        onClick={() => toggleSong(song.id)}>
                                        {done && <Check className="h-2.5 w-2.5" />}
                                        {song.title}{song.artist ? ` (${song.artist})` : ""}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Habilidades Valiosas */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 text-cyan-500" />
                        <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Habilidades Valiosas</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{plan.notes?.habilidades_tecnicas || 'Sin metas'}</p>
                    </div>

                    {/* ===== PROFESIONAL ACADÉMICO ===== */}

                    {/* Asignaturas */}
                    {monthSubjectIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Asignaturas</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5">{monthSubjectIds.length}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {monthSubjectIds.map(sid => {
                            const sub = subjects.find(s => s.id === sid);
                            return sub ? (
                              <Badge key={sid} variant="outline" className="text-[10px] px-2 py-0.5">{sub.name}</Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Proyectos */}
                    {monthProjectIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Proyectos</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5">{monthProjectIds.length}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {monthProjectIds.map(pid => {
                            const proj = projects.find(p => p.id === pid);
                            return proj ? (
                              <Badge key={pid} variant="outline" className="text-[10px] px-2 py-0.5">{proj.name}</Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Emprendimiento */}
                    {plan.notes?.emprendimiento && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Emprendimiento</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{plan.notes.emprendimiento}</p>
                      </div>
                    )}

                    {/* Tareas del Mes */}
                    {tasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tareas del Mes</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5">
                            {tasks.filter(t => completedTaskIds.includes(t.id)).length}/{tasks.length}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {tasks.map(task => {
                            const done = completedTaskIds.includes(task.id);
                            return (
                              <div key={task.id} className={cn("flex items-center gap-2 p-1.5 rounded-lg text-xs", done ? "text-muted-foreground" : "")}>
                                <Checkbox checked={done} className="h-3.5 w-3.5" />
                                <span className={cn("flex-1 truncate", done && "line-through")}>{task.title}</span>
                                <Badge variant="outline" className="text-[8px] px-1">{task.source}</Badge>
                                {task.due_date && <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(task.due_date), 'd MMM', { locale: es })}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Eventos del Mes */}
                    {events.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-700 dark:text-red-400">Eventos del Mes</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5">
                            {events.filter(e => completedEventIds.includes(e.id)).length}/{events.length}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {events.map(ev => {
                            const done = completedEventIds.includes(ev.id);
                            return (
                              <div key={ev.id} className={cn("flex items-center gap-2 p-1.5 rounded-lg text-xs", done ? "text-muted-foreground" : "")}>
                                <Checkbox checked={done} className="h-3.5 w-3.5" />
                                <span className={cn("flex-1 truncate", done && "line-through")}>{ev.title}</span>
                                <Badge variant="outline" className="text-[8px] px-1">{ev.category}</Badge>
                                <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(ev.event_date), 'd MMM', { locale: es })}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No items fallback */}
                    {monthBooks.length === 0 && monthSongsData.length === 0 && tasks.length === 0 && events.length === 0 && monthSubjectIds.length === 0 && monthProjectIds.length === 0 && !plan.notes?.emprendimiento && (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50">
                        <Calendar className="h-6 w-6 mb-1" />
                        <p className="text-[10px]">Sin items asignados este mes</p>
                      </div>
                    )}

                    {/* ===== TIEMPO ACUMULATIVO ===== */}
                    {timeData && Object.keys(timeData.byArea).length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <Timer className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-muted-foreground">Tiempo Acumulativo</span>
                          <span className="text-[10px] text-muted-foreground">Total: {timeData.totalMinutes} min</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                          {Object.entries(timeData.byArea)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 8)
                            .map(([area, minutes]) => (
                              <div key={area} className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/20 text-[10px]">
                                <span className="text-muted-foreground truncate">{AREA_LABELS[area] || area}</span>
                                <span className="font-medium tabular-nums ml-1">{Math.round(minutes)}min</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Effort & Results */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4 space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Esfuerzo y Resultados — {QUARTERS.find(q => q.id === selectedQuarter)?.name}
            </h2>
            <LifeAreaScoresPanel periodType="quarter" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white/80 dark:bg-zinc-900/80 px-3 text-muted-foreground/60">Métricas detalladas</span>
              </div>
            </div>
            <AreaEffortResultsPanel periodType="quarter" periodStart={new Date(2026, (selectedQuarter - 1) * 3, 1)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}