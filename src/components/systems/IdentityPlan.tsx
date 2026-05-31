import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowRight, Edit2, Check } from "lucide-react";

const DEFAULT_AREAS = [
  { area_id: "universidad", area_label: "Universidad", icon: "🎓", color: "#3b82f6" },
  { area_id: "emprendimiento", area_label: "Emprendimiento", icon: "💼", color: "#8b5cf6" },
  { area_id: "proyectos", area_label: "Proyectos", icon: "💻", color: "#06b6d4" },
  { area_id: "piano", area_label: "Piano", icon: "🎹", color: "#ec4899" },
  { area_id: "guitarra", area_label: "Guitarra", icon: "🎸", color: "#f97316" },
  { area_id: "lectura", area_label: "Lectura", icon: "📖", color: "#14b8a6" },
  { area_id: "ajedrez", area_label: "Ajedrez", icon: "♟️", color: "#6366f1" },
  { area_id: "apariencia", area_label: "Apariencia", icon: "✨", color: "#f472b6" },
  { area_id: "gym", area_label: "Gym", icon: "💪", color: "#ef4444" },
  { area_id: "finanzas", area_label: "Finanzas", icon: "💰", color: "#22c55e" },
  { area_id: "idiomas", area_label: "Idiomas", icon: "🌐", color: "#10b981" },
];

interface IdentityItem {
  id: string;
  area_id: string;
  area_label: string;
  point_a: string;
  point_b: string;
  progress_percentage: number;
  icon: string;
  color: string;
}

export function IdentityPlan() {
  const [items, setItems] = useState<IdentityItem[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from("identity_plan").select("*").order("created_at");
    if (data && data.length > 0) {
      setItems(data as IdentityItem[]);
    } else {
      // Seed defaults
      const seeds = DEFAULT_AREAS.map(a => ({
        ...a,
        point_a: "",
        point_b: "",
        progress_percentage: 0,
      }));
      const { data: inserted } = await supabase
        .from("identity_plan")
        .upsert(seeds, { onConflict: "area_id" })
        .select("*");
      setItems((inserted as IdentityItem[]) || []);
    }
    setLoading(false);
  };

  const updateItem = async (id: string, updates: Partial<IdentityItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from("identity_plan").update(updates).eq("id", id);
  };

  if (loading) return null;

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-lg font-bold mb-1">🪞 Plan Identidad</h3>
      <p className="text-xs text-muted-foreground mb-4">Define tu Punto A → Punto B en cada área de vida</p>

      <div className="space-y-4">
        {items.map(item => {
          const isEditing = editing === item.id;
          return (
            <div key={item.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: item.color + "40" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="font-semibold text-sm flex-1">{item.area_label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditing(isEditing ? null : item.id)}
                >
                  {isEditing ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                </Button>
              </div>

              {/* Point A → B */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2 min-h-[2.5rem]">
                  <p className="text-[10px] text-red-500 font-semibold mb-0.5">PUNTO A</p>
                  {isEditing ? (
                    <Input
                      value={item.point_a}
                      onChange={e => updateItem(item.id, { point_a: e.target.value })}
                      className="h-6 text-xs border-0 p-0 bg-transparent"
                      placeholder="¿Dónde estoy?"
                    />
                  ) : (
                    <p className="text-muted-foreground">{item.point_a || "Sin definir"}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-2 min-h-[2.5rem]">
                  <p className="text-[10px] text-green-500 font-semibold mb-0.5">PUNTO B</p>
                  {isEditing ? (
                    <Input
                      value={item.point_b}
                      onChange={e => updateItem(item.id, { point_b: e.target.value })}
                      className="h-6 text-xs border-0 p-0 bg-transparent"
                      placeholder="¿A dónde voy?"
                    />
                  ) : (
                    <p className="text-muted-foreground">{item.point_b || "Sin definir"}</p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.progress_percentage}%</span>
                </div>
                {isEditing ? (
                  <Slider
                    value={[item.progress_percentage]}
                    max={100}
                    step={5}
                    onValueChange={([v]) => updateItem(item.id, { progress_percentage: v })}
                    className="py-1"
                  />
                ) : (
                  <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${item.progress_percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
