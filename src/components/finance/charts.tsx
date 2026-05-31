import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LucideIcon } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

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

export const MonthlySummaryChart = ({ data }: { data: MonthlySummaryData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => `${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP`}
        />
        <Legend />
        <Bar dataKey="income" name="Ingresos" fill="#10b981" />
        <Bar dataKey="expense" name="Gastos" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CategorySpendChart = ({ data }: { data: CategoryData[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
