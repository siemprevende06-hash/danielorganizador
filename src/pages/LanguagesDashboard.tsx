import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { useLanguageWeeklyStats } from '@/hooks/useLanguageWeeklyStats';
import { LanguageHeader } from '@/components/languages/LanguageHeader';
import { LanguageQuickStats } from '@/components/languages/LanguageQuickStats';
import { LanguageSkillsChecklist } from '@/components/languages/LanguageSkillsChecklist';
import { LanguagePracticeTimerCard } from '@/components/languages/LanguagePracticeTimerCard';
import { LanguageResourcesCard } from '@/components/languages/LanguageResourcesCard';
import { LanguageStatsTab } from '@/components/languages/LanguageStatsTab';
import { LanguageTipCard } from '@/components/languages/LanguageTipCard';
import { LANGUAGE_SKILLS, type LanguageSkillId } from '@/components/languages/skills';

export default function LanguagesDashboard() {
  const { settings, todaySession, isLoading, currentLanguage, setLanguage, getSubTasksForDuration, toggleSubTask, getProgress, logPracticeMinutes } =
    useLanguageLearning();

  const { weeklyData, streak, loading: weeklyLoading } = useLanguageWeeklyStats(currentLanguage);

  const [activeTab, setActiveTab] = useState('today');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeSkill, setActiveSkill] = useState<LanguageSkillId>('vocabulary');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weeklyGoal = 300;
  const dailyGoal = 45;

  const todayMinutes = todaySession?.totalDuration || 0;
  const progress = getProgress();
  const subTasks = getSubTasksForDuration(90);

  const weeklyTotal = useMemo(() => weeklyData.reduce((sum, d) => sum + d.minutes, 0), [weeklyData]);
  const weeklyPercent = Math.min((weeklyTotal / weeklyGoal) * 100, 100);

  const pieData = useMemo(
    () =>
      [
        { name: 'Completadas', value: progress.completed, color: 'hsl(var(--success))' },
        { name: 'Pendientes', value: progress.total - progress.completed, color: 'hsl(var(--muted))' },
      ].filter(d => d.value > 0),
    [progress]
  );

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimerSeconds(0);
    setTimerActive(true);
  };

  const completeTimer = async () => {
    setTimerActive(false);
    const minutes = Math.ceil(timerSeconds / 60);
    if (minutes > 0) {
      await logPracticeMinutes(activeSkill, minutes, 'morning');
    }
    setTimerSeconds(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <LanguageHeader currentLanguage={currentLanguage} onSetLanguage={setLanguage} streak={streak} />

        <LanguageQuickStats
          progress={progress}
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          weeklyTotal={weeklyTotal}
          weeklyPercent={weeklyPercent}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="text-xs sm:text-sm">
              📝 Hoy
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-xs sm:text-sm">
              ⏱️ Práctica
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              📊 Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <LanguageSkillsChecklist
              skills={LANGUAGE_SKILLS}
              subTasks={subTasks}
              activeSkillId={timerActive ? activeSkill : null}
              onToggle={(id) => toggleSubTask(id, 'morning')}
              onStartTimer={(id) => {
                setActiveSkill(id as LanguageSkillId);
                setActiveTab('practice');
                setTimerSeconds(0);
                setTimerActive(true);
              }}
            />

            <LanguageTipCard currentLanguage={currentLanguage} />
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            <LanguagePracticeTimerCard
              skills={LANGUAGE_SKILLS}
              timerActive={timerActive}
              timerSeconds={timerSeconds}
              selectedSkill={activeSkill}
              onSelectSkill={setActiveSkill}
              onStart={startTimer}
              onComplete={completeTimer}
              formatTime={formatTime}
            />

            <LanguageResourcesCard />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {weeklyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[220px] w-full" />
                <Skeleton className="h-[220px] w-full" />
              </div>
            ) : (
              <LanguageStatsTab weeklyData={weeklyData} pieData={pieData} progress={progress} settings={settings} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
