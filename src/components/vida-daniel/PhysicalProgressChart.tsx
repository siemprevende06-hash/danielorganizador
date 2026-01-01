import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { PhysicalMeasurement } from '@/hooks/usePhysicalTracking';

interface PhysicalProgressChartProps {
  measurements: PhysicalMeasurement[];
  targetWeight: number;
  startWeight: number;
}

export const PhysicalProgressChart = ({ measurements, targetWeight, startWeight }: PhysicalProgressChartProps) => {
  const chartData = useMemo(() => {
    if (measurements.length === 0) return [];
    
    return [...measurements]
      .reverse()
      .slice(-30)
      .map(m => ({
        date: new Date(m.measurement_date).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short' 
        }),
        weight: m.weight,
        fullDate: m.measurement_date
      }));
  }, [measurements]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolución del Peso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Agrega mediciones para ver tu progreso
          </div>
        </CardContent>
      </Card>
    );
  }

  const minWeight = Math.min(...chartData.map(d => d.weight), startWeight) - 2;
  const maxWeight = Math.max(...chartData.map(d => d.weight), targetWeight) + 2;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Evolución del Peso (últimos 30 registros)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                domain={[minWeight, maxWeight]} 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value} kg`, 'Peso']}
              />
              <ReferenceLine 
                y={targetWeight} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Meta: ${targetWeight}kg`, 
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--primary))'
                }}
              />
              <ReferenceLine 
                y={startWeight} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                label={{ 
                  value: `Inicio: ${startWeight}kg`, 
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
