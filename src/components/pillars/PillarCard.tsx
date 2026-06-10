import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PillarProgress } from "@/hooks/usePillarProgress";

interface PillarCardProps {
  pillar: PillarProgress;
  compact?: boolean;
  onCoverChange?: () => void;
}

export function PillarCard({ pillar, compact = false, onCoverChange }: PillarCardProps) {
  const [cover, setCover] = useState<string | null>(pillar.coverUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const colorFor = (n: number) =>
    n >= 80 ? "text-green-500" : n >= 50 ? "text-yellow-500" : n > 0 ? "text-orange-500" : "text-muted-foreground";
  const barFor = (n: number) =>
    n >= 80 ? "bg-green-500" : n >= 50 ? "bg-yellow-500" : n > 0 ? "bg-orange-500" : "bg-muted";

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `pillars/${pillar.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("user-images").upload(path, file, { upsert: true });
    if (error) { console.error(error); return; }
    const { data } = supabase.storage.from("user-images").getPublicUrl(path);
    const url = data.publicUrl;
    await supabase.from("pillar_covers").upsert({ pillar_id: pillar.id, cover_url: url, updated_at: new Date().toISOString() });
    setCover(url);
    onCoverChange?.();
  };

  if (compact) {
    return (
      <Link to={pillar.route} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted">
        <span className="text-lg">{pillar.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium truncate">{pillar.name}</span>
            <span className={cn("text-xs font-bold", colorFor(pillar.percentage))}>{pillar.percentage}%</span>
          </div>
          <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full", barFor(pillar.percentage))} style={{ width: `${pillar.percentage}%` }} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn(
      "relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md group",
      pillar.status === "completed" && "border-green-500/50"
    )}>
      {/* Cover */}
      <Link to={pillar.route} className="block relative h-24 bg-gradient-to-br from-primary/20 to-primary/5">
        {cover ? (
          <img src={cover} alt={pillar.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">{pillar.icon}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <span className="absolute top-2 left-2 text-2xl drop-shadow">{pillar.icon}</span>
        <span className={cn("absolute top-2 right-2 text-xl font-bold drop-shadow", colorFor(pillar.percentage))}>
          {pillar.percentage}%
        </span>
      </Link>

      {/* Upload button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
        className="absolute top-2 right-1/2 translate-x-1/2 bg-background/80 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        aria-label="Cambiar portada"
      >
        <ImagePlus className="w-3.5 h-3.5" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
      />

      {/* Body */}
      <Link to={pillar.route} className="block p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{pillar.name}</span>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full transition-all", barFor(pillar.percentage))} style={{ width: `${pillar.percentage}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded bg-muted/60 px-2 py-1">
            <div className="text-muted-foreground">Esfuerzo</div>
            <div className={cn("font-bold", colorFor(pillar.effort))}>{pillar.effort}%</div>
          </div>
          <div className="rounded bg-muted/60 px-2 py-1">
            <div className="text-muted-foreground">Resultados</div>
            <div className={cn("font-bold", colorFor(pillar.results))}>{pillar.results}%</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>Tareas {pillar.tasksCompleted}/{pillar.tasksTotal}</span>
          {pillar.hoursToday > 0 && <span>{pillar.hoursToday.toFixed(1)}h</span>}
          {pillar.streak > 0 && <span>🔥 {pillar.streak}</span>}
        </div>
      </Link>
    </div>
  );
}
