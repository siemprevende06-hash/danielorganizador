import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { Zap, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MINI_HABITS_KEY = "miniHabits";

interface MiniHabitDef {
  id: string;
  label: string;
  emoji: string;
}

const DEFAULT_MINI_HABITS: MiniHabitDef[] = [
  { id: "mini-nofap", label: "No FAP", emoji: "🚫" },
  { id: "mini-nosocial", label: "No Redes Sociales +30min", emoji: "📵" },
];

const todayKey = () => new Date().toISOString().split("T")[0];

function loadDefs(): MiniHabitDef[] {
  try {
    const raw = localStorage.getItem(MINI_HABITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(MINI_HABITS_KEY, JSON.stringify(DEFAULT_MINI_HABITS));
  return DEFAULT_MINI_HABITS;
}

export function MiniHabitsSection() {
  const [defs, setDefs] = useState<MiniHabitDef[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDefs(loadDefs());
    (async () => {
      const today = todayKey();
      let row: any = null;
      try {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .select("id, completions")
          .eq("tracking_date", today)
          .maybeSingle();
        row = data;
        if (row) await setCache("daily_systems_tracking", `mini_${today}`, row);
      } catch {
        row = await getCached<any>("daily_systems_tracking", `mini_${today}`);
      }
      if (row) {
        setRecordId(row.id);
        setCompletions((row.completions as Record<string, boolean>) || {});
      }
      setLoading(false);
    })();
  }, []);

  const toggle = async (id: string) => {
    const next = { ...completions, [id]: !completions[id] };
    setCompletions(next);
    const payload = { completions: next, tracking_date: todayKey() };
    if (recordId) {
      await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
    } else {
      const { queued } = await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
      if (!queued) {
        const { data } = await supabase
          .from("daily_systems_tracking")
          .upsert(payload, { onConflict: "tracking_date" })
          .select("id")
          .single();
        if (data) setRecordId(data.id);
      }
    }
  };

  if (loading) return null;

  const done = defs.filter(d => completions[d.id]).length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-yellow-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide">Mini Hábitos</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">{done}/{defs.length}</span>
      </div>
      <Progress value={defs.length > 0 ? (done / defs.length) * 100 : 0} className="h-1.5 mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {defs.map(d => {
          const isDone = !!completions[d.id];
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={cn(
                "flex items-center gap-2 text-left py-2.5 px-3 rounded-lg transition-all ring-1",
                isDone
                  ? "bg-green-500/10 ring-green-500/50 text-green-600 font-medium"
                  : "bg-muted/40 ring-muted/30 text-muted-foreground hover:bg-muted/60"
              )}
            >
              <span className="text-lg">{d.emoji}</span>
              <span className="text-xs flex-1">{d.label}</span>
              {isDone && <span className="text-sm">✓</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
