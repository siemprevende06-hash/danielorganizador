import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, addWeeks, addMonths, addQuarters, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type TrendScope = "day" | "week" | "month" | "quarter";

const SCOPE_OPTIONS: { id: TrendScope; label: string }[] = [
  { id: "day", label: "Diario" },
  { id: "week", label: "Semanal" },
  { id: "month", label: "Mensual" },
  { id: "quarter", label: "Trimestral" },
];

interface SessionRow {
  practice_date: string;
  duration_minutes: number;
}

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export function MusicTrendChart() {
  const [scope, setScope] = useState<TrendScope>("day");
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("music_practice_sessions")
          .select("practice_date, duration_minutes")
          .gte("practice_date", dateKey(subDays(new Date(), 750)));
        if (alive && data) setRows(data as SessionRow[]);
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const byDay = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach(r => { m[r.practice_date] = (m[r.practice_date] || 0) + (r.duration_minutes || 0); });
    return m;
  }, [rows]);

  const total = useMemo(() => Object.values(byDay).reduce((s, v) => s + v, 0), [byDay]);

  const data = useMemo(() => {
    const today = new Date();
    const out: { label: string; minutes: number }[] = [];

    if (scope === "day") {
      for (let i = 13; i >= 0; i--) {
        const d = subDays(today, i);
        out.push({ label: format(d, "d MMM", { locale: es }), minutes: byDay[dateKey(d)] || 0 });
      }
      return out;
    }

    if (scope === "week") {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      for (let i = 11; i >= 0; i--) {
        const ws = addWeeks(start, -i);
        let minutes = 0;
        for (let d = 0; d < 7; d++) minutes += byDay[dateKey(addDays(ws, d))] || 0;
        out.push({ label: format(ws, "d MMM", { locale: es }), minutes });
      }
      return out;
    }

    if (scope === "month") {
      const start = startOfMonth(today);
      for (let i = 11; i >= 0; i--) {
        const ms = addMonths(start, -i);
        const me = addMonths(ms, 1);
        let minutes = 0;
        for (let d = ms; d < me; d = addDays(d, 1)) minutes += byDay[dateKey(d)] || 0;
        out.push({ label: format(ms, "MMM yy", { locale: es }), minutes });
      }
      return out;
    }

    const start = startOfQuarter(today);
    for (let i = 7; i >= 0; i--) {
      const qs = addQuarters(start, -i);
      const qe = addQuarters(qs, 1);
      let minutes = 0;
      for (let d = qs; d < qe; d = addDays(d, 1)) minutes += byDay[dateKey(d)] || 0;
      out.push({ label: `Q${Math.floor(qs.getMonth() / 3) + 1} ${format(qs, "yy")}`, minutes });
    }
    return out;
  }, [scope, byDay]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" /> Tendencia de práctica
        </span>
        <div className="flex rounded-lg border bg-muted/40 p-0.5">
          {SCOPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setScope(opt.id)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors",
                scope === opt.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {total === 0 && !loading ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Aún no hay práctica registrada para mostrar la tendencia
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={scope === "day" ? 1 : 0} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value: any) => [`${value} min`, "Práctica"]}
            />
            <Bar dataKey="minutes" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}