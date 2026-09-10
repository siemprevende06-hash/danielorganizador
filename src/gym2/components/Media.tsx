import { cn } from "@/lib/utils";
import type { AnyExercise } from "../lib/exercises";

const tint: Record<string, string> = {
  chest: "bg-rose-500/15 text-rose-500",
  back: "bg-sky-500/15 text-sky-500",
  shoulders: "bg-violet-500/15 text-violet-500",
  "upper arms": "bg-orange-500/15 text-orange-500",
  "lower arms": "bg-amber-500/15 text-amber-500",
  waist: "bg-yellow-500/15 text-yellow-500",
  "upper legs": "bg-blue-500/15 text-blue-500",
  "lower legs": "bg-teal-500/15 text-teal-500",
  neck: "bg-slate-500/15 text-slate-400",
  cardio: "bg-emerald-500/15 text-emerald-500",
};

export function ExerciseIcon({
  ex,
  className,
}: {
  ex: { n?: string; bp?: string } | null;
  className?: string;
}) {
  const name = ex?.n || "?";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
        tint[ex?.bp || ""] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {initials}
    </span>
  );
}