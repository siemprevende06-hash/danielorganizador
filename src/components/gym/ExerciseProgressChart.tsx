import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExerciseHistoryPoint } from "@/hooks/useWorkoutTracking";

interface Props {
  points: ExerciseHistoryPoint[];
  showWeight?: boolean;
  showReps?: boolean;
}

export const ExerciseProgressChart = ({ points, showWeight = true, showReps = true }: Props) => {
  if (points.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-2">Sin datos para graficar</p>;
  }
  const data = points.map(p => ({ ...p, label: p.date.slice(5) }));
  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={{ fontSize: 11 }} labelFormatter={(l) => `Fecha: ${l}`} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {showWeight && <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} />}
          <Line type="monotone" dataKey="e1rm" name="1RM est." stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5 }} />
          {showReps && <Line type="monotone" dataKey="reps" name="Reps" stroke="#22c55e" strokeWidth={1.5} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
