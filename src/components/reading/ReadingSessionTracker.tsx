import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Flame, Minus, Plus, Save, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import {
  useReadingSessions,
  type ReadingSession,
  type SaveReadingPayload,
  type ReadingStats,
} from '@/hooks/useReadingSessions';

// ============================================================
// Panel completo: registro + estadísticas (se usa en la página Daily)
// ============================================================
export function ReadingTrackingPanel({ minutes, onMinChange }: { minutes: number; onMinChange: (v: number) => void }) {
  const reading = useReadingSessions();
  const library = useReadingLibrary();
  return (
    <div className="space-y-3">
      <ReadingTracker
        minutes={minutes}
        onMinChange={onMinChange}
        sessions={reading.sessions}
        saveSession={reading.saveSession}
        books={library.books}
        updateBookProgress={library.updateProgress}
        getCurrentlyReading={library.getCurrentlyReading}
        onSaved={reading.refetch}
      />
      <ReadingPagesStats stats={reading.stats} sessions={reading.sessions} />
    </div>
  );
}

// ============================================================
// Registro de sesión de lectura: tiempo + página inicio/fin
// ============================================================
interface TrackerProps {
  minutes: number;
  onMinChange: (v: number) => void;
  sessions: ReadingSession[];
  saveSession: (p: SaveReadingPayload) => Promise<any>;
  books: { id: string; title: string; pages_read: number; pages_total: number | null }[];
  getCurrentlyReading: () => any;
  updateBookProgress: (id: string, pagesRead: number) => Promise<void>;
  onSaved?: () => void;
}

export function ReadingTracker({ minutes, onMinChange, sessions, saveSession, books, updateBookProgress, getCurrentlyReading, onSaved }: TrackerProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const current = getCurrentlyReading();
  const lastToday = useMemo(
    () => sessions.filter((s) => s.session_date === todayStr).sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(-1)[0],
    [sessions, todayStr]
  );

  const [draftMin, setDraftMin] = useState(minutes);
  const [pageStart, setPageStart] = useState<number>(lastToday?.page_end ?? current?.pages_read ?? 0);
  const [pageEnd, setPageEnd] = useState<number>(lastToday?.page_end ?? current?.pages_read ?? 0);

  useEffect(() => setDraftMin(minutes), [minutes]);
  useEffect(() => {
    const base = lastToday?.page_end ?? current?.pages_read ?? 0;
    setPageStart((p) => (p === 0 ? base : p));
    setPageEnd((p) => (p === 0 ? base : p));
  }, [current?.id, lastToday?.page_end]);

  const pages = Math.max(0, (Number(pageEnd) || 0) - (Number(pageStart) || 0));

  const handleSave = async () => {
    if (draftMin <= 0 && pages <= 0) {
      toast.info('Ingresa minutos o página inicio/fin');
      return;
    }
    const start = Number(pageStart) || 0;
    const end = Number(pageEnd) || 0;
    const bookId = current?.id || null;
    const saved = await saveSession({
      minutes: draftMin || 0,
      bookId,
      pageStart: end >= start && end > 0 ? start : null,
      pageEnd: end >= start && end > 0 ? end : null,
    });
    if (!saved) return;

    // Sumar páginas al libro activo en la biblioteca
    if (bookId && pages > 0) {
      await updateBookProgress(bookId, (Number(current?.pages_read) || 0) + pages);
    }
    if (draftMin > 0) {
      onMinChange(draftMin);
    }
    if (end > start && end > 0) {
      setPageStart(end);
      setPageEnd(end);
    }
    onSaved?.();
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-purple-500 to-fuchsia-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15">
              <BookOpen className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold">Sesión de Lectura</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {current ? current.title : 'sin libro activo'}
              </p>
            </div>
          </div>
          {current && (
            <Badge variant="outline" className="text-[10px] font-mono">
              {current.pages_read}/{current.pages_total || '?'} pág
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/40 p-2 space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Tiempo
            </p>
            <Input
              type="number"
              min={0}
              value={draftMin || ''}
              onChange={(e) => setDraftMin(parseInt(e.target.value) || 0)}
              placeholder="min"
              className="h-8 text-sm font-bold text-center"
            />
          </div>
          <div className="rounded-xl bg-muted/40 p-2 space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" /> Inicié en
            </p>
            <Input
              type="number"
              min={0}
              value={pageStart || ''}
              onChange={(e) => setPageStart(parseInt(e.target.value) || 0)}
              placeholder="pág"
              className="h-8 text-sm font-bold text-center"
            />
          </div>
          <div className="rounded-xl border-2 border-purple-500/30 p-2 space-y-1 bg-muted/40">
            <p className="text-[9px] text-purple-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5" /> Terminé en
            </p>
            <Input
              type="number"
              min={0}
              value={pageEnd || ''}
              onChange={(e) => setPageEnd(parseInt(e.target.value) || 0)}
              placeholder="página"
              className="h-8 text-sm font-bold text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 p-2.5 text-center">
            <p className="text-2xl font-extrabold tabular-nums text-purple-600 dark:text-purple-400">
              {pages}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">páginas hoy</p>
          </div>
          <Button size="sm" onClick={handleSave} className="h-10 px-4">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar
          </Button>
          <button
            onClick={() => { setPageStart(0); setPageEnd(0); setDraftMin(0); }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Limpiar"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Estadísticas de páginas leídas: día · semana · mes · trimestre
// ============================================================
export function ReadingPagesStats({ stats, sessions }: { stats: ReadingStats; sessions: ReadingSession[] }) {
  const chartData = useMemo(() => stats.days.slice(-30).map((d) => ({ ...d, label: format(new Date(d.date), 'd MMM', { locale: es }) })), [stats.days]);

  const tiles = [
    { label: 'Hoy', value: stats.today, sub: sessions.filter((s) => s.session_date === format(new Date(), 'yyyy-MM-dd')).length > 0 ? 'con sesión' : 'sin sesión', color: 'text-purple-500', bg: 'bg-purple-500/15' },
    { label: 'Semana', value: stats.week, sub: 'páginas', color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
    { label: 'Mes', value: stats.month, sub: 'páginas', color: 'text-blue-500', bg: 'bg-blue-500/15' },
    { label: 'Trimestre', value: stats.quarter, sub: 'páginas', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
  ];
  const totalTodayMinutes = sessions
    .filter((s) => s.session_date === format(new Date(), 'yyyy-MM-dd'))
    .reduce((a, s) => a + (s.minutes || 0), 0);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold">Páginas leídas</p>
          <Badge variant="outline" className="text-[10px] font-mono ml-auto">
            <Clock className="h-2.5 w-2.5 mr-1" /> {totalTodayMinutes} min hoy
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-muted/40 p-3 text-center">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1', t.bg)}>
                <Flame className={cn('h-3.5 w-3.5', t.color)} />
              </div>
              <p className="text-xl font-extrabold tabular-nums">{t.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t.label}</p>
              {t.sub && <p className="text-[8px] text-muted-foreground/60">{t.sub}</p>}
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Últimos 30 días
          </p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="readingPages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.14)" />
              <XAxis dataKey="label" tick={{ fontSize: 7, fill: 'currentColor' }} interval={4} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(v: number) => [`${v} páginas`]}
                labelFormatter={(label) => String(label)}
              />
              <ReferenceLine y={20} stroke="#10b981" strokeDasharray="5 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="pages" stroke="#6366f1" strokeWidth={2} fill="url(#readingPages)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}