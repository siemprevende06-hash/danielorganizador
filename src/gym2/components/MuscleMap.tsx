import PATHS, { type BodyView } from "../lib/body-paths";
import { INERT, MUSCLE_NAME, levelsOf } from "../lib/muscles";
import { cn } from "@/lib/utils";

const FILL = [
  "rgba(148,163,184,0.14)",
  "rgba(48,209,88,0.24)",
  "rgba(48,209,88,0.44)",
  "rgba(48,209,88,0.66)",
  "rgba(48,209,88,0.92)",
];
const STROKE = "rgba(51,65,85,0.55)";

function View({
  view,
  levels,
  onMuscle,
  selected,
  label,
}: {
  view: BodyView;
  levels: Record<string, number>;
  onMuscle?: (slug: string) => void;
  selected?: string | null;
  label: string;
}) {
  return (
    <svg
      viewBox={view.vb}
      role="img"
      aria-label={label}
      className="h-auto w-1/2"
    >
      {INERT.map(
        (slug) =>
          (view.p[slug] || []).map((d, i) => (
            <path key={slug + i} d={d} fill="none" stroke={STROKE} strokeWidth="1" />
          ))
      )}
      {Object.keys(levels).map((slug) =>
        (view.p[slug] || []).map((d, i) => (
          <path
            key={slug + i}
            d={d}
            fill={FILL[levels[slug]] || FILL[0]}
            stroke={STROKE}
            strokeWidth="1"
            className={cn(
              "cursor-pointer transition-opacity",
              selected && selected !== slug && "opacity-40"
            )}
            onClick={onMuscle ? () => onMuscle(slug) : undefined}
          >
            <title>{MUSCLE_NAME[slug] || slug}</title>
          </path>
        ))
      )}
    </svg>
  );
}

export function MuscleMap({
  load,
  onMuscle,
  selected,
  body = "male",
  className,
}: {
  load: Record<string, number>;
  onMuscle?: (slug: string) => void;
  selected?: string | null;
  body?: "male" | "female";
  className?: string;
}) {
  const levels = levelsOf(load);
  const g = PATHS[body] || PATHS.male;
  const bodyParts = Object.keys(load);
  void bodyParts;
  return (
    <div className={cn("flex gap-2", className)}>
      <View view={g.front} levels={levels} onMuscle={onMuscle} selected={selected} label="Frente" />
      <View view={g.back} levels={levels} onMuscle={onMuscle} selected={selected} label="Espalda" />
    </div>
  );
}

export function MuscleMapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      Menos
      {[0, 1, 2, 3, 4].map((l) => (
        <span
          key={l}
          className="h-3 w-3 rounded-[3px]"
          style={{ background: FILL[l] }}
        />
      ))}
      Más
    </div>
  );
}