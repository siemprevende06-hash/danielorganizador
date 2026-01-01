import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Music, BookOpen, Languages, CheckCircle2, XCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface PersonalDevelopmentSectionProps {
  stats: LifeStats;
}

const getIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('guitarra') || lowerName.includes('piano')) return Music;
  if (lowerName.includes('lectura') || lowerName.includes('libro')) return BookOpen;
  if (lowerName.includes('italiano') || lowerName.includes('inglés') || lowerName.includes('idioma')) return Languages;
  return Brain;
};

// Mock data for trend chart
const generateTrendData = () => {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      piano: Math.floor(Math.random() * 3) + 3,
      guitarra: Math.floor(Math.random() * 2) + 1,
      lectura: Math.floor(Math.random() * 2) + 2,
      idiomas: Math.floor(Math.random() * 2) + 1,
    });
  }
  return data;
};

export const PersonalDevelopmentSection = ({ stats }: PersonalDevelopmentSectionProps) => {
  const trendData = generateTrendData();

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-teal-500/10">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-green-500" />
          Desarrollo Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.personalDevelopment.map((skill, index) => {
            const Icon = getIcon(skill.name);
            return (
              <div key={index} className="p-4 rounded-lg border bg-card text-center">
                <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h4 className="font-medium text-sm mb-2">{skill.name}</h4>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">General</p>
                    <p className="text-lg font-bold">{skill.generalScore}/10</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1">
                    {skill.completedToday ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs">Hoy</span>
                  </div>
                  
                  {skill.streak > 0 && (
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <Flame className="h-3 w-3" />
                      <span className="text-xs font-medium">{skill.streak}</span>
                    </div>
                  )}
                  
                  <Progress value={skill.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground">{skill.progress}%</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend Chart */}
        <div className="pt-6 border-t">
          <h4 className="font-medium mb-4">📊 Tendencia (últimos 30 días)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="piano" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Piano"
                />
                <Line 
                  type="monotone" 
                  dataKey="guitarra" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={false}
                  name="Guitarra"
                />
                <Line 
                  type="monotone" 
                  dataKey="lectura" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                  name="Lectura"
                />
                <Line 
                  type="monotone" 
                  dataKey="idiomas" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  dot={false}
                  name="Idiomas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
