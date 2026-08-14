import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, Component } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell } from "recharts";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";
import { getMonthNamesForQuarter, loadTrimestralPlanFromLocal } from "@/hooks/useTrimestralPlan";
import { pushSyncKey, pullPlansIntoLocal } from "@/lib/planSync";
import { CentralAreasSection, CENTRAL_AREAS } from "@/components/twelveweekyear/CentralAreasSection";
class SafeSection extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsxs(CardContent, { className: "p-6 text-center text-muted-foreground", children: [_jsxs("p", { className: "text-sm", children: ["No se pudo cargar ", this.props.title] }), _jsx("button", { onClick: () => this.setState({ hasError: false }), className: "text-xs text-primary mt-2 hover:underline", children: "Reintentar" })] }) }));
        }
        return this.props.children;
    }
}
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PeriodControlSection } from "@/components/control/PeriodControlSection";
import { BookOpen, Music, Target, Calendar, Flame, Zap, BarChart3, Check, Piano, Guitar, LayoutDashboard, Globe, Book, GraduationCap, FolderKanban, Briefcase, ListTodo, Timer, Gamepad2, Search, Plus } from "lucide-react";
const QUARTERS = [
    { id: 1, name: "Q1", dates: "Ene – Mar" },
    { id: 2, name: "Q2", dates: "Abr – Jun" },
    { id: 3, name: "Q3", dates: "Jul – Sep" },
    { id: 4, name: "Q4", dates: "Oct – Dic" },
];
const MONTH_KEYS = ["month1", "month2", "month3"];
const PROGRESS_KEY = "trimestral_progress_Q";
const YEAR = 2026;
const AREA_LABELS = {
    lectura: 'Lectura', musica: 'Música', ajedrez: 'Ajedrez',
    idiomas: 'Idiomas', gym: 'Gimnasio', piano: 'Piano', guitarra: 'Guitarra',
    dibujo: 'Dibujo', italiano: 'Italiano', ingles: 'Inglés',
    game: 'Game Seducción', 'entrenamiento-fisico': 'Gym',
};
const GOAL_COLORS = {
    emerald: "#10b981", rose: "#f43f5e", teal: "#14b8a6",
    pink: "#ec4899", green: "#22c55e", blue: "#3b82f6", orange: "#f97316",
};
function TimeGoalRow({ label, actual, goal, color, icon }) {
    const pct = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0;
    const fill = GOAL_COLORS[color] || "#6366f1";
    return (_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "relative shrink-0", children: _jsx(PieChart, { width: 40, height: 40, children: _jsxs(Pie, { data: [
                            { name: "done", value: Math.max(pct, 1) },
                            { name: "remaining", value: Math.max(100 - pct, 0) },
                        ], cx: 20, cy: 20, innerRadius: 14, outerRadius: 18, startAngle: 90, endAngle: -270, dataKey: "value", stroke: "none", children: [_jsx(Cell, { fill: fill }), _jsx(Cell, { fill: "hsl(var(--muted))" })] }) }) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-center justify-between text-[10px]", children: [_jsxs("span", { className: "flex items-center gap-1 text-muted-foreground truncate", children: [icon, " ", label] }), _jsxs("span", { className: "font-medium tabular-nums shrink-0 ml-1", children: [Math.round(actual), "min / ", goal, "min"] })] }) })] }));
}
export default function TwelveWeekYear() {
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const { streak: overallStreak } = useOverallSystemStreak();
    const [selectedQuarter, setSelectedQuarter] = useState(() => {
        const qp = parseInt(searchParams.get('q') || '', 10);
        if (qp >= 1 && qp <= 4)
            return qp;
        const month = new Date().getMonth();
        return Math.floor(month / 3) + 1;
    });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const month = new Date().getMonth();
        return (month % 3);
    });
    const [scope, setScope] = useState('month');
    const [activeCentral, setActiveCentral] = useState('desarrollo');
    const [activeSub, setActiveSub] = useState('lectura');
    const monthLabels = getMonthNamesForQuarter(selectedQuarter);
    const [plan, setPlan] = useState(null);
    const [books, setBooks] = useState([]);
    const [songs, setSongs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [entrepreneurships, setEntrepreneurships] = useState([]);
    const [monthTasks, setMonthTasks] = useState({});
    const [monthEvents, setMonthEvents] = useState({});
    const [monthlyTimeData, setMonthlyTimeData] = useState({});
    const [chessData, setChessData] = useState({});
    const [langData, setLangData] = useState({});
    const [progress, setProgress] = useState({
        completedBooks: [], completedSongs: [], completedGoals: [],
        bookProgress: {}, songProgress: {},
    });
    const [focusAreaStats, setFocusAreaStats] = useState({});
    const [projectDetails, setProjectDetails] = useState({});
    const [allBooks, setAllBooks] = useState([]);
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
                setPlan(parsed);
                const progRaw = localStorage.getItem(storageKey);
                if (progRaw)
                    setProgress(JSON.parse(progRaw));
                else
                    setProgress({ completedBooks: [], completedSongs: [], completedGoals: [], bookProgress: {}, songProgress: {} });
                if (!parsed) {
                    setBooks([]);
                    setSongs([]);
                    setLoading(false);
                    return;
                }
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
                if (booksRes.data)
                    setBooks(booksRes.data);
                if (allBooksRes.data)
                    setAllBooks(allBooksRes.data);
                if (songsRes.data)
                    setSongs(songsRes.data);
                try {
                    const { data: projRows } = await supabase.from('projects').select('id, title');
                    if (projRows)
                        setProjects(projRows.map((p) => ({ id: p.id, name: p.title })));
                }
                catch { }
                try {
                    const { data: subjRows } = await supabase.from('university_subjects').select('id, name');
                    if (subjRows)
                        setSubjects(subjRows.map((s) => ({ id: s.id, name: s.name })));
                }
                catch { }
                try {
                    const { data: entRows } = await supabase.from('entrepreneurships').select('id, name');
                    if (entRows)
                        setEntrepreneurships(entRows.map((e) => ({ id: e.id, name: e.name })));
                }
                catch { }
                // Group tasks and events by month
                const tasksByMonth = { month1: [], month2: [], month3: [] };
                const eventsByMonth = { month1: [], month2: [], month3: [] };
                (tasksRes.data || []).forEach((t) => {
                    if (!t.due_date)
                        return;
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
                (eventsRes.data || []).forEach((e) => {
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
                const monthTimes = {};
                const chessByMonth = {};
                const langByMonth = {};
                const [chessGoalsRes] = await Promise.all([
                    supabase.from('chess_goals').select('target_games_per_month, target_minutes_per_day').eq('is_active', true).maybeSingle(),
                ]);
                const chessTargetGames = chessGoalsRes.data?.target_games_per_month || 30;
                const chessTargetMinutes = chessGoalsRes.data?.target_minutes_per_day || 30;
                for (let mi = 0; mi < 3; mi++) {
                    const ms = new Date(year, qStartMonth + mi, 1);
                    const me = new Date(year, qStartMonth + mi + 1, 0);
                    const { data: trackingRows } = await supabase
                        .from('daily_systems_tracking')
                        .select('tracking_date, time_data, count_data')
                        .gte('tracking_date', format(ms, 'yyyy-MM-dd'))
                        .lte('tracking_date', format(me, 'yyyy-MM-dd'));
                    const byArea = {};
                    let total = 0;
                    let chessGames = 0;
                    const chessDays = new Set();
                    const italianoDays = new Set();
                    const inglesDays = new Set();
                    (trackingRows || []).forEach((row) => {
                        const td = row.time_data || {};
                        Object.entries(td).forEach(([key, val]) => {
                            const v = val;
                            byArea[key] = (byArea[key] || 0) + v;
                            total += v;
                        });
                        const cd = row.count_data || {};
                        const cg = Number(cd.ajedrez) || 0;
                        if (cg > 0) {
                            chessGames += cg;
                            chessDays.add(row.tracking_date);
                        }
                        if ((Number(td.italiano) || 0) > 0)
                            italianoDays.add(row.tracking_date);
                        if ((Number(td.ingles) || 0) > 0)
                            inglesDays.add(row.tracking_date);
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
                const areaStatsAccum = {};
                for (let mi = 0; mi < 3; mi++) {
                    const ms = new Date(year, qStartMonth + mi, 1);
                    const me = new Date(year, qStartMonth + mi + 1, 0);
                    const { data: areaRows } = await supabase
                        .from('daily_area_stats')
                        .select('area_id, time_spent_minutes, stat_date')
                        .in('area_id', ['universidad', 'emprendimiento', 'proyectos'])
                        .gte('stat_date', format(ms, 'yyyy-MM-dd'))
                        .lte('stat_date', format(me, 'yyyy-MM-dd'));
                    (areaRows || []).forEach((row) => {
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
                            const details = {};
                            projRows.forEach((p) => { details[p.id] = { name: p.title, tasks: p.tasks || [] }; });
                            setProjectDetails(details);
                        }
                    }
                    catch (e) {
                        console.error('Error loading project details:', e);
                    }
                }
            }
            catch {
                console.error("Error loading plan");
            }
            setLoading(false);
        };
        load();
    }, [selectedQuarter]);
    const saveProgress = (p) => {
        setProgress(p);
        localStorage.setItem(storageKey, JSON.stringify(p));
        pushSyncKey(storageKey);
    };
    const toggleBook = (id) => {
        const next = { ...progress };
        if (next.completedBooks.includes(id)) {
            next.completedBooks = next.completedBooks.filter(i => i !== id);
        }
        else {
            next.completedBooks.push(id);
        }
        saveProgress(next);
    };
    const toggleSong = (id) => {
        const next = { ...progress };
        if (next.completedSongs.includes(id)) {
            next.completedSongs = next.completedSongs.filter(i => i !== id);
        }
        else {
            next.completedSongs.push(id);
        }
        saveProgress(next);
    };
    const toggleGoal = (title) => {
        const next = { ...progress };
        if (next.completedGoals.includes(title)) {
            next.completedGoals = next.completedGoals.filter(g => g !== title);
        }
        else {
            next.completedGoals.push(title);
        }
        saveProgress(next);
    };
    const handleAddBookToMonth = (bookId) => {
        const storageKey = `trimestral_plan_Q${selectedQuarter}_${YEAR}`;
        const currentPlan = loadTrimestralPlanFromLocal(`Q${selectedQuarter}_${YEAR}`);
        if (!currentPlan)
            return;
        const currentBooks = [...(currentPlan.distribution[monthKey]?.books || [])];
        if (currentBooks.includes(bookId))
            return;
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
    const getMonthProgress = (mk) => {
        if (!plan)
            return { books: [], songs: [], booksPct: 0, songsPct: 0, booksCount: 0, songsCount: 0, completedBooks: 0, completedSongs: 0 };
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
            const byArea = {};
            let totalMinutes = 0;
            MONTH_KEYS.forEach(mk => {
                const t = monthlyTimeData[mk];
                if (!t)
                    return;
                totalMinutes += t.totalMinutes || 0;
                Object.entries(t.byArea || {}).forEach(([k, v]) => { byArea[k] = (byArea[k] || 0) + (v || 0); });
            });
            return { totalMinutes, byArea };
        })()
        : monthlyTimeData[monthKey];
    const tasks = isQuarterScope ? MONTH_KEYS.flatMap(mk => monthTasks[mk] || []) : (monthTasks[monthKey] || []);
    const events = isQuarterScope ? MONTH_KEYS.flatMap(mk => monthEvents[mk] || []) : (monthEvents[monthKey] || []);
    const completedTaskIds = isQuarterScope
        ? MONTH_KEYS.flatMap(mk => plan?.completedTasks?.[mk] || [])
        : (plan?.completedTasks?.[monthKey] || []);
    const completedEventIds = isQuarterScope
        ? MONTH_KEYS.flatMap(mk => plan?.completedEvents?.[mk] || [])
        : (plan?.completedEvents?.[monthKey] || []);
    const monthBooks = mp.books.map(id => books.find(b => b.id === id)).filter(Boolean);
    const availableForSlot = allBooks.filter(b => !monthMp.books.includes(b.id));
    const filteredSlotBooks = availableForSlot.filter(b => b.title.toLowerCase().includes(slotSearch.toLowerCase()) ||
        (b.author && b.author.toLowerCase().includes(slotSearch.toLowerCase())));
    const monthSongsData = mp.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
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
    const goalFor = (area) => isQuarterScope
        ? MONTH_KEYS.reduce((s, mk) => s + (plan?.timeGoals?.[mk]?.[area] || 0), 0)
        : (plan?.timeGoals?.[monthKey]?.[area] || 0);
    const areaGoalFor = (area) => isQuarterScope
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
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center gap-3", children: [_jsx("div", { className: "h-12 w-12 rounded-full bg-muted" }), _jsx("div", { className: "h-4 w-28 bg-muted rounded" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-5xl mx-auto space-y-5", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "3 Meses" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [QUARTERS.find(q => q.id === selectedQuarter)?.name, " \u00B7 Semana ", weekInQ, "/12"] })] }) }), _jsx(PeriodControlSection, { scope: "quarter", start: quarterStartDate, end: quarterEndDate }), _jsx("div", { className: "grid grid-cols-4 gap-2.5", children: QUARTERS.map(q => {
                            const isActive = selectedQuarter === q.id;
                            return (_jsxs("button", { onClick: () => setSelectedQuarter(q.id), className: cn("relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl", isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), children: [_jsx("div", { className: "text-lg font-bold", children: q.name }), _jsx("div", { className: cn("text-[10px] mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground"), children: q.dates })] }, q.id));
                        }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Per\u00EDodo" }), _jsx("div", { className: "inline-flex gap-1 p-1 rounded-xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40", children: ['month', 'quarter'].map(s => (_jsx("button", { onClick: () => setScope(s), className: cn("px-4 py-1.5 rounded-lg text-xs font-semibold transition-all", scope === s ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"), children: s === 'month' ? 'Mes' : 'Trimestre' }, s))) })] }), _jsx("div", { className: cn("flex gap-2 transition-opacity", isQuarterScope && "opacity-50"), children: monthLabels.map((label, i) => {
                            const isActive = selectedMonth === i;
                            const colors = ["from-sky-500 to-cyan-400", "from-violet-500 to-purple-400", "from-amber-500 to-orange-400"];
                            return (_jsxs("button", { onClick: () => { setSelectedMonth(i); setScope('month'); }, className: cn("flex-1 relative rounded-2xl p-3 text-center transition-all border-0 backdrop-blur-xl", isActive
                                    ? `bg-gradient-to-r ${colors[i]} text-white shadow-lg scale-[1.02]`
                                    : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), children: [_jsx("div", { className: "text-base font-bold", children: label }), _jsxs("div", { className: cn("text-[10px] mt-0.5", isActive ? "text-white/70" : "text-muted-foreground"), children: ["Mes ", i + 1] })] }, i));
                        }) }), _jsx("div", { className: "grid grid-cols-5 gap-2.5", children: [
                            { icon: _jsx(Zap, { className: "h-4 w-4 text-blue-500" }), label: "Semana", value: weekInQ, gradient: "from-blue-500 to-cyan-400" },
                            { icon: _jsx(BarChart3, { className: "h-4 w-4 text-purple-500" }), label: "Progreso", value: `${overallPct}%`, gradient: "from-purple-500 to-pink-400" },
                            { icon: _jsx(BookOpen, { className: "h-4 w-4 text-emerald-500" }), label: "Libros", value: `${completedBooksCount}/${totalBooksTarget}`, gradient: "from-emerald-500 to-teal-400" },
                            { icon: _jsx(Music, { className: "h-4 w-4 text-rose-500" }), label: "Canciones", value: `${completedSongsCount}/${totalSongsTarget}`, gradient: "from-rose-500 to-pink-400" },
                            { icon: _jsx(Flame, { className: "h-4 w-4 text-orange-500" }), label: `Racha ${overallStreak.current}d`, value: overallStreak.longest > 0 ? `${overallStreak.longest}` : `${overallStreak.current}d`, gradient: "from-orange-500 to-amber-400" },
                        ].map((s, i) => (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-1 bg-gradient-to-r", s.gradient) }), _jsxs(CardContent, { className: "p-3.5 text-center space-y-1", children: [_jsx("div", { className: "flex justify-center", children: s.icon }), _jsx("div", { className: "text-xl font-bold tabular-nums", children: s.value }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: s.label })] })] }, i))) }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Tiempo del trimestre" }), _jsxs("span", { className: "text-sm font-bold tabular-nums", children: [Math.round(weekProgress), "%"] })] }), _jsx(Progress, { value: weekProgress, className: "h-1.5" }), _jsxs("div", { className: "flex justify-between mt-1.5 text-[9px] text-muted-foreground/60", children: [_jsx("span", { children: "Sem 1" }), _jsx("span", { children: "Sem 6" }), _jsx("span", { children: "Sem 12" })] })] })] }), _jsx(SafeSection, { title: "\u00C1reas Centrales", children: _jsx(CentralAreasSection, { selectedQuarter: selectedQuarter, activeCentral: activeCentral, activeSub: activeSub, onCentralChange: (id) => { setActiveCentral(id); const def = CENTRAL_AREAS.find(a => a.id === id); if (def?.subAreas?.length)
                                setActiveSub(def.subAreas[0].id); }, onSubChange: setActiveSub, year: YEAR, start: isQuarterScope ? quarterStartDate : monthStartDate, end: isQuarterScope ? quarterEndDate : monthEndDate, getGoal: (subId) => isQuarterScope
                                ? MONTH_KEYS.reduce((s, mk) => s + ((plan?.timeGoals?.[mk]?.[subId] || 0) + (plan?.areaTimeGoals?.[mk]?.[subId] || 0)), 0)
                                : ((plan?.timeGoals?.[monthKey]?.[subId] || 0) + (plan?.areaTimeGoals?.[monthKey]?.[subId] || 0)) }) }), !plan ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(LayoutDashboard, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsx("p", { className: "font-medium mb-1", children: "Sin plan trimestral" }), _jsxs("p", { className: "text-xs text-muted-foreground text-center mb-2", children: ["Ve a Plan Trimestral y crea un plan para ", QUARTERS.find(q => q.id === selectedQuarter)?.name] })] }) })) : (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-violet-500 to-indigo-400" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("h2", { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Target, { className: "h-4 w-4 text-violet-500" }), " Progreso General \u2014 ", periodLabel] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                    { label: "Libros", pct: bookPct, count: `${completedBooksCount}/${totalBooksTarget}`, color: "text-emerald-500" },
                                                    { label: "Canciones", pct: songPct, count: `${completedSongsCount}/${totalSongsTarget}`, color: "text-rose-500" },
                                                    { label: "Metas", pct: goalsPct, count: `${completedGoalsCount}/${totalGoalsCount}`, color: "text-amber-500" },
                                                ].map(m => (_jsxs("div", { className: "text-center space-y-1", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: m.label }), _jsxs("p", { className: cn("text-lg font-bold", m.color), children: [m.pct, "%"] }), _jsx(Progress, { value: m.pct, className: "h-1.5" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: m.count })] }, m.label))) })] })] }), activeCentral === 'desarrollo' && (_jsx(_Fragment, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" }), _jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold", children: "Desarrollo Personal" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [periodLabel, " \u00B7 Crecimiento intelectual, creatividad y bienestar"] })] })] }), activeSub === 'lectura' && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-emerald-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Book, { className: "h-3.5 w-3.5 text-emerald-500" }), _jsx("span", { className: "text-xs font-semibold text-emerald-700 dark:text-emerald-400", children: "Lectura" }), _jsx(Progress, { value: mp.booksPct, className: "h-1 flex-1 max-w-[80px]" }), _jsxs("span", { className: "text-[10px] font-medium text-emerald-600", children: [mp.booksPct, "%"] }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [mp.completedBooks, "/", mp.booksCount, " le\u00EDdos"] })] }), _jsx(TimeGoalRow, { label: "Minutos de lectura", actual: timeData?.byArea?.lectura || 0, goal: goalFor('lectura'), color: "emerald", icon: _jsx(Book, { className: "h-3 w-3 text-emerald-500" }) }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: Array.from({ length: isQuarterScope ? monthBooks.length : Math.max(slotsPerMonth, monthBooks.length) }).map((_, i) => {
                                                        if (i < monthBooks.length) {
                                                            const book = monthBooks[i];
                                                            const done = progress.completedBooks.includes(book.id);
                                                            return (_jsxs("div", { className: cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border/50 bg-card/30 hover:border-emerald-200"), onClick: () => toggleBook(book.id), children: [_jsxs("div", { className: "aspect-[2/3] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative", children: [book.cover_image_url ? (_jsx("img", { src: book.cover_image_url, alt: book.title, className: "w-full h-full object-cover" })) : (_jsx(BookOpen, { className: "w-8 h-8 text-emerald-400/60" })), done && (_jsx("div", { className: "absolute inset-0 bg-emerald-500/20 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg", children: _jsx(Check, { className: "h-5 w-5" }) }) })), !done && book.pages_total && book.pages_total > 0 && (_jsxs("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-4", children: [_jsxs("div", { className: "text-[8px] text-white font-medium", children: [Math.min(100, Math.round(((book.pages_read || 0) / book.pages_total) * 100)), "%"] }), _jsx(Progress, { value: Math.min(100, Math.round(((book.pages_read || 0) / book.pages_total) * 100)), className: "h-1 bg-white/20 [&>div]:bg-emerald-400" })] }))] }), _jsx("p", { className: cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground"), children: book.title }), book.author && _jsx("p", { className: "text-[9px] text-muted-foreground truncate", children: book.author }), !done && book.pages_total && book.pages_total > 0 && (_jsxs("p", { className: "text-[8px] text-muted-foreground", children: [book.pages_read || 0, "/", book.pages_total, " p\u00E1g."] }))] }, book.id));
                                                        }
                                                        if (isQuarterScope)
                                                            return null;
                                                        return (_jsxs("div", { className: "space-y-1.5 p-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all", onClick: () => { setSlotSearch(''); setSlotDialogOpen(true); }, children: [_jsx("div", { className: "aspect-[2/3] rounded-lg flex items-center justify-center", children: _jsx(Plus, { className: "w-8 h-8 text-muted-foreground/30" }) }), _jsx("p", { className: "text-[10px] text-muted-foreground/40 text-center", children: "Seleccionar libro" })] }, `slot-${i}`));
                                                    }) })] })), activeSub === 'musica' && (pianoSongs.length > 0 || guitarSongs.length > 0) && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-rose-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Music, { className: "h-3.5 w-3.5 text-rose-500" }), _jsx("span", { className: "text-xs font-semibold text-rose-700 dark:text-rose-400", children: "M\u00FAsica" }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [mp.completedSongs, "/", mp.songsCount, " completadas"] })] }), _jsx(TimeGoalRow, { label: "Minutos de pr\u00E1ctica", actual: timeData?.byArea?.musica || 0, goal: goalFor('musica'), color: "rose", icon: _jsx(Music, { className: "h-3 w-3 text-rose-500" }) }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", children: [pianoSongs.map(song => {
                                                            const done = progress.completedSongs.includes(song.id);
                                                            return (_jsxs("div", { className: cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20" : "border-border/50 bg-card/30 hover:border-rose-200"), onClick: () => toggleSong(song.id), children: [_jsxs("div", { className: "aspect-[2/3] bg-gradient-to-br from-rose-500/20 to-rose-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative", children: [_jsx(Piano, { className: "w-8 h-8 text-rose-400/60" }), done && (_jsx("div", { className: "absolute inset-0 bg-rose-500/20 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg", children: _jsx(Check, { className: "h-5 w-5" }) }) }))] }), _jsx("p", { className: cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground"), children: song.title }), song.artist && _jsx("p", { className: "text-[9px] text-muted-foreground truncate", children: song.artist })] }, song.id));
                                                        }), guitarSongs.map(song => {
                                                            const done = progress.completedSongs.includes(song.id);
                                                            return (_jsxs("div", { className: cn("space-y-1.5 p-2 rounded-xl border transition-all cursor-pointer", done ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : "border-border/50 bg-card/30 hover:border-amber-200"), onClick: () => toggleSong(song.id), children: [_jsxs("div", { className: "aspect-[2/3] bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-lg overflow-hidden flex items-center justify-center shadow-sm relative", children: [_jsx(Guitar, { className: "w-8 h-8 text-amber-400/60" }), done && (_jsx("div", { className: "absolute inset-0 bg-amber-500/20 flex items-center justify-center", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg", children: _jsx(Check, { className: "h-5 w-5" }) }) }))] }), _jsx("p", { className: cn("text-xs font-medium leading-tight line-clamp-2", done && "line-through text-muted-foreground"), children: song.title }), song.artist && _jsx("p", { className: "text-[9px] text-muted-foreground truncate", children: song.artist })] }, song.id));
                                                        })] })] })), activeSub === 'ajedrez' && showChessSection && chessMonth && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-teal-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Gamepad2, { className: "h-3.5 w-3.5 text-teal-500" }), _jsx("span", { className: "text-xs font-semibold text-teal-700 dark:text-teal-400", children: "Ajedrez" })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5", children: [_jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1", children: [_jsxs("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: ["Partidas meta/", isQuarterScope ? 'trimestre' : 'mes'] }), _jsx("p", { className: "text-lg font-bold text-teal-500", children: chessMonth.targetGames })] }), _jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Partidas jugadas" }), _jsx("p", { className: cn("text-lg font-bold", chessMonth.gamesPlayed >= chessMonth.targetGames ? "text-emerald-500" : "text-amber-500"), children: chessMonth.gamesPlayed })] }), _jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "D\u00EDas de pr\u00E1ctica" }), _jsx("p", { className: "text-lg font-bold text-teal-500", children: chessMonth.practiceDays })] }), _jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-1", children: [_jsxs("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: ["Minutos meta/", isQuarterScope ? 'trimestre' : 'mes'] }), _jsxs("p", { className: "text-lg font-bold text-teal-500", children: [goalFor('ajedrez'), "min"] })] })] }), _jsx(Progress, { value: chessMonth.targetGames > 0 ? Math.min(100, Math.round((chessMonth.gamesPlayed / chessMonth.targetGames) * 100)) : 0, className: "h-1.5" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [chessMonth.gamesPlayed, "/", chessMonth.targetGames, " partidas este ", isQuarterScope ? 'trimestre' : 'mes'] }), _jsx(TimeGoalRow, { label: "Minutos de ajedrez", actual: timeData?.byArea?.ajedrez || 0, goal: goalFor('ajedrez'), color: "teal", icon: _jsx(Gamepad2, { className: "h-3 w-3 text-teal-500" }) })] })), activeSub === 'idiomas' && showLangSection && langMonth && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-sky-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "h-3.5 w-3.5 text-sky-500" }), _jsx("span", { className: "text-xs font-semibold text-sky-700 dark:text-sky-400", children: "Idiomas" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Globe, { className: "h-3 w-3 text-green-500" }), _jsx("span", { className: "text-xs font-semibold text-green-700 dark:text-green-400", children: "Italiano" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[9px] text-muted-foreground", children: "D\u00EDas practicados" }), _jsx("p", { className: "text-lg font-bold text-green-500", children: langMonth.italiano.practiceDays })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[9px] text-muted-foreground", children: "Plan" }), _jsx("p", { className: "text-sm font-medium text-muted-foreground", children: plan?.notes?.italiano || '—' })] })] })] }), _jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/40 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Globe, { className: "h-3 w-3 text-blue-500" }), _jsx("span", { className: "text-xs font-semibold text-blue-700 dark:text-blue-400", children: "Ingl\u00E9s" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[9px] text-muted-foreground", children: "D\u00EDas practicados" }), _jsx("p", { className: "text-lg font-bold text-blue-500", children: langMonth.ingles.practiceDays })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[9px] text-muted-foreground", children: "Plan" }), _jsx("p", { className: "text-sm font-medium text-muted-foreground", children: plan?.notes?.ingles || '—' })] })] })] })] }), _jsx(TimeGoalRow, { label: "Minutos italiano", actual: (timeData?.byArea?.italiano || 0) + (timeData?.byArea?.idiomas || 0), goal: goalFor('italiano'), color: "green", icon: _jsx(Globe, { className: "h-3 w-3 text-green-500" }) }), _jsx(TimeGoalRow, { label: "Minutos ingl\u00E9s", actual: timeData?.byArea?.ingles || 0, goal: goalFor('ingles'), color: "blue", icon: _jsx(Globe, { className: "h-3 w-3 text-blue-500" }) })] })), plan.personal_goals?.length > 0 && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-purple-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-purple-500" }), _jsx("span", { className: "text-xs font-semibold text-purple-700 dark:text-purple-400", children: "Metas Personales" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 ml-auto", children: [completedGoalsCount, "/", totalGoalsCount] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-1", children: plan.personal_goals.map((g, i) => {
                                                        const done = progress.completedGoals.includes(g.title);
                                                        return (_jsxs("label", { className: "flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-border/40", children: [_jsx(Checkbox, { checked: done, onCheckedChange: () => toggleGoal(g.title) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn("text-xs font-medium", done && "line-through text-muted-foreground"), children: g.title }), g.target && _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Meta: ", g.target] })] }), done && _jsx(Check, { className: "h-3.5 w-3.5 text-emerald-500 shrink-0" })] }, i));
                                                    }) })] }))] }) })), activeCentral === 'profesional' && (_jsx(_Fragment, { children: _jsxs("div", { className: "space-y-4 pt-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" }), _jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold", children: "Profesional Acad\u00E9mico" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [periodLabel, " \u00B7 Carrera, estudios y proyectos"] })] })] }), activeSub === 'universidad' && monthSubjectIds.length > 0 && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-blue-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(GraduationCap, { className: "h-3.5 w-3.5 text-blue-500" }), _jsx("span", { className: "text-xs font-semibold text-blue-700 dark:text-blue-400", children: "Asignaturas a estudiar" }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5", children: monthSubjectIds.length })] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: monthSubjectIds.map(sid => {
                                                        const sub = subjects.find(s => s.id === sid);
                                                        return sub ? (_jsx(Badge, { variant: "outline", className: "text-[10px] px-2.5 py-1 border-blue-200 bg-blue-50/30 dark:bg-blue-950/20", children: sub.name }, sid)) : null;
                                                    }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [_jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-blue-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Tareas completadas" }), _jsxs("p", { className: "text-base font-bold text-blue-500", children: [tasks.filter(t => completedTaskIds.includes(t.id)).length, "/", tasks.length] })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-blue-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Minutos enfoque / meta" }), _jsxs("p", { className: cn("text-base font-bold", (areaGoalFor('universidad') || 0) > 0 && (focusAreaStats.universidad || 0) >= (areaGoalFor('universidad') || 0) ? "text-emerald-500" : "text-blue-500"), children: [Math.round(focusAreaStats.universidad || 0), "min / ", areaGoalFor('universidad') || 0, "min"] })] })] }), _jsx(Progress, { value: (areaGoalFor('universidad') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.universidad || 0) / (areaGoalFor('universidad') || 0)) * 100)) : 0, className: "h-1.5" })] })), activeSub === 'proyectos' && monthProjectIds.length > 0 && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-amber-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderKanban, { className: "h-3.5 w-3.5 text-amber-500" }), _jsx("span", { className: "text-xs font-semibold text-amber-700 dark:text-amber-400", children: "Proyectos" }), _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5", children: monthProjectIds.length })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [_jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Tareas completadas (gral)" }), _jsxs("p", { className: "text-base font-bold text-amber-500", children: [tasks.filter(t => completedTaskIds.includes(t.id) && t.source === 'proyecto').length, "/", tasks.filter(t => t.source === 'proyecto').length] })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Minutos enfoque / meta" }), _jsxs("p", { className: cn("text-base font-bold", (areaGoalFor('proyectos') || 0) > 0 && (focusAreaStats.proyectos || 0) >= (areaGoalFor('proyectos') || 0) ? "text-emerald-500" : "text-amber-500"), children: [Math.round(focusAreaStats.proyectos || 0), "min / ", areaGoalFor('proyectos') || 0, "min"] })] })] }), _jsx(Progress, { value: (areaGoalFor('proyectos') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.proyectos || 0) / (areaGoalFor('proyectos') || 0)) * 100)) : 0, className: "h-1.5" }), _jsx("div", { className: "space-y-2", children: monthProjectIds.map(pid => {
                                                        const detail = projectDetails[pid];
                                                        if (!detail)
                                                            return null;
                                                        const projTasks = detail.tasks || [];
                                                        const doneTasks = projTasks.filter((t) => t.completed).length;
                                                        return (_jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-200/40 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-semibold", children: detail.name }), _jsxs("span", { className: "text-[9px] text-muted-foreground", children: [doneTasks, "/", projTasks.length, " tareas"] })] }), projTasks.length > 0 && (_jsx(Progress, { value: projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0, className: "h-1" })), projTasks.slice(0, 5).map((t) => (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px]", children: [_jsx("div", { className: cn("w-1.5 h-1.5 rounded-full shrink-0", t.completed ? "bg-emerald-500" : "bg-muted-foreground/30") }), _jsx("span", { className: cn("truncate flex-1", t.completed && "line-through text-muted-foreground"), children: t.title })] }, t.id))), projTasks.length > 5 && _jsxs("p", { className: "text-[8px] text-muted-foreground", children: ["+", projTasks.length - 5, " tareas m\u00E1s"] })] }, pid));
                                                    }) })] })), activeSub === 'emprendimiento' && (monthEntrepreneurshipIds.length > 0 || plan.notes?.emprendimiento || tasks.some(t => t.source === 'emprendimiento')) && (_jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-purple-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Briefcase, { className: "h-3.5 w-3.5 text-purple-500" }), _jsx("span", { className: "text-xs font-semibold text-purple-700 dark:text-purple-400", children: "Emprendimiento" }), monthEntrepreneurshipIds.length > 0 && _jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5", children: monthEntrepreneurshipIds.length })] }), plan.notes?.emprendimiento && (_jsx("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40", children: _jsx("p", { className: "text-[11px] text-muted-foreground", children: plan.notes.emprendimiento }) })), _jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [_jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Tareas completadas" }), _jsxs("p", { className: "text-base font-bold text-purple-500", children: [tasks.filter(t => completedTaskIds.includes(t.id) && t.source === 'emprendimiento').length, "/", tasks.filter(t => t.source === 'emprendimiento').length] })] }), _jsxs("div", { className: "p-2.5 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1", children: [_jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: "Minutos enfoque / meta" }), _jsxs("p", { className: cn("text-base font-bold", (areaGoalFor('emprendimiento') || 0) > 0 && (focusAreaStats.emprendimiento || 0) >= (areaGoalFor('emprendimiento') || 0) ? "text-emerald-500" : "text-purple-500"), children: [Math.round(focusAreaStats.emprendimiento || 0), "min / ", areaGoalFor('emprendimiento') || 0, "min"] })] })] }), _jsx(Progress, { value: (areaGoalFor('emprendimiento') || 0) > 0 ? Math.min(100, Math.round(((focusAreaStats.emprendimiento || 0) / (areaGoalFor('emprendimiento') || 0)) * 100)) : 0, className: "h-1.5" }), monthEntrepreneurshipIds.length > 0 && (_jsx("div", { className: "space-y-2", children: monthEntrepreneurshipIds.map(eid => {
                                                        const ent = entrepreneurships.find((e) => e.id === eid);
                                                        if (!ent)
                                                            return null;
                                                        const entTasks = tasks.filter(t => t.source === 'emprendimiento');
                                                        const doneEntTasks = entTasks.filter(t => completedTaskIds.includes(t.id)).length;
                                                        return (_jsxs("div", { className: "p-3 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-purple-200/40 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs font-semibold", children: ent.name }), _jsxs("span", { className: "text-[9px] text-muted-foreground", children: [doneEntTasks, "/", entTasks.length, " tareas"] })] }), entTasks.length > 0 && (_jsx(Progress, { value: Math.round((doneEntTasks / entTasks.length) * 100), className: "h-1" })), entTasks.slice(0, 5).map(t => (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px]", children: [_jsx("div", { className: cn("w-1.5 h-1.5 rounded-full shrink-0", completedTaskIds.includes(t.id) ? "bg-emerald-500" : "bg-muted-foreground/30") }), _jsx("span", { className: cn("truncate flex-1", completedTaskIds.includes(t.id) && "line-through text-muted-foreground"), children: t.title })] }, t.id))), entTasks.length > 5 && _jsxs("p", { className: "text-[8px] text-muted-foreground", children: ["+", entTasks.length - 5, " tareas m\u00E1s"] })] }, eid));
                                                    }) }))] })), activeSub === 'tareas' && (tasks.length > 0 || events.length > 0) && (_jsxs("div", { className: "space-y-4 pt-2 border-t border-border/40", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-3.5 w-3.5 text-foreground" }), _jsx("span", { className: "text-xs font-semibold", children: "Tareas Generales" })] }), tasks.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-3.5 w-3.5 text-emerald-500" }), _jsxs("span", { className: "text-xs font-semibold text-emerald-700 dark:text-emerald-400", children: ["Tareas del ", periodSuffix] }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5", children: [tasks.filter(t => completedTaskIds.includes(t.id)).length, "/", tasks.length] })] }), _jsx("div", { className: "space-y-1", children: tasks.map(task => {
                                                                const done = completedTaskIds.includes(task.id);
                                                                return (_jsxs("div", { className: cn("flex items-center gap-2 p-2 rounded-lg text-xs border border-border/40", done ? "text-muted-foreground bg-muted/20" : "hover:bg-muted/30"), children: [_jsx(Checkbox, { checked: done, className: "h-3.5 w-3.5" }), _jsx("span", { className: cn("flex-1 truncate", done && "line-through"), children: task.title }), _jsx(Badge, { variant: "outline", className: "text-[8px] px-1", children: task.source }), task.due_date && _jsx("span", { className: "text-[9px] text-muted-foreground shrink-0", children: format(new Date(task.due_date), 'd MMM', { locale: es }) })] }, task.id));
                                                            }) })] })), events.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-3.5 w-3.5 text-red-500" }), _jsxs("span", { className: "text-xs font-semibold text-red-700 dark:text-red-400", children: ["Eventos del ", periodSuffix] }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5", children: [events.filter(e => completedEventIds.includes(e.id)).length, "/", events.length] })] }), _jsx("div", { className: "space-y-1", children: events.map(ev => {
                                                                const done = completedEventIds.includes(ev.id);
                                                                return (_jsxs("div", { className: cn("flex items-center gap-2 p-2 rounded-lg text-xs border border-border/40", done ? "text-muted-foreground bg-muted/20" : "hover:bg-muted/30"), children: [_jsx(Checkbox, { checked: done, className: "h-3.5 w-3.5" }), _jsx("span", { className: cn("flex-1 truncate", done && "line-through"), children: ev.title }), _jsx(Badge, { variant: "outline", className: "text-[8px] px-1", children: ev.category }), _jsx("span", { className: "text-[9px] text-muted-foreground shrink-0", children: format(new Date(ev.event_date), 'd MMM', { locale: es }) })] }, ev.id));
                                                            }) })] }))] }))] }) })), showTimeGoalsCard && (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Timer, { className: "h-3.5 w-3.5 text-primary" }), _jsxs("span", { className: "text-sm font-semibold", children: ["Metas de Tiempo \u2014 ", periodLabel] }), _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: [timeData?.totalMinutes || 0, "min acumulados"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(TimeGoalRow, { label: "Lectura", actual: timeData?.byArea?.lectura || 0, goal: goalFor('lectura'), color: "emerald", icon: _jsx(Book, { className: "h-3 w-3 text-emerald-500" }) }), _jsx(TimeGoalRow, { label: "M\u00FAsica", actual: timeData?.byArea?.musica || 0, goal: goalFor('musica'), color: "rose", icon: _jsx(Music, { className: "h-3 w-3 text-rose-500" }) }), _jsx(TimeGoalRow, { label: "Ajedrez", actual: timeData?.byArea?.ajedrez || 0, goal: goalFor('ajedrez'), color: "teal", icon: _jsx(Gamepad2, { className: "h-3 w-3 text-teal-500" }) }), _jsx(TimeGoalRow, { label: "Italiano", actual: (timeData?.byArea?.italiano || 0) + (timeData?.byArea?.idiomas || 0), goal: goalFor('italiano'), color: "green", icon: _jsx(Globe, { className: "h-3 w-3 text-green-500" }) }), _jsx(TimeGoalRow, { label: "Ingl\u00E9s", actual: timeData?.byArea?.ingles || 0, goal: goalFor('ingles'), color: "blue", icon: _jsx(Globe, { className: "h-3 w-3 text-blue-500" }) }), _jsx(TimeGoalRow, { label: "Gym", actual: timeData?.byArea?.['entrenamiento-fisico'] || 0, goal: goalFor('gym'), color: "orange", icon: _jsx(Zap, { className: "h-3 w-3 text-orange-500" }) })] })] })] }))] }))] }), _jsx(Dialog, { open: slotDialogOpen, onOpenChange: setSlotDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-lg", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "text-base font-semibold", children: "Seleccionar libro" }) }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Buscar libro...", value: slotSearch, onChange: e => setSlotSearch(e.target.value), className: "pl-9", autoFocus: true })] }), _jsxs("div", { className: "max-h-80 overflow-y-auto space-y-1", children: [filteredSlotBooks.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: availableForSlot.length === 0 ? 'No hay más libros disponibles' : 'Sin resultados' })), filteredSlotBooks.map(book => (_jsxs("button", { onClick: () => handleAddBookToMonth(book.id), className: "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left transition-colors", children: [_jsx("div", { className: "w-10 h-14 rounded bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center shrink-0 overflow-hidden", children: book.cover_image_url ? (_jsx("img", { src: book.cover_image_url, alt: book.title, className: "w-full h-full object-cover" })) : (_jsx(BookOpen, { className: "w-5 h-5 text-emerald-400/60" })) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium truncate", children: book.title }), book.author && _jsx("p", { className: "text-xs text-muted-foreground truncate", children: book.author })] })] }, book.id)))] })] }) })] }));
}
