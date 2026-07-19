import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Dumbbell, Brain, Languages, Music, Gamepad2, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { useMusicRepertoire } from "@/hooks/useMusicRepertoire";

interface SystemCard {
  id: string;
  label: string;
  icon: any;
  route?: string;
  schedule: string;
  todayValue: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  weekTotal: number;
  streak: number;
  spark: number[];
}

const todayKey = () => new Date().toISOString().split("T")[0];

const semaphore = (value: number, min: number, max: number) => {
  if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓" };
  if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓" };
  if (value > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Incompleto" };
  return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
};

function SystemCardView({ c }: { c: SystemCard }) {
  const Icon = c.icon;
  const sem = semaphore(c.todayValue, c.minThreshold, c.maxThreshold);
  const goalPct = c.maxThreshold > 0 ? Math.min(100, Math.round((c.todayValue / c.maxThreshold) * 100)) : 0;
  const max = Math.max(1, ...c.spark);

  return (
    <Link to={c.route || "/systems"} className="block">
      <Card className={cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold">{c.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {c.streak > 0 && <span className="text-[10px] text-orange-500">🔥{c.streak}</span>}
            <span className={cn("text-[10px] font-semibold", sem.text)}>{sem.label}</span>
          </div>
        </div>
        {c.schedule && (
          <p className="text-[10px] text-muted-foreground mb-1.5 font-mono">{c.schedule}</p>
        )}
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-2xl font-bold">{c.todayValue}</span>
          <span className="text-[10px] text-muted-foreground">{c.unit}</span>
          {c.maxThreshold > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">/{c.maxThreshold}</span>
          )}
        </div>
        {c.maxThreshold > 0 && (
          <Progress value={goalPct} className="h-1.5 mb-1.5" />
        )}
        {c.spark.length > 0 && (
          <div className="flex items-end gap-0.5 h-5 mb-1">
            {c.spark.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${Math.max(6, (v / max) * 100)}%`,
                  backgroundColor: i === 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                }}
              />
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          Semana: {c.weekTotal}{c.unit && ` ${c.unit}`}
        </p>
      </Card>
    </Link>
  );
}

export function MySystemsSection() {
  const [cards, setCards] = useState<SystemCard[]>([]);
  const [idiomasCard, setIdiomasCard] = useState<SystemCard | null>(null);
  const [gymCard, setGymCard] = useState<SystemCard | null>(null);
  const [musicaMin, setMusicaMin] = useState(0);
  const [loading, setLoading] = useState(true);
  const { getSongsByInstrument } = useMusicRepertoire();

  const pianoLearning = getSongsByInstrument("piano").find(s => s.status === "learning");
  const guitarLearning = getSongsByInstrument("guitar").find(s => s.status === "learning");

  useEffect(() => {
    (async () => {
      try {
        const today = todayKey();
        const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const [trackingR, streaksR] = await Promise.all([
          supabase.from("daily_systems_tracking").select("*").gte("tracking_date", start).lte("tracking_date", today),
          supabase.from("system_habit_streaks").select("*"),
        ]);
        const rows = trackingR.data || [];
        const streaks: Record<string, number> = {};
        (streaksR.data || []).forEach((s: any) => streaks[s.habit_id] = s.current_streak || 0);
        await setCache("daily_systems_tracking", `systems_7d_${today}`, rows);
        await setCache("system_habit_streaks", "all", streaksR.data || []);
        const todayRow = rows.find((r: any) => r.tracking_date === today);
        const td = (todayRow?.time_data as any) || {};
        setMusicaMin(Number(td["musica"]) || 0);
        const result = buildCards(rows, streaks, today);
        setCards(result.cards);
        setIdiomasCard(result.idiomasCard);
        setGymCard(result.gymCard);
      } catch {
        const today = todayKey();
        const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const cachedRows = await getCached<any[]>("daily_systems_tracking", `systems_7d_${today}`);
        const cachedStreaks = await getCached<any[]>("system_habit_streaks", "all");
        if (cachedRows) {
          const sMap: Record<string, number> = {};
          (cachedStreaks || []).forEach((s: any) => sMap[s.habit_id] = s.current_streak || 0);
          const todayRow = cachedRows.find((r: any) => r.tracking_date === today);
          const td = (todayRow?.time_data as any) || {};
          setMusicaMin(Number(td["musica"]) || 0);
          const result = buildCards(cachedRows, sMap, today);
          setCards(result.cards);
          setIdiomasCard(result.idiomasCard);
          setGymCard(result.gymCard);
        }
      }
      setLoading(false);
    })();
  }, []);

  function buildCards(rows: any[], streaks: Record<string, number>, today: string) {
    const minutesByDay = (key: string) => {
      const arr: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const row = rows.find((r: any) => r.tracking_date === d);
        const t = (row?.time_data as any) || {};
        arr.push(Number(t[key]) || 0);
      }
      return arr;
    };

    const gymByDay = () => {
      const arr: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const row = rows.find((r: any) => r.tracking_date === d);
        arr.push(Number(row?.workout_duration) || 0);
      }
      return arr;
    };

    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    const last = (a: number[]) => a[a.length - 1] || 0;

    const gameSpark = minutesByDay("game");
    const gymSpark = gymByDay();

    const cards: SystemCard[] = [
      {
        id: "lectura", label: "Lectura", icon: BookOpen, route: "/reading-library",
        schedule: "8:30 - 9:00 AM",
        todayValue: last(minutesByDay("lectura")), unit: "min",
        minThreshold: 15, maxThreshold: 30,
        weekTotal: sum(minutesByDay("lectura")), streak: streaks.lectura || 0, spark: minutesByDay("lectura"),
      },
      {
        id: "ajedrez", label: "Ajedrez", icon: Crown, route: "/chess",
        schedule: "1:20 - 2:00 PM",
        todayValue: last(minutesByDay("ajedrez")), unit: "min",
        minThreshold: 10, maxThreshold: 20,
        weekTotal: sum(minutesByDay("ajedrez")), streak: streaks.ajedrez || 0, spark: minutesByDay("ajedrez"),
      },
      {
        id: "game", label: "Game (Seducción)", icon: Gamepad2, route: "/systems",
        schedule: "1:20 - 2:00 PM",
        todayValue: last(gameSpark), unit: "min",
        minThreshold: 10, maxThreshold: 20,
        weekTotal: sum(gameSpark), streak: streaks.game || 0, spark: gameSpark,
      },
    ];

    const idiomasSpark = minutesByDay("idiomas");
    const iCard: SystemCard = {
      id: "idiomas", label: "Idiomas", icon: Languages, route: "/languages-dashboard",
      schedule: "5:00 - 6:30 PM",
      todayValue: last(idiomasSpark), unit: "min",
      minThreshold: 30, maxThreshold: 90,
      weekTotal: sum(idiomasSpark), streak: streaks.idiomas || 0, spark: idiomasSpark,
    };

    const gCard: SystemCard = {
      id: "gym", label: "Gym", icon: Dumbbell, route: "/gym",
      schedule: "6:00 - 7:00 PM",
      todayValue: last(gymSpark), unit: "min",
      minThreshold: 30, maxThreshold: 60,
      weekTotal: sum(gymSpark), streak: streaks.gym || 0, spark: gymSpark,
    };

    return { cards, idiomasCard: iCard, gymCard: gCard };
  }

  const musicaSem = semaphore(musicaMin, 15, 30);

  if (loading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4" />Mis Sistemas (acumulativos)
        </h2>
        <Link to="/systems" className="text-xs text-muted-foreground hover:text-foreground">Ver todo →</Link>
      </div>

      {/* === Hobbies Mentales === */}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hobbies Mentales</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(c => <SystemCardView key={c.id} c={c} />)}
      </div>

      {/* Idiomas — entre secciones, pertenece a Hobbies Mentales */}
      {idiomasCard && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="col-span-3">
            <SystemCardView c={idiomasCard} />
          </div>
        </div>
      )}

      {/* === Hobbies Artísticos === */}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hobbies Artísticos</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Música — 3 columnas */}
        <Link to="/music-dashboard" className="col-span-3 block">
          <Card className={cn("p-3 ring-2 h-full", musicaSem.ring, musicaSem.bg)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Music className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold">Música</span>
              </div>
              <span className={cn("text-[10px] font-semibold", musicaSem.text)}>{musicaSem.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm">🎹</span>
                  <span className="text-[10px] font-semibold">Piano</span>
                </div>
                {pianoLearning ? (
                  <div>
                    <p className="text-xs font-medium truncate">{pianoLearning.title}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{pianoLearning.artist}</p>
                    <Badge variant="outline" className="mt-0.5 text-[8px] h-3.5 capitalize">{pianoLearning.difficulty}</Badge>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Sin canción</p>
                )}
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm">🎸</span>
                  <span className="text-[10px] font-semibold">Guitarra</span>
                </div>
                {guitarLearning ? (
                  <div>
                    <p className="text-xs font-medium truncate">{guitarLearning.title}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{guitarLearning.artist}</p>
                    <Badge variant="outline" className="mt-0.5 text-[8px] h-3.5 capitalize">{guitarLearning.difficulty}</Badge>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Sin canción</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold">{musicaMin} <span className="text-[10px] text-muted-foreground font-normal">min hoy</span></span>
            </div>
            <WeekStreakBar habitId="musica" todayValue={musicaMin} minThreshold={15} maxThreshold={30} compact hideStreak />
          </Card>
        </Link>
      </div>

      {/* === Gym === */}
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entrenamiento</p>
      <div className="grid grid-cols-3 gap-3">
        {gymCard && (
          <div className="col-span-3">
            <SystemCardView c={gymCard} />
          </div>
        )}
      </div>
    </Card>
  );
}
