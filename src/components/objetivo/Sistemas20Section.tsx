import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, CalendarCheck2, CalendarDays, CheckCircle2, Circle, Clock,
  Flame, Link2, ListChecks, Target, Zap,
} from "lucide-react";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { usePersonalLists, LIFE_AREAS } from "@/hooks/usePersonalLists";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { getCoverGradient } from "@/components/areas/AreaCover";

interface SistemaConfig {
  id: string;
  label: string;
  emoji: string;
  coverSub: string;
  habitId: string;
  timeKeys: string[];
  goalMinutes: number;
  countKey?: string;
  countLabel?: string;
  description: string;
}

const SISTEMAS_V2: SistemaConfig[] = [
  {
    id: "universidad",
    label: "Universidad",
    emoji: "🎓",
    coverSub: "universidad",
    habitId: "universidad",
    timeKeys: ["universidad"],
    goalMinutes: 120,
    description: "Cada bloque de estudio acerca tu graduación y tu excelencia académica.",
  },
  {
    id: "emprendimiento",
    label: "Emprendimiento",
    emoji: "💼",
    coverSub: "emprendimiento",
    habitId: "emprendimiento",
    timeKeys: ["emprendimiento"],
    goalMinutes: 60,
    description: "Cada minuto construye AUTEC y sus ingresos recurrentes.",
  },
  {
    id: "proyectos",
    label: "Proyectos",
    emoji: "💻",
    coverSub: "proyectos",
    habitId: "proyectos",
    timeKeys: ["proyectos"],
    goalMinutes: 60,
    description: "Los proyectos convierten tu habilidad en un portafolio real.",
  },
  {
    id: "lectura",
    label: "Lectura",
    emoji: "📚",
    coverSub: "lectura",
    habitId: "lectura",
    timeKeys: ["lectura"],
    goalMinutes: 30,
    description: "Cada página alimenta tu mente y tu meta de +24 libros al año.",
  },
  {
    id: "musica",
    label: "Música",
    emoji: "🎸",
    coverSub: "musica",
    habitId: "musica",
    timeKeys: ["musica"],
    goalMinutes: 30,
    description: "La práctica diaria te acerca a tocar de forma avanzada.",
  },
  {
    id: "idiomas",
    label: "Idiomas",
    emoji: "🌐",
    coverSub: "idiomas",
    habitId: "idiomas",
    timeKeys: ["idiomas", "italiano", "ingles"],
    goalMinutes: 60,
    description: "Inglés e italiano se dominan con constancia diaria.",
  },
  {
    id: "ajedrez",
    label: "Ajedrez",
    emoji: "♟️",
    coverSub: "ajedrez",
    habitId: "ajedrez",
    timeKeys: ["ajedrez"],
    goalMinutes: 15,
    countKey: "ajedrez",
    countLabel: "partidas",
    description: "Cada partida entrena tu estrategia y tu mente competitiva.",
  },
  {
    id: "gym",
    label: "Gym",
    emoji: "💪",
    coverSub: "gym",
    habitId: "entrenamiento-fisico",
    timeKeys: ["gym"],
    goalMinutes: 60,
    description: "Cada sesión te acerca a los 70kg+ y a una presencia imponente.",
  },
  {
    id: "game",
    label: "Game (Seducción)",
    emoji: "🔥",
    coverSub: "game",
    habitId: "game",
    timeKeys: ["game"],
    goalMinutes: 30,
    description: "La práctica social construye experiencia real en relaciones.",
  },
];

const SYSTEM_IDS = new Set(SISTEMAS_V2.map(s => s.id));

const AREA_LABELS: Record<string, string> = Object.fromEntries(
  LIFE_AREAS.map(a => [a.id, a.label])
);

interface HistoryRow {
  tracking_date: string;
  time_data?: Record<string, number>;
  completions?: Record<string, boolean>;
}

function fmtMin(m: number) {
  const mm = Math.round(m || 0);
  const h = Math.floor(mm / 60);
  return h > 0 ? `${h}h ${mm % 60}m` : `${mm}m`;
}

function daysActive(rows: HistoryRow[], sys: SistemaConfig) {
  return rows.filter(row => {
    if (row.completions?.[sys.habitId]) return true;
    return sys.timeKeys.some(k => (row.time_data?.[k] || 0) > 0);
  }).length;
}

function systemMinutesOf(data: Pick<import("@/hooks/useSystemsTracking").SystemsData, "timeData">, sys: SistemaConfig) {
  return sys.timeKeys.reduce((acc, k) => acc + (data.timeData?.[k] || 0), 0);
}

function Reto90Indicator() {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("challenge_90_days")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setChallenge(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  if (!challenge) {
    return (
      <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/5 py-3">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-500" />
          No hay reto de 90 días activo — inícialo desde la página Sistemas
        </div>
      </Card>
    );
  }

  const startDate = new Date(challenge.start_date + "T00:00:00");
  const endDate = new Date(challenge.end_date + "T00:00:00");
  const today = new Date();
  const totalDays = Math.max(1, differenceInDays(endDate, startDate));
  const daysPassed = Math.max(0, Math.min(totalDays, differenceInDays(today, startDate)));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const progressPct = Math.min(100, (daysPassed / totalDays) * 100);

  return (
    <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/5">
      <div className="p-3 flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 grid place-items-center shrink-0 shadow-lg shadow-orange-500/30">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Reto de 90 Días</p>
            <span className="text-xs font-black text-orange-500 tabular-nums">{Math.round(progressPct)}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-secondary overflow-hidden mt-1">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Día {daysPassed} de {totalDays} · {daysRemaining} días restantes ·{" "}
            {format(startDate, "d MMM", { locale: es })} → {format(endDate, "d MMM yyyy", { locale: es })}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function Sistemas20Section() {
  const { data: sys, loadHistory } = useSystemsTracking();
  const { lists, tasks } = usePersonalLists();
  const { covers } = useAreaCovers();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadHistory(30).then((rows: any[]) => {
      if (active) {
        setHistory((rows || []) as HistoryRow[]);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [loadHistory]);

  const weekRows = useMemo(() => history.slice(-7), [history]);
  const monthRows = useMemo(() => history.slice(-30), [history]);

  const listsBySystem = useMemo(() => {
    const map: Record<string, { list: (typeof lists)[number]; done: number; total: number; roots: { id: string; title: string; completed: boolean }[] }[]> = {};
    for (const list of lists) {
      if (!list.system_key || !SYSTEM_IDS.has(list.system_key)) continue;
      const listTasks = tasks.filter(t => t.list_id === list.id);
      const roots = listTasks.filter(t => !t.parent_id);
      const done = roots.filter(t => t.completed).length;
      if (!map[list.system_key]) map[list.system_key] = [];
      map[list.system_key].push({
        list,
        done,
        total: roots.length,
        roots: roots.map(t => ({ id: t.id, title: t.title, completed: t.completed })),
      });
    }
    return map;
  }, [lists, tasks]);

  const summary = useMemo(() => {
    let todayMinutes = 0;
    let todayDone = 0;
    let systemsWithGoals = 0;
    let connectedLists = 0;
    let doneTasks = 0;
    let totalTasks = 0;

    for (const s of SISTEMAS_V2) {
      const minutes = systemMinutesOf(sys, s);
      todayMinutes += minutes;
      const completed = !!sys.completions[s.habitId];
      if (completed || minutes >= s.goalMinutes) todayDone += 1;
      const linked = listsBySystem[s.id] || [];
      if (linked.length > 0) {
        systemsWithGoals += 1;
        connectedLists += linked.length;
        for (const l of linked) {
          doneTasks += l.done;
          totalTasks += l.total;
        }
      }
    }

    const goalPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return { todayMinutes, todayDone, systemsWithGoals, connectedLists, doneTasks, totalTasks, goalPct };
  }, [sys, listsBySystem]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <span className="text-3xl">⚙️</span>
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Sistemas 2.0</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Aquí ves la conexión directa: cada sistema que haces a diario empuja las metas de
          tu lista personal. Tu esfuerzo de hoy tiene un destino claro.
        </p>
      </div>

      <Reto90Indicator />

      <Card className="overflow-hidden border-2 border-primary/15">
        <div className="bg-gradient-to-r from-primary/10 via-background to-purple-600/10 p-4 md:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-500" /> Hoy invertido
              </p>
              <p className="text-lg font-black tabular-nums mt-0.5">{fmtMin(summary.todayMinutes)}</p>
              <p className="text-[10px] text-muted-foreground">en tus sistemas conectados</p>
            </div>
            <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" /> Sistemas hoy
              </p>
              <p className="text-lg font-black tabular-nums mt-0.5">{summary.todayDone}/{SISTEMAS_V2.length}</p>
              <p className="text-[10px] text-muted-foreground">con esfuerzo registrado</p>
            </div>
            <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ListChecks className="h-3 w-3 text-emerald-500" /> Metas conectadas
              </p>
              <p className="text-lg font-black tabular-nums mt-0.5">{summary.connectedLists}</p>
              <p className="text-[10px] text-muted-foreground">{summary.systemsWithGoals}/{SISTEMAS_V2.length} sistemas con meta</p>
            </div>
            <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3 text-purple-500" /> Progreso de metas
              </p>
              <p className="text-lg font-black tabular-nums mt-0.5">{summary.totalTasks > 0 ? `${summary.goalPct}%` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">
                {summary.totalTasks > 0 ? `${summary.doneTasks}/${summary.totalTasks} tareas` : "conecta listas para verlo"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando tus sistemas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SISTEMAS_V2.map(s => {
            const minutes = systemMinutesOf(sys, s);
            const count = s.countKey ? (sys.countData?.[s.countKey] || 0) : 0;
            const completed = !!sys.completions[s.habitId];
            const week = daysActive(weekRows, s);
            const month = daysActive(monthRows, s);
            const goalPct = Math.max(0, Math.min(100, Math.round((minutes / s.goalMinutes) * 100)));
            const linked = listsBySystem[s.id] || [];
            const coverUrl = covers[coverKey("sub", s.coverSub)] ?? null;

            return (
              <Card key={s.id} className="overflow-hidden border-border/70 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col">
                <div className={cn("relative h-20 bg-gradient-to-br overflow-hidden", getCoverGradient(s.coverSub))}>
                  {coverUrl && (
                    <img src={coverUrl} alt={s.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent px-3 pb-1 flex items-end justify-between">
                    <span className="text-sm font-bold text-white drop-shadow truncate">
                      {s.emoji} {s.label}
                    </span>
                    {completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3" /> Hoy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/80">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-3 space-y-3 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-sky-500" /> Hoy
                        </span>
                        <span className="font-black tabular-nums">
                          {s.countKey && count > minutes
                            ? `${count} ${s.countLabel || ""}`
                            : `${fmtMin(minutes)} / ${fmtMin(s.goalMinutes)}`}
                        </span>
                      </div>
                      <Progress value={goalPct} className="h-1.5 mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <CalendarCheck2 className="h-2.5 w-2.5 text-indigo-500" /> Semana
                        </p>
                        <p className="text-sm font-black tabular-nums">{week}/7</p>
                        <p className="text-[9px] text-muted-foreground">días activos</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-2.5 w-2.5 text-purple-500" /> Mes
                        </p>
                        <p className="text-sm font-black tabular-nums">{month}/30</p>
                        <p className="text-[9px] text-muted-foreground">días activos</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-snug">{s.description}</p>

                  <div className="flex-1" />

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Aporta a tu meta
                      </span>
                    </div>

                    {linked.length === 0 ? (
                      <Link to="/mi-lista">
                        <div className="rounded-lg border border-dashed border-border/60 p-3 text-center hover:border-primary/40 transition-colors">
                          <p className="text-[10px] text-muted-foreground">
                            Conecta una lista de "Mi Lista Personal" a este sistema
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="space-y-1.5">
                        {linked.map(l => {
                          const pct = l.total > 0 ? Math.round((l.done / l.total) * 100) : 0;
                          return (
                            <div key={l.list.id} className={cn(
                              "rounded-lg border p-2",
                              pct >= 100 ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 bg-muted/20"
                            )}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold truncate flex items-center gap-1.5">
                                  <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                  {l.list.title}
                                </p>
                                <span className="text-[10px] font-black tabular-nums shrink-0">
                                  {l.total > 0 ? `${pct}%` : "—"}
                                </span>
                              </div>
                              {l.list.sub_area && (
                                <p className="text-[9px] text-muted-foreground truncate pl-4.5">
                                  {l.list.sub_area} · {AREA_LABELS[l.list.area_id] || l.list.area_id}
                                </p>
                              )}
                              {l.total > 0 && <Progress value={pct} className="h-1 mt-1" />}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                {l.roots.slice(0, 2).map(t => (
                                  <span key={t.id} className="flex items-center gap-1 text-[9px] text-muted-foreground min-w-0">
                                    {t.completed
                                      ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                      : <Circle className="h-2.5 w-2.5 shrink-0" />}
                                    <span className="truncate max-w-[10rem]">{t.title}</span>
                                  </span>
                                ))}
                                {l.roots.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">
                                    +{l.roots.length - 2} más
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Sistemas20Section;