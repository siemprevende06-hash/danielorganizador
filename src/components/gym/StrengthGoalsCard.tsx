import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Save, Edit3 } from "lucide-react";
import { useStrengthGoals, MAIN_LIFTS, type StrengthGoal } from "@/hooks/useStrengthGoals";
import { toast } from "@/hooks/use-toast";

export const StrengthGoalsCard = () => {
  const { goals, loading, upsertGoal } = useStrengthGoals();
  const [editing, setEditing] = useState<{ key: string; name: string } | null>(null);
  const [cw, setCw] = useState(0); const [cr, setCr] = useState(0);
  const [tw, setTw] = useState(0); const [tr, setTr] = useState(0);

  const open = (lift: { key: string; name: string }) => {
    const existing = goals.find(g => g.exercise_key === lift.key);
    setEditing(lift);
    setCw(existing?.current_weight_kg || 0);
    setCr(existing?.current_reps || 0);
    setTw(existing?.target_weight_kg || 0);
    setTr(existing?.target_reps || 0);
  };

  const save = async () => {
    if (!editing) return;
    await upsertGoal({
      exercise_key: editing.key, exercise_name: editing.name,
      current_weight_kg: cw, current_reps: cr,
      target_weight_kg: tw, target_reps: tr,
    });
    toast({ title: "Objetivo guardado" });
    setEditing(null);
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Cargando...</p></Card>;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Objetivos de Fuerza</h3>
      </div>
      <div className="space-y-2">
        {MAIN_LIFTS.map(lift => {
          const g = goals.find(x => x.exercise_key === lift.key);
          const wpct = g && g.target_weight_kg > 0 ? Math.min(100, Math.round((g.current_weight_kg / g.target_weight_kg) * 100)) : 0;
          return (
            <div key={lift.key} className="p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{lift.name}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => open(lift)}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              {g ? (
                <>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{g.current_weight_kg}kg × {g.current_reps}</span>
                    <span>→ {g.target_weight_kg}kg × {g.target_reps}</span>
                  </div>
                  <Progress value={wpct} className="h-1.5" />
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Sin objetivo. Toca para definir.</p>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={editing !== null} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso actual (kg)</Label><Input type="number" value={cw} onChange={e => setCw(Number(e.target.value))} /></div>
              <div><Label>Reps actuales</Label><Input type="number" value={cr} onChange={e => setCr(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso objetivo (kg)</Label><Input type="number" value={tw} onChange={e => setTw(Number(e.target.value))} /></div>
              <div><Label>Reps objetivo</Label><Input type="number" value={tr} onChange={e => setTr(Number(e.target.value))} /></div>
            </div>
            <Button onClick={save} className="w-full gap-2"><Save className="h-4 w-4" /> Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
