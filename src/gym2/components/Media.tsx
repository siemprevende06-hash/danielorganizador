import { useState } from "react";
import { cn } from "@/lib/utils";
import { esName } from "../lib/exercises";
import type { AnyExercise, Ex } from "../lib/exercises";

const IMG_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/";
const GIF_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/";

export const imgUrl = (ex: AnyExercise | null | undefined): string | undefined =>
  ex && "img" in ex && (ex as Ex).img ? IMG_BASE + (ex as Ex).img : undefined;

export const gifUrl = (ex: AnyExercise | null | undefined): string | undefined =>
  ex && "gif" in ex && (ex as Ex).gif ? GIF_BASE + (ex as Ex).gif : undefined;

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
  const name = ex?.n ? esName(ex as AnyExercise) || ex.n : "?";
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

export function ExerciseImg({
  ex,
  className,
  preferGif = false,
}: {
  ex: AnyExercise | null;
  className?: string;
  preferGif?: boolean;
}) {
  const [mode, setMode] = useState<0 | 1 | 2>(() =>
    preferGif
      ? gifUrl(ex)
        ? 0
        : imgUrl(ex)
          ? 1
          : 2
      : imgUrl(ex)
        ? 1
        : 2
  );
  const [loaded, setLoaded] = useState(false);
  const src = mode === 0 ? gifUrl(ex) : mode === 1 ? imgUrl(ex) : undefined;
  if (!src)
    return <ExerciseIcon ex={ex} className={className} />;
  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted",
        className
      )}
    >
      {!loaded && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
          {preferGif ? "…" : ""}
        </span>
      )}
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (mode === 0 && imgUrl(ex)) {
            setMode(1);
            setLoaded(false);
          } else {
            setMode(2);
          }
        }}
        className={cn(
          "h-full w-full object-cover",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </span>
  );
}