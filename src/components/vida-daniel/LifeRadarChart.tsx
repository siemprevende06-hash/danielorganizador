import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Radar as RadarIcon } from 'lucide-react';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface LifeRadarChartProps {
  stats: LifeStats;
}

export const LifeRadarChart = ({ stats }: LifeRadarChartProps) => {
  // Calculate scores for each life area
  const habitScore = stats.habits.length > 0 
    ? Math.round(stats.habits.reduce((acc, h) => acc + h.monthlyCompletion, 0) / stats.habits.length / 10)
    : 5;

  const entScore = stats.entrepreneurship.length > 0
    ? Math.round(stats.entrepreneurship.reduce((acc, e) => acc + e.generalScore, 0) / stats.entrepreneurship.length)
    : 5;

  const devScore = stats.personalDevelopment.length > 0
    ? Math.round(stats.personalDevelopment.reduce((acc, p) => acc + p.generalScore, 0) / stats.personalDevelopment.length)
    : 5;

  const routineScore = Math.round(
    ((stats.routines.activation.monthlyCompletion + stats.routines.deactivation.monthlyCompletion) / 2) / 10
  );

  const data = [
    { area: 'Universidad', value: stats.university.generalScore, fullMark: 10 },
    { area: 'Emprendimiento', value: entScore, fullMark: 10 },
    { area: 'Hábitos', value: habitScore, fullMark: 10 },
    { area: 'Desarrollo Personal', value: devScore, fullMark: 10 },
    { area: 'Apariencia', value: stats.appearance.generalScore, fullMark: 10 },
    { area: 'Rutinas', value: routineScore, fullMark: 10 },
    { area: 'Proyectos', value: stats.projects.generalScore, fullMark: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadarIcon className="h-5 w-5 text-primary" />
          Mapa de Vida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
              <PolarAngleAxis 
                dataKey="area" 
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              />
              <PolarRadiusAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="Puntuación Actual"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-sm truncate">{item.area}</span>
              <span className={`text-sm font-bold ${
                item.value >= 7 ? 'text-green-500' : 
                item.value >= 5 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {item.value}/10
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
