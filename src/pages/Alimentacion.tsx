import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Camera, Utensils, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";

const MEALS = [
  { id: "pre-entreno", name: "Pre-entreno", time: "5:30 AM" },
  { id: "desayuno", name: "Desayuno", time: "8:00 AM" },
  { id: "merienda-1", name: "Merienda 1", time: "10:30 AM" },
  { id: "almuerzo", name: "Almuerzo", time: "1:20 PM" },
  { id: "merienda-2", name: "Merienda 2", time: "4:00 PM" },
  { id: "comida", name: "Comida", time: "7:00 PM" },
  { id: "antes-dormir", name: "Antes de Dormir", time: "8:40 PM" },
];

interface DayEntry {
  tracking_date: string;
  meal_photos: Record<string, string>;
  water_data: Record<string, boolean>;
  completions: Record<string, boolean>;
}

export default function Alimentacion() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { uploadImage, uploading } = useImageUpload();

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    const start = format(subDays(selectedDate, 30), "yyyy-MM-dd");
    const { data } = await supabase
      .from("daily_systems_tracking")
      .select("tracking_date, meal_photos, water_data, completions")
      .gte("tracking_date", start)
      .lte("tracking_date", dateStr)
      .order("tracking_date", { ascending: false });
    setEntries((data as DayEntry[] | null) || []);
    setLoading(false);
  };

  const todayEntry = entries.find(e => e.tracking_date === dateStr);
  const mealPhotos = (todayEntry?.meal_photos || {}) as Record<string, string>;
  const waterData = (todayEntry?.water_data || {}) as Record<string, boolean>;

  const handlePhotoUpload = async (mealId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = await uploadImage(file);
      if (!url) return;

      const newPhotos = { ...mealPhotos, [mealId]: url };
      await supabase
        .from("daily_systems_tracking")
        .upsert({ tracking_date: dateStr, meal_photos: newPhotos }, { onConflict: "tracking_date" });
      loadData();
    };
    input.click();
  };

  const waterCount = Object.values(waterData).filter(Boolean).length;

  // Weekly gallery
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10">
              <Utensils className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Alimentación
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Registro fotográfico de comidas e hidratación</p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold capitalize">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => new Date(d.getTime() + 86400000))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Water summary */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Hidratación</span>
            <Badge variant="secondary">{waterCount}/7 vasos</Badge>
          </div>
        </Card>

        <Tabs defaultValue="today">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-4">
            {MEALS.map(meal => {
              const photo = mealPhotos[meal.id];
              return (
                <Card key={meal.id} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">{meal.time}</p>
                    </div>
                    {photo ? (
                      <img src={photo} alt={meal.name} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePhotoUpload(meal.id)}
                        disabled={uploading}
                        className="gap-1"
                      >
                        <Camera className="h-3 w-3" />
                        Foto
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <div className="space-y-4">
              {weekDays.map(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                const entry = entries.find(e => e.tracking_date === dayStr);
                const photos = (entry?.meal_photos || {}) as Record<string, string>;
                const photoList = Object.entries(photos).filter(([, v]) => v);
                return (
                  <Card key={dayStr} className="p-4">
                    <p className="text-sm font-semibold capitalize mb-2">
                      {format(day, "EEEE d", { locale: es })}
                    </p>
                    {photoList.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {photoList.map(([mealId, url]) => (
                          <div key={mealId} className="shrink-0">
                            <img src={url} alt={mealId} className="h-16 w-16 rounded-lg object-cover" />
                            <p className="text-[10px] text-center text-muted-foreground mt-1">
                              {MEALS.find(m => m.id === mealId)?.name || mealId}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin fotos registradas</p>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
