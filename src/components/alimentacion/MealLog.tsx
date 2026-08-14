import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";

export const MEALS = [
  { id: "pre-entreno", name: "Pre-entreno", time: "5:30 AM" },
  { id: "desayuno", name: "Desayuno", time: "8:00 AM" },
  { id: "merienda-1", name: "Merienda 1", time: "10:30 AM" },
  { id: "almuerzo", name: "Almuerzo", time: "1:20 PM" },
  { id: "merienda-2", name: "Merienda 2", time: "4:00 PM" },
  { id: "comida", name: "Comida", time: "7:00 PM" },
  { id: "antes-dormir", name: "Antes de Dormir", time: "8:40 PM" },
];

export interface MealLogRow {
  id: string;
  meal_date: string;
  meal_type: string;
  scheduled_time: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  photo_url: string | null;
}

function HourBadge({ iso }: { iso: string }) {
  return <>{format(new Date(iso), "h:mm a")}</>;
}

export function MealLog({ date, onDateChange }: { date: Date; onDateChange: (d: Date) => void }) {
  const [logs, setLogs] = useState<MealLogRow[]>([]);
  const [weekLogs, setWeekLogs] = useState<MealLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { uploadImage, uploading } = useImageUpload();

  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const [{ data: dayData }, { data: weekData }] = await Promise.all([
      supabase.from("meal_tracking").select("*").eq("meal_date", dateStr),
      supabase.from("meal_tracking").select("*").gte("meal_date", weekStart).lte("meal_date", weekEnd),
    ]);
    setLogs((dayData as MealLogRow[] | null) || []);
    setWeekLogs((weekData as MealLogRow[] | null) || []);
    setLoading(false);
  }, [dateStr, date]);

  useEffect(() => { load(); }, [load]);

  const logFor = (mealId: string) => logs.find(l => l.meal_type === mealId);

  const markEaten = async (mealId: string, scheduledTime: string) => {
    const meal = MEALS.find(m => m.id === mealId);
    const now = new Date();
    await supabase.from("meal_tracking").upsert(
      {
        meal_date: dateStr,
        meal_type: mealId,
        scheduled_time: scheduledTime,
        completed: true,
        completed_at: now.toISOString(),
        notes: meal ? `Comida registrada: ${meal.name}` : null,
      },
      { onConflict: "meal_date,meal_type" }
    );
    load();
  };

  const handlePhoto = async (mealId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = await uploadImage(file, "meal-log");
      if (!url) return;
      const existing = logFor(mealId);
      if (existing) {
        await supabase.from("meal_tracking").update({ photo_url: url }).eq("id", existing.id);
      } else {
        const meal = MEALS.find(m => m.id === mealId);
        await supabase.from("meal_tracking").insert({
          meal_date: dateStr,
          meal_type: mealId,
          scheduled_time: meal?.time || "00:00",
          completed: false,
          photo_url: url,
        });
      }
      load();
    };
    input.click();
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  });

  const loggedCount = logs.filter(l => l.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><Utensils className="h-5 w-5" /> Registro de comidas</h3>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => onDateChange(subDays(date, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold capitalize">{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
          <Button size="icon" variant="ghost" onClick={() => onDateChange(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {weekDays.map(d => {
          const ds = format(d, "yyyy-MM-dd");
          const dayLogs = weekLogs.filter(l => l.meal_date === ds && l.completed).length;
          const active = ds === dateStr;
          return (
            <button
              key={ds}
              onClick={() => onDateChange(d)}
              className={cn(
                "flex flex-col items-center px-2.5 py-1.5 rounded-lg border text-[10px] shrink-0 transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
              )}
            >
              <span className="font-bold">{format(d, "d")}</span>
              <span className="uppercase">{format(d, "EEE", { locale: es })}</span>
              <span className={cn("font-semibold", active ? "text-primary-foreground" : dayLogs > 0 ? "text-green-600" : "text-muted-foreground")}>
                {dayLogs}/7
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isToday ? "default" : "secondary"}>
          {isToday ? `Hoy: ${loggedCount}/7 comidas` : `${loggedCount}/7 comidas registradas`}
        </Badge>
        {isToday && loggedCount < MEALS.length && (
          <Badge variant="outline" className="text-muted-foreground">
            Falta registrar {MEALS.length - loggedCount} comida{MEALS.length - loggedCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {MEALS.map(meal => {
            const row = logFor(meal.id);
            const actual = row?.completed_at ? <HourBadge iso={row.completed_at} /> : null;
            return (
              <Card key={meal.id} className={cn("p-3", row?.completed && "border-green-500/50 bg-green-500/5")}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{meal.name}</p>
                      {row?.completed && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Plan: {meal.time}</span>
                      {actual ? (
                        <span className="flex items-center gap-1 text-green-700 font-medium">
                          <CheckCircle2 className="h-3 w-3" />Comí: {actual}
                        </span>
                      ) : (
                        <span className="text-red-400/80 flex items-center gap-1"><Clock className="h-3 w-3" />Sin registrar</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isToday && !row?.completed && (
                      <Button size="sm" className="h-7 text-[10px]" onClick={() => markEaten(meal.id, meal.time)}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />Comí ahora
                      </Button>
                    )}
                    {row?.photo_url ? (
                      <img src={row.photo_url} alt={meal.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handlePhoto(meal.id)} disabled={uploading}>
                        <Camera className="h-3 w-3 mr-1" />Foto
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}