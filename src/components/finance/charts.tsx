import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA", "#FFD60A"];

interface MonthlySummaryData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface WalletDistData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/80 backdrop-blur-lg border border-border/50 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatCurrency(Number(entry.value))} CUP</span>
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
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sin datos en los ├║ltimos 6 meses
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
      <ResponsiveContainer width="100%" height={260}>
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
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sin gastos este mes
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
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
      <div className="w-full space-y-1.5 px-1">
        {data.map((entry, index) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold">{pct}%</span>
              <span className="text-[10px] text-muted-foreground">{formatCurrency(entry.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WalletDistributionChart = ({ data }: { data: WalletDistData[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sin billeteras
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-1.5 px-1">
        {data.map((entry, index) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold">{pct}%</span>
              <span className="text-[10px] text-muted-foreground">{formatCurrency(entry.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CashFlowTrendChart = ({ data }: { data: { month: string; balance: number }[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
        Sin datos suficientes
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="balance" name="Balance" stroke="hsl(var(--primary))" fill="url(#balanceGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const DistributionBagChart = ({ data }: { data: { name: string; percentage: number; color: string }[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Sin bolsas de distribuci├│n
      </div>
    );
  }

  const chartData = data.map(d => ({ name: d.name, value: d.percentage }));
  const colorMap: Record<string, string> = {
    rose: "#e11d48", blue: "#3b82f6", amber: "#f59e0b", green: "#22c55e",
    violet: "#8b5cf6", orange: "#f97316",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorMap[data[index]?.color] || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-1">
        {data.map((entry, index) => {
          const bgColor = colorMap[entry.color] || COLORS[index % COLORS.length];
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: bgColor }} />
              <span className="text-muted-foreground flex-1 truncate">{entry.name}</span>
              <span className="font-semibold">{entry.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { TrendIndicator, formatCurrency };
