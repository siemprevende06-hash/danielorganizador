import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

const SYSTEM_NAMES: Record<string, string> = {
  "rutina-activacion": "Activación",
  "alistamiento-desayuno": "Alistamiento",
  "rutina-desactivacion": "Desactivación",
  "entrenamiento-fisico": "Gym",
  "lectura": "Lectura",
  "musica": "Música",
  "ajedrez": "Ajedrez",
  "skincare-manana": "Skincare AM",
  "skincare-noche": "Skincare PM",
  "banarme-vestirme": "Baño/Vestirme",
};

interface Props {
  weekStart: Date;
}

export function WeeklySystemsStats({ weekStart }: Props) {
  const [data, setData] = useState<any[]>([]);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const load = async () => {
      const { data: rows } = await supabase
        .from("daily_systems_tracking")
        .select("tracking_date, completions, block_completions")
        .gte("tracking_date", format(weekStart, "yyyy-MM-dd"))
        .lte("tracking_date", format(weekEnd, "yyyy-MM-dd"))
        .order("tracking_date");
      setData(rows || []);
    };
    load();
  }, [weekStart.toISOString()]);

  const habitIds = Object.keys(SYSTEM_NAMES);

  return (
    <Card className="p-4">
      <h3 className="font-bold text-sm mb-3">📊 Sistemas de Vida — Semana</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1 pr-2">Sistema</th>
              {days.map(d => (
                <th key={d.toISOString()} className="text-center px-1 py-1">
                  {format(d, "EEE", { locale: es }).slice(0, 2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitIds.map(hid => (
              <tr key={hid} className="border-t border-border/30">
                <td className="py-1 pr-2 text-muted-foreground whitespace-nowrap">{SYSTEM_NAMES[hid]}</td>
                {days.map(d => {
                  const dayStr = format(d, "yyyy-MM-dd");
                  const row = data.find(r => r.tracking_date === dayStr);
                  const completions = (row?.completions || {}) as Record<string, boolean>;
                  const done = !!completions[hid];
                  return (
                    <td key={d.toISOString()} className="text-center px-1 py-1">
                      {row ? (
                        done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400/50 mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
