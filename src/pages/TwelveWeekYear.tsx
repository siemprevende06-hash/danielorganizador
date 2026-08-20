import { useState, useEffect, Component, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell } from "recharts";
import { AreaEffortResultsPanel } from "@/components/areas/AreaEffortResultsPanel";
import { LifeAreaScoresPanel } from "@/components/areas/LifeAreaScoresPanel";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";
import { useTrimestralPlan, getMonthNamesForQuarter, loadTrimestralPlanFromLocal } from "@/hooks/useTrimestralPlan";
import { pushSyncKey, pullPlansIntoLocal } from "@/lib/planSync";
import { CentralAreasSection, CENTRAL_AREAS } from "@/components/twelveweekyear/CentralAreasSection";

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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PeriodControlSection } from "@/components/control/PeriodControlSection";
import {
  BookOpen, Music, Target, Calendar, Flame,
  Zap, BarChart3, Check, Piano, Guitar, LayoutDashboard,
  Brain, Globe, Code, Sword, Book,
  GraduationCap, FolderKanban, Briefcase, ListTodo,
  Clock, Timer, Heart, Crown, Trophy, Gamepad2,
  Search, Plus
} from "lucide-react";

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
  timeGoals: Record<string, Record<string, number>>;
  areaTimeGoals: Record<string, Record<string, number>>;
}

interface BookDetail { id: string; title: string; author: string | null; cover_image_url: string | null; pages_read?: number | null; pages_total?: number | null; }
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

interface ChessMonthData {
  gamesPlayed: number;
  practiceDays: number;
  targetGames: number;
  targetMinutes: number;
}

interface LanguageMonthData {
  italiano: { practiceDays: number };
  ingles: { practiceDays: number };
}

const QUARTERS = [
  { id: 1, name: "Q1", dates: "Ene – Mar" },
  { id: 2, name: "Q2", dates: "Abr – Jun" },
  { id: 3, name: "Q3", dates: "Jul – Sep" },
  { id: 4, name: "Q4", dates: "Oct – Dic" },
];

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

const PROGRESS_KEY = "trimestral_progress_Q";

const YEAR = 2026;

const AREA_LABELS: Record<string, string> = {
  lectura: 'Lectura', musica: 'Música', ajedrez: 'Ajedrez',
  idiomas: 'Idiomas', gym: 'Gimnasio', piano: 'Piano', guitarra: 'Guitarra',
  dibujo: 'Dibujo', italiano: 'Italiano', ingles: 'Inglés',
  game: 'Game Seducción', 'entrenamiento-fisico': 'Gym',
};

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

export default function TwelveWeekYear() {
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { streak: overallStreak } = useOverallSystemStreak();
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const qp = parseInt(searchParams.get('q') || '', 10);
    if (qp >= 1 && qp <= 4) return qp;
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const month = new Date().getMonth();
    return (month % 3);
  });
  const [scope, setScope] = useState<'month' | 'quarter'>('month');
  const [activeCentral, setActiveCentral] = useState('desarrollo');
  const [activeSub, setActiveSub] = useState('lectura');

  const monthLabels = getMonthNamesForQuarter(selectedQuarter);

  const [plan, setPlan] = useState<TrimestralPlan | null>(null);
  const [books, setBooks] = useState<BookDetail[]>([]);
  const [songs, setSongs] = useState<SongDetail[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [entrepreneurships, setEntrepreneurships] = useState<ProjectItem[]>([]);
  const [monthTasks, setMonthTasks] = useState<Record<string, TaskItem[]>>({});
  const [monthEvents, setMonthEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [monthlyTimeData, setMonthlyTimeData] = useState<Record<string, MonthlyTimeData>>({});
  const [chessData, setChessData] = useState<Record<string, ChessMonthData>>({});
  const [langData, setLangData] = useState<Record<string, LanguageMonthData>>({});
  const [progress, setProgress] = useState<ProgressData>({
    completedBooks: [], completedSongs: [], completedGoals: [],
    bookProgress: {}, songProgress: {},
  });
  const [focusAreaStats, setFocusAreaStats] = useState<Record<string, number>>({});
  const [projectDetails, setProjectDetails] = useState<Record<string, any>>({});
  const [allBooks, setAllBooks] = useState<BookDetail[]>([]);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [slotSearch, setSlotSearch] = useState('');

  const storageKey = `${PROGRESS_KEY}${selectedQuarter}_${YEAR}`;
  const monthKey = MONTH_KEYS[selectedMonth];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await pullPlansIntoLocal();
        const parsed = loadTrimestralPlanFromLocal(`Q${selectedQuarter}_${YEAR}`);
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
        const year = YEAR;
        const quarterStart = new Date(year, qStartMonth, 1);
        const quarterEnd = new Date(year, qStartMonth + 3, 0);
        const qs = format(quarterStart, 'yyyy-MM-dd');
        const qe = format(quarterEnd, 'yyyy-MM-dd');

        const [booksRes, songsRes, tasksRes, eventsRes, allBooksRes] = await Promise.all([
          allBookIds.length > 0
            ? supabase.from("reading_library").select("id, title, author, cover_image_url, pages_read, pages_total").in("id", allBookIds)
            : Promise.resolve({ data: [] }),
          allSongIds.length > 0
            ? supabase.from("music_repertoire").select("id, title, artist, instrument").in("id", allSongIds)
            : Promise.resolve({ data: [] }),
          supabase.from('tasks').select('id, title, source, due_date, completed, priority')
            .gte('due_date', qs).lte('due_date', qe),
          supabase.from('calendar_events').select('*')
            .gte('event_date', qs).lte('event_date', qe).order('event_date'),
          supabase.from('reading_library').select('id, title, author, cover_image_url, pages_read, pages_total').order('title'),
        ]);
        if (booksRes.data) setBooks(booksRes.data);
        if (allBooksRes.data) setAllBooks(allBooksRes.data);
        if (songsRes.data) setSongs(songsRes.data);

        try {
          const { data: projRows } = await supabase.from('projects').select('id, title');
          if (projRows) setProjects(projRows.map((p: any) => ({ id: p.id, name: p.title })));
        } catch {}
        try {
          const { data: subjRows } = await supabase.from('university_subjects').select('id, name');
          if (subjRows) setSubjects(subjRows.map((s: any) => ({ id: s.id, name: s.name })));
        } catch {}
        try {
          const { data: entRows } = await supabase.from('entrepreneurships').select('id, name');
          if (entRows) setEntrepreneurships(entRows.map((e: any) => ({ id: e.id, name: e.name })));
        } catch {}

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

        // Load time data, chess data, and language data per month (all from daily_systems_tracking)
        const monthTimes: Record<string, MonthlyTimeData> = {};
        const chessByMonth: Record<string, ChessMonthData> = {};
        const langByMonth: Record<string, LanguageMonthData> = {};
        const [chessGoalsRes] = await Promise.all([
          supabase.from('chess_goals').select('target_games_per_month, target_minutes_per_day').eq('is_active', true).maybeSingle(),
        ]);
        const chessTargetGames = (chessGoalsRes.data as any)?.target_games_per_month || 30;
        const chessTargetMinutes = (chessGoalsRes.data as any)?.target_minutes_per_day || 30;
        for (let mi = 0; mi < 3; mi++) {
          const ms = new Date(year, qStartMonth + mi, 1);
          const me = new Date(year, qStartMonth + mi + 1, 0);
          const { data: trackingRows } = await supabase
            .from('daily_systems_tracking')
            .select('tracking_date, time_data, count_data')
            .gte('tracking_date', format(ms, 'yyyy-MM-dd'))
            .lte('tracking_date', format(me, 'yyyy-MM-dd'));
          const byArea: Record<string, number> = {};
          let total = 0;
          let chessGames = 0;
          const chessDays = new Set<string>();
          const italianoDays = new Set<string>();
          const inglesDays = new Set<string>();
          (trackingRows || []).forEach((row: any) => {
            const td = row.time_data || {};
            Object.entries(td).forEach(([key, val]) => {
              const v = val as number;
              byArea[key] = (byArea[key] || 0) + v;
              total += v;
            });
            const cd = row.count_data || {};
            const cg = Number(cd.ajedrez) || 0;
            if (cg > 0) {
              chessGames += cg;
              chessDays.add(row.tracking_date);
            }
            if ((Number(td.italiano) || 0) > 0) italianoDays.add(row.tracking_date);
            if ((Number(td.ingles) || 0) > 0) inglesDays.add(row.tracking_date);
          });
          const mk = `month${mi + 1}`;
          monthTimes[mk] = { totalMinutes: total, byArea };
          chessByMonth[mk] = { gamesPlayed: chessGames, practiceDays: chessDays.size, targetGames: chessTargetGames, targetMinutes: chessTargetMinutes };
          langByMonth[mk] = { italiano: { practiceDays: italianoDays.size }, ingles: { practiceDays: inglesDays.size } };
        }
        setMonthlyTimeData(monthTimes);
        setChessData(chessByMonth);
        setLangData(langByMonth);

        // Load focus area stats (universidad, proyectos, emprendimiento)
        const areaStatsAccum: Record<string, number> = {};
        for (let mi = 0; mi < 3; mi++) {
          const ms = new Date(year, qStartMonth + mi, 1);
          const me = new Date(year, qStartMonth + mi + 1, 0);
          const { data: areaRows } = await supabase
            .from('daily_area_stats')
            .select('area_id, time_spent_minutes, stat_date')
            .in('area_id', ['universidad', 'emprendimiento', 'proyectos'])
            .gte('stat_date', format(ms, 'yyyy-MM-dd'))
            .lte('stat_date', format(me, 'yyyy-MM-dd'));
          (areaRows || []).forEach((row: any) => {
            const area = row.area_id;
            const mins = row.time_spent_minutes || 0;
            areaStatsAccum[area] = (areaStatsAccum[area] || 0) + mins;
          });
        }
        setFocusAreaStats(areaStatsAccum);

        // Load project details with tasks
        if (allBookIds.length > 0 || monthProjectIds.length > 0) {
          try {
            const { data: projRows } = await supabase
              .from('projects')
              .select('id, title, tasks');
            if (projRows) {
              const details: Record<string, any> = {};
              projRows.forEach((p: any) => { details[p.id] = { name: p.title, tasks: p.tasks || [] }; });
              setProjectDetails(details);
            }
          } catch (e) { console.error('Error loading project details:', e); }
        }

      } catch { console.error("Error loading plan"); }
      setLoading(false);
    };
    load();
  }, [selectedQuarter]);

  const saveProgress = (p: ProgressData) => {
    setProgress(p);
    localStorage.setItem(storageKey, JSON.stringify(p));
    pushSyncKey(storageKey);
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

  const handleAddBookToMonth = (bookId: string) => {
    const storageKey = `trimestral_plan_Q${selectedQuarter}_${YEAR}`;
    const currentPlan = loadTrimestralPlanFromLocal(`Q${selectedQuarter}_${YEAR}`);
    if (!currentPlan) return;

    const currentBooks = [...(currentPlan.distribution[monthKey]?.books || [])];
    if (currentBooks.includes(bookId)) return;
    currentBooks.push(bookId);

    const updatedPlan = {
      ...currentPlan,
      distribution: {
        ...currentPlan.distribution,
        [monthKey]: { ...currentPlan.distribution[monthKey], books: currentBooks },
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(updatedPlan));
    pushSyncKey(storageKey);
    setPlan(updatedPlan);
    const newBook = allBooks.find(b => b.id === bookId);
    if (newBook && !books.find(b => b.id === bookId)) {
      setBooks(prev => [...prev, newBook]);
    }
    setSlotDialogOpen(false);
  };

  const getWeekInQuarter = () => {
    const now = new Date();
    const startOfYear = new Date(YEAR, 0, 1);
    const week = Math.min(Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)), 52);
    return ((week - 1) % 12) + 1;
  };
  const weekInQ = getWeekInQuarter();
  const weekProgress = (weekInQ / 12) * 100;

  const totalBooksTarget = plan?.books?.goal || 0;
  const totalSongsTarget = plan?.songs?.goal || 0;
  const slotsPerMonth = totalBooksTarget > 0 ? Math.max(1, Math.round(totalBooksTarget / 3)) : 2;
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

  const getMonthProgress = (mk: typeof MONTH_KEYS[number]) => {
    if (!plan) return { books: [], songs: [], booksPct: 0, songsPct: 0, booksCount: 0, songsCount: 0, completedBooks: 0, completedSongs: 0 };
    const monthBooks = plan.distribution?.[mk]?.books || [];
    const monthSongs = plan.distribution?.[mk]?.songs || [];
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

  const isQuarterScope = scope === 'quarter';
  const qStartMonth = (selectedQuarter - 1) * 3;
  const quarterStartDate = new Date(YEAR, qStartMonth, 1);
  const quarterEndDate = new Date(YEAR, qStartMonth + 3, 0);
  const monthStartDate = new Date(YEAR, qStartMonth + selectedMonth, 1);
  const monthEndDate = new Date(YEAR, qStartMonth + selectedMonth + 1, 0);

  const monthMp = getMonthProgress(monthKey);
  const mp = isQuarterScope
    ? (() => {
        const months = MONTH_KEYS.map(mk => getMonthProgress(mk));
        const qBooks = [...new Set(months.flatMap(m => m.books))];
        const qSongs = [...new Set(months.flatMap(m => m.songs))];
        const qCompletedBooks = qBooks.filter(id => progress.completedBooks.includes(id)).length;
        const qCompletedSongs = qSongs.filter(id => progress.completedSongs.includes(id)).length;
        return {
          books: qBooks, songs: qSongs,
          booksCount: qBooks.length, songsCount: qSongs.length,
          completedBooks: qCompletedBooks, completedSongs: qCompletedSongs,
          booksPct: qBooks.length > 0 ? Math.round((qCompletedBooks / qBooks.length) * 100) : 0,
          songsPct: qSongs.length > 0 ? Math.round((qCompletedSongs / qSongs.length) * 100) : 0,
        };
      })()
    : monthMp;

  const timeData = isQuarterScope
    ? (() => {
        const byArea: Record<string, number> = {};
        let totalMinutes = 0;
        MONTH_KEYS.forEach(mk => {
          const t = monthlyTimeData[mk];
          if (!t) return;
          totalMinutes += t.totalMinutes || 0;
          Object.entries(t.byArea || {}).forEach(([k, v]) => { byArea[k] = (byArea[k] || 0) + (v || 0); });
        });
        return { totalMinutes, byArea };
      })()
    : monthlyTimeData[monthKey];

  const tasks = isQuarterScope ? MONTH_KEYS.flatMap(mk => monthTasks[mk] || []) : (monthTasks[monthKey] || []);
  const events = isQuarterScope ? MONTH_KEYS.flatMap(mk => monthEvents[mk] || []) : (monthEvents[monthKey] || []);
  const completedTaskIds: string[] = isQuarterScope
    ? MONTH_KEYS.flatMap(mk => plan?.completedTasks?.[mk] || [])
    : (plan?.completedTasks?.[monthKey] || []);
  const completedEventIds: string[] = isQuarterScope
    ? MONTH_KEYS.flatMap(mk => plan?.completedEvents?.[mk] || [])
    : (plan?.completedEvents?.[monthKey] || []);

  const monthBooks = mp.books.map(id => books.find(b => b.id === id)).filter(Boolean) as BookDetail[];
  const availableForSlot = allBooks.filter(b => !monthMp.books.includes(b.id));
  const filteredSlotBooks = availableForSlot.filter(b =>
    b.title.toLowerCase().includes(slotSearch.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(slotSearch.toLowerCase()))
  );
  const monthSongsData = mp.songs.map(id => songs.find(s => s.id === id)).filter(Boolean) as SongDetail[];
  const monthSubjectIds = isQuarterScope
    ? [...new Set(MONTH_KEYS.flatMap(mk => plan?.monthSubjects?.[mk] || []))]
    : (plan?.monthSubjects?.[monthKey] || []);
  const monthProjectIds = isQuarterScope
    ? [...new Set(MONTH_KEYS.flatMap(mk => plan?.monthProjects?.[mk] || []))]
    : (plan?.monthProjects?.[monthKey] || []);
  const monthEntrepreneurshipIds = isQuarterScope
    ? [...new Set(MONTH_KEYS.flatMap(mk => plan?.monthEntrepreneurships?.[mk] || []))]
    : (plan?.monthEntrepreneurships?.[monthKey] || []);

  const chessMonth = isQuarterScope
    ? {
        gamesPlayed: MONTH_KEYS.reduce((s, mk) => s + (chessData[mk]?.gamesPlayed || 0), 0),
        practiceDays: MONTH_KEYS.reduce((s, mk) => s + (chessData[mk]?.practiceDays || 0), 0),
        targetGames: MONTH_KEYS.reduce((s, mk) => s + (chessData[mk]?.targetGames || 0), 0),
        targetMinutes: MONTH_KEYS.reduce((s, mk) => s + (chessData[mk]?.targetMinutes || 0), 0),
      }
    : chessData[monthKey];

  const langMonth = isQuarterScope
    ? {
        italiano: { practiceDays: MONTH_KEYS.reduce((s, mk) => s + (langData[mk]?.italiano?.practiceDays || 0), 0) },
        ingles: { practiceDays: MONTH_KEYS.reduce((s, mk) => s + (langData[mk]?.ingles?.practiceDays || 0), 0) },
      }
    : langData[monthKey];

  const pianoSongs = monthSongsData.filter(s => s.instrument === 'piano');
  const guitarSongs = monthSongsData.filter(s => s.instrument === 'guitar');

  const goalFor = (area: string) => isQuarterScope
    ? MONTH_KEYS.reduce((s, mk) => s + (plan?.timeGoals?.[mk]?.[area] || 0), 0)
    : (plan?.timeGoals?.[monthKey]?.[area] || 0);

  const areaGoalFor = (area: string) => isQuarterScope
    ? MONTH_KEYS.reduce((s, mk) => s + (plan?.areaTimeGoals?.[mk]?.[area] || 0), 0)
    : (plan?.areaTimeGoals?.[monthKey]?.[area] || 0);

  const periodLabel = isQuarterScope ? `Q${selectedQuarter} · Trimestre` : monthLabels[selectedMonth];
  const periodSuffix = isQuarterScope ? 'Trimestre' : 'Mes';
  const showTimeGoalsCard = isQuarterScope
    ? MONTH_KEYS.some(mk => !!plan?.timeGoals?.[mk])
    : !!plan?.timeGoals?.[monthKey];
  const showChessSection = isQuarterScope ? MONTH_KEYS.some(mk => !!chessData[mk]) : !!chessMonth;
  const showLangSection = isQuarterScope ? MONTH_KEYS.some(mk => !!langData[mk]) : !!langMonth;

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

        {/* Panel de control del trimestre */}
        <PeriodControlSection scope="quarter" start={quarterStartDate} end={quarterEndDate} />

        {/* Quarter selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUARTERS.map(q => {
            const isActive = selectedQuarter === q.id;
            return (
              <button key={q.id} onClick={() => setSelectedQuarter(q.id)}
                className={cn(
                  "relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"
                )}>
                <div className="text-lg font-bold">{q.name}</div>
                <div className={cn("text-[10px] mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>{q.dates}</div>
              </button>
            );
          })}
        </div>

        {/* Scope: Mes / Trimestre */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Período</span>
          <div className="inline-flex gap-1 p-1 rounded-xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40">
            {(['month', 'quarter'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  scope === s ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}>
                {s === 'month' ? 'Mes' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>

        {/* Month selector */}
        <div className={cn("flex gap-2 transition-opacity", isQuarterScope && "opacity-50")}>
          {monthLabels.map((label, i) => {
            const isActive = selectedMonth === i;
            const colors = ["from-sky-500 to-cyan-400", "from-violet-500 to-purple-400", "from-amber-500 to-orange-400"];
            return (
              <button key={i} onClick={() => { setSelectedMonth(i); setScope('month'); }}
                className={cn(
                  "flex-1 relative rounded-2xl p-3 text-center transition-all border-0 backdrop-blur-xl",
                  isActive
                    ? `bg-gradient-to-r ${colors[i]} text-white shadow-lg scale-[1.02]`
                    : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"
                )}>
                <div className="text-base font-bold">{label}</div>
                <div className={cn("text-[10px] mt-0.5", isActive ? "text-white/70" : "text-muted-foreground")}>
                  Mes {i + 1}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { icon: <Zap className="h-4 w-4 text-blue-500" />, label: "Semana", value: weekInQ, gradient: "from-blue-500 to-cyan-400" },
            { icon: <BarChart3 className="h-4 w-4 text-purple-500" />, label: "Progreso", value: `${overallPct}%`, gradient: "from-purple-500 to-pink-400" },
            { icon: <BookOpen className="h-4 w-4 text-emerald-500" />, label: "Libros", value: `${completedBooksCount}/${totalBooksTarget}`, gradient: "from-emerald-500 to-teal-400" },
            { icon: <Music className="h-4 w-4 text-rose-500" />, label: "Canciones", value: `${completedSongsCount}/${totalSongsTarget}`, gradient: "from-rose-500 to-pink-400" },
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

        {/* Time progress */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
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

        {/* Áreas Centrales */}
        <SafeSection title="Áreas Centrales">
          <CentralAreasSection
            selectedQuarter={selectedQuarter}
            activeCentral={activeCentral}
            activeSub={activeSub}
            onCentralChange={(id) => { setActiveCentral(id); const def = CENTRAL_AREAS.find(a => a.id === id); if (def?.subAreas?.length) setActiveSub(def.subAreas[0].id); }}
            onSubChange={setActiveSub}
            year={YEAR}
            start={isQuarterScope ? quarterStartDate : monthStartDate}
            end={isQuarterScope ? quarterEndDate : monthEndDate}
            getGoal={(subId) => isQuarterScope
              ? MONTH_KEYS.reduce((s, mk) => s + ((plan?.timeGoals?.[mk]?.[subId] || 0) + (plan?.areaTimeGoals?.[mk]?.[subId] || 0)), 0)
              : ((plan?.timeGoals?.[monthKey]?.[subId] || 0) + (plan?.areaTimeGoals?.[monthKey]?.[subId] || 0))}
          />
        </SafeSection>

        {!plan ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin plan trimestral</p>
              <p className="text-xs text-muted-foreground text-center mb-2">Ve a Plan Trimestral y crea un plan para {QUARTERS.find(q => q.id === selectedQuarter)?.name}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall progress */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
              <CardContent className="p-4 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" /> Progreso General — {periodLabel}
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

            {activeCentral === 'desarrollo' && (<>
            {/* ===== DESARROLLO PERSONAL ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
                <div>
                  <h2 className="text-base font-bold">Desarrollo Personal</h2>
                  <p className="text-[10px] text-muted-foreground">{periodLabel} · Crecimiento intelectual, creatividad y bienestar</p>
                </div>
              </div>

              {activeSub === 'lectura' && (
              <div className="space-y-2 pl-4 border-l-2 border-emerald-200/50">
                <div className="flex items-center gap-2">
                  <Book className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Lectura</span>
                  <Progress value={mp.booksPct} className="h-1 flex-1 max-w-[80px]" />
                  <span className="text-[10px] font-medium text-emerald-600">{mp.booksPct}%</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
                    {mp.completedBooks}/{mp.booksCount} leídos
                  </Badge>
                </div>
                <TimeGoalRow label="Minutos de lectura" actual={timeData?.byArea?.lectura || 0} goal={goalFor('lectura')} color="emerald" icon={<Book className="h-3 w-3 text-emerald-500" />} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: isQuarterScope ? monthBooks.length : Math.max(slotsPerMonth, monthBooks.length) }).map((_, i) => {
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
                    if (isQuarterScope) return null;
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
              )}

              {activeSub === 'musica' && (pianoSongs.length > 0 || guitarSongs.length > 0) && (
                <div className="space-y-2 pl-4 border-l-2 border-rose-200/50">
                  <div className="flex items-center gap-2">
                    <Music className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Música</span>
                    <span className="text-[10px] text-muted-foreground">{mp.completedSongs}/{mp.songsCount} completadas</span>
                  </div>
                  <TimeGoalRow label="Minutos de práctica" actual={timeData?.byArea?.musica || 0} goal={goalFor('musica')} color="rose" icon={<Music className="h-3 w-3 text-rose-500" />} />
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

              {activeSub === 'ajedrez' && showChessSection && chessMonth && (
                <div className="space-y-2 pl-4 border-l-2 border-teal-200/50">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-3.5 w-3.5 text-teal-500" />
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Ajedrez</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Partidas meta/{isQuarterScope ? 'trimestre' : 'mes'}</p>
                      <p className="text-lg font-bold text-teal-500">{chessMonth.targetGames}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Partidas jugadas</p>
                      <p className={cn("text-lg font-bold", chessMonth.gamesPlayed >= chessMonth.targetGames ? "text-emerald-500" : "text-amber-500")}>{chessMonth.gamesPlayed}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Días de práctica</p>
                      <p className="text-lg font-bold text-teal-500">{chessMonth.practiceDays}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Minutos meta/{isQuarterScope ? 'trimestre' : 'mes'}</p>
                      <p className="text-lg font-bold text-teal-500">{goalFor('ajedrez')}min</p>
                    </div>
                  </div>
                  <Progress value={chessMonth.targetGames > 0 ? Math.min(100, Math.round((chessMonth.gamesPlayed / chessMonth.targetGames) * 100)) : 0} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{chessMonth.gamesPlayed}/{chessMonth.targetGames} partidas este {isQuarterScope ? 'trimestre' : 'mes'}</p>
                  <TimeGoalRow label="Minutos de ajedrez" actual={timeData?.byArea?.ajedrez || 0} goal={goalFor('ajedrez')} color="teal" icon={<Gamepad2 className="h-3 w-3 text-teal-500" />} />
                </div>
              )}

              {activeSub === 'idiomas' && showLangSection && langMonth && (
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
                          <p className="text-lg font-bold text-green-500">{langMonth.italiano.practiceDays}</p>
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
                          <p className="text-lg font-bold text-blue-500">{langMonth.ingles.practiceDays}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground">Plan</p>
                          <p className="text-sm font-medium text-muted-foreground">{plan?.notes?.ingles || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TimeGoalRow label="Minutos italiano" actual={(timeData?.byArea?.italiano || 0) + (timeData?.byArea?.idiomas || 0)} goal={goalFor('italiano')} color="green" icon={<Globe className="h-3 w-3 text-green-500" />} />
                  <TimeGoalRow label="Minutos inglés" actual={timeData?.byArea?.ingles || 0} goal={goalFor('ingles')} color="blue" icon={<Globe className="h-3 w-3 text-blue-500" />} />
                </div>
              )}

              {/* ---- Metas Personales ---- */}
              {plan.personal_goals?.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Metas Personales</span>
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
                </div>
              )}
            </div>
            </>)}

            {activeCentral === 'profesional' && (<>
            {/* ===== PROFESIONAL ACADÉMICO ===== */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" />
                <div>
                  <h2 className="text-base font-bold">Profesional Académico</h2>
                  <p className="text-[10px] text-muted-foreground">{periodLabel} · Carrera, estudios y proyectos</p>
                </div>
              </div>

              {activeSub === 'universidad' && monthSubjectIds.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-blue-200/50">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Asignaturas a estudiar</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5">{monthSubjectIds.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {monthSubjectIds.map(sid => {
                      const sub = subjects.find(s => s.id === sid);
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
                      <p className={cn("text-base font-bold", (areaGoalFor('universidad') || 0) > 0 && (focusAreaStats.universidad || 0) >= (areaGoalFor('universidad') || 0) ? "text-emerald-500" : "text-blue-500")}>
                        {Math.round(focusAreaStats.universidad || 0)}min / {areaGoalFor('universidad') || 0}min
                      </p>
                    </div>
                  </div>
                  <Progress value={(areaGoalFor('universidad') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.universidad || 0) / (areaGoalFor('universidad') || 0)) * 100)) : 0} className="h-1.5" />
                </div>
              )}

              {activeSub === 'proyectos' && monthProjectIds.length > 0 && (
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
                      <p className={cn("text-base font-bold", (areaGoalFor('proyectos') || 0) > 0 && (focusAreaStats.proyectos || 0) >= (areaGoalFor('proyectos') || 0) ? "text-emerald-500" : "text-amber-500")}>
                        {Math.round(focusAreaStats.proyectos || 0)}min / {areaGoalFor('proyectos') || 0}min
                      </p>
                    </div>
                  </div>
                  <Progress value={(areaGoalFor('proyectos') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.proyectos || 0) / (areaGoalFor('proyectos') || 0)) * 100)) : 0} className="h-1.5" />
                  <div className="space-y-2">
                    {monthProjectIds.map(pid => {
                      const detail = projectDetails[pid];
                      if (!detail) return null;
                      const projTasks = detail.tasks || [];
                      const doneTasks = projTasks.filter((t: any) => t.completed).length;
                      return (
                        <div key={pid} className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">{detail.name}</p>
                            <span className="text-[9px] text-muted-foreground">{doneTasks}/{projTasks.length} tareas</span>
                          </div>
                          {projTasks.length > 0 && (
                            <Progress value={projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0} className="h-1" />
                          )}
                          {projTasks.slice(0, 5).map((t: any) => (
                            <div key={t.id} className="flex items-center gap-1.5 text-[10px]">
                              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.completed ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                              <span className={cn("truncate flex-1", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                            </div>
                          ))}
                          {projTasks.length > 5 && <p className="text-[8px] text-muted-foreground">+{projTasks.length - 5} tareas más</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSub === 'emprendimiento' && (monthEntrepreneurshipIds.length > 0 || plan.notes?.emprendimiento || tasks.some(t => t.source === 'emprendimiento')) && (
                <div className="space-y-2 pl-4 border-l-2 border-purple-200/50">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Emprendimiento</span>
                    {monthEntrepreneurshipIds.length > 0 && <Badge variant="secondary" className="text-[9px] px-1.5">{monthEntrepreneurshipIds.length}</Badge>}
                  </div>
                  {plan.notes?.emprendimiento && (
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
                      <p className={cn("text-base font-bold", (areaGoalFor('emprendimiento') || 0) > 0 && (focusAreaStats.emprendimiento || 0) >= (areaGoalFor('emprendimiento') || 0) ? "text-emerald-500" : "text-purple-500")}>
                        {Math.round(focusAreaStats.emprendimiento || 0)}min / {areaGoalFor('emprendimiento') || 0}min
                      </p>
                    </div>
                  </div>
                  <Progress value={(areaGoalFor('emprendimiento') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.emprendimiento || 0) / (areaGoalFor('emprendimiento') || 0)) * 100)) : 0} className="h-1.5" />
                  {monthEntrepreneurshipIds.length > 0 && (
                    <div className="space-y-2">
                      {monthEntrepreneurshipIds.map(eid => {
                        const ent = entrepreneurships.find((e: any) => e.id === eid);
                        if (!ent) return null;
                        const entTasks = tasks.filter(t => t.source === 'emprendimiento');
                        const doneEntTasks = entTasks.filter(t => completedTaskIds.includes(t.id)).length;
                        return (
                          <div key={eid} className="p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold">{ent.name}</p>
                              <span className="text-[9px] text-muted-foreground">{doneEntTasks}/{entTasks.length} tareas</span>
                            </div>
                            {entTasks.length > 0 && (
                              <Progress value={Math.round((doneEntTasks / entTasks.length) * 100)} className="h-1" />
                            )}
                            {entTasks.slice(0, 5).map(t => (
                              <div key={t.id} className="flex items-center gap-1.5 text-[10px]">
                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", completedTaskIds.includes(t.id) ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                <span className={cn("truncate flex-1", completedTaskIds.includes(t.id) && "line-through text-muted-foreground")}>{t.title}</span>
                              </div>
                            ))}
                            {entTasks.length > 5 && <p className="text-[8px] text-muted-foreground">+{entTasks.length - 5} tareas más</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeSub === 'tareas' && (tasks.length > 0 || events.length > 0) && (
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 text-foreground" />
                  <span className="text-xs font-semibold">Tareas Generales</span>
                </div>
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tareas del {periodSuffix}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        {tasks.filter(t => completedTaskIds.includes(t.id)).length}/{tasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {tasks.map(task => {
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
                    </div>
                  </div>
                )}
                {events.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">Eventos del {periodSuffix}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        {events.filter(e => completedEventIds.includes(e.id)).length}/{events.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {events.map(ev => {
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
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
            </>)}
            {/* ===== METAS DE TIEMPO VS ESFUERZO REAL ===== */}
            {showTimeGoalsCard && (
              <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-semibold">Metas de Tiempo — {periodLabel}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{timeData?.totalMinutes || 0}min acumulados</span>
                  </div>
                  <div className="space-y-2">
                    <TimeGoalRow label="Lectura" actual={timeData?.byArea?.lectura || 0} goal={goalFor('lectura')} color="emerald" icon={<Book className="h-3 w-3 text-emerald-500" />} />
                    <TimeGoalRow label="Música" actual={timeData?.byArea?.musica || 0} goal={goalFor('musica')} color="rose" icon={<Music className="h-3 w-3 text-rose-500" />} />
                    <TimeGoalRow label="Ajedrez" actual={timeData?.byArea?.ajedrez || 0} goal={goalFor('ajedrez')} color="teal" icon={<Gamepad2 className="h-3 w-3 text-teal-500" />} />
                    <TimeGoalRow label="Italiano" actual={(timeData?.byArea?.italiano || 0) + (timeData?.byArea?.idiomas || 0)} goal={goalFor('italiano')} color="green" icon={<Globe className="h-3 w-3 text-green-500" />} />
                    <TimeGoalRow label="Inglés" actual={timeData?.byArea?.ingles || 0} goal={goalFor('ingles')} color="blue" icon={<Globe className="h-3 w-3 text-blue-500" />} />
                    <TimeGoalRow label="Gym" actual={timeData?.byArea?.['entrenamiento-fisico'] || 0} goal={goalFor('gym')} color="orange" icon={<Zap className="h-3 w-3 text-orange-500" />} />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}


      </div>

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
