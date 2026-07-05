import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA", "#FFD60A"];

interface MonthlySummaryData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  value: number;
  icon?: LucideIcon;
  [key: string]: string | number | LucideIcon | undefined;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/80 backdrop-blur-lg border border-border/50 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {Number(entry.value).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP
          </span>
        </div>
      ))}
    </div>
  );
};

const TrendIndicator = ({ value }: { value: number }) => {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

export const MonthlySummaryChart = ({ data }: { data: MonthlySummaryData[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No hay datos de los últimos 6 meses
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#34C759]" />
          Ingresos
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FF3B30]" />
          Gastos
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border) / 0.4)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
          <Legend iconType="rect" iconSize={10} formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
          <Bar dataKey="income" name="Ingresos" fill="#34C759" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Gastos" fill="#FF3B30" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategorySpendChart = ({ data }: { data: CategoryData[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No hay datos para mostrar
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            animationBegin={200}
            animationDuration={600}
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-1.5">
        {data.map((entry, index) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          const IconComponent = entry.icon;
          return (
            <div key={entry.name} className="flex items-center gap-2 px-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-medium">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
