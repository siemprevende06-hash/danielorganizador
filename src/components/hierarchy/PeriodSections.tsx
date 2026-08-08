import { useState, useEffect, Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell } from "recharts";
import {
  BookOpen, Music, Target, Calendar, Flame,
  Zap, BarChart3, Check, Piano, Guitar,
  Brain, Globe, Code, Book,
  GraduationCap, FolderKanban, Briefcase, ListTodo,
  Clock, Timer, Heart, Gamepad2,
  Search, Plus, Dumbbell
} from "lucide-react";
import { format, startOfWeek, endOfWeek, getISOWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";
import { CentralAreasSection } from "@/components/twelveweekyear/CentralAreasSection";
import {
  loadQuarterPlan, saveQuarterPlan, loadMonthlyPlan, saveMonthlyPlan,
  getQuarterGoal, getMonthGoal, getWeekGoalEffective,
  getWeeksOfMonth, getWeekId, getQuarterFromDate, getMonthKeyOf,
  splitEvenly, ALL_HIERARCHY_AREAS, AREA_LABELS,
} from "@/lib/hierarchy";

class SafeSection extends Component<{ children: ReactNode; title: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; title: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No se pudo cargar {this.props.title}</p>
            <button onClick={() => this.setState({ hasError: false })} className="text-xs text-primary mt-2 hover:underline">Reintentar</button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export interface PeriodSectionsProps {
  scope: 'quarter' | 'month' | 'week' | 'year';
  year: number;
  quarter: number;
  monthIndex?: number;
  weekStart?: Date;
  hideStats?: boolean;
}

interface BookDetail { id: string; title: string; author: string | null; cover_image_url: string | null; pages_read?: number | null; pages_total?: number | null; }
interface SongDetail { id: string; title: string; artist: string | null; instrument: string; }
interface TaskItem { id: string; title: string; source: string; due_date: string; completed: boolean; priority?: string; }
interface CalendarEvent { id: string; title: string; event_date: string; category: string; }

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

const GOAL_COLORS: Record<string, string> = {
  emerald: "#10b981", rose: "#f43f5e", teal: "#14b8a6",
  pink: "#ec4899", green: "#22c55e", blue: "#3b82f6", orange: "#f97316",
};

function TimeGoalRow({ label, actual, goal, color, icon }: { label: string; actual: number; goal: number; color: string; icon: React.ReactNode }) {
  const pct = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0;
  const fill = GOAL_COLORS[color] || "#6366f1";
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0">
        <PieChart width={40} height={40}>
          <Pie
            data={[
              { name: "done", value: Math.max(pct, 1) },
              { name: "remaining", value: Math.max(100 - pct, 0) },
            ]}
            cx={20} cy={20} innerRadius={14} outerRadius={18}
            startAngle={90} endAngle={-270}
            dataKey="value" stroke="none"
          >
            <Cell fill={fill} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground truncate">{icon} {label}</span>
          <span className="font-medium tabular-nums shrink-0 ml-1">{Math.round(actual)}min / {goal}min</span>
        </div>
      </div>
    </div>
  );
}

interface ProgressData {
  completedBooks: string[];
  completedSongs: string[];
  completedGoals: string[];
}

function loadProgress(key: string): ProgressData {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        completedBooks: p.completedBooks || [],
        completedSongs: p.completedSongs || [],
        completedGoals: p.completedGoals || [],
      };
    }
  } catch {}
  return { completedBooks: [], completedSongs: [], completedGoals: [] };
}

function saveProgress(key: string, p: ProgressData) {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch {}
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default function PeriodSections({ scope, year, quarter, monthIndex, weekStart, hideStats }: PeriodSectionsProps) {
  const { streak: overallStreak } = useOverallSystemStreak();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [books, setBooks] = useState<Record<string, BookDetail>>({});
  const [allBooks, setAllBooks] = useState<BookDetail[]>([]);
  const [songs, setSongs] = useState<Record<string, SongDetail>>({});
  const [subjectsById, setSubjectsById] = useState<Record<string, { id: string; name: string }>>({});
  const [entrepreneurshipsById, setEntrepreneurshipsById] = useState<Record<string, { id: string; name: string }>>({});
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeByArea, setTimeByArea] = useState<Record<string, number>>({});
  const [focusAreaMinutes, setFocusAreaMinutes] = useState<Record<string, number>>({});
  const [chessGames, setChessGames] = useState(0);
  const [chessPracticeDays, setChessPracticeDays] = useState(0);
  const [chessTargetMonth, setChessTargetMonth] = useState(30);
  const [langDays, setLangDays] = useState<{ italiano: number; ingles: number }>({ italiano: 0, ingles: 0 });
  const [progress, setProgress] = useState<ProgressData>({ completedBooks: [], completedSongs: [], completedGoals: [] });
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [slotSearch, setSlotSearch] = useState('');

  const weekId = scope === 'week' && weekStart ? getWeekId(weekStart) : '';
  const monthAnchor = scope === 'month'
    ? new Date(year, (quarter - 1) * 3 + (monthIndex ?? 0), 1)
    : scope === 'week'
      ? new Date(weekStart!.getFullYear(), weekStart!.getMonth(), 1)
      : scope === 'quarter'
        ? new Date(year, (quarter - 1) * 3, 1)
        : new Date(year, 0, 1);
  const anchorMonthKey = scope === 'year' ? 'month1' : getMonthKeyOf(monthAnchor, quarter);

  const periodStart = scope === 'week' ? startOfWeek(weekStart!, { weekStartsOn: 1 }) : monthAnchor;
  const periodEnd = scope === 'week'
    ? endOfWeek(weekStart!, { weekStartsOn: 1 })
    : scope === 'year'
      ? new Date(year, 11, 31)
      : new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);

  const weeksOfMonth = scope === 'week' ? getWeeksOfMonth(monthAnchor) : [];
  const weekIdx = weekId ? Math.max(0, weeksOfMonth.indexOf(weekId)) : 0;

  const now = new Date();

  // ---- Goals per period ----
  const periodGoal = (area: string): number => {
    if (scope === 'month') return getMonthGoal(quarter, year, `month${(monthIndex ?? 0) + 1}`, area);
    if (scope === 'quarter') return getQuarterGoal(quarter, year, area);
    if (scope === 'week') return getWeekGoalEffective(weekStart!, area);
    let sum = 0;
    for (let q = 1; q <= 4; q++) sum += getQuarterGoal(q, year, area);
    return sum;
  };

  const progressKeys = () => {
    if (scope === 'year') return [1, 2, 3, 4].map(q => `trimestral_progress_Q${q}_${year}`);
    return [`trimestral_progress_Q${quarter}_${year}`];
  };

  const quarterPlans = scope === 'year'
    ? [1, 2, 3, 4].map(q => loadQuarterPlan(q, year)).filter(Boolean)
    : [];

  const load = async () => {
    setLoading(true);
    const qp = scope === 'year' ? null : loadQuarterPlan(quarter, year);
    setPlan(qp);

    const startStr = format(periodStart, 'yyyy-MM-dd');
    const endStr = format(periodEnd, 'yyyy-MM-dd');

    const mergedProgress: ProgressData = { completedBooks: [], completedSongs: [], completedGoals: [] };
    progressKeys().forEach(k => {
      const p = loadProgress(k);
      mergedProgress.completedBooks.push(...p.completedBooks);
      mergedProgress.completedSongs.push(...p.completedSongs);
      mergedProgress.completedGoals.push(...p.completedGoals);
    });
    mergedProgress.completedBooks = [...new Set(mergedProgress.completedBooks)];
    mergedProgress.completedSongs = [...new Set(mergedProgress.completedSongs)];
    mergedProgress.completedGoals = [...new Set(mergedProgress.completedGoals)];
    setProgress(mergedProgress);

    // Books / songs ids in scope
    let bookIds: string[] = [];
    let songIds: string[] = [];
    const addBookQuarterMap: Record<string, number> = {};
    if (scope === 'year') {
      const bSet = new Set<string>();
      const sSet = new Set<string>();
      [1, 2, 3, 4].forEach(q => {
        const p = loadQuarterPlan(q, year);
        if (!p?.distribution) return;
        MONTH_KEYS.forEach(mk => {
          (p.distribution[mk]?.books || []).forEach((id: string) => { bSet.add(id); addBookQuarterMap[id] = q; });
          (p.distribution[mk]?.songs || []).forEach((id: string) => sSet.add(id));
        });
      });
      bookIds = [...bSet];
      songIds = [...sSet];
    } else if (qp) {
      const dist = qp.distribution || {};
      if (scope === 'month') {
        bookIds = dist[`month${(monthIndex ?? 0) + 1}`]?.books || [];
        songIds = dist[`month${(monthIndex ?? 0) + 1}`]?.songs || [];
      } else if (scope === 'quarter') {
        const bSet = new Set<string>();
        const sSet = new Set<string>();
        MONTH_KEYS.forEach(mk => {
          (dist[mk]?.books || []).forEach((id: string) => bSet.add(id));
          (dist[mk]?.songs || []).forEach((id: string) => sSet.add(id));
        });
        bookIds = [...bSet];
        songIds = [...sSet];
      } else if (scope === 'week') {
        bookIds = dist[anchorMonthKey]?.books || [];
        songIds = dist[anchorMonthKey]?.songs || [];
      }
    }

    const [booksRes, songsRes, tasksRes, eventsRes, allBooksRes, chessGoalsRes] = await Promise.all([
      bookIds.length > 0
        ? supabase.from("reading_library").select("id, title, author, cover_image_url, pages_read, pages_total").in("id", bookIds)
        : Promise.resolve({ data: [] }),
      songIds.length > 0
        ? supabase.from("music_repertoire").select("id, title, artist, instrument").in("id", songIds)
        : Promise.resolve({ data: [] }),
      supabase.from('tasks').select('id, title, source, due_date, completed, priority')
        .gte('due_date', `${startStr}T00:00:00`).lte('due_date', `${endStr}T23:59:59`),
      supabase.from('calendar_events').select('*')
        .gte('event_date', startStr).lte('event_date', endStr).order('event_date'),
      supabase.from('reading_library').select('id, title, author, cover_image_url, pages_read, pages_total').order('title'),
      supabase.from('chess_goals').select('target_games_per_month, target_minutes_per_day').eq('is_active', true).maybeSingle(),
    ]);
    if (booksRes.data) {
      const map: Record<string, BookDetail> = {};
      booksRes.data.forEach((b: any) => { map[b.id] = b; });
      setBooks(map);
    }
    if (allBooksRes.data) setAllBooks(allBooksRes.data);
    if (songsRes.data) {
      const map: Record<string, SongDetail> = {};
      songsRes.data.forEach((s: any) => { map[s.id] = s; });
      setSongs(map);
    }
    if (tasksRes.data) setTasks(tasksRes.data as TaskItem[]);
    if (eventsRes.data) setEvents(eventsRes.data as CalendarEvent[]);
    setChessTargetMonth((chessGoalsRes.data as any)?.target_games_per_month || 30);

    // Subjects / entrepreneurships
    try {
      const { data: subjRows } = await supabase.from('university_subjects').select('id, name');
      if (subjRows) {
        const map: Record<string, { id: string; name: string }> = {};
        subjRows.forEach((s: any) => { map[s.id] = { id: s.id, name: s.name }; });
        setSubjectsById(map);
      }
    } catch {}
    try {
      const { data: entRows } = await supabase.from('entrepreneurships').select('id, name');
      if (entRows) {
        const map: Record<string, { id: string; name: string }> = {};
        entRows.forEach((e: any) => { map[e.id] = { id: e.id, name: e.name }; });
        setEntrepreneurshipsById(map);
      }
    } catch {}

    // Time + chess + languages from daily_systems_tracking
    const { data: trackingRows } = await supabase
      .from('daily_systems_tracking')
      .select('tracking_date, time_data, count_data')
      .gte('tracking_date', startStr).lte('tracking_date', endStr);
    const byArea: Record<string, number> = {};
    let games = 0;
    let gamesDays = new Set<string>();
    let italDays = new Set<string>();
    let engDays = new Set<string>();
    (trackingRows || []).forEach((row: any) => {
      const td = row.time_data || {};
      Object.entries(td).forEach(([key, val]) => {
        byArea[key] = (byArea[key] || 0) + (Number(val) || 0);
      });
      const cd = row.count_data || {};
      const cg = Number(cd.ajedrez) || 0;
      if (cg > 0) {
        games += cg;
        gamesDays.add(row.tracking_date);
      }
      if ((Number(td.italiano) || 0) > 0) italDays.add(row.tracking_date);
      if ((Number(td.ingles) || 0) > 0) engDays.add(row.tracking_date);
    });
    setTimeByArea(byArea);
    setChessGames(games);
    setChessPracticeDays(gamesDays.size);
    setLangDays({ italiano: italDays.size, ingles: engDays.size });

    // Focus areas (universidad / proyectos / emprendimiento)
    const { data: areaRows } = await supabase
      .from('daily_area_stats')
      .select('area_id, time_spent_minutes, stat_date')
      .in('area_id', ['universidad', 'emprendimiento', 'proyectos'])
      .gte('stat_date', startStr).lte('stat_date', endStr);
    const areaAcc: Record<string, number> = {};
    (areaRows || []).forEach((row: any) => {
      areaAcc[row.area_id] = (areaAcc[row.area_id] || 0) + (row.time_spent_minutes || 0);
    });
    setFocusAreaMinutes(areaAcc);

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, year, quarter, monthIndex, weekId]);

  // ---- Derived ----
  const bookIdsInScope = Object.keys(books);
  const songIdsInScope = Object.keys(songs);
  const booksGoal = bookIdsInScope.length;
  const songsGoal = songIdsInScope.length;
  const booksDone = progress.completedBooks.filter(id => bookIdsInScope.includes(id)).length;
  const songsDone = progress.completedSongs.filter(id => songIdsInScope.includes(id)).length;

  const personalGoals: { title: string; target?: string }[] = scope === 'year'
    ? quarterPlans.flatMap((p: any) => p.personal_goals || [])
    : plan?.personal_goals || [];
  const personalTitles = personalGoals.map(g => g.title);
  const goalsDone = progress.completedGoals.filter(t => personalTitles.includes(t)).length;
  const goalsTotal = personalGoals.length;

  const overallTotal = booksGoal + songsGoal + goalsTotal;
  const overallPct = overallTotal > 0 ? Math.round(((booksDone + songsDone + goalsDone) / overallTotal) * 100) : 0;

  // Time progress
  let timePct = 0;
  let timeLabel = '';
  let timeCaption = '';
  if (scope === 'quarter') {
    const startOfYear = new Date(year, 0, 1);
    const week = Math.min(Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)), 52);
    const weekInQ = ((week - 1) % 12) + 1;
    timePct = (weekInQ / 12) * 100;
    timeLabel = `Semana ${weekInQ}/12`;
    timeCaption = 'Tiempo del trimestre';
  } else if (scope === 'month') {
    const daysInMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0).getDate();
    timePct = Math.min(100, (now.getDate() / daysInMonth) * 100);
    timeLabel = `Día ${now.getDate()}/${daysInMonth}`;
    timeCaption = 'Tiempo del mes';
  } else if (scope === 'week') {
    const dow = (now.getDay() + 6) % 7 + 1;
    timePct = Math.min(100, (dow / 7) * 100);
    timeLabel = `Día ${dow}/7`;
    timeCaption = 'Tiempo de la semana';
  } else {
    const dayOfYear = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000);
    const total = new Date(year, 11, 31).getTime() === new Date(year, 0, 1).getTime() ? 365 : 365;
    timePct = Math.min(100, (dayOfYear / total) * 100);
    timeLabel = `Semana ${getISOWeek(now)}/52`;
    timeCaption = 'Tiempo del año';
  }

  const weekOfMonth = scope === 'month' ? Math.floor((now.getDate() - 1) / 7) + 1 : 0;

  const scopeLabel =
    scope === 'month'
      ? format(monthAnchor, 'MMMM yyyy', { locale: es })
      : scope === 'quarter'
        ? `Q${quarter} ${year}`
        : scope === 'week'
          ? `Semana del ${format(periodStart, 'd MMM', { locale: es })}`
          : `${year}`;

  // Month keys for tasks/events/projects of the anchor month
  const anchorMonthPlan = scope === 'year' ? null : plan;
  const completedTaskIds: string[] = scope === 'year'
    ? MONTH_KEYS.flatMap(mk => [1, 2, 3, 4].flatMap(q => (loadQuarterPlan(q, year)?.completedTasks?.[mk] || [])))
    : (plan?.completedTasks?.[anchorMonthKey] || []);
  const completedEventIds: string[] = scope === 'year'
    ? MONTH_KEYS.flatMap(mk => [1, 2, 3, 4].flatMap(q => (loadQuarterPlan(q, year)?.completedEvents?.[mk] || [])))
    : (plan?.completedEvents?.[anchorMonthKey] || []);

  const monthProjectIds: string[] = scope === 'year'
    ? [1, 2, 3, 4].flatMap(q => MONTH_KEYS.flatMap(mk => (loadQuarterPlan(q, year)?.monthProjects?.[mk] || [])))
    : (plan?.monthProjects?.[anchorMonthKey] || []);
  const monthSubjectIds: string[] = scope === 'year'
    ? [1, 2, 3, 4].flatMap(q => MONTH_KEYS.flatMap(mk => (loadQuarterPlan(q, year)?.monthSubjects?.[mk] || [])))
    : (plan?.monthSubjects?.[anchorMonthKey] || []);
  const monthEntrepreneurshipIds: string[] = scope === 'year'
    ? [1, 2, 3, 4].flatMap(q => MONTH_KEYS.flatMap(mk => (loadQuarterPlan(q, year)?.monthEntrepreneurships?.[mk] || [])))
    : (plan?.monthEntrepreneurships?.[anchorMonthKey] || []);

  const totalMinutes = Object.values(timeByArea).reduce((s, v) => s + v, 0);
  const monthBooks = bookIdsInScope.map(id => books[id]).filter(Boolean) as BookDetail[];
  const monthSongsData = songIdsInScope.map(id => songs[id]).filter(Boolean) as SongDetail[];
  const pianoSongs = monthSongsData.filter(s => s.instrument === 'piano');
  const guitarSongs = monthSongsData.filter(s => s.instrument === 'guitar');
  const availableForSlot = allBooks.filter(b => !bookIdsInScope.includes(b.id));
  const filteredSlotBooks = availableForSlot.filter(b =>
    b.title.toLowerCase().includes(slotSearch.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(slotSearch.toLowerCase()))
  );

  const chessTarget = scope === 'month'
    ? chessTargetMonth
    : scope === 'quarter'
      ? chessTargetMonth * 3
      : scope === 'week'
        ? (splitEvenly(chessTargetMonth, weeksOfMonth.length)[weekIdx] || chessTargetMonth)
        : chessTargetMonth * 12;

  const canAddBooks = scope === 'month' || scope === 'quarter';
  const addTargetMonthKey = scope === 'quarter' ? `month${(monthIndex ?? 0) + 1}` : `month${(monthIndex ?? 0) + 1}`;

  const handleAddBookToMonth = (bookId: string) => {
    if (scope === 'year') return;
    const currentPlan = loadQuarterPlan(quarter, year);
    if (!currentPlan) return;
    const currentBooks = [...(currentPlan.distribution?.[addTargetMonthKey]?.books || [])];
    if (currentBooks.includes(bookId)) return;
    currentBooks.push(bookId);
    const updatedPlan = {
      ...currentPlan,
      distribution: {
        ...(currentPlan.distribution || {}),
        [addTargetMonthKey]: { ...(currentPlan.distribution?.[addTargetMonthKey] || {}), books: currentBooks },
      },
    };
    saveQuarterPlan(quarter, year, updatedPlan as any);
    setPlan(updatedPlan as any);
    const newBook = allBooks.find(b => b.id === bookId);
    if (newBook) setBooks(prev => ({ ...prev, [bookId]: newBook }));
    // Sync with monthly plan
    const monthDate = scope === 'month' ? monthAnchor : new Date(year, (quarter - 1) * 3 + (monthIndex ?? 0), 1);
    const monthly = loadMonthlyPlan(monthDate);
    if (monthly) {
      saveMonthlyPlan(monthDate, {
        ...monthly,
        books: { ...(monthly.books || { goal: 0, selected: [] }), goal: currentBooks.length, selected: currentBooks },
      });
    }
    setSlotDialogOpen(false);
  };

  const writeQuarterProgress = (key: string, updater: (p: ProgressData) => ProgressData) => {
    const next = updater(loadProgress(key));
    saveProgress(key, next);
    setProgress(updater(mergedFromAllKeys()));
  };

  const mergedFromAllKeys = (): ProgressData => {
    const out: ProgressData = { completedBooks: [], completedSongs: [], completedGoals: [] };
    progressKeys().forEach(k => {
      const p = loadProgress(k);
      out.completedBooks.push(...p.completedBooks);
      out.completedSongs.push(...p.completedSongs);
      out.completedGoals.push(...p.completedGoals);
    });
    out.completedBooks = [...new Set(out.completedBooks)];
    out.completedSongs = [...new Set(out.completedSongs)];
    out.completedGoals = [...new Set(out.completedGoals)];
    return out;
  };

  const quarterForBook = (id: string): number => {
    if (scope !== 'year') return quarter;
    for (let q = 1; q <= 4; q++) {
      const p = loadQuarterPlan(q, year);
      if (p?.distribution) {
        const found = MONTH_KEYS.some(mk => (p.distribution[mk]?.books || []).includes(id));
        if (found) return q;
      }
    }
    return 1;
  };

  const quarterForSong = (id: string): number => {
    if (scope !== 'year') return quarter;
    for (let q = 1; q <= 4; q++) {
      const p = loadQuarterPlan(q, year);
      if (p?.distribution) {
        const found = MONTH_KEYS.some(mk => (p.distribution[mk]?.songs || []).includes(id));
        if (found) return q;
      }
    }
    return 1;
  };

  const quarterForGoal = (title: string): number => {
    if (scope !== 'year') return quarter;
    for (let q = 1; q <= 4; q++) {
      const p = loadQuarterPlan(q, year);
      if (p?.personal_goals?.some((g: any) => g.title === title)) return q;
    }
    return 1;
  };

  const toggleBook = (id: string) => {
    const q = quarterForBook(id);
    const key = `trimestral_progress_Q${q}_${year}`;
    writeQuarterProgress(key, p => {
      const list = [...p.completedBooks];
      if (list.includes(id)) return { ...p, completedBooks: list.filter(i => i !== id) };
      list.push(id);
      return { ...p, completedBooks: list };
    });
  };

  const toggleSong = (id: string) => {
    const q = quarterForSong(id);
    const key = `trimestral_progress_Q${q}_${year}`;
    writeQuarterProgress(key, p => {
      const list = [...p.completedSongs];
      if (list.includes(id)) return { ...p, completedSongs: list.filter(i => i !== id) };
      list.push(id);
      return { ...p, completedSongs: list };
    });
  };

  const toggleGoal = (title: string) => {
    const q = quarterForGoal(title);
    const key = `trimestral_progress_Q${q}_${year}`;
    writeQuarterProgress(key, p => {
      const list = [...p.completedGoals];
      if (list.includes(title)) return { ...p, completedGoals: list.filter(g => g !== title) };
      list.push(title);
      return { ...p, completedGoals: list };
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const noPlan = scope === 'year' ? quarterPlans.length === 0 : !plan;

  return (
    <div className="space-y-5">
      {/* Stats */}
      {!hideStats && (
      <div className="grid grid-cols-5 gap-2.5">
        {[
          { icon: <Zap className="h-4 w-4 text-blue-500" />, label: scope === 'week' ? 'Día' : 'Semana', value: scope === 'week' ? `${Math.min(7, (now.getDay() + 6) % 7 + 1)}/7` : scope === 'month' ? `Sem ${weekOfMonth}` : scope === 'year' ? `S${getISOWeek(now)}` : timeLabel.replace('Semana ', ''), gradient: "from-blue-500 to-cyan-400" },
          { icon: <BarChart3 className="h-4 w-4 text-purple-500" />, label: "Progreso", value: `${overallPct}%`, gradient: "from-purple-500 to-pink-400" },
          { icon: <BookOpen className="h-4 w-4 text-emerald-500" />, label: "Libros", value: `${booksDone}/${booksGoal}`, gradient: "from-emerald-500 to-teal-400" },
          { icon: <Music className="h-4 w-4 text-rose-500" />, label: "Canciones", value: `${songsDone}/${songsGoal}`, gradient: "from-rose-500 to-pink-400" },
          { icon: <Flame className="h-4 w-4 text-orange-500" />, label: `Racha ${overallStreak.current}d`, value: overallStreak.longest > 0 ? `${overallStreak.longest}` : `${overallStreak.current}d`, gradient: "from-orange-500 to-amber-400" },
        ].map((s, i) => (
          <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
            <CardContent className="p-3.5 text-center space-y-1">
              <div className="flex justify-center">{s.icon}</div>
              <div className="text-xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Time progress */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">{timeCaption}</span>
            <span className="text-sm font-bold tabular-nums">{timeLabel}</span>
          </div>
          <Progress value={timePct} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Áreas Centrales */}
      <SafeSection title="Áreas Centrales">
        <CentralAreasSection
          selectedQuarter={quarter}
          year={year}
          start={periodStart}
          end={periodEnd}
          getGoal={periodGoal}
        />
      </SafeSection>

      {noPlan ? (
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin plan {scope === 'year' ? 'anual' : 'trimestral'}</p>
            <p className="text-xs text-muted-foreground text-center mb-2">Ve a Plan Trimestral y crea un plan para {scopeLabel}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall progress */}
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
            <CardContent className="p-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-500" /> Progreso General — {scopeLabel}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Libros", pct: booksGoal > 0 ? Math.round((booksDone / booksGoal) * 100) : 0, count: `${booksDone}/${booksGoal}`, color: "text-emerald-500" },
                  { label: "Canciones", pct: songsGoal > 0 ? Math.round((songsDone / songsGoal) * 100) : 0, count: `${songsDone}/${songsGoal}`, color: "text-rose-500" },
                  { label: "Metas", pct: goalsTotal > 0 ? Math.round((goalsDone / goalsTotal) * 100) : 0, count: `${goalsDone}/${goalsTotal}`, color: "text-amber-500" },
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

          {/* ===== DESARROLLO PERSONAL ===== */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
              <div>
                <h2 className="text-base font-bold">Desarrollo Personal</h2>
                <p className="text-[10px] text-muted-foreground">{scopeLabel} · Crecimiento intelectual, creatividad y bienestar</p>
              </div>
            </div>

            {monthBooks.length > 0 || canAddBooks ? (
            <div className="space-y-2 pl-4 border-l-2 border-emerald-200/50">
              <div className="flex items-center gap-2">
                <Book className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Lectura</span>
                <Progress value={booksGoal > 0 ? Math.round((booksDone / booksGoal) * 100) : 0} className="h-1 flex-1 max-w-[80px]" />
                <span className="text-[10px] font-medium text-emerald-600">{booksGoal > 0 ? Math.round((booksDone / booksGoal) * 100) : 0}%</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
                  {booksDone}/{booksGoal} leídos
                </Badge>
              </div>
              <TimeGoalRow label="Minutos de lectura" actual={timeByArea.lectura || 0} goal={periodGoal('lectura')} color="emerald" icon={<Book className="h-3 w-3 text-emerald-500" />} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: canAddBooks ? Math.max(booksGoal, monthBooks.length) : monthBooks.length }).map((_, i) => {
                  if (i < monthBooks.length) {
                    const book = monthBooks[i];
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
                          {!done && book.pages_total && book.pages_total > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-4">
                              <div className="text-[8px] text-white font-medium">{Math.min(100, Math.round(((book.pages_read || 0) / book.pages_total) * 100))}%</div>
                              <Progress value={Math.min(100, Math.round(((book.pages_read || 0) / book.pages_total) * 100))} className="h-1 bg-white/20 [&>div]:bg-emerald-400" />
                            </div>
                          )}
                        </div>
                        <p className={cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground")}>{book.title}</p>
                        {book.author && <p className="text-[9px] text-muted-foreground truncate">{book.author}</p>}
                        {!done && book.pages_total && book.pages_total > 0 && (
                          <p className="text-[8px] text-muted-foreground">{book.pages_read || 0}/{book.pages_total} pág.</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={`slot-${i}`}
                      className="space-y-1.5 p-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all"
                      onClick={() => { setSlotSearch(''); setSlotDialogOpen(true); }}>
                      <div className="aspect-[2/3] rounded-lg flex items-center justify-center">
                        <Plus className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-[10px] text-muted-foreground/40 text-center">Seleccionar libro</p>
                    </div>
                  );
                })}
              </div>
            </div>
            ) : null}

            {(pianoSongs.length > 0 || guitarSongs.length > 0) && (
              <div className="space-y-2 pl-4 border-l-2 border-rose-200/50">
                <div className="flex items-center gap-2">
                  <Music className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Música</span>
                  <span className="text-[10px] text-muted-foreground">{songsDone}/{songsGoal} completadas</span>
                </div>
                <TimeGoalRow label="Minutos de práctica" actual={timeByArea.musica || 0} goal={periodGoal('musica')} color="rose" icon={<Music className="h-3 w-3 text-rose-500" />} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pianoSongs.map(song => {
                    const done = progress.completedSongs.includes(song.id);
                    return (
                      <div key={song.id} className={cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20" : "border-border/50 bg-card/30 hover:border-rose-200")}
                        onClick={() => toggleSong(song.id)}>
                        <div className="aspect-[2/3] bg-gradient-to-br from-rose-500/20 to-rose-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative">
                          <Piano className="w-8 h-8 text-rose-400/60" />
                          {done && (
                            <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
                                <Check className="h-5 w-5" />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground")}>{song.title}</p>
                        {song.artist && <p className="text-[9px] text-muted-foreground truncate">{song.artist}</p>}
                      </div>
                    );
                  })}
                  {guitarSongs.map(song => {
                    const done = progress.completedSongs.includes(song.id);
                    return (
                      <div key={song.id} className={cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/50 bg-card/30 hover:border-amber-200")}
                        onClick={() => toggleSong(song.id)}>
                        <div className="aspect-[2/3] bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative">
                          <Guitar className="w-8 h-8 text-amber-400/60" />
                          {done && (
                            <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                                <Check className="h-5 w-5" />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className={cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground")}>{song.title}</p>
                        {song.artist && <p className="text-[9px] text-muted-foreground truncate">{song.artist}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {chessGames > 0 || periodGoal('ajedrez') > 0 ? (
              <div className="space-y-2 pl-4 border-l-2 border-teal-200/50">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-3.5 w-3.5 text-teal-500" />
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Ajedrez</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Partidas meta</p>
                    <p className="text-lg font-bold text-teal-500">{chessTarget}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Partidas jugadas</p>
                    <p className={cn("text-lg font-bold", chessGames >= chessTarget ? "text-emerald-500" : "text-amber-500")}>{chessGames}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Días de práctica</p>
                    <p className="text-lg font-bold text-teal-500">{chessPracticeDays}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Minutos meta</p>
                    <p className="text-lg font-bold text-teal-500">{periodGoal('ajedrez')}min</p>
                  </div>
                </div>
                <Progress value={chessTarget > 0 ? Math.min(100, Math.round((chessGames / chessTarget) * 100)) : 0} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground">{chessGames}/{chessTarget} partidas</p>
                <TimeGoalRow label="Minutos de ajedrez" actual={timeByArea.ajedrez || 0} goal={periodGoal('ajedrez')} color="teal" icon={<Gamepad2 className="h-3 w-3 text-teal-500" />} />
              </div>
            ) : null}

            {langDays.italiano > 0 || langDays.ingles > 0 || periodGoal('italiano') > 0 || periodGoal('ingles') > 0 ? (
              <div className="space-y-2 pl-4 border-l-2 border-sky-200/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Idiomas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">Italiano</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Días practicados</p>
                        <p className="text-lg font-bold text-green-500">{langDays.italiano}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground">Plan</p>
                        <p className="text-sm font-medium text-muted-foreground">{plan?.notes?.italiano || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Inglés</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-muted-foreground">Días practicados</p>
                        <p className="text-lg font-bold text-blue-500">{langDays.ingles}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground">Plan</p>
                        <p className="text-sm font-medium text-muted-foreground">{plan?.notes?.ingles || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <TimeGoalRow label="Minutos italiano" actual={(timeByArea.italiano || 0) + (timeByArea.idiomas || 0)} goal={periodGoal('italiano')} color="green" icon={<Globe className="h-3 w-3 text-green-500" />} />
                <TimeGoalRow label="Minutos inglés" actual={timeByArea.ingles || 0} goal={periodGoal('ingles')} color="blue" icon={<Globe className="h-3 w-3 text-blue-500" />} />
              </div>
            ) : null}

            {/* ---- Metas Personales ---- */}
            {personalGoals.length > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Metas Personales</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">{goalsDone}/{goalsTotal}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {personalGoals.map((g, i) => {
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
              </div>
            )}
          </div>

          {/* ===== PROFESIONAL ACADÉMICO ===== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" />
              <div>
                <h2 className="text-base font-bold">Profesional Académico</h2>
                <p className="text-[10px] text-muted-foreground">{scopeLabel} · Carrera, estudios y proyectos</p>
              </div>
            </div>

            {monthSubjectIds.length > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-blue-200/50">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Asignaturas a estudiar</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5">{monthSubjectIds.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {monthSubjectIds.map(sid => {
                    const sub = subjectsById[sid];
                    return sub ? (
                      <Badge key={sid} variant="outline" className="text-[10px] px-2.5 py-1 border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">{sub.name}</Badge>
                    ) : null;
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-blue-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Tareas completadas</p>
                    <p className="text-base font-bold text-blue-500">{tasks.filter(t => completedTaskIds.includes(t.id)).length}/{tasks.length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-blue-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Minutos enfoque / meta</p>
                    <p className={cn("text-base font-bold", periodGoal('universidad') > 0 && (focusAreaMinutes.universidad || 0) >= periodGoal('universidad') ? "text-emerald-500" : "text-blue-500")}>
                      {Math.round(focusAreaMinutes.universidad || 0)}min / {periodGoal('universidad')}min
                    </p>
                  </div>
                </div>
                <Progress value={periodGoal('universidad') > 0 ? Math.min(100, Math.round(((focusAreaMinutes.universidad || 0) / periodGoal('universidad')) * 100)) : 0} className="h-1.5" />
              </div>
            )}

            {monthProjectIds.length > 0 && (
              <div className="space-y-2 pl-4 border-l-2 border-amber-200/50">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Proyectos</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5">{monthProjectIds.length}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Tareas completadas (gral)</p>
                    <p className="text-base font-bold text-amber-500">{tasks.filter(t => completedTaskIds.includes(t.id) && t.source === 'proyecto').length}/{tasks.filter(t => t.source === 'proyecto').length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Minutos enfoque / meta</p>
                    <p className={cn("text-base font-bold", periodGoal('proyectos') > 0 && (focusAreaMinutes.proyectos || 0) >= periodGoal('proyectos') ? "text-emerald-500" : "text-amber-500")}>
                      {Math.round(focusAreaMinutes.proyectos || 0)}min / {periodGoal('proyectos')}min
                    </p>
                  </div>
                </div>
                <Progress value={periodGoal('proyectos') > 0 ? Math.min(100, Math.round(((focusAreaMinutes.proyectos || 0) / periodGoal('proyectos')) * 100)) : 0} className="h-1.5" />
              </div>
            )}

            {monthEntrepreneurshipIds.length > 0 || (plan?.notes?.emprendimiento) || tasks.some(t => t.source === 'emprendimiento') ? (
              <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Emprendimiento</span>
                  {monthEntrepreneurshipIds.length > 0 && <Badge variant="secondary" className="text-[9px] px-1.5">{monthEntrepreneurshipIds.length}</Badge>}
                </div>
                {plan?.notes?.emprendimiento && (
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40">
                    <p className="text-[11px] text-muted-foreground">{plan.notes.emprendimiento}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Tareas completadas</p>
                    <p className="text-base font-bold text-purple-500">{tasks.filter(t => completedTaskIds.includes(t.id) && t.source === 'emprendimiento').length}/{tasks.filter(t => t.source === 'emprendimiento').length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Minutos enfoque / meta</p>
                    <p className={cn("text-base font-bold", periodGoal('emprendimiento') > 0 && (focusAreaMinutes.emprendimiento || 0) >= periodGoal('emprendimiento') ? "text-emerald-500" : "text-purple-500")}>
                      {Math.round(focusAreaMinutes.emprendimiento || 0)}min / {periodGoal('emprendimiento')}min
                    </p>
                  </div>
                </div>
                <Progress value={periodGoal('emprendimiento') > 0 ? Math.min(100, Math.round(((focusAreaMinutes.emprendimiento || 0) / periodGoal('emprendimiento')) * 100)) : 0} className="h-1.5" />
                {monthEntrepreneurshipIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {monthEntrepreneurshipIds.map(eid => {
                      const ent = entrepreneurshipsById[eid];
                      return ent ? (
                        <Badge key={eid} variant="outline" className="text-[10px] px-2.5 py-1 border-purple-200 bg-purple-50/30 dark:bg-purple-950/20">{ent.name}</Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {(tasks.length > 0 || events.length > 0) && (
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 text-foreground" />
                  <span className="text-xs font-semibold">Tareas Generales</span>
                </div>
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tareas del período</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        {tasks.filter(t => completedTaskIds.includes(t.id)).length}/{tasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {tasks.slice(0, 30).map(task => {
                        const done = completedTaskIds.includes(task.id);
                        return (
                          <div key={task.id} className={cn("flex items-center gap-2 p-2 rounded-lg text-xs border border-border/40", done ? "text-muted-foreground bg-muted/20" : "hover:bg-muted/30")}>
                            <Checkbox checked={done} className="h-3.5 w-3.5" />
                            <span className={cn("flex-1 truncate", done && "line-through")}>{task.title}</span>
                            <Badge variant="outline" className="text-[8px] px-1">{task.source}</Badge>
                            {task.due_date && <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(task.due_date), 'd MMM', { locale: es })}</span>}
                          </div>
                        );
                      })}
                      {tasks.length > 30 && <p className="text-[9px] text-muted-foreground pl-1">+{tasks.length - 30} tareas más</p>}
                    </div>
                  </div>
                )}
                {events.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">Eventos del período</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        {events.filter(e => completedEventIds.includes(e.id)).length}/{events.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {events.slice(0, 30).map(ev => {
                        const done = completedEventIds.includes(ev.id);
                        return (
                          <div key={ev.id} className={cn("flex items-center gap-2 p-2 rounded-lg text-xs border border-border/40", done ? "text-muted-foreground bg-muted/20" : "hover:bg-muted/30")}>
                            <Checkbox checked={done} className="h-3.5 w-3.5" />
                            <span className={cn("flex-1 truncate", done && "line-through")}>{ev.title}</span>
                            <Badge variant="outline" className="text-[8px] px-1">{ev.category}</Badge>
                            <span className="text-[9px] text-muted-foreground shrink-0">{format(new Date(ev.event_date), 'd MMM', { locale: es })}</span>
                          </div>
                        );
                      })}
                      {events.length > 30 && <p className="text-[9px] text-muted-foreground pl-1">+{events.length - 30} eventos más</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== METAS DE TIEMPO VS ESFUERZO REAL ===== */}
          {ALL_HIERARCHY_AREAS.some(a => periodGoal(a) > 0) && (
            <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold">Metas de Tiempo — {scopeLabel}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{totalMinutes}min acumulados</span>
                </div>
                <div className="space-y-2">
                  <TimeGoalRow label="Lectura" actual={timeByArea.lectura || 0} goal={periodGoal('lectura')} color="emerald" icon={<Book className="h-3 w-3 text-emerald-500" />} />
                  <TimeGoalRow label="Música" actual={timeByArea.musica || 0} goal={periodGoal('musica')} color="rose" icon={<Music className="h-3 w-3 text-rose-500" />} />
                  <TimeGoalRow label="Ajedrez" actual={timeByArea.ajedrez || 0} goal={periodGoal('ajedrez')} color="teal" icon={<Gamepad2 className="h-3 w-3 text-teal-500" />} />
                  <TimeGoalRow label="Italiano" actual={(timeByArea.italiano || 0) + (timeByArea.idiomas || 0)} goal={periodGoal('italiano')} color="green" icon={<Globe className="h-3 w-3 text-green-500" />} />
                  <TimeGoalRow label="Inglés" actual={timeByArea.ingles || 0} goal={periodGoal('ingles')} color="blue" icon={<Globe className="h-3 w-3 text-blue-500" />} />
                  <TimeGoalRow label="Gym" actual={timeByArea['entrenamiento-fisico'] || 0} goal={periodGoal('gym')} color="orange" icon={<Dumbbell className="h-3 w-3 text-orange-500" />} />
                  <TimeGoalRow label="Game" actual={timeByArea.game || 0} goal={periodGoal('game')} color="pink" icon={<Zap className="h-3 w-3 text-pink-500" />} />
                  <TimeGoalRow label="Universidad" actual={focusAreaMinutes.universidad || 0} goal={periodGoal('universidad')} color="blue" icon={<GraduationCap className="h-3 w-3 text-blue-500" />} />
                  <TimeGoalRow label="Proyectos" actual={focusAreaMinutes.proyectos || 0} goal={periodGoal('proyectos')} color="amber" icon={<FolderKanban className="h-3 w-3 text-amber-500" />} />
                  <TimeGoalRow label="Emprendimiento" actual={focusAreaMinutes.emprendimiento || 0} goal={periodGoal('emprendimiento')} color="purple" icon={<Briefcase className="h-3 w-3 text-purple-500" />} />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Book selector dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Seleccionar libro</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar libro..."
              value={slotSearch}
              onChange={e => setSlotSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredSlotBooks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {availableForSlot.length === 0 ? 'No hay más libros disponibles' : 'Sin resultados'}
              </p>
            )}
            {filteredSlotBooks.map(book => (
              <button
                key={book.id}
                onClick={() => handleAddBookToMonth(book.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left transition-colors"
              >
                <div className="w-10 h-14 rounded bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-emerald-400/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  {book.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
