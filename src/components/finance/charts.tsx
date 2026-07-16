import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

const COLORS = ["#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#BF5AF2", "#64D2FF", "#FFD60A"];

interface MonthlySummaryData { month: string; income: number; expense: number }
interface CategoryData { name: string; value: number; [key: string]: string | number | undefined }
interface WalletDistData { name: string; value: number }

const formatCurrency = (v: number) =>
  v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg shadow-black/5 text-xs">
      <p className="font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-zinc-500 dark:text-zinc-400">{entry.name}:</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(Number(entry.value))} CUP</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg shadow-black/5 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{d.name}</span>
      </div>
      <p className="text-zinc-500 mt-0.5">{formatCurrency(d.value)} CUP</p>
    </div>
  );
};

const TrendIndicator = ({ value }: { value: number }) => {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />;
};

const EmptyChart = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[260px] text-zinc-400 dark:text-zinc-500 gap-2">
    <Activity className="h-8 w-8" />
    <span className="text-sm">{message}</span>
  </div>
);

export const MonthlySummaryChart = ({ data }: { data: MonthlySummaryData[] }) => {
  if (data.length === 0) return <EmptyChart message="Sin datos en los últimos 6 meses" />;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#30D158]" />
          Ingresos
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FF453A]" />
          Gastos
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
          <Bar dataKey="income" name="Ingresos" fill="#30D158" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Gastos" fill="#FF453A" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategorySpendChart = ({ data }: { data: CategoryData[] }) => {
  if (data.length === 0) return <EmptyChart message="Sin gastos este mes" />;

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={86}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(total)}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Total</p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-1.5 mt-2">
        {data.map((entry, index) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WalletDistributionChart = ({ data }: { data: WalletDistData[] }) => {
  if (data.length === 0) return <EmptyChart message="Sin billeteras" />;

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-1.5 mt-2">
        {data.map((entry, index) => {
          const pct = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CashFlowTrendChart = ({ data }: { data: { month: string; balance: number }[] }) => {
  if (data.length === 0) return <EmptyChart message="Sin datos suficientes" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0A84FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="balance" name="Balance" stroke="#0A84FF" fill="url(#cashflowGrad)" strokeWidth={2.5} dot={{ fill: "#0A84FF", r: 3, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, fill: "#0A84FF", strokeWidth: 2, stroke: "#fff" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const DistributionBagChart = ({ data }: { data: { name: string; percentage: number; color: string }[] }) => {
  if (data.length === 0) return <EmptyChart message="Sin bolsas de distribución" />;

  const chartData = data.map(d => ({ name: d.name, value: d.percentage }));
  const colorMap: Record<string, string> = {
    rose: "#FF453A", blue: "#0A84FF", amber: "#FF9F0A", green: "#30D158",
    violet: "#BF5AF2", orange: "#FF9F0A",
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorMap[data[index]?.color] || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card) / 0.9)", backdropFilter: "blur(20px)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{data.reduce((s, b) => s + b.percentage, 0)}%</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Distribuido</p>
          </div>
        </div>
      </div>
      <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
        {data.map((entry, index) => {
          const bgColor = colorMap[entry.color] || COLORS[index % COLORS.length];
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: bgColor }} />
              <span className="text-zinc-500 dark:text-zinc-400 truncate">{entry.name}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 ml-auto">{entry.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { TrendIndicator, formatCurrency };
