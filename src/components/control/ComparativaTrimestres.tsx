import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { useResultadosPeriodo, AREA_ORDER, EMPTY_RESULTADO, type ResultadoPeriodo } from '@/hooks/useResultadosPeriodo';

function quarterRange(quarter: number, year: number) {
  return {
    start: new Date(year, (quarter - 1) * 3, 1),
    end: new Date(year, quarter * 3, 0),
  };
}

function prevQuarter(quarter: number, year: number, offset: number): { quarter: number; year: number } {
  let q = quarter - offset;
  let y = year;
  while (q < 1) { q += 4; y -= 1; }
  return { quarter: q, year: y };
}

function rangeLabel(quarter: number, year: number): string {
  const start = new Date(year, (quarter - 1) * 3, 1);
  return `Q${quarter} ${year}`;
}

export function ComparativaTrimestres({ quarter, year }: { quarter: number; year: number }) {
  const r0 = useResultadosPeriodo(quarterRange(quarter, year).start, quarterRange(quarter, year).end);
  const p1 = prevQuarter(quarter, year, 1);
  const r1 = useResultadosPeriodo(quarterRange(p1.quarter, p1.year).start, quarterRange(p1.quarter, p1.year).end);
  const p2 = prevQuarter(quarter, year, 2);
  const r2 = useResultadosPeriodo(quarterRange(p2.quarter, p2.year).start, quarterRange(p2.quarter, p2.year).end);
  const p3 = prevQuarter(quarter, year, 3);
  const r3 = useResultadosPeriodo(quarterRange(p3.quarter, p3.year).start, quarterRange(p3.quarter, p3.year).end);

  const gather = (r: { data: ResultadoPeriodo | undefined }, q: number, y: number) => {
    const d = r.data || EMPTY_RESULTADO;
    const minutes = AREA_ORDER.reduce((s, k) => s + (d.byArea?.[k]?.minutes || 0), 0);
    const taskPct = d.globalTotal > 0 ? Math.round((d.globalDone / d.globalTotal) * 100) : null;
    return {
      label: rangeLabel(q, y),
      score: d.score || 0,
      tareas: taskPct ?? 0,
      minutos: minutes,
    };
  };

  const chartData = [
    gather(r3, p3.quarter, p3.year),
    gather(r2, p2.quarter, p2.year),
    gather(r1, p1.quarter, p1.year),
    gather(r0, quarter, year),
  ];
  const maxMin = Math.max(...chartData.map(d => d.minutos), 1);
  const current = chartData[3];
  const avgScore = Math.round(chartData.slice(0, 3).reduce((s, d) => s + d.score, 0) / 3);

  const hasData = chartData.some(d => d.score > 0 || d.minutos > 0);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold">Comparativa vs trimestres anteriores</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <Badge variant="outline" className="text-current">Score actual <b>{current.score}</b></Badge>
            <Badge variant="outline" className="text-current">Prom. previos <b>{avgScore}</b></Badge>
          </div>
        </div>

        {!hasData ? (
          <p className="text-xs text-muted-foreground text-center py-8 rounded-xl border border-dashed border-border/60">
            Sin datos en los últimos 4 trimestres. Registra actividad para ver la tendencia.
          </p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                <YAxis yAxisId="min" orientation="right" domain={[0, maxMin]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number, name: number | string) => [name === 'minutos' ? `${v} min` : `${v}%`, name === 'minutos' ? 'Minutos' : name === 'score' ? 'Score' : '% Tareas']}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine yAxisId="pct" y={100} stroke="rgba(0,0,0,0.15)" strokeDasharray="4 4" />
                <Line yAxisId="pct" type="monotone" dataKey="score" name="Score" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line yAxisId="pct" type="monotone" dataKey="tareas" name="Tareas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="min" type="monotone" dataKey="minutos" name="minutos" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {chartData.map(d => (
            <div key={d.label} className="rounded-xl bg-muted/30 p-2 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{d.label}</p>
              <p className="text-sm font-bold tabular-nums text-sky-500">{d.score}</p>
              <p className="text-[9px] text-muted-foreground">{d.minutos} min</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}