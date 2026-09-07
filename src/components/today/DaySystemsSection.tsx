import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import {
  DAY_SYSTEMS,
  SOSTEN_STRUCTURAL,
  systemActualMinutes,
  type DaySystem,
  type DaySystemArea,
  type SpeedOption,
} from "@/lib/daySystems";
import { cn } from "@/lib/utils";
import { Flame, Trophy, Zap, Sun, Shield, Sparkles, Clock, Gauge } from "lucide-react";

const AREA_ICONS: Record<string, React.ReactNode> = {
  "prof-acad": <Zap className="h-3.5 w-3.5" />,
  desarrollo: <Sparkles className="h-3.5 w-3.5" />,
  finanzas: <Gauge className="h-3.5 w-3.5" />,
  salud: <Sun className="h-3.5 w-3.5" />,
  "fuerza-mental": <Sparkles className="h-3.5 w-3.5" />,
  apariencia: <Sparkles className="h-3.5 w-3.5" />,
};

type TierKey = "red" | "grey" | "blue" | "green" | "gold";

interface Tier {
  key: TierKey;
  label: string;
  border: string;
  bg: string;
  bar: string;
  text: string;
  hex: string;
}

const TIERS: Record<TierKey, Tier> = {
  red: {
    key: "red",
    label: "No hice",
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    bar: "bg-red-500",
    text: "text-red-500",
    hex: "#ef4444",
  },
  grey: {
    key: "grey",
    label: "Sin datos",
    border: "border-border/40",
    bg: "bg-white/80 dark:bg-zinc-950/80",
    bar: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    hex: "#64748b",
  },
  blue: {
    key: "blue",
    label: "Mínimo",
    border: "border-blue-500/50",
    bg: "bg-blue-500/5",
    bar: "bg-blue-500",
    text: "text-blue-500",
    hex: "#3b82f6",
  },
  green: {
    key: "green",
    label: "Máximo",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/5",
    bar: "bg-emerald-500",
    text: "text-emerald-500",
    hex: "#10b981",
  },
  gold: {
    key: "gold",
    label: "Extra",
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    bar: "bg-amber-500",
    text: "text-amber-500",
    hex: "#f59e0b",
  },
};

function getTier(actual: number, skipped: boolean, speedOptions: SpeedOption[]): Tier {
  if (skipped) return TIERS.red;
  const min = speedOptions.find(o => o.id === "minimo")?.minutes ?? 0;
  const max = speedOptions.find(o => o.id === "maximo")?.minutes ?? 0;
  const extra = speedOptions.find(o => o.id === "extra")?.minutes ?? 0;
  if (actual <= 0) return TIERS.grey;
  if (extra > 0 && actual >= extra) return TIERS.gold;
  if (actual >= max) return TIERS.green;
  if (actual >= min) return TIERS.blue;
  return TIERS.grey;
}

function SystemCover({ type, id, name }: { type: "area" | "sub"; id: string; name: string }) {
  const { covers } = useAreaCovers();
  const url = covers[coverKey(type, id)] ?? null;
  return (
    <div className={cn("relative bg-gradient-to-br overflow-hidden", getCoverGradient(id))}>
      {url ? (
        <img src={url} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      {!url ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-lg drop-shadow-sm">🖼️</span>
        </div>
      ) : null}
    </div>
  );
}

function CentralSystemCard({
  system,
  completed,
  skipped,
  actualMinutes,
  meta,
  streakLabel,
  streak,
  onToggle,
  onTimeChange,
}: {
  system: DaySystem;
  completed: boolean;
  skipped: boolean;
  actualMinutes: number;
  meta: number;
  streakLabel?: string;
  streak?: { current: number; best: number };
  onToggle: () => void;
  onTimeChange: (minutes: number) => void;
}) {
  const tier = getTier(actualMinutes, skipped, system.speedOptions);
  const pct = meta > 0 ? Math.round((actualMinutes / meta) * 100) : 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border transition-all hover:shadow-md group flex flex-col",
        tier.border,
        tier.bg
      )}
    >
      <div className="h-16 w-full shrink-0">
        <SystemCover type={system.cover.type} id={system.cover.id} name={system.name} />
      </div>
      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          <Checkbox
            checked={completed || actualMinutes >= meta}
            onCheckedChange={onToggle}
            className="h-4 w-4 data-[state=checked]:bg-primary"
          />
          <span className={cn("text-xs font-semibold truncate", (completed || actualMinutes >= meta) && "line-through text-muted-foreground")}>
            {system.name}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <Clock className={cn("h-3 w-3 shrink-0", tier.text)} />
            <Input
              type="number"
              min={0}
              value={actualMinutes || ""}
              onChange={e => onTimeChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="min"
              className={cn("h-6 w-16 text-center text-[10px] px-1", tier.text)}
            />
          </div>
          <span className="text-[9px] text-muted-foreground shrink-0">
            <span className="font-mono font-semibold text-foreground">{meta}</span> min
          </span>
        </div>

        <Progress
          value={Math.min(100, pct)}
          className="h-1.5"
          indicatorClassName={tier.bar}
        />

        <div className="flex items-center justify-between gap-1 text-[9px]">
          <span className={cn("font-medium flex items-center gap-1", tier.text)}>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tier.hex }}
            />
            {tier.label}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {streakLabel && (
              <span className={cn("font-medium flex items-center gap-0.5", streakLabel.startsWith("🔥") ? "text-orange-500" : "text-yellow-600")}>
                {streakLabel}
              </span>
            )}
            {streak && (streak.current > 0 || streak.best > 0) && (
              <span className="flex items-center gap-1">
                {streak.current > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500">
                    <Flame className="h-2.5 w-2.5" />
                    {streak.current}
                  </span>
                )}
                {streak.best > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-600">
                    <Trophy className="h-2.5 w-2.5" />
                    {streak.best}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DaySystemsSection({
  completions,
  timeData,
  workoutDuration,
  onToggle,
  onTimeChange,
  skipped,
  streaks,
}: {
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  workoutDuration: number;
  onToggle: (id: string) => void;
  onTimeChange: (id: string, minutes: number) => void;
  skipped?: Record<string, boolean>;
  streaks?: Record<string, { current: number; best: number }>;
}) {
  const { getMinutes } = useSystemSpeed();
  const covers = useAreaCovers();

  const centralAreas = useMemo(() => DAY_SYSTEMS.filter(a => a.kind === "central"), []);
  const structuralAreas = useMemo(() => DAY_SYSTEMS.filter(a => a.kind === "estructural"), []);

  const data = useMemo(
    () => ({ completions, timeData, workoutDuration }),
    [completions, timeData, workoutDuration]
  );

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Áreas Centrales
        </h2>
        {centralAreas.map(area => (
          <AreaGroup
            key={area.id}
            area={area}
            data={data}
            onToggle={onToggle}
            onTimeChange={onTimeChange}
            skipped={skipped}
            getMinutes={getMinutes}
            covers={covers}
            streaks={streaks}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-blue-500" /> Áreas Estructurales
        </h2>
        {structuralAreas.map(area => (
          <AreaGroup
            key={area.id}
            area={area}
            data={data}
            onToggle={onToggle}
            onTimeChange={onTimeChange}
            skipped={skipped}
            getMinutes={getMinutes}
            covers={covers}
            streaks={streaks}
          />
        ))}
      </div>
    </div>
  );
}

function AreaGroup({
  area,
  data,
  onToggle,
  onTimeChange,
  skipped,
  getMinutes,
  covers,
  streaks,
}: {
  area: DaySystemArea;
  data: { completions: Record<string, boolean>; timeData: Record<string, number>; workoutDuration: number };
  onToggle: (id: string) => void;
  onTimeChange: (id: string, minutes: number) => void;
  skipped?: Record<string, boolean>;
  getMinutes: (sysId: string) => number;
  covers: ReturnType<typeof useAreaCovers>;
  streaks?: Record<string, { current: number; best: number }>;
}) {
  const coverUrl = covers.covers[coverKey(area.cover.type, area.cover.id)] ?? null;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="p-3 border-b border-border/40 flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 relative bg-gradient-to-br border border-border/40">
          {coverUrl ? (
            <img src={coverUrl} alt={area.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-lg">{AREA_ICONS[area.id]}</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{area.name}</h3>
          <p className="text-[9px] text-muted-foreground">
            {area.kind === "central" ? `${area.systems.length} sistemas del día` : "Desde Sostén"}
          </p>
        </div>
      </div>
      <CardContent className="p-3">
        {area.kind === "central" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {area.systems.map(sys => {
              const meta = getMinutes(sys.id);
              const actual = systemActualMinutes(sys, data);
              const done = !!data.completions[sys.id];
              const isSkipped = !!skipped?.[sys.id];
              const streak = streaks?.[sys.id];
              const streakLabel =
                sys.streakMinutes > 0
                  ? sys.streakMinutes === 30
                    ? "🏆30'"
                    : "🔥5'"
                  : undefined;
              return (
                <CentralSystemCard
                  key={sys.id}
                  system={sys}
                  completed={done}
                  skipped={isSkipped}
                  actualMinutes={actual}
                  meta={meta}
                  streakLabel={streakLabel}
                  onToggle={() => onToggle(sys.id)}
                  onTimeChange={v => onTimeChange(sys.id, v)}
                  streak={streak}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(SOSTEN_STRUCTURAL[area.id] || []).map(item => {
              const done = !!data.completions[item.id];
              const isSkipped = !!skipped?.[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-lg border transition-all",
                    done
                      ? "bg-emerald-500/5 border-emerald-500/40"
                      : isSkipped
                      ? "bg-red-500/5 border-red-500/40"
                      : "bg-background border-border hover:border-primary/30"
                  )}
                >
                  <Checkbox checked={done} className="h-4 w-4" />
                  <span className={cn("text-xs font-medium truncate", done && "line-through text-muted-foreground")}>
                    {item.name}
                  </span>
                  {isSkipped && <span className="text-[9px] text-red-400 ml-auto shrink-0">No lo hice</span>}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}