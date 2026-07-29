import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { BookOpen, Music2, Crown, Image as ImageIcon, ArrowRight, Plus, Save, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useReadingLibrary } from "@/hooks/useReadingLibrary";
import { useMusicRepertoire, type Song } from "@/hooks/useMusicRepertoire";
import { useChessTracking } from "@/hooks/useChessTracking";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { toast } from "sonner";

/** Color semáforo: rojo (0) · azul (>0 y <mín) · azul (≥mín y <máx) · verde (máx exacto) · dorado (>máx = extra) */
const semaphore = (value: number, min: number, max: number) => {
  if (value <= 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
  if (value > max) return { ring: "ring-amber-500/60", bg: "bg-amber-500/10", text: "text-amber-600", label: "Extra ✓" };
  if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓" };
  if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓" };
  return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
};

interface Props {
  todayMinutes: { lectura?: number; musica?: number; ajedrez?: number };
  onTimeChange: (id: string, v: number) => void;
  onCountChange: (id: string, v: number) => void;
  countData: { ajedrez?: number };
  skipped?: Record<string, boolean>;
  onSkipToggle?: (id: string) => void;
}

export const HobbyCards = ({ todayMinutes, onTimeChange, onCountChange, countData, skipped, onSkipToggle }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <ReadingCard todayMin={todayMinutes.lectura || 0} onChange={(v) => onTimeChange("lectura", v)} onSkip={() => onSkipToggle?.("lectura")} skipped={!!skipped?.lectura} />
      <MusicCard todayMin={todayMinutes.musica || 0} onChange={(v) => onTimeChange("musica", v)} onSkip={() => onSkipToggle?.("musica")} skipped={!!skipped?.musica} />
      <ChessCard
        todayMin={todayMinutes.ajedrez || 0}
        todayGames={countData.ajedrez || 0}
        onMinChange={(v) => onTimeChange("ajedrez", v)}
        onGamesChange={(v) => onCountChange("ajedrez", v)}
        onSkip={() => onSkipToggle?.("ajedrez")}
        skipped={!!skipped?.ajedrez}
      />
    </div>
  );
};

// ============== LECTURA ==============
const ReadingCard = ({ todayMin, onChange, onSkip, skipped }: { todayMin: number; onChange: (v: number) => void; onSkip?: () => void; skipped?: boolean }) => {
  const { books, getCurrentlyReading, getStats } = useReadingLibrary();
  const [weekPages, setWeekPages] = useState(0);
  const [draft, setDraft] = useState(todayMin);
  const current = getCurrentlyReading();
  const stats = getStats();
  const MIN_GOAL = 15;
  const MAX_GOAL = 30;
  const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
  const isSkipped = skipped && todayMin === 0;

  useEffect(() => setDraft(todayMin), [todayMin]);

  useEffect(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const wp = books
      .filter(b => b.status !== "to_read" && new Date(b.updated_at) >= startOfWeek)
      .reduce((a, b) => a + (b.pages_read || 0), 0);
    setWeekPages(wp);
  }, [books]);

  const progress = current?.pages_total ? Math.round((current.pages_read / current.pages_total) * 100) : 0;
  const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));

  return (
    <Card className={cn("overflow-hidden p-0 ring-2 transition-all", sem.ring)}>
      <div className="ios-grad-header p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20"><BookOpen className="h-4 w-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Lectura</span>
        </div>
        <Link to="/reading-library"><ArrowRight className="h-4 w-4 text-white/80" /></Link>
      </div>
      <div className={cn("p-4 space-y-3", sem.bg)}>
        {current ? (
          <div className="flex gap-3">
            <div className="w-14 h-18 rounded-md bg-muted flex-shrink-0 overflow-hidden border">
              {current.cover_image_url ? (
                <img src={current.cover_image_url} alt={current.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/40" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{current.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{current.author || "—"}</p>
              <Progress value={progress} className="h-1.5 mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">{current.pages_read}/{current.pages_total || "?"} pág</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Sin libro activo</p>
            <Link to="/reading-library"><Button size="sm" variant="outline" className="mt-1 h-7 text-[11px]"><Plus className="h-3 w-3" /> Agregar</Button></Link>
          </div>
        )}

        {/* Input HOY */}
        <div className="bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoy (min)</span>
            <span className={cn("text-[10px] font-bold", sem.text)}>{sem.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={draft || ""}
              onChange={(e) => setDraft(parseInt(e.target.value) || 0)}
              onBlur={() => draft !== todayMin && onChange(draft)}
              className="h-8 text-sm font-bold text-center"
              placeholder="0"
            />
            <Button size="sm" className="h-8 px-2" onClick={() => { onChange(draft); toast.success("Guardado"); }}>
              <Save className="h-3 w-3" />
            </Button>
            <button
              onClick={() => { onChange(0); onSkip?.(); }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"
              )}
              title="No lo hice"
            >
              <XCircle className="h-3 w-3" />
              {isSkipped ? "Saltado" : "No hice"}
            </button>
          </div>
          <Progress value={todayPct} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground text-center">Min {MIN_GOAL} · Máx {MAX_GOAL} min</p>
        </div>

        <WeekStreakBar habitId="lectura" todayValue={todayMin} minThreshold={MIN_GOAL} maxThreshold={MAX_GOAL} compact />

        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t">
          <Stat label="Hoy" value={`${todayMin}m`} />
          <Stat label="Sem" value={`${weekPages}p`} />
          <Stat label="Mes" value={`${stats.thisYearBooks}/24`} />
        </div>
      </div>
    </Card>
  );
};

// ============== MÚSICA ==============
const MusicCard = ({ todayMin, onChange, onSkip, skipped }: { todayMin: number; onChange: (v: number) => void; onSkip?: () => void; skipped?: boolean }) => {
  const { songs, getSongsByInstrument } = useMusicRepertoire();
  const [instrument, setInstrument] = useState<"piano" | "guitar">("piano");
  const [weekMin, setWeekMin] = useState(0);
  const [monthMin, setMonthMin] = useState(0);
  const [draft, setDraft] = useState(todayMin);
  const MIN_GOAL = 15;
  const MAX_GOAL = 30;
  const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
  const isSkipped = skipped && todayMin === 0;

  useEffect(() => setDraft(todayMin), [todayMin]);

  const learning = useMemo<Song | undefined>(
    () => getSongsByInstrument(instrument).find(s => s.status === "learning"),
    [songs, instrument]
  );

  useEffect(() => {
    (async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data } = await supabase
        .from("music_practice_sessions")
        .select("duration_minutes, practice_date, instrument")
        .eq("instrument", instrument)
        .gte("practice_date", startOfMonth.toISOString().split("T")[0]);
      const w = (data || []).filter(d => new Date(d.practice_date) >= startOfWeek)
        .reduce((a, d) => a + (d.duration_minutes || 0), 0);
      const m = (data || []).reduce((a, d) => a + (d.duration_minutes || 0), 0);
      setWeekMin(w);
      setMonthMin(m);
    })();
  }, [instrument]);

  const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));

  return (
    <Card className={cn("overflow-hidden p-0 ring-2 transition-all", sem.ring)}>
      <div className="ios-grad-header p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20"><Music2 className="h-4 w-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Música</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/80">{instrument === "piano" ? "🎹" : "🎸"}</span>
          <Switch
            checked={instrument === "guitar"}
            onCheckedChange={c => setInstrument(c ? "guitar" : "piano")}
            className="scale-75 data-[state=checked]:bg-white/40 data-[state=unchecked]:bg-white/20"
          />
        </div>
      </div>
      <div className={cn("p-4 space-y-3", sem.bg)}>
        {learning ? (
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 flex items-center justify-center border">
              <Music2 className="h-5 w-5 text-primary/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{learning.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{learning.artist || "—"}</p>
              <Badge variant="outline" className="mt-0.5 text-[9px] h-4 capitalize">{learning.difficulty}</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">Sin canción en {instrument}</p>
            <Link to="/music-dashboard"><Button size="sm" variant="outline" className="mt-1 h-7 text-[11px]"><Plus className="h-3 w-3" /> Agregar</Button></Link>
          </div>
        )}

        <div className="bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoy (min)</span>
            <span className={cn("text-[10px] font-bold", sem.text)}>{sem.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={draft || ""}
              onChange={(e) => setDraft(parseInt(e.target.value) || 0)}
              onBlur={() => draft !== todayMin && onChange(draft)}
              className="h-8 text-sm font-bold text-center"
              placeholder="0"
            />
            <Button size="sm" className="h-8 px-2" onClick={() => { onChange(draft); toast.success("Guardado"); }}>
              <Save className="h-3 w-3" />
            </Button>
            <button
              onClick={() => { onChange(0); onSkip?.(); }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"
              )}
              title="No lo hice"
            >
              <XCircle className="h-3 w-3" />
              {isSkipped ? "Saltado" : "No hice"}
            </button>
          </div>
          <Progress value={todayPct} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground text-center">Min {MIN_GOAL} · Máx {MAX_GOAL} min</p>
        </div>

        <WeekStreakBar habitId="musica" variant="bars" timeDataKey="musica" todayValue={todayMin} minThreshold={MIN_GOAL} maxThreshold={MAX_GOAL} compact />

        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t">
          <Stat label="Hoy" value={`${todayMin}m`} />
          <Stat label="Sem" value={`${weekMin}m`} />
          <Stat label="Mes" value={`${monthMin}m`} />
        </div>
      </div>
    </Card>
  );
};

// ============== AJEDREZ ==============
const ChessCard = ({
  todayMin, todayGames, onMinChange, onGamesChange, onSkip, skipped,
}: {
  todayMin: number; todayGames: number;
  onMinChange: (v: number) => void; onGamesChange: (v: number) => void;
  onSkip?: () => void; skipped?: boolean;
}) => {
  const { stats, goals } = useChessTracking();
  const MIN_GOAL = 10;
  const MAX_GOAL = 20;
  const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
  const isSkipped = skipped && todayMin === 0;
  const [draftMin, setDraftMin] = useState(todayMin);
  const [draftGames, setDraftGames] = useState(todayGames);

  useEffect(() => setDraftMin(todayMin), [todayMin]);
  useEffect(() => setDraftGames(todayGames), [todayGames]);

  const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));

  return (
    <Card className={cn("overflow-hidden p-0 ring-2 transition-all", sem.ring)}>
      <div className="ios-grad-header p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/20"><Crown className="h-4 w-4 text-white" /></div>
          <span className="text-white font-semibold text-sm">Ajedrez</span>
        </div>
        <Link to="/chess"><ArrowRight className="h-4 w-4 text-white/80" /></Link>
      </div>
      <div className={cn("p-4 space-y-3", sem.bg)}>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold">{stats.currentElo}</p>
            <p className="text-[10px] text-muted-foreground">ELO {goals?.target_elo ? `· obj ${goals.target_elo}` : ""}</p>
          </div>
          <Link to="/chess">
            <Button size="sm" variant="outline" className="h-7 text-[11px]"><Plus className="h-3 w-3" /> Sesión</Button>
          </Link>
        </div>

        <div className="bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoy</span>
            <span className={cn("text-[10px] font-bold", sem.text)}>{sem.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <Input
                type="number"
                min={0}
                value={draftMin || ""}
                onChange={(e) => setDraftMin(parseInt(e.target.value) || 0)}
                onBlur={() => draftMin !== todayMin && onMinChange(draftMin)}
                className="h-8 text-sm font-bold text-center"
                placeholder="min"
              />
              <p className="text-[9px] text-center text-muted-foreground mt-0.5">minutos</p>
            </div>
            <div>
              <Input
                type="number"
                min={0}
                value={draftGames || ""}
                onChange={(e) => setDraftGames(parseInt(e.target.value) || 0)}
                onBlur={() => draftGames !== todayGames && onGamesChange(draftGames)}
                className="h-8 text-sm font-bold text-center"
                placeholder="part."
              />
              <p className="text-[9px] text-center text-muted-foreground mt-0.5">partidas</p>
            </div>
          </div>
          <div className="flex justify-center pt-1">
            <button
              onClick={() => { onMinChange(0); onSkip?.(); }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"
              )}
              title="No lo hice"
            >
              <XCircle className="h-3 w-3" />
              {isSkipped ? "Saltado" : "No hice"}
            </button>
          </div>
          <Progress value={todayPct} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground text-center">Min {MIN_GOAL} · Máx {MAX_GOAL} min</p>
        </div>

        <WeekStreakBar habitId="ajedrez" todayValue={todayMin} minThreshold={MIN_GOAL} maxThreshold={MAX_GOAL} compact />

        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t">
          <Stat label="Hoy" value={`${stats.today.games}p`} />
          <Stat label="Sem" value={`${stats.week.games}p`} />
          <Stat label="Mes" value={`${stats.month.games}p`} />
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <p className="font-semibold text-xs">{value}</p>
    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);
