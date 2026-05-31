import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LanguageWeeklyDay } from '@/hooks/useLanguageWeeklyStats';
import type { LanguageSettings } from '@/hooks/useLanguageLearning';

export function LanguageStatsTab({
  weeklyData,
  pieData,
  progress,
  settings,
}: {
  weeklyData: LanguageWeeklyDay[];
  pieData: { name: string; value: number; color: string }[];
  progress: { completed: number; total: number; percentage: number };
  settings: LanguageSettings | null;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Actividad Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value} min`, 'Tiempo']} />
              <Bar dataKey="minutes" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Habilidades por día</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value}/5`, 'Habilidades']} />
              <Bar dataKey="skills" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Progreso de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold">{progress.percentage}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {progress.completed} de {progress.total} completadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl mb-1">🇺🇸</p>
            <p className="font-bold text-sm sm:text-base">Inglés</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {settings?.englishLevel || 'intermediate'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl mb-1">🇮🇹</p>
            <p className="font-bold text-sm sm:text-base">Italiano</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {settings?.italianLevel || 'beginner'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
