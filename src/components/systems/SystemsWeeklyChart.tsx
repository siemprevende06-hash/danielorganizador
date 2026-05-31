import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const SYSTEM_IDS = [
  { id: "estructural", label: "Estructural", color: "#3b82f6", habitIds: ["rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion"] },
  { id: "fisica", label: "Física", color: "#f97316", habitIds: ["entrenamiento-fisico"] },
  { id: "hobbys", label: "Hobbys", color: "#a855f7", habitIds: ["lectura", "musica", "ajedrez"] },
  { id: "apariencia", label: "Apariencia", color: "#ec4899", habitIds: ["skincare-manana", "skincare-noche", "banarme-vestirme"] },
  { id: "alimentacion", label: "Alimentación", color: "#f59e0b", habitIds: ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"] },
];

const TOTAL_HABITS = SYSTEM_IDS.reduce((a, s) => a + s.habitIds.length, 0);

interface HistoryRow {
  tracking_date: string;
  completions: Record<string, boolean>;
  time_data: Record<string, number>;
  water_data: Record<string, boolean>;
  block_completions: Record<string, boolean>;
  workout_duration: number;
}

export function SystemsWeeklyChart() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [period, setPeriod] = useState("7");

  useEffect(() => {
    const load = async () => {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split("T")[0];

      const { data: rows } = await supabase
        .from("daily_systems_tracking")
        .select("tracking_date, completions, time_data, water_data, block_completions, workout_duration")
        .gte("tracking_date", startStr)
        .order("tracking_date", { ascending: true });

      setHistory((rows as HistoryRow[] | null) || []);
    };
    load();
  }, [period]);

  // Build daily completion data
  const dailyData = history.map(row => {
    const completions = (row.completions || {}) as Record<string, boolean>;
    const completed = Object.values(completions).filter(Boolean).length;
    const percent = TOTAL_HABITS > 0 ? Math.round((completed / TOTAL_HABITS) * 100) : 0;
    const day = new Date(row.tracking_date + "T12:00:00");
    const label = day.toLocaleDateString("es", { weekday: "short", day: "numeric" });
    const waterCount = Object.values((row.water_data || {}) as Record<string, boolean>).filter(Boolean).length;
    const blocksCompleted = Object.values((row.block_completions || {}) as Record<string, boolean>).filter(Boolean).length;

    return {
      date: label,
      completion: percent,
      habits: completed,
      water: waterCount * 300,
      blocks: blocksCompleted,
      workout: row.workout_duration || 0,
    };
  });

  // Build system breakdown for pie chart (today or average)
  const latestRow = history[history.length - 1];
  const pieData = SYSTEM_IDS.map(sys => {
    if (!latestRow) return { name: sys.label, value: 0, color: sys.color };
    const completions = (latestRow.completions || {}) as Record<string, boolean>;
    const completed = sys.habitIds.filter(id => completions[id]).length;
    return { name: sys.label, value: completed, color: sys.color };
  }).filter(d => d.value > 0);

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📊 Estadísticas de Sistemas</h3>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-8">
            <TabsTrigger value="7" className="text-xs px-2 h-6">7D</TabsTrigger>
            <TabsTrigger value="14" className="text-xs px-2 h-6">14D</TabsTrigger>
            <TabsTrigger value="30" className="text-xs px-2 h-6">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {dailyData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay datos aún. Completa tu día para ver estadísticas.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Completion trend */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Completamiento Diario (%)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Habits & Blocks bar chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Hábitos vs Bloques</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="habits" fill="#22c55e" radius={[4, 4, 0, 0]} name="Hábitos" />
                <Bar dataKey="blocks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bloques" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Water & Workout */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Agua (ml) y Ejercicio (min)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Agua (ml)" />
                <Bar dataKey="workout" fill="#f97316" radius={[4, 4, 0, 0]} name="Ejercicio (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* System breakdown pie */}
          {pieData.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Distribución por Sistema (Último Día)</h4>
              <div className="flex items-center justify-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
