import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sun, CalendarCheck2, CalendarDays, Home, Sparkles, ArrowRight, Target, Activity,
  ListChecks, CheckCircle2, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBArea, PointBSubAxis } from "@/lib/definitions";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { usePuntoPartida, type PuntoPartidaEntry } from "@/hooks/usePuntoPartida";
import { getWeekGoalEffective, getMonthGoalsSummary } from "@/lib/hierarchy";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { useAreaScores, type AreaScore, type SubAreaScore } from "@/hooks/useAreaScores";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { usePersonalLists, type PersonalList, type PersonalListTask } from "@/hooks/usePersonalLists";

const LIST_AREA_MAP: Record<string, string> = {
  salud_bienestar: "salud",
  fuerza_mental: "fuerza-mental",
  apariencia: "apariencia",
  desarrollo_personal: "desarrollo",
  profesional_academico: "profesional",
  finanzas: "finanzas",
  amor_romance: "amor",
  familia_amistad: "familia",
  ocio_experiencias: "ocio",
};

interface AreaSystemConfig {
  habits: string[];
  hierarchyAreas: string[];
  vision: string;
}

const AREA_SYSTEMS: Record<string, AreaSystemConfig> = {
  salud: {
    habits: ["entrenamiento-fisico", "alistamiento-desayuno", "desayuno", "almuerzo", "comida", "antes-dormir", "suplementos"],
    hierarchyAreas: ["gym"],
    vision: "Físicamente fuerte: 70kg+, gym 5d/sem y presencia imponente",
  },
  "fuerza-mental": {
    habits: ["rutina-activacion", "horario-regular", "rutina-desactivacion"],
    hierarchyAreas: [],
    vision: "Rutinas y disciplina automáticas que sostienen todo lo demás",
  },
  apariencia: {
    habits: ["skincare-manana", "skincare-noche", "banarme-vestirse"],
    hierarchyAreas: [],
    vision: "Presencia impecable en cada detalle del día",
  },
  desarrollo: {
    habits: ["musica", "lectura", "ajedrez", "game"],
    hierarchyAreas: ["musica", "lectura", "ajedrez", "ingles", "italiano", "game"],
    vision: "Tocar música de forma avanzada, +24 libros/año y dominio de inglés e italiano",
  },
  profesional: {
    habits: ["universidad", "emprendimiento", "proyectos"],
    hierarchyAreas: ["universidad", "proyectos", "emprendimiento"],
    vision: "Graduado en Ingeniería Automática y AUTEC estable generando ingresos",
  },
  finanzas: {
    habits: ["finanzas"],
    hierarchyAreas: [],
    vision: "Libertad económica: ahorro, inversión e ingresos múltiples",
  },
  familia: {
    habits: ["familia"],
    hierarchyAreas: [],
    vision: "Amistades profundas y una red social sólida",
  },
  amor: {
    habits: ["game"],
    hierarchyAreas: [],
    vision: "Hombre seguro con experiencia real en relaciones",
  },
  ocio: {
    habits: ["game"],
    hierarchyAreas: [],
    vision: "Vida equilibrada, experiencias nuevas y viajes",
  },
  proposito: {
    habits: ["journaling"],
    hierarchyAreas: [],
    vision: "Saber quién soy, hacia dónde voy y por qué",
  },
};

const GROUP_LABELS: Record<string, string> = {
  cimientos: "Cimientos · Estructura",
  construccion: "Construcción · Esfuerzo",
  recompensas: "Recompensas · Vida",
};

const ALL_HABITS = [...new Set(Object.values(AREA_SYSTEMS).flatMap(c => c.habits))];

const NODE_META = [
  { key: "diario", label: "Diario", tag: "Hábitos de hoy", icon: Sun },
  { key: "semanal", label: "Semanal", tag: "Constancia 7 días", icon: CalendarCheck2 },
  { key: "mensual", label: "Mensual", tag: "Resultados del mes", icon: CalendarDays },
  { key: "comodidad", label: "Comodidad", tag: "Punto B alcanzado", icon: Home },
  { key: "vision", label: "Visión", tag: "La meta definitiva", icon: Sparkles },
] as const;

interface HistoryRow {
  tracking_date: string;
  time_data?: Record<string, number>;
  completions?: Record<string, boolean>;
}

function flattenSubs(sub: PointBSubAxis[]): PointBSubAxis[] {
  const out: PointBSubAxis[] = [];
  for (const s of sub) {
    if (s.children && s.children.length > 0) out.push(...flattenSubs(s.children));
    else out.push(s);
  }
  return out;
}

function fmtMin(m: number) {
  const mm = Math.round(m || 0);
  const h = Math.floor(mm / 60);
  return h > 0 ? `${h}h ${mm % 60}m` : `${mm}m`;
}

function Ring({
  value, size = 84, stroke = 8, trackClass = "text-white/20", barClass = "text-white",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  trackClass?: string;
  barClass?: string;
  children: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeLinecap="round"
          className={barClass}
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function daysActive(rows: HistoryRow[], habits: string[]) {
  if (rows.length === 0) return 0;
  return rows.filter(row => habits.some(h => row.completions?.[h])).length;
}

function JourneyNode({ node }: {
  node: { icon: typeof Sun; label: string; tag: string; value: string; sub: string; active: boolean; accent: string; };
}) {
  const Icon = node.icon;
  return (
    <div className={cn(
      "flex-1 min-w-[150px] rounded-xl border p-3 transition-all",
      node.active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/60 bg-muted/20"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0 bg-muted/40", node.accent)}>
          <Icon className={cn("h-4 w-4", node.accent.split(" ").filter(t => t.startsWith("text-")).join(" ") || "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">{node.label}</p>
          <p className="text-[9px] text-muted-foreground truncate mt-0.5">{node.tag}</p>
        </div>
      </div>
      <p className="text-base font-black tabular-nums leading-tight truncate">{node.value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug">{node.sub}</p>
    </div>
  );
}

function collectSubScores(list: SubAreaScore[], m: Record<string, SubAreaScore>) {
  for (const s of list) {
    m[s.id] = s;
    if (s.children && s.children.length > 0) collectSubScores(s.children, m);
  }
}

function AreaJourneyCard({
  area, entries, sys, today, weekRows, monthRows, monthGoals,
  score, subCovers, lists, tasks,
}: {
  area: PointBArea;
  entries: Record<string, PuntoPartidaEntry>;
  sys: ReturnType<typeof useSystemsTracking>["data"];
  today: Date;
  weekRows: HistoryRow[];
  monthRows: HistoryRow[];
  monthGoals: Record<string, number>;
  score?: AreaScore;
  subCovers: Record<string, string>;
  lists: PersonalList[];
  tasks: PersonalListTask[];
}) {
  const cfg = AREA_SYSTEMS[area.id] || { habits: [], hierarchyAreas: [], vision: "" };

  const subs = useMemo(() => flattenSubs(area.sub), [area]);
  const comodidad = useMemo(() => {
    const vals: number[] = [];
    for (const s of subs) {
      const range = s.target - s.start;
      if (range === 0) continue;
      const cur = entries[area.id]?.sub_scores?.[s.id] ?? s.start;
      vals.push(Math.max(0, Math.min(100, ((cur - s.start) / range) * 100)));
    }
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [subs, entries, area.id]);

  const subScoresById = useMemo(() => {
    const m: Record<string, SubAreaScore> = {};
    collectSubScores(score?.sub || [], m);
    return m;
  }, [score]);

  const areaLists = useMemo(
    () => lists.filter(l => LIST_AREA_MAP[l.area_id] === area.id),
    [lists, area.id]
  );

  const areaEsfuerzo = score?.esfuerzo ?? null;
  const areaResultados = score?.resultados ?? null;

  const doneToday = cfg.habits.filter(h => sys.completions[h]).length;
  const minToday = cfg.habits.reduce((s, h) => s + (sys.timeData[h] || 0), 0);

  const weekGoal = cfg.hierarchyAreas.reduce((s, a) => s + (getWeekGoalEffective(today, a) || 0), 0);
  const weekActual = cfg.hierarchyAreas.reduce((s, a) => s + weekRows.reduce((t, r) => t + (r.time_data?.[a] || 0), 0), 0);
  const monthGoal = cfg.hierarchyAreas.reduce((s, a) => s + (monthGoals[a] || 0), 0);
  const monthActual = cfg.hierarchyAreas.reduce((s, a) => s + monthRows.reduce((t, r) => t + (r.time_data?.[a] || 0), 0), 0);

  const days7 = daysActive(weekRows, cfg.habits);
  const days30 = daysActive(monthRows, cfg.habits);

  const visionReached = comodidad >= 100;

  const nodes = [
    {
      icon: Sun,
      label: "Diario",
      tag: "Hábitos de hoy",
      value: `${doneToday}/${cfg.habits.length}`,
      sub: minToday > 0 ? `${fmtMin(minToday)} de esfuerzo hoy` : "marca tus sistemas hoy",
      active: doneToday > 0,
      accent: "bg-sky-500/15 text-sky-500",
    },
    {
      icon: CalendarCheck2,
      label: "Semanal",
      tag: "Constancia 7 días",
      value: weekGoal > 0 ? `${fmtMin(weekActual)}/${fmtMin(weekGoal)}` : `${days7}/7 días`,
      sub: weekGoal > 0 ? "minutos de la semana" : "días activos en la semana",
      active: (weekGoal > 0 && weekActual >= weekGoal) || (weekGoal === 0 && days7 >= 7),
      accent: "bg-indigo-500/15 text-indigo-500",
    },
    {
      icon: CalendarDays,
      label: "Mensual",
      tag: "Resultados del mes",
      value: monthGoal > 0 ? `${fmtMin(monthActual)}/${fmtMin(monthGoal)}` : `${days30}/30 días`,
      sub: monthGoal > 0 ? "minutos del mes" : "días activos en el mes",
      active: (monthGoal > 0 && monthActual >= monthGoal) || (monthGoal === 0 && days30 >= 30),
      accent: "bg-purple-500/15 text-purple-500",
    },
    {
      icon: Home,
      label: "Comodidad",
      tag: "Punto B alcanzado",
      value: `${comodidad}%`,
      sub: visionReached ? "zona de comodidad conquistada" : `${100 - comodidad}% para tu punto de comodidad`,
      active: visionReached,
      accent: "bg-emerald-500/15 text-emerald-500",
    },
    {
      icon: Sparkles,
      label: "Visión",
      tag: "La meta definitiva",
      value: visionReached ? "Alcanzada" : "En camino",
      sub: cfg.vision,
      active: visionReached,
      accent: "bg-amber-500/15 text-amber-500",
    },
  ];

  const results = subs.slice(0, 6).map(s => {
    const cur = entries[area.id]?.sub_scores?.[s.id] ?? s.start;
    const range = s.target - s.start;
    const pct = range === 0 ? 100 : Math.max(0, Math.min(100, ((cur - s.start) / range) * 100));
    const subScore = subScoresById[s.id];
    return { ...s, cur, pct, esfuerzo: subScore?.esfuerzo ?? null, cover: subCovers[s.id] ?? null };
  });

  return (
    <Card className="overflow-hidden border-border/70 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className={cn("bg-gradient-to-br px-5 py-4 relative overflow-hidden bg-cover", getCoverGradient(area.id))}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/5 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl drop-shadow-sm">{area.icon}</span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white drop-shadow leading-tight">{area.label}</h3>
              <p className="text-[10px] text-white/85 uppercase tracking-wider">
                {GROUP_LABELS[area.group] || "Área"} · {subs.length} resultados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white/85 font-semibold uppercase tracking-wider">Comodidad</p>
              <p className="text-xs text-white/70">{visionReached ? "✓ Conquistada" : "Punto B"}</p>
            </div>
            <Ring value={comodidad} size={70} stroke={7}>
              <div className="text-center">
                <span className="text-white font-black text-base leading-none drop-shadow">{comodidad}%</span>
                <span className="block text-[8px] text-white/80 font-semibold">PUNTO B</span>
              </div>
            </Ring>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {nodes.map((n, i) => (
            <div key={n.label} className="flex items-center gap-1.5 flex-1">
              {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
              <JourneyNode node={n} />
            </div>
          ))}
        </div>

        {areaEsfuerzo != null && areaResultados != null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600 flex items-center justify-center gap-1">
                <Activity className="h-3 w-3" /> Esfuerzo real
              </p>
              <p className="text-xl font-black tabular-nums text-sky-600">{areaEsfuerzo}%</p>
              <p className="text-[9px] text-muted-foreground">consistencia registrada en tus días</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-center gap-1">
                <Target className="h-3 w-3" /> Resultados reales
              </p>
              <p className="text-xl font-black tabular-nums text-emerald-600">{areaResultados}%</p>
              <p className="text-[9px] text-muted-foreground">progreso hacia tu punto de comodidad</p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Resultados que avanzan
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {results.map(s => {
                const pct = s.pct;
                return (
                  <div key={s.id} className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                    <div className={cn("relative h-14 flex items-center justify-center bg-gradient-to-br overflow-hidden", getCoverGradient(s.id))}>
                      {s.cover ? (
                        <img src={s.cover} alt={s.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl drop-shadow-sm">{area.icon}</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/70 to-transparent px-2 flex items-end">
                        <span className="text-[10px] font-bold text-white drop-shadow truncate">{s.label}</span>
                      </div>
                    </div>
                    <div className="p-2 pt-1.5 space-y-1.5">
                      {s.esfuerzo != null && (
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Activity className="h-2.5 w-2.5 text-sky-500" /> Esfuerzo
                          </span>
                          <span className="font-bold tabular-nums">{s.esfuerzo}%</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                          <span className="font-medium">Resultado planificado</span>
                          <span className="font-bold tabular-nums text-[10px]">
                            <span className={cn(
                              "text-[11px] font-black",
                              pct >= 80 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-muted-foreground"
                            )}>{s.cur}{s.unit}</span>
                            <span className="text-muted-foreground/50"> / {s.target}{s.unit}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-[9px] font-bold text-muted-foreground tabular-nums shrink-0">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {areaLists.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Objetivos · Mi Lista Personal
              </span>
            </div>
            <div className="space-y-2">
              {areaLists.map(list => {
                const listTasks = tasks.filter(t => t.list_id === list.id);
                const roots = listTasks.filter(t => !t.parent_id);
                const done = roots.filter(t => t.completed).length;
                const pct = roots.length ? Math.round((done / roots.length) * 100) : 0;
                return (
                  <div key={list.id} className="overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    {list.cover_image_url && (
                      <img src={list.cover_image_url} alt={`Portada de ${list.title}`} loading="lazy" className="h-12 w-full object-cover" />
                    )}
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold truncate">{list.title}</p>
                          {list.sub_area && (
                            <p className="text-[9px] text-muted-foreground truncate">{list.sub_area}</p>
                          )}
                        </div>
                        <span className="text-[11px] font-black tabular-nums shrink-0">{roots.length > 0 ? `${pct}%` : "—"}</span>
                      </div>
                      {roots.length > 0 && (
                        <Progress value={pct} className="h-1.5" />
                      )}
                      {roots.length > 0 && (
                        <div className="space-y-1">
                          {roots.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-1.5">
                              {t.completed
                                ? <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                : <Circle className="h-3 w-3 text-muted-foreground shrink-0" />}
                              <span className={cn("text-[10px] truncate", t.completed && "line-through text-muted-foreground")}>
                                {t.title}
                              </span>
                            </div>
                          ))}
                          {roots.length > 3 && (
                            <p className="text-[9px] text-muted-foreground pl-4">+{roots.length - 3} más</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SistemasSection() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { data: sys, loadHistory } = useSystemsTracking();
  const { entries, loading: ppLoading } = usePuntoPartida();
  const { scores: areaScores, averages, loading: scoresLoading } = useAreaScores("month", "esfuerzo");
  const { covers } = useAreaCovers();
  const { lists, tasks } = usePersonalLists();

  useEffect(() => {
    let active = true;
    loadHistory(30).then(rows => {
      if (active) {
        setHistory((rows || []) as HistoryRow[]);
        setLoadingHistory(false);
      }
    });
    return () => { active = false; };
  }, [loadHistory]);

  const today = useMemo(() => new Date(), []);
  const monthGoals = useMemo(() => getMonthGoalsSummary(today), [today]);

  const weekRows = useMemo(() => history.slice(-7), [history]);
  const monthRows = useMemo(() => history.slice(-30), [history]);

  const scoreById = useMemo(() => {
    const map: Record<string, AreaScore> = {};
    areaScores.forEach(a => { map[a.id] = a; });
    return map;
  }, [areaScores]);

  const subCovers = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [key, url] of Object.entries(covers)) {
      if (key.startsWith("sub:") && url) map[key.slice(4)] = url;
    }
    return map;
  }, [covers]);

  const summary = useMemo(() => {
    const doneToday = ALL_HABITS.filter(h => sys.completions[h]).length;
    const minToday = ALL_HABITS.reduce((s, h) => s + (sys.timeData[h] || 0), 0);

    let weekGoal = 0, weekActual = 0, monthGoal = 0, monthActual = 0;
    for (const area of POINT_B_AREAS) {
      const cfg = AREA_SYSTEMS[area.id];
      if (!cfg) continue;
      for (const a of cfg.hierarchyAreas) {
        weekGoal += getWeekGoalEffective(today, a) || 0;
        weekActual += weekRows.reduce((t, r) => t + (r.time_data?.[a] || 0), 0);
        monthGoal += monthGoals[a] || 0;
        monthActual += monthRows.reduce((t, r) => t + (r.time_data?.[a] || 0), 0);
      }
    }

    let com = 0, visionDone = 0;
    for (const area of POINT_B_AREAS) {
      const subs = flattenSubs(area.sub);
      const vals: number[] = [];
      for (const s of subs) {
        const range = s.target - s.start;
        if (range === 0) continue;
        const cur = entries[area.id]?.sub_scores?.[s.id] ?? s.start;
        vals.push(Math.max(0, Math.min(100, ((cur - s.start) / range) * 100)));
      }
      const areaCom = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      com += areaCom;
      if (areaCom >= 100) visionDone += 1;
    }
    const globalCom = POINT_B_AREAS.length ? Math.round(com / POINT_B_AREAS.length) : 0;

    return { doneToday, minToday, weekGoal, weekActual, monthGoal, monthActual, globalCom, visionDone };
  }, [sys, entries, today, monthGoals, weekRows, monthRows]);

  const loading = loadingHistory || ppLoading || scoresLoading;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <span className="text-3xl">⚙️</span>
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Sistemas</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Tus sistemas diarios, semanales y mensuales se traducen en resultados que acercan tu punto de comodidad
          y hacen posible la visión de cada área. Así avanza tu camino.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {NODE_META.map(n => (
            <span key={n.key} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              <n.icon className="h-3 w-3" />
              {n.label}
            </span>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-primary/15">
        <div className="bg-gradient-to-r from-primary/10 via-background to-purple-600/10 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Ring value={summary.globalCom} size={76} stroke={7} trackClass="text-primary/20" barClass="text-primary">
                <div className="text-center">
                  <span className="font-black text-lg leading-none text-foreground">{summary.globalCom}%</span>
                  <span className="block text-[8px] font-bold text-muted-foreground">GLOBAL</span>
                </div>
              </Ring>
              <div>
                <p className="text-sm font-bold">Progreso hacia tu Punto de Comodidad</p>
                <p className="text-[11px] text-muted-foreground">
                  {summary.visionDone}/{POINT_B_AREAS.length} áreas con visión alcanzada · Promedio de todas tus áreas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1 max-w-3xl">
              <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sun className="h-3 w-3 text-sky-500" /> Hoy
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5">{summary.doneToday}/{ALL_HABITS.length}</p>
                <p className="text-[10px] text-muted-foreground">{summary.minToday > 0 ? `${fmtMin(summary.minToday)} invertidos` : "sistemas del día"}</p>
              </div>
              <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-500" /> Esfuerzo
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5">{averages.esfuerzo}%</p>
                <p className="text-[10px] text-muted-foreground">consistencia real del mes</p>
              </div>
              <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3 text-purple-500" /> Resultados
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5">{averages.resultados}%</p>
                <p className="text-[10px] text-muted-foreground">avance real al punto B</p>
              </div>
              <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CalendarCheck2 className="h-3 w-3 text-indigo-500" /> Semana
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5">{summary.weekGoal > 0 ? `${Math.round((summary.weekActual / summary.weekGoal) * 100)}%` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">{summary.weekGoal > 0 ? `${fmtMin(summary.weekActual)} de ${fmtMin(summary.weekGoal)}` : "sin metas de minutos"}</p>
              </div>
              <div className="rounded-xl bg-background border border-border/60 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-purple-500" /> Mes
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5">{summary.monthGoal > 0 ? `${Math.round((summary.monthActual / summary.monthGoal) * 100)}%` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">{summary.monthGoal > 0 ? `${fmtMin(summary.monthActual)} de ${fmtMin(summary.monthGoal)}` : "sin metas de minutos"}</p>
              </div>
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
        <div className="space-y-4">
          {POINT_B_AREAS.map(area => (
            <AreaJourneyCard
              key={area.id}
              area={area}
              entries={entries}
              sys={sys}
              today={today}
              weekRows={weekRows}
              monthRows={monthRows}
              monthGoals={monthGoals}
              score={scoreById[area.id]}
              subCovers={subCovers}
              lists={lists}
              tasks={tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SistemasSection;