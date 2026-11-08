import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LanguageWeeklyDay } from '@/hooks/useLanguageWeeklyStats';
import type { LanguageSettings } from '@/hooks/useLanguageLearning';
import { normalizeCefr } from '@/lib/languagePlan';
import { cn } from '@/lib/utils';

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
  const totalWeekMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  const activeDays = weeklyData.filter(day => day.minutes > 0 || day.skills > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Minutos esta semana</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalWeekMinutes}</p>
            <p className="text-[11px] text-muted-foreground">en los últimos 7 días</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Días activos</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{activeDays}/7</p>
            <p className="text-[11px] text-muted-foreground">
              {activeDays >= 5 ? 'Constancia excelente' : activeDays >= 3 ? 'Buen ritmo' : 'Aún hay margen'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Actividad semanal</CardTitle>
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
              <YAxis allowDecimals={false} domain={[0, 6]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value}/6`, 'Habilidades']} />
              <Bar dataKey="skills" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Se cuentan las 6 habilidades canónicas: gramática, vocabulario, lectura, listening, speaking y escritura.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Progreso de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-3xl font-bold tabular-nums">{progress.percentage}%</p>
              <p className="text-sm text-muted-foreground">
                {progress.completed} de {progress.total} habilidades completadas
              </p>
              <Badge variant="outline" className="text-[11px]">
                {progress.percentage >= 100 ? 'Día completo 🎉' : 'Sigue así'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            flag: '🇺🇸',
            name: 'Inglés',
            level: normalizeCefr(settings?.englishLevel, 'B1.1'),
            className: 'from-sky-500/10 to-blue-500/5',
          },
          {
            flag: '🇮🇹',
            name: 'Italiano',
            level: normalizeCefr(settings?.italianLevel, 'A1.1'),
            className: 'from-emerald-500/10 to-green-500/5',
          },
        ].map(language => (
          <Card key={language.name} className={cn('overflow-hidden bg-gradient-to-br', language.className)}>
            <CardContent className="p-4 text-center">
              <p className="mb-1 text-2xl">{language.flag}</p>
              <p className="text-sm font-bold">{language.name}</p>
              <Badge variant="outline" className="mt-1 bg-background/60 text-xs">
                {language.level}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
