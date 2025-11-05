import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isToday, parseISO, format, formatISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { VisionBoardGrid } from '@/components/VisionBoardGrid';
import type { Task, HabitHistory, MonthlyGoal, QuarterlyGoal, LifeArea } from '@/lib/definitions';
import { lifeAreas, centralAreas, socialAreas, habits, quarterlyGoals as initialQuarterlyGoals } from '@/lib/data';
import { flattenAreas, findAreaById, getAllSubAreaIds, getEffortLevel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, Repeat, Zap, Sparkles, Compass, ExternalLink } from 'lucide-react';
import { ProductivityMeter } from '@/components/dashboard/ProductivityMeter';
import { Progress } from '@/components/ui/progress';
import CurrentRoutineBlock from '@/components/dashboard/CurrentRoutineBlock';
import MotivationPanel from '@/components/dashboard/MotivationPanel';
import VisionActivationGrid from '@/components/dashboard/VisionActivationGrid';
import EmbeddedVisionBoard from '@/components/dashboard/EmbeddedVisionBoard';
import AttractionPillar from '@/components/dashboard/AttractionPillar';

const PERSONAL_CARE_HISTORY_KEY = 'personalCareHistory';
const SKIN_CARE_HISTORY_KEY = 'skinCareHistory';

interface PersonalCareState {
  cleanClothes: boolean;
  hairDone: boolean;
  perfume: boolean;
}

interface PersonalCareHistory {
  [date: string]: PersonalCareState;
}

interface SkinCareState {
  morning: boolean;
  night: boolean;
}

interface SkinCareHistory {
  [date: string]: SkinCareState;
}

const IconIndicator = ({ area, score, goalProgress, habitHistory }: { area: LifeArea, score: number, goalProgress?: number, habitHistory: HabitHistory }) => {
  const { progressColor, finalEffortRing, barColorClass, displayProgress, isHighPriorityIncomplete } = useMemo(() => {
    let scoreToUse = score;
    const habitForArea = habits.find(h => h.areaId === area.id);
    let effort = null;

    if (habitForArea) {
      const todayStr = formatISO(new Date(), { representation: 'date' });
      const todayEntry = habitHistory[habitForArea.id]?.completedDates?.find(d => d && d.date === todayStr);
      const todayDuration = todayEntry?.duration || 0;

      if (habitForArea.effortLevels && todayDuration > 0) {
        effort = getEffortLevel(habitForArea, todayDuration);
      }
    }

    if (score === -1 && goalProgress !== undefined && goalProgress > -1) {
      scoreToUse = goalProgress;
    }

    const getBarColorClass = (progress: number) => {
      if (progress === -1) return 'bg-muted';
      if (progress >= 100) return 'bg-emerald-400';
      if (progress >= 75) return 'bg-green-500';
      if (progress > 0) return 'bg-amber-500';
      return 'bg-red-500';
    };

    const getProgressColor = (s: number) => {
      if (s === -1) return 'text-muted-foreground';
      if (s >= 100) return 'text-emerald-400';
      if (s >= 75) return 'text-green-500';
      if (s > 0) return 'text-amber-500';
      return 'text-red-500';
    };

    const isCompleted = scoreToUse >= 100;
    let finalEffort = effort;
    
    if (!finalEffort && isCompleted) {
      const habitForArea = habits.find(h => h.areaId === area.id);
      if (habitForArea && !habitForArea.effortLevels) {
        finalEffort = { name: 'Esmeralda', ring: 'ring-emerald-400', border: 'border-emerald-400' };
      }
    }

    const effectiveProgress = goalProgress !== undefined && goalProgress > -1 ? goalProgress : scoreToUse;
    const highPriorityHabits = ['entrenamiento', 'universidad', 'proyectos-personales'];
    const isHighPriorityIncomplete = highPriorityHabits.includes(area.id) && scoreToUse < 100 && !effort;

    return {
      progressColor: getProgressColor(effectiveProgress),
      barColorClass: getBarColorClass(effectiveProgress),
      displayProgress: effectiveProgress,
      finalEffortRing: finalEffort,
      isHighPriorityIncomplete,
    };
  }, [score, goalProgress, area.id, habitHistory]);

  const Icon = area.icon;

  return (
    <div className="p-2 rounded-md hover:bg-accent cursor-pointer flex flex-col items-center gap-2 relative">
      <div className={cn(
        "p-3 rounded-lg border-2 border-transparent transition-all",
        finalEffortRing && `ring-2 ring-offset-2 ring-offset-background ${finalEffortRing.ring} ${finalEffortRing.border}`
      )}>
        <Icon className={cn("h-12 w-12", progressColor)} />
      </div>
      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
        {displayProgress >= 0 && <div className={cn("h-full rounded-full", barColorClass)} style={{ width: `${displayProgress}%` }} />}
      </div>
    </div>
  );
};

interface AreaColumnProps {
  title: string;
  parentAreas: LifeArea[];
  productivityData: { [areaId: string]: { score: number; area: LifeArea, goalProgress?: number } };
  habitHistory: HabitHistory;
}

const AreaColumn = ({ title, parentAreas, productivityData, habitHistory }: AreaColumnProps) => {
  const allAppAreas = useMemo(() => flattenAreas([...lifeAreas, ...centralAreas, ...socialAreas]), []);

  const columnAverage = useMemo(() => {
    const areaIdsInColumn = parentAreas.flatMap(area => getAllSubAreaIds(area, allAppAreas));
    const scores = areaIdsInColumn
      .map(id => {
        const data = productivityData[id];
        if (!data) return undefined;
        return data.goalProgress !== undefined && data.goalProgress > -1 ? data.goalProgress : data.score;
      })
      .filter(score => score !== undefined && score !== -1);

    if (scores.length === 0) return -1;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [parentAreas, productivityData, allAppAreas]);

  const renderArea = (area: LifeArea): React.ReactNode => {
    const specialLayoutAreas = ['profesional', 'desarrollo-personal', 'mental', 'apariencia', 'finanzas', 'salud'];

    const allSubAreaIds = getAllSubAreaIds(area, allAppAreas);
    const subAreaScores = allSubAreaIds
      .map(id => {
        const data = productivityData[id];
        if (!data) return undefined;
        return data.goalProgress !== undefined && data.goalProgress > -1 ? data.goalProgress : data.score;
      })
      .filter(score => score !== undefined && score !== -1);

    const areaAverage = subAreaScores.length > 0
      ? subAreaScores.reduce((sum, score) => sum + score, 0) / subAreaScores.length
      : -1;

    const areaData = productivityData[area.id];
    const hasTrackedItems = areaData !== undefined;
    const score = hasTrackedItems ? areaData.score : -1;
    const goalProgress = hasTrackedItems ? areaData.goalProgress : undefined;

    if (specialLayoutAreas.includes(area.id)) {
      const AreaIcon = area.icon;

      if (area.id === 'mental') {
        const routines = ['rutina-activacion', 'rutina-desactivacion'];
        const dopamineDetox = ['no-fap', 'no-videojuegos', 'redes-sociales'];
        const atomicHabits = ['ducha-fria', 'planificacion', 'autocritica'];

        const renderGroup = (groupTitle: string, icon: LucideIcon, habitIds: string[]) => {
          const habitsToShow = (area.subAreas || [])
            .map(sub => allAppAreas.find(a => a.id === sub.id))
            .filter((a): a is LifeArea => !!a && habitIds.includes(a.id));
          if (habitsToShow.length === 0) return null;

          return (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2 font-semibold text-primary/80 text-sm">
                {React.createElement(icon, { className: 'h-4 w-4' })}
                <h5>{groupTitle}</h5>
              </div>
              <div className="flex items-center flex-wrap gap-x-1">
                {habitsToShow.map(habitArea => {
                  const habitAreaData = productivityData[habitArea.id];
                  const habitScore = habitAreaData?.score ?? -1;
                  const habitGoalProgress = habitAreaData?.goalProgress;
                  return <IconIndicator key={habitArea.id} area={habitArea} score={habitScore} goalProgress={habitGoalProgress} habitHistory={habitHistory} />;
                })}
              </div>
            </div>
          );
        };

        return (
          <div key={area.id} className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-primary/90">
              <AreaIcon className="h-5 w-5" />
              <h4>{area.name}</h4>
            </div>
            {areaAverage >= 0 && (
              <div className="pl-7">
                <Progress value={areaAverage} className="h-1.5" />
              </div>
            )}
            <div className="pl-7 flex flex-col gap-3">
              {renderGroup("Rutinas", Repeat, routines)}
              {renderGroup("Detox Dopamínico", Zap, dopamineDetox)}
              {renderGroup("Hábitos Atómicos", Sparkles, atomicHabits)}
            </div>
          </div>
        );
      }

      return (
        <div key={area.id} className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-primary/90">
            <AreaIcon className="h-5 w-5" />
            <h4>{area.name}</h4>
          </div>
          {areaAverage >= 0 && (
            <div className="pl-7">
              <Progress value={areaAverage} className="h-1.5" />
            </div>
          )}
          <div className="pl-7 flex items-center flex-wrap gap-x-1">
            {(area.subAreas || []).map(sub => {
              const subArea = allAppAreas.find(a => a.id === sub.id);
              if (!subArea) return null;
              const subAreaData = productivityData[subArea.id];
              const subAreaScore = subAreaData?.score ?? -1;
              const subAreaGoalProgress = subAreaData?.goalProgress;
              return <IconIndicator key={subArea.id} area={subArea} score={subAreaScore} goalProgress={subAreaGoalProgress} habitHistory={habitHistory} />;
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={area.id} className="flex items-center gap-2">
        <IconIndicator area={area} score={score} goalProgress={goalProgress} habitHistory={habitHistory} />
        <span className="font-medium text-sm truncate">{area.name}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className='text-center space-y-2'>
        <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
        {columnAverage >= 0 && <Progress value={columnAverage} className="h-1.5" />}
      </div>
      <div className="w-full space-y-4">
        {parentAreas.map(area => renderArea(area))}
      </div>
    </div>
  );
};

const EffortVerdict = ({ score }: { score: number }) => {
  const { title, message, borderColor } = useMemo(() => {
    if (score >= 80) {
      return {
        title: "Veredicto: Has Honrado tu Palabra.",
        message: "Hoy has invertido en tu futuro yo. Cada acción, cada esfuerzo, te ha acercado a la persona que quieres ser. Duerme tranquilo, estás exactamente donde debes estar. El camino se construye con días como este.",
        borderColor: "border-emerald-500/80"
      };
    }
    if (score >= 50) {
      return {
        title: "Veredicto: Has Ganado Terreno.",
        message: "Has luchado y has avanzado. No todos los días son perfectos, pero el esfuerzo de hoy cuenta y suma. La consistencia no se trata de perfección, se trata de persistencia. Sigue adelante.",
        borderColor: "border-blue-500/80"
      };
    }
    return {
      title: "Veredicto: Un Día para Reflexionar.",
      message: "Hoy no fue tu día más fuerte, y está bien reconocerlo. Lo importante no es este resultado, sino tu respuesta mañana. Usa esto no como una derrota, sino como la tensión necesaria para un impulso mayor. Mañana es una página en blanco.",
      borderColor: "border-amber-500/80"
    };
  }, [score]);

  return (
    <Card className={cn("border-2", borderColor)}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl flex items-center justify-center gap-3">
          <Compass className="h-6 w-6 text-primary" />
          La Brújula del Presente: Veredicto del Esfuerzo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-primary">{title}</h4>
          <p className="text-muted-foreground italic text-sm">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ControlRoom() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [personalCareHistory, setPersonalCareHistory] = useState<PersonalCareHistory>({});
  const [skinCareHistory, setSkinCareHistory] = useState<SkinCareHistory>({});
  const [monthlyGoals, setMonthlyGoals] = useState<Record<string, MonthlyGoal>>({});
  const [quarterlyGoals, setQuarterlyGoals] = useState<QuarterlyGoal[]>([]);
  const [isClient, setIsClient] = useState(false);

  const currentMonthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const mainAreas = useMemo(() => [...lifeAreas, ...centralAreas], []);
  const allAppAreas = useMemo(() => flattenAreas([...lifeAreas, ...centralAreas, ...socialAreas]), []);

  useEffect(() => {
    setIsClient(true);
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setAllTasks(JSON.parse(storedTasks, (key, value) => (key === 'dueDate' || key === 'startDate') && value ? new Date(value) : value) || []);
    }
    const storedHabits = localStorage.getItem('habitHistory');
    if (storedHabits) {
      setHabitHistory(JSON.parse(storedHabits) || {});
    }
    const storedPersonalCare = localStorage.getItem(PERSONAL_CARE_HISTORY_KEY);
    if (storedPersonalCare) {
      setPersonalCareHistory(JSON.parse(storedPersonalCare));
    }
    const storedSkinCare = localStorage.getItem(SKIN_CARE_HISTORY_KEY);
    if (storedSkinCare) {
      setSkinCareHistory(JSON.parse(storedSkinCare));
    }
    const storedMonthlyGoals = localStorage.getItem('monthlyGoals');
    if (storedMonthlyGoals) {
      try {
        const allParsedGoals = JSON.parse(storedMonthlyGoals, (key, value) => {
          if ((key === 'startDate' || key === 'dueDate') && value) {
            return new Date(value);
          }
          return value;
        });
        setMonthlyGoals(allParsedGoals[currentMonthKey] || {});
      } catch (error) {
        setMonthlyGoals({});
      }
    }
    const storedQuarterlyGoals = localStorage.getItem('quarterlyGoals');
    setQuarterlyGoals(storedQuarterlyGoals ? JSON.parse(storedQuarterlyGoals) : initialQuarterlyGoals);
  }, [currentMonthKey]);

  const augmentedHabitHistory = useMemo(() => {
    if (!isClient) return habitHistory;

    const todayStr = formatISO(new Date(), { representation: 'date' });
    const todayPersonalCare = personalCareHistory[todayStr] || { cleanClothes: false, hairDone: false, perfume: false };
    const todaySkinCare = skinCareHistory[todayStr] || { morning: false, night: false };

    const augmentedHistory: HabitHistory = JSON.parse(JSON.stringify(habitHistory));

    const updateHabit = (habitId: string, isCompleted: boolean) => {
      if (!augmentedHistory[habitId]) {
        augmentedHistory[habitId] = { completedDates: [], currentStreak: 0, longestStreak: 0 };
      }
      let completedDates = augmentedHistory[habitId].completedDates || [];
      const entryIndex = completedDates.findIndex((d: any) => d.date === todayStr);

      if (entryIndex > -1) {
        if (isCompleted) {
          completedDates[entryIndex].status = 'completed';
        } else {
          if (completedDates[entryIndex].status === 'completed') {
            completedDates.splice(entryIndex, 1);
          }
        }
      } else if (isCompleted) {
        completedDates.push({ date: todayStr, status: 'completed' });
      }
      augmentedHistory[habitId].completedDates = completedDates;
    };

    updateHabit('habit-cuidado-personal', todayPersonalCare.cleanClothes && todayPersonalCare.hairDone && todayPersonalCare.perfume);
    updateHabit('habit-skincare', todaySkinCare.morning && todaySkinCare.night);

    return augmentedHistory;
  }, [isClient, habitHistory, personalCareHistory, skinCareHistory]);

  const productivityData = useMemo(() => {
    if (!isClient) return { average: { completedHabits: 0, totalHabits: 0, completedTasks: 0, totalTasks: 0, score: 0 } };

    const todayTasks = allTasks.filter(task => task.dueDate && isToday(new Date(task.dueDate)));
    const areaScores: any = {};

    allAppAreas.forEach(area => {
      const areaHabits = habits.filter(h => h.areaId === area.id);
      const areaTasks = todayTasks.filter(t => t.areaId === area.id);

      let score: number | null = null;

      if (area.id === 'proyectos-personales') {
        if (areaTasks.length > 0) {
          const completed = areaTasks.filter(t => t.status === 'completada').length;
          score = (completed / areaTasks.length) * 100;
        } else {
          score = -1;
        }
      } else {
        const completedHabitsCount = areaHabits.filter(h => {
          const todayEntry = augmentedHabitHistory[h.id]?.completedDates?.find(d => d && isToday(parseISO(d.date)));
          return todayEntry?.status === 'completed';
        }).length;

        const completedTasksCount = areaTasks.filter(t => t.status === 'completada').length;
        const totalItems = areaHabits.length + areaTasks.length;
        const completedItems = completedHabitsCount + completedTasksCount;
        if (totalItems > 0) {
          score = (completedItems / totalItems) * 100;
        }
      }

      if (score !== null) {
        areaScores[area.id] = { score, area };
      } else if (socialAreas.some(sa => sa.id === area.id)) {
        const socialAreaTasks = todayTasks.filter(t => t.areaId === area.id);
        if (socialAreaTasks.length > 0) {
          const completed = socialAreaTasks.filter(t => t.status === 'completada').length;
          areaScores[area.id] = { score: (completed / socialAreaTasks.length) * 100, area };
        } else {
          areaScores[area.id] = { score: -1, area };
        }
      }

      const monthlyGoalForArea = monthlyGoals[area.id];
      if (monthlyGoalForArea && monthlyGoalForArea.tasks.length > 0) {
        const completedMonthlyTasks = monthlyGoalForArea.tasks.filter(t => t.completed).length;
        const goalProgress = (completedMonthlyTasks / monthlyGoalForArea.tasks.length) * 100;

        if (areaScores[area.id]) {
          areaScores[area.id].goalProgress = goalProgress;
        } else {
          areaScores[area.id] = { score: -1, area, goalProgress: goalProgress };
        }
      }
    });

    socialAreas.forEach(area => {
      if (!areaScores[area.id]) {
        areaScores[area.id] = { score: -1, area };
      }
    });

    const totalHabits = habits.length;
    const totalTasks = todayTasks.length;
    const totalCompletedHabits = Object.values(augmentedHabitHistory).filter(h =>
      (h.completedDates || []).some(d => d && d.date && isToday(parseISO(d.date)) && d.status === 'completed')
    ).length;
    const totalCompletedTasks = todayTasks.filter(t => t.status === 'completada').length;

    const professionalArea = mainAreas.find(a => a.id === 'profesional');
    const personalArea = mainAreas.find(a => a.id === 'desarrollo-personal');
    const healthArea = centralAreas.find(a => a.id === 'salud');
    const financeArea = mainAreas.find(a => a.id === 'finanzas');
    const mentalArea = mainAreas.find(a => a.id === 'mental');
    const appearanceArea = mainAreas.find(a => a.id === 'apariencia');

    const getMetricsForArea = (areaIds: string[]) => {
      const areaHabits = habits.filter(h => areaIds.includes(h.areaId));
      const areaTasks = todayTasks.filter(t => areaIds.includes(t.areaId || ''));

      const completedHabitsCount = areaHabits.filter(h => {
        return (augmentedHabitHistory[h.id]?.completedDates || []).some(d => d && d.date && isToday(parseISO(d.date)) && d.status === 'completed')
      }).length;

      const completedTasksCount = areaTasks.filter(t => t.status === 'completada').length;

      return {
        completedHabits: completedHabitsCount,
        totalHabits: areaHabits.length,
        completedTasks: completedTasksCount,
        totalTasks: areaTasks.length,
      };
    };

    const overallScore = (totalHabits + totalTasks) > 0 ? ((totalCompletedHabits + totalCompletedTasks) / (totalHabits + totalTasks)) * 100 : 100;

    areaScores.average = {
      score: overallScore,
      area: { id: 'average', name: 'Promedio', description: '', icon: () => null },
      data: {
        completedHabits: totalCompletedHabits,
        totalHabits: totalHabits,
        completedTasks: totalCompletedTasks,
        totalTasks: totalTasks,
      },
      professional: getMetricsForArea(professionalArea ? getAllSubAreaIds(professionalArea, allAppAreas) : []),
      personal: getMetricsForArea(personalArea ? getAllSubAreaIds(personalArea, allAppAreas) : []),
      health: getMetricsForArea(healthArea ? getAllSubAreaIds(healthArea, allAppAreas) : []),
      finance: getMetricsForArea(financeArea ? getAllSubAreaIds(financeArea, allAppAreas) : []),
      mental: getMetricsForArea(mentalArea ? getAllSubAreaIds(mentalArea, allAppAreas) : []),
      appearance: getMetricsForArea(appearanceArea ? getAllSubAreaIds(appearanceArea, allAppAreas) : []),
    };

    return areaScores;
  }, [allTasks, augmentedHabitHistory, monthlyGoals, isClient, mainAreas, allAppAreas]);

  const { borderColorClass } = useMemo(() => {
    const scores = Object.values(productivityData)
      .map((data: any) => data.score)
      .filter(score => score !== -1 && score !== undefined);

    if (scores.length === 0) {
      return { overallScore: -1, borderColorClass: 'border-border' };
    }

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    let colorClass = 'border-border';
    if (averageScore >= 100) colorClass = 'border-emerald-400';
    else if (averageScore >= 75) colorClass = 'border-green-500';
    else if (averageScore >= 40) colorClass = 'border-amber-500';
    else if (averageScore > 0) colorClass = 'border-red-500';

    return { overallScore: averageScore, borderColorClass: colorClass };
  }, [productivityData]);

  const projectsByMainArea = useMemo(() => {
    if (!monthlyGoals) return [];

    const monthlyProjects = Object.entries(monthlyGoals)
      .map(([areaId, goalData]) => {
        if (!goalData.quarterlyGoalId || !goalData.tasks || goalData.tasks.length === 0) return null;

        const area = findAreaById(allAppAreas, areaId);
        const quarterlyGoal = quarterlyGoals.find(qg => qg.id === goalData.quarterlyGoalId);

        if (!area || !quarterlyGoal) return null;

        const completedTasks = goalData.tasks.filter(t => t.completed).length;
        const progress = (completedTasks / goalData.tasks.length) * 100;

        return {
          area,
          quarterlyGoal,
          progress,
          completedTasks,
          totalTasks: goalData.tasks.length,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const grouped: Record<string, { mainArea: LifeArea, projects: any[] }> = {};
    const areasToShow = ['profesional', 'desarrollo-personal'];

    monthlyProjects.forEach(project => {
      let mainArea: LifeArea | undefined;
      let parentArea = project.area;

      while (parentArea) {
        const foundMain = [...lifeAreas, ...centralAreas].find(m => m.id === parentArea.id);
        if (foundMain) {
          mainArea = foundMain;
          break;
        }
        const parentId = allAppAreas.find(a => a.subAreas?.some(sa => sa.id === parentArea.id))?.id;
        parentArea = parentId ? findAreaById(allAppAreas, parentId)! : undefined!;
      }

      if (mainArea && areasToShow.includes(mainArea.id)) {
        if (!grouped[mainArea.id]) {
          grouped[mainArea.id] = { mainArea, projects: [] };
        }
        grouped[mainArea.id].projects.push(project);
      }
    });
    return Object.values(grouped);
  }, [monthlyGoals, quarterlyGoals, allAppAreas]);

  if (!isClient) {
    return null;
  }

  const averageData = productivityData.average;

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      <header className='flex justify-between items-center'>
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">Sala de Control</h1>
          <p className="text-muted-foreground mt-2">
            Un vistazo rápido al estado de todos los sistemas de tu vida
          </p>
        </div>
          {averageData?.data && (
            <div className='flex flex-nowrap gap-1 justify-end'>
              <ProductivityMeter title="Promedio del Día" {...averageData.data} showCard={false} />
              <ProductivityMeter title="Día Saludable" {...averageData.health} showCard={false} />
              <ProductivityMeter title="Día Mental" {...averageData.mental} showCard={false} />
              <ProductivityMeter title="Día Apariencia" {...averageData.appearance} showCard={false} />
              <ProductivityMeter title="Día Profesional" {...averageData.professional} showCard={false} />
              <ProductivityMeter title="Día Personal" {...averageData.personal} showCard={false} />
              <ProductivityMeter title="Día Financiero" {...averageData.finance} showCard={false} />
            </div>
          )}
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Rutina Diaria</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {isClient && <CurrentRoutineBlock />}
          </CardContent>
        </Card>

        <div className={cn("p-4 rounded-lg border-2", borderColorClass)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AreaColumn title="Áreas Centrales" parentAreas={centralAreas} productivityData={productivityData} habitHistory={augmentedHabitHistory} />
            <AreaColumn title="Áreas Clave" parentAreas={lifeAreas} productivityData={productivityData} habitHistory={augmentedHabitHistory} />
            <AreaColumn title="Áreas Sociales" parentAreas={socialAreas} productivityData={productivityData} habitHistory={augmentedHabitHistory} />
          </div>
        </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Tablero de Visión</CardTitle>
          <CardDescription>Sube imágenes inspiradoras y márcalas cuando las logres. Cada tarjeta con checkbox se pone verde al completarla.</CardDescription>
        </CardHeader>
        <CardContent>
          <VisionBoardGrid />
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VisionActivationGrid habitHistory={augmentedHabitHistory} />
          <AttractionPillar habitHistory={augmentedHabitHistory} />
        </div>

        <EffortVerdict score={averageData.score} />

        <Separator />

        {projectsByMainArea.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Proyectos del Mes</h2>
            {projectsByMainArea.map(({ mainArea, projects }) => {
              const AreaIcon = mainArea.icon;
              return (
                <div key={mainArea.id}>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                    <AreaIcon className="h-6 w-6 text-primary" />
                    {mainArea.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-9">
                    {projects.map((project) => (
                      <Card key={project.quarterlyGoal.id} className="h-full">
                        <CardHeader className="pb-4">
                          <Link to={`/goals/${project.quarterlyGoal.id}`} className="hover:underline">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              {project.quarterlyGoal.title}
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </CardTitle>
                          </Link>
                          <CardDescription className='text-xs pt-1'>{project.area.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Progress value={project.progress} className='h-2' />
                            <div className="text-xs text-muted-foreground font-medium">
                              {project.completedTasks} de {project.totalTasks} subtareas
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <Separator />

      {isClient && <MotivationPanel habitHistory={augmentedHabitHistory} productivityData={productivityData} />}
    </div>
  );
}
