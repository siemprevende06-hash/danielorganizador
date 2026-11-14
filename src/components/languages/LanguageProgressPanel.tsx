import { useMemo, type ReactNode } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Gauge,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CEFR_LEVELS,
  LANGUAGE_SKILLS,
  nextCefr,
  type LanguageSkillId,
} from '@/lib/languagePlan';
import {
  STUDY_ERROR_CATEGORIES,
  type StudyErrorEntry,
} from '@/lib/languageStudyPlan';
import type { LanguageHistoryDay, LanguageWeeklyDay } from '@/hooks/useLanguageWeeklyStats';
import { SKILL_CATALOG } from './playbook';

interface Props {
  level: string;
  weeklyData: LanguageWeeklyDay[];
  history: LanguageHistoryDay[];
  streak: number;
  skillDays: Record<string, number>;
  selfEvaluation: Partial<Record<LanguageSkillId, number>>;
  errors: StudyErrorEntry[];
  vocabulary: { total: number; learned: number; learning: number; fresh: number };
  weekProgress: { done: number; total: number; percent: number };
  dailyGoal: number;
  weeklyGoal: number;
}

/**
 * Progreso con datos reales: minutos y días de `daily_systems_tracking`,
 * autoevaluación del plan mensual y errores del plan de 4 semanas. La
 * comparación importante es práctica vs. autoevaluación, para detectar
 * habilidades que se sienten bien pero se practican poco (y al revés).
 */
export function LanguageProgressPanel({
  level,
  weeklyData,
  history,
  streak,
  skillDays,
  selfEvaluation,
  errors,
  vocabulary,
  weekProgress,
  dailyGoal,
  weeklyGoal,
}: Props) {
  const weekMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  const activeDays = weeklyData.filter(day => day.minutes > 0 || day.skills > 0).length;

  const previousWeek = useMemo(() => history.slice(-14, -7), [history]);
  const previousMinutes = previousWeek.reduce((sum, day) => sum + day.minutes, 0);
  const deltaMinutes = weekMinutes - previousMinutes;

  const evaluatedSkills = LANGUAGE_SKILLS.filter(skill => !!selfEvaluation[skill.id]);

  const radarData = useMemo(
    () =>
      SKILL_CATALOG.map(meta => {
        const practicedDays = skillDays[meta.id] ?? 0;
        const evaluation = selfEvaluation[meta.id];
        return {
          skill: meta.short,
          practica: Math.round((practicedDays / 7) * 100),
          autoevaluacion: evaluation ? evaluation * 20 : 0,
        };
      }),
    [skillDays, selfEvaluation]
  );

  const ranking = useMemo(
    () =>
      [...SKILL_CATALOG].sort((a, b) => (skillDays[b.id] ?? 0) - (skillDays[a.id] ?? 0)),
    [skillDays]
  );
  const mostPracticed = ranking[0] ?? null;
  const leastPracticed = ranking[ranking.length - 1] ?? null;

  const errorsByCategory = useMemo(
    () =>
      STUDY_ERROR_CATEGORIES.map(category => ({
        ...category,
        total: errors.filter(entry => entry.category === category.id).length,
        pending: errors.filter(entry => entry.category === category.id && !entry.reviewed).length,
      })),
    [errors]
  );
  const maxErrorCount = Math.max(1, ...errorsByCategory.map(item => item.total));
  const pendingErrors = errors.filter(entry => !entry.reviewed).length;

  const levelIndex = CEFR_LEVELS.indexOf(level as (typeof CEFR_LEVELS)[number]);
  const ladderPercent = levelIndex >= 0 ? Math.round(((levelIndex + 1) / CEFR_LEVELS.length) * 100) : 0;
  const nextLevel = nextCefr(level);
  const weekGoalPercent = weeklyGoal > 0 ? Math.min(100, Math.round((weekMinutes / weeklyGoal) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi
          icon={<CalendarCheck2 className="h-3.5 w-3.5" />}
          label="Minutos esta semana"
          value={`${weekMinutes}`}
          hint={weeklyGoal > 0 ? `${weekGoalPercent}% de ${weeklyGoal} min` : 'sin meta semanal'}
        />
        <Kpi
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          label="Días activos"
          value={`${activeDays}/7`}
          hint={activeDays >= 5 ? 'Constancia alta' : activeDays >= 3 ? 'Ritmo estable' : 'Puedes subir el ritmo'}
        />
        <Kpi
          icon={<Flame className="h-3.5 w-3.5" />}
          label="Racha"
          value={`${streak}`}
          hint={streak > 0 ? 'días seguidos' : 'empieza hoy'}
        />
        <Kpi
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Vocabulario"
          value={`${vocabulary.learned}`}
          hint={`dominadas de ${vocabulary.total} guardadas`}
        />
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            Las 6 habilidades: práctica vs. autoevaluación
            <Badge variant="outline" className="ml-auto text-[10px]">
              7 días
            </Badge>
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Práctica = días de la semana con la habilidad marcada. Autoevaluación = tu nota del plan mensual (1–5).
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Práctica"
                dataKey="practica"
                stroke="hsl(var(--foreground))"
                fill="hsl(var(--foreground))"
                fillOpacity={0.16}
                strokeWidth={1.5}
              />
              {evaluatedSkills.length > 0 && (
                <Radar
                  name="Autoevaluación"
                  dataKey="autoevaluacion"
                  stroke="hsl(var(--focus))"
                  fill="hsl(var(--focus))"
                  fillOpacity={0.12}
                  strokeWidth={1.5}
                />
              )}
              <Tooltip
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          {evaluatedSkills.length === 0 && (
            <p className="-mt-1 text-center text-[10px] text-muted-foreground">
              Aún no hay autoevaluación este mes: complétala en la planificación mensual de Idiomas para comparar las dos curvas.
            </p>
          )}
          {evaluatedSkills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-foreground" /> Práctica
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-focus" /> Autoevaluación
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Últimos 28 días</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Intensidad = minutos. Pasa el cursor para ver habilidades.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <Heatmap history={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Semana en minutos</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {weeklyGoal > 0
                ? `${weekMinutes} de ${weeklyGoal} min · ${weekGoalPercent}% de la meta`
                : `${weekMinutes} min · sin meta semanal configurada`}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <WeekBars weeklyData={weeklyData} dailyGoal={dailyGoal} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            Informe de la semana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <ul className="space-y-1.5 text-[12px] leading-snug">
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span>
                <strong className="tabular-nums">{weekMinutes} min</strong> en{' '}
                <strong className="tabular-nums">{activeDays} de 7 días</strong>
                {activeDays > 0 && (
                  <> · media de {Math.round(weekMinutes / activeDays)} min por día activo</>
                )}
                .
              </span>
            </li>
            {mostPracticed && (skillDays[mostPracticed.id] ?? 0) > 0 && (
              <li className="flex items-start gap-1.5">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>
                  La que más trabajaste fue <strong>{mostPracticed.label}</strong> con{' '}
                  <strong className="tabular-nums">{skillDays[mostPracticed.id]}/7 días</strong>. Mantén esa
                  constancia.
                </span>
              </li>
            )}
            {leastPracticed && (skillDays[leastPracticed.id] ?? 0) < 2 && (
              <li className="flex items-start gap-1.5">
                <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  <strong>{leastPracticed.label}</strong> solo aparece{' '}
                  <strong className="tabular-nums">{skillDays[leastPracticed.id] ?? 0}/7 días</strong>. Su táctica
                  recomendada: {leastPracticed.playbook.tactic.toLowerCase()}.
                </span>
              </li>
            )}
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              <span>
                {previousMinutes === 0
                  ? 'Sin datos de la semana anterior para comparar.'
                  : deltaMinutes >= 0
                    ? `Subiste ${deltaMinutes} min respecto a la semana anterior.`
                    : `Bajaste ${Math.abs(deltaMinutes)} min respecto a la semana anterior; retoma con una sesión corta.`}
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              <span>
                Plan de 4 semanas: <strong className="tabular-nums">{weekProgress.percent}%</strong> de la semana (
                {weekProgress.done}/{weekProgress.total} tareas).
                {pendingErrors > 0 ? ` ${pendingErrors} errores esperan repaso.` : ' Sin errores pendientes.'}
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Errores por categoría
            <Badge variant={pendingErrors > 0 ? 'secondary' : 'outline'} className="ml-auto text-[10px]">
              {pendingErrors} sin revisar
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          {errors.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 p-3 text-center text-[11px] text-muted-foreground">
              Aún no hay errores anotados. Añádelos en el cierre de la sesión o en Plan → Errores.
            </p>
          ) : (
            errorsByCategory.map(category => (
              <div key={category.id} className="flex items-center gap-2">
                <span className={cn('w-24 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', category.tone)}>
                  {category.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${Math.round((category.total / maxErrorCount) * 100)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  {category.total} · {category.pending} pend.
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Escalera CEFR</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {levelIndex >= 0
              ? `Estás en ${level}. Siguiente objetivo: ${nextLevel}.`
              : `Nivel actual: ${level}.`}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <Progress value={ladderPercent} className="h-1.5" />
          <div className="flex flex-wrap gap-1">
            {CEFR_LEVELS.map((item, index) => {
              const current = index === levelIndex;
              const passed = levelIndex >= 0 && index < levelIndex;
              return (
                <span
                  key={item}
                  className={cn(
                    'rounded-full border px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                    current
                      ? 'border-foreground bg-foreground text-background'
                      : passed
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-border/60 text-muted-foreground'
                  )}
                >
                  {item}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            El nivel sale de la planificación mensual de Idiomas. La escalera mide tu posición declarada, no una
            prueba automática.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-0.5 text-xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

const INTENSITY = [0.06, 0.22, 0.4, 0.65, 1];

function intensityFor(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 20) return 2;
  if (minutes < 40) return 3;
  return 4;
}

function Heatmap({ history }: { history: LanguageHistoryDay[] }) {
  const days = useMemo(() => {
    if (history.length === 0) return [];
    const first = new Date(`${history[0].date}T12:00:00`);
    const pad = (first.getDay() + 6) % 7; // lunes = 0
    return [
      ...Array.from({ length: pad }, () => null),
      ...history,
    ];
  }, [history]);

  if (history.length === 0) {
    return <p className="py-6 text-center text-[11px] text-muted-foreground">Sin actividad registrada todavía.</p>;
  }

  return (
    <div className="flex items-start gap-2">
      <div className="grid grid-rows-7 gap-1 pt-4 text-[9px] leading-none text-muted-foreground">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
          <span key={day} className="grid h-3 items-center">
            {index % 2 === 0 ? day : ''}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="grid auto-cols-fr grid-flow-col grid-rows-7 gap-1">
          {days.map((day, index) => {
            if (!day) return <span key={`pad-${index}`} className="h-3 w-full rounded-[3px] bg-transparent" />;
            const level = intensityFor(day.minutes);
            const skillNames = day.skills
              .map(id => LANGUAGE_SKILLS.find(skill => skill.id === id)?.name ?? id)
              .join(', ');
            return (
              <span
                key={day.date}
                title={`${format(new Date(`${day.date}T12:00:00`), 'EEE d MMM', { locale: es })}: ${
                  day.minutes
                } min${skillNames ? ` · ${skillNames}` : ''}`}
                className="h-3 w-full rounded-[3px]"
                style={{
                  backgroundColor:
                    level === 0
                      ? 'hsl(var(--muted))'
                      : day.minutes > 0
                        ? `hsl(var(--success) / ${INTENSITY[level]})`
                        : `hsl(var(--focus) / ${INTENSITY[1]})`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
          <span>menos</span>
          {INTENSITY.map((alpha, index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: index === 0 ? 'hsl(var(--muted))' : `hsl(var(--success) / ${alpha})` }}
            />
          ))}
          <span>más</span>
        </div>
      </div>
    </div>
  );
}

function WeekBars({ weeklyData, dailyGoal }: { weeklyData: LanguageWeeklyDay[]; dailyGoal: number }) {
  const max = Math.max(dailyGoal, ...weeklyData.map(day => day.minutes), 1);

  if (weeklyData.length === 0) {
    return <p className="py-6 text-center text-[11px] text-muted-foreground">Sin datos de la semana.</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex h-28 items-end gap-1.5">
        {weeklyData.map(day => {
          const height = Math.max(4, Math.round((day.minutes / max) * 100));
          const reached = dailyGoal > 0 && day.minutes >= dailyGoal;
          return (
            <div key={day.date} className="flex h-full flex-1 flex-col justify-end gap-1" title={`${day.minutes} min`}>
              <span className="text-center text-[9px] tabular-nums text-muted-foreground">{day.minutes}</span>
              <div
                className={cn('w-full rounded-t-[4px] transition-all', reached ? 'bg-success' : 'bg-foreground/75')}
                style={{ height: `${height}%`, minHeight: 4 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {weeklyData.map(day => (
          <span key={`label-${day.date}`} className="flex-1 text-center text-[9px] text-muted-foreground">
            {day.day}
          </span>
        ))}
      </div>
      {dailyGoal > 0 && (
        <p className="text-right text-[9px] text-muted-foreground">Verde = meta diaria de {dailyGoal} min alcanzada</p>
      )}
    </div>
  );
}
