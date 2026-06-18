import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Camera, Utensils, Droplets, Flame, Beef, Wheat, Apple, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useNutritionAI } from "@/hooks/useNutritionAI";
import { RecipeManager } from "@/components/alimentacion/RecipeManager";
import { WeeklyMealPlan } from "@/components/alimentacion/WeeklyMealPlan";

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

function MacroProgressBar({ label, current, goal, icon, color }: { label: string; current: number; goal: number; icon: React.ReactNode; color: string }) {
  const pct = Math.min(Math.round((current / goal) * 100), 100);
  const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : color;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground">{icon} {label}</span>
        <span className="font-medium">{current}/{goal}<span className="text-muted-foreground ml-0.5">{label === "Calorías" ? "" : "g"}</span></span>
      </div>
      <Progress value={pct} className="h-1.5" indicatorClassName={barColor} />
    </div>
  );
}

export default function Alimentacion() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { uploadImage, uploading } = useImageUpload();
  const nutritionAI = useNutritionAI();
  const [foodInputs, setFoodInputs] = useState<Record<string, string>>({});

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadData();
    if (isToday) {
      nutritionAI.fetchTodayMeals();
    }
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

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayTotals = isToday ? nutritionAI.getTodayTotals() : { calories: 0, protein: 0, carbs: 0, fat: 0 };

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
          <p className="text-sm text-muted-foreground">Registro fotográfico y macros</p>
        </div>

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

        {/* Macro Summary Card — like MyFitnessPal */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-bold">Resumen Diario</span>
            </div>
            <span className={cn("text-xl font-bold", todayTotals.calories > nutritionAI.DAILY_GOALS.calories ? "text-red-500" : "text-foreground")}>
              {todayTotals.calories}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ {nutritionAI.DAILY_GOALS.calories}</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <MacroProgressBar label="Calorías" current={todayTotals.calories} goal={nutritionAI.DAILY_GOALS.calories} icon={<Flame className="h-3 w-3 text-orange-500" />} color="bg-orange-500" />
            <div className="grid grid-cols-3 gap-3">
              <MacroProgressBar label="Proteína" current={todayTotals.protein} goal={nutritionAI.DAILY_GOALS.protein} icon={<Beef className="h-3 w-3 text-red-400" />} color="bg-red-400" />
              <MacroProgressBar label="Carbos" current={todayTotals.carbs} goal={nutritionAI.DAILY_GOALS.carbs} icon={<Wheat className="h-3 w-3 text-amber-400" />} color="bg-amber-400" />
              <MacroProgressBar label="Grasa" current={todayTotals.fat} goal={nutritionAI.DAILY_GOALS.fat} icon={<Apple className="h-3 w-3 text-green-400" />} color="bg-green-400" />
            </div>
          </div>
        </Card>

        {/* Water summary */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Hidratación</span>
            <Badge variant="secondary">{waterCount}/7 vasos</Badge>
          </div>
        </Card>

        <Tabs defaultValue="today">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="recipes">Recetas</TabsTrigger>
            <TabsTrigger value="plan">Planificar</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-4">
            {MEALS.map(meal => {
              const photo = mealPhotos[meal.id];
              const mealFoods = isToday ? nutritionAI.todayMeals.filter(m => m.description?.toLowerCase().includes(meal.name.toLowerCase())) : [];
              const mealCals = mealFoods.reduce((s, m) => s + (m.estimated_calories || 0), 0);
              const mealProtein = mealFoods.reduce((s, m) => s + (m.protein_grams || 0), 0);
              const mealCarbs = mealFoods.reduce((s, m) => s + (m.carbs_grams || 0), 0);
              const mealFat = mealFoods.reduce((s, m) => s + (m.fat_grams || 0), 0);
              return (
                <Card key={meal.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">{meal.time}</p>
                        {mealFoods.length > 0 && (
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {mealFoods.map(f => (
                              <Badge key={f.id} variant="secondary" className="text-[10px] gap-1">
                                {f.description} ~{f.estimated_calories} kcal
                                <button onClick={() => nutritionAI.deleteMeal(f.id)} className="hover:text-destructive ml-0.5"><Trash2 className="h-2.5 w-2.5" /></button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(mealCals > 0) && (
                          <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            <span>{Math.round(mealCals)} kcal</span>
                            <span>P: {Math.round(mealProtein)}g</span>
                            <span>C: {Math.round(mealCarbs)}g</span>
                            <span>G: {Math.round(mealFat)}g</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isToday && (
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Input
                                placeholder="¿Qué comiste?"
                                value={foodInputs[meal.id] || ""}
                                onChange={e => setFoodInputs(p => ({ ...p, [meal.id]: e.target.value }))}
                                className="h-7 w-28 text-[10px]"
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter" && foodInputs[meal.id]) {
                                    await nutritionAI.analyzeFood(foodInputs[meal.id]);
                                    setFoodInputs(p => ({ ...p, [meal.id]: "" }));
                                  }
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={nutritionAI.loading || !foodInputs[meal.id]}
                                onClick={async () => {
                                  if (foodInputs[meal.id]) {
                                    await nutritionAI.analyzeFood(foodInputs[meal.id]);
                                    setFoodInputs(p => ({ ...p, [meal.id]: "" }));
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {photo ? (
                          <img src={photo} alt={meal.name} className="h-14 w-14 rounded-lg object-cover" />
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handlePhotoUpload(meal.id)} disabled={uploading} className="gap-1 h-7 text-[10px]">
                            <Camera className="h-3 w-3" />Foto
                          </Button>
                        )}
                      </div>
                    </div>
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
                    <p className="text-sm font-semibold capitalize mb-2">{format(day, "EEEE d", { locale: es })}</p>
                    {photoList.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {photoList.map(([mealId, url]) => (
                          <div key={mealId} className="shrink-0">
                            <img src={url} alt={mealId} className="h-16 w-16 rounded-lg object-cover" />
                            <p className="text-[10px] text-center text-muted-foreground mt-1">{MEALS.find(m => m.id === mealId)?.name || mealId}</p>
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

          <TabsContent value="recipes" className="mt-4">
            <RecipeManager />
          </TabsContent>

          <TabsContent value="plan" className="mt-4">
            <WeeklyMealPlan />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
