import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function MusicStatsTab({
  pieData,
  difficultyData,
  getStats,
}: {
  pieData: { name: string; value: number; color: string }[];
  difficultyData: { name: string; piano: number; guitar: number }[];
  getStats: (instrument?: 'piano' | 'guitar') => {
    total: number;
    mastered: number;
    learning: number;
    byDifficulty: { beginner: number; intermediate: number; advanced: number };
  };
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Por Dificultad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={difficultyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="piano" name="Piano" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="guitar" name="Guitarra" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['piano', 'guitar'] as const).map(inst => {
          const s = getStats(inst);
          const masteredPct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
          return (
            <Card key={inst}>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold mb-1">{inst === 'piano' ? '🎹 Piano' : '🎸 Guitarra'}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dominio</span>
                    <span>{masteredPct}%</span>
                  </div>
                  <Progress value={masteredPct} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                    <div>
                      <p className="font-bold text-base sm:text-lg">{s.total}</p>
                      Total
                    </div>
                    <div>
                      <p className="font-bold text-base sm:text-lg text-success">{s.mastered}</p>
                      Dominadas
                    </div>
                    <div>
                      <p className="font-bold text-base sm:text-lg text-warning">{s.learning}</p>
                      Aprendiendo
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
