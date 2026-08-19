import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, Camera, BookMarked, Flame, Clock } from "lucide-react";

export const MEALS = [
  { id: "pre-entreno", name: "Pre-entreno", time: "5:30 AM" },
  { id: "desayuno", name: "Desayuno", time: "8:00 AM" },
  { id: "merienda-1", name: "Merienda 1", time: "10:30 AM" },
  { id: "almuerzo", name: "Almuerzo", time: "1:20 PM" },
  { id: "merienda-2", name: "Merienda 2", time: "4:00 PM" },
  { id: "comida", name: "Comida", time: "7:00 PM" },
  { id: "antes-dormir", name: "Antes de Dormir", time: "8:40 PM" },
];

interface TrackingRow {
  meal_date: string;
  meal_type: string;
  scheduled_time: string;
  completed: boolean;
  completed_at: string | null;
  photo_url: string | null;
  notes: string | null;
}

interface MealDetailRow {
  id: string;
  meal_tracking_id: string | null;
  description: string;
  estimated_calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  created_at: string;
}

interface SysPhotoRow {
  tracking_date: string;
  meal_photos: Record<string, string>;
  completions: Record<string, boolean>;
}

interface PlanRecipeRow {
  plan_date: string;
  meal_slot: string;
  recipe: { id: string; name: string; photo_url: string | null } | null;
}

function mealIdToTime(id: string): number {
  const meal = MEALS.find((m) => m.id === id);
  if (!meal) return 12 * 60;
  const [hh, mm, ampm] = meal.time.split(/:| /).filter(Boolean);
  let hours = Number(hh);
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + Number(mm);
}

function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function timeOfIso(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

function slotLabel(slot: string): string {
  return MEALS.find((m) => m.id === slot)?.name ?? slot;
}

// Los datos legacy usan guiones bajos (pre_entreno, merienda_1, merienda_nocturna)
const MEAL_ID_ALIASES: Record<string, string> = {
  pre_entreno: "pre-entreno",
  merienda_1: "merienda-1",
  merienda_2: "merienda-2",
  merienda_nocturna: "antes-dormir",
};

function mealTypeToId(type: string): string {
  const normalized = type.replace(/-/g, "_");
  return MEAL_ID_ALIASES[normalized] ?? normalized.replace(/_/g, "-");
}

export function MealHistoryViewer() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tracking, setTracking] = useState<TrackingRow[]>([]);
  const [details, setDetails] = useState<MealDetailRow[]>([]);
  const [sysPhotos, setSysPhotos] = useState<SysPhotoRow[]>([]);
  const [plan, setPlan] = useState<PlanRecipeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(
    () => startOfWeek(subDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 6 * 86400000) }),
    [weekStart]
  );
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(days[days.length - 1], "yyyy-MM-dd");

  useEffect(() => {
    setSelectedDate(new Date());
  }, [weekOffset]);

  const load = useCallback(async () => {
    setLoading(true);
    const [trackRes, detailRes, sysRes, planRes] = await Promise.all([
      supabase
        .from("meal_tracking")
        .select("meal_date, meal_type, scheduled_time, completed, completed_at, photo_url, notes")
        .gte("meal_date", startStr)
        .lte("meal_date", endStr),
      supabase
        .from("meal_details")
        .select("id, meal_tracking_id, description, estimated_calories, protein_grams, carbs_grams, fat_grams, created_at")
        .gte("created_at", `${startStr}T00:00:00`)
        .lte("created_at", `${endStr}T23:59:59`)
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_systems_tracking")
        .select("tracking_date, meal_photos, completions")
        .gte("tracking_date", startStr)
        .lte("tracking_date", endStr),
      supabase
        .from("meal_plan")
        .select("plan_date, meal_slot, recipe:recipes(id, name, photo_url)")
        .gte("plan_date", startStr)
        .lte("plan_date", endStr),
    ]);
    setTracking((trackRes.data as TrackingRow[] | null) || []);
    setDetails((detailRes.data as MealDetailRow[] | null) || []);
    setSysPhotos((sysRes.data as SysPhotoRow[] | null) || []);
    setPlan((planRes.data as PlanRecipeRow[] | null) || []);
    setLoading(false);
  }, [startStr, endStr]);

  useEffect(() => { load(); }, [load]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const dayDetails = details.filter((d) => format(parseISO(d.created_at), "yyyy-MM-dd") === dateStr);
  const daySys = sysPhotos.find((s) => s.tracking_date === dateStr);
  const sysMealPhotos = (daySys?.meal_photos || {}) as Record<string, string>;
  const weekTrack = tracking.filter((t) => t.meal_date === dateStr);

  const mealRows = MEALS.map((meal) => {
    const track = weekTrack.find((t) => mealTypeToId(t.meal_type) === meal.id);
    const sysPhoto = sysMealPhotos[meal.id];
    const rec = plan.find((p) => p.plan_date === dateStr && p.meal_slot === meal.id);
    const linked = details.filter((d) => d.meal_tracking_id === track?.id);
    return { meal, track, sysPhoto, rec, details: linked };
  });

  const orphanDetails = dayDetails.filter((d) => {
    const linked = mealRows.some((r) => r.details.some((x) => x.id === d.id));
    return !linked && !d.meal_tracking_id;
  });

  const assignedDetails = mealRows.map((r) => {
    const own = r.details.map((d) => ({ d, score: 0 }));
    const extras = orphanDetails
      .filter((x) => !x.meal_tracking_id)
      .map((d) => {
        const t = new Date(d.created_at);
        const mins = t.getHours() * 60 + t.getMinutes();
        const score = Math.abs(mins - mealIdToTime(r.meal.id));
        return { d, score };
      })
      .filter((x) => x.score <= 45)
      .sort((a, b) => a.score - b.score);
    return { meal: r.meal, track: r.track, sysPhoto: r.sysPhoto, rec: r.rec, orphs: extras };
  });

  const photosOfDay = [
    ...mealRows.map((r) => ({ src: r.track?.photo_url || r.sysPhoto || null, label: r.meal.name })),
    ...assignedDetails
      .flatMap((r) => (r.rec?.recipe?.photo_url ? [{ src: r.rec.recipe.photo_url as string, label: r.rec.recipe.name, isRecipe: true }] : []))
      .filter((p) => p.src),
  ]
    .filter((p): p is { src: string; label: string; isRecipe?: boolean } => !!p.src);

  const eatenCount = mealRows.filter((r) => r.track?.completed || r.track?.photo_url || r.sysPhoto).length;
  const kcalDay = dayDetails.reduce((s, d) => s + (d.estimated_calories || 0), 0);
  const protDay = dayDetails.reduce((s, d) => s + (d.protein_grams || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Camera className="h-5 w-5" /> ¿Qué comí cada día?
        </h3>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            Semana del {format(weekStart, "d MMM", { locale: es })}
          </span>
          <Button size="icon" variant="ghost" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((d) => {
          const ds = format(d, "yyyy-MM-dd");
          const dayEaten = tracking.filter(
            (t) => t.meal_date === ds && (t.completed || t.photo_url)
          ).length;
          const daySysPhoto = sysPhotos.find((s) => s.tracking_date === ds);
          const sysCount = Object.values(daySysPhoto?.meal_photos || {}).filter(Boolean).length;
          const active = ds === dateStr;
          const count = Math.max(dayEaten, sysCount);
          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(d)}
              className={cn(
                "flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-[10px] shrink-0 transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
              )}
            >
              <span className="font-bold">{format(d, "d")}</span>
              <span className="uppercase">{format(d, "EEE", { locale: es })}</span>
              <span className={cn("font-semibold", active ? "text-primary-foreground" : count > 0 ? "text-green-600" : "text-muted-foreground")}>
                {count > 0 ? `🍽 ${count}` : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando historial...</p>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {eatenCount > 0 ? `${eatenCount}/7 comidas registradas` : "Nada registrado este día"}
            </Badge>
            {kcalDay > 0 && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Flame className="h-3 w-3 text-orange-500" /> {Math.round(kcalDay)} kcal · P {Math.round(protDay)}g
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {mealRows.map(({ meal, track, sysPhoto, rec }) => {
              const assigned = assignedDetails.find((a) => a.meal.id === meal.id);
              const orphs = assigned?.orphs ?? [];
              const photo = track?.photo_url || sysPhoto || null;
              const wasEaten = track?.completed || !!photo || orphs.length > 0;
              return (
                <Card key={meal.id} className={cn("p-3", wasEaten && "border-green-500/50 bg-green-500/5")}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{meal.name}</p>
                        {wasEaten && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                        {rec?.recipe && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <BookMarked className="h-2.5 w-2.5" />
                            {rec.recipe.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />Plan: {meal.time}
                        </span>
                        {track?.completed_at && (
                          <span className="flex items-center gap-1 text-green-700 font-medium">
                            <CheckCircle2 className="h-3 w-3" />Comí: {timeOfIso(track.completed_at)}
                          </span>
                        )}
                        {!track?.completed_at && orphs.length > 0 && (
                          <span className="text-xs text-green-700 font-medium">
                            Comí: {timeOfIso(orphs[0].d.created_at)} aprox.
                          </span>
                        )}
                      </div>
                      {orphs.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {orphs.map(({ d }) => (
                            <Badge key={d.id} variant="secondary" className="text-[10px]">
                              {d.description}
                              {d.estimated_calories ? ` ~${Math.round(d.estimated_calories)} kcal` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rec?.recipe?.photo_url && (
                        <img
                          src={rec.recipe.photo_url}
                          alt={rec.recipe.name}
                          className="h-12 w-12 rounded-lg object-cover border"
                        />
                      )}
                      {photo ? (
                        <img src={photo} alt={meal.name} className="h-14 w-14 rounded-lg object-cover" />
                      ) : !wasEaten && (
                        <span className="text-[10px] text-muted-foreground">Sin foto</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {orphanDetails.length > 0 && (
              <Card className="p-3 border-dashed">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Otros registros del día</p>
                <div className="flex gap-1.5 flex-wrap">
                  {orphanDetails.map((d) => (
                    <Badge key={d.id} variant="outline" className="text-[10px]">
                      {d.description} {d.estimated_calories ? `~${Math.round(d.estimated_calories)} kcal` : ""}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {photosOfDay.length > 0 && (
            <Card className="p-3">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" /> Fotos del día ({photosOfDay.length})
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {photosOfDay.map((p, i) => (
                  <div key={i} className="space-y-1">
                    <img src={p.src} alt={p.label} className="aspect-square w-full rounded-lg object-cover" />
                    <p className="text-[9px] text-center text-muted-foreground truncate">{p.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}