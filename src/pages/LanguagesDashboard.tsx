import { useEffect, useMemo, useRef, useState } from 'react';
import { startOfWeek } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { useLanguageWeeklyStats } from '@/hooks/useLanguageWeeklyStats';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { useToast } from '@/hooks/use-toast';
import { getDayGoalEffective, getWeekGoalEffective } from '@/lib/hierarchy';
import { normalizeCefr, skillCompletionKey, type LanguageId } from '@/lib/languagePlan';
import { LanguageHeader } from '@/components/languages/LanguageHeader';
import { LanguageQuickStats } from '@/components/languages/LanguageQuickStats';
import { LanguageSkillsChecklist } from '@/components/languages/LanguageSkillsChecklist';
import { LanguagePracticeTimerCard } from '@/components/languages/LanguagePracticeTimerCard';
import { LanguageResourcesCard } from '@/components/languages/LanguageResourcesCard';
import { LanguageStatsTab } from '@/components/languages/LanguageStatsTab';
import { LanguageTipCard } from '@/components/languages/LanguageTipCard';
import { StudyPlanPanel } from '@/components/languages/StudyPlanPanel';
import VocabularyPanel from '@/components/languages/VocabularyPanel';
import { LanguageTutorPanel } from '@/components/languages/LanguageTutorPanel';
import { LANGUAGE_SKILLS, type LanguageSkillId } from '@/components/languages/skills';

const LEGACY_SKILL: Record<LanguageSkillId, string> = {
  gramatica: 'grammar',
  vocabulario: 'vocabulary',
  'lectura-l': 'reading',
  listening: 'listening',
  speaking: 'speaking',
  escritura: 'grammar',
};

const TUTOR_TO_CANONICAL: Record<string, LanguageSkillId> = {
  grammar: 'gramatica',
  vocabulary: 'vocabulario',
  reading: 'lectura-l',
  listening: 'listening',
  speaking: 'speaking',
  writing: 'escritura',
};

const CANONICAL_IDS = new Set<LanguageSkillId>(LANGUAGE_SKILLS.map(skill => skill.id));

function normalizeSkillId(raw: string): LanguageSkillId {
  if (CANONICAL_IDS.has(raw as LanguageSkillId)) return raw as LanguageSkillId;
  return TUTOR_TO_CANONICAL[raw] ?? 'vocabulario';
}

export default function LanguagesDashboard() {
  const {
    settings,
    isLoading,
    currentLanguage,
    setLanguage,
    logPracticeMinutes,
  } = useLanguageLearning();

  const {
    data: tracking,
    loading: trackingLoading,
    toggleCompletion,
    setTimeValue,
  } = useSystemsTracking();

  const { weeklyData, streak, loading: weeklyLoading } = useLanguageWeeklyStats(currentLanguage);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('today');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeSkill, setActiveSkill] = useState<LanguageSkillId>('vocabulario');
  const [timerSkill, setTimerSkill] = useState<LanguageSkillId>('vocabulario');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;

  const currentArea: LanguageId = currentLanguage === 'italian' ? 'italiano' : 'ingles';
  const currentLevel = normalizeCefr(
    currentLanguage === 'italian' ? settings?.italianLevel : settings?.englishLevel,
    currentLanguage === 'italian' ? 'A1.1' : 'B1.1'
  );

  const weeklyGoal = getWeekGoalEffective(startOfWeek(new Date(), { weekStartsOn: 1 }), currentArea);
  const dailyGoal = getDayGoalEffective(new Date(), currentArea);

  const todayMinutes = Number(tracking.timeData[currentArea]) || 0;
  const completedSkills = useMemo(
    () =>
      LANGUAGE_SKILLS.filter(skill => !!tracking.completions[skillCompletionKey(currentArea, skill.id)]).length,
    [tracking.completions, currentArea]
  );
  const progress = useMemo(
    () => ({
      completed: completedSkills,
      total: LANGUAGE_SKILLS.length,
      percentage: Math.round((completedSkills / LANGUAGE_SKILLS.length) * 100),
    }),
    [completedSkills]
  );

  const weeklyTotal = useMemo(() => weeklyData.reduce((sum, day) => sum + day.minutes, 0), [weeklyData]);
  const weeklyPercent = weeklyGoal > 0 ? Math.min((weeklyTotal / weeklyGoal) * 100, 100) : 0;

  const pieData = useMemo(
    () =>
      [
        { name: 'Completadas', value: progress.completed, color: 'hsl(var(--success))' },
        { name: 'Pendientes', value: progress.total - progress.completed, color: 'hsl(var(--muted))' },
      ].filter(item => item.value > 0),
    [progress]
  );

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimerSeconds(seconds => seconds + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);

  // Al cambiar de idioma, la sesión en curso pertenece al idioma anterior.
  useEffect(() => {
    setTimerActive(false);
    setTimerSeconds(0);
  }, [currentLanguage]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
  };

  /**
   * Registra práctica en la fuente canónica (`daily_systems_tracking`) y, de
   * paso, mantiene sincronizada la tabla heredada `language_sessions` para el
   * bloque de idiomas del día.
   */
  const registerPractice = async (
    rawSkillId: string,
    minutes: number,
    blockType: 'morning' | 'afternoon' = 'morning',
    languageOverride?: 'english' | 'italian'
  ) => {
    if (minutes <= 0) return;
    const skill = normalizeSkillId(rawSkillId);
    const area: LanguageId =
      languageOverride === 'italian' ? 'italiano' : languageOverride === 'english' ? 'ingles' : currentArea;
    const snapshot = trackingRef.current;
    const current = Number(snapshot.timeData[area]) || 0;
    const key = skillCompletionKey(area, skill);

    setTimeValue(area, current + minutes);
    if (!snapshot.completions[key]) toggleCompletion(key);

    try {
      await logPracticeMinutes(LEGACY_SKILL[skill], minutes, blockType, languageOverride);
    } catch {
      // La fuente canónica ya se guardó; el espejo heredado es best-effort.
    }
  };

  const startTimer = (skillId: LanguageSkillId) => {
    setActiveSkill(skillId);
    setTimerSkill(skillId);
    setTimerSeconds(0);
    setTimerActive(true);
    setActiveTab('practice');
  };

  const startSelectedTimer = () => {
    setTimerSkill(activeSkill);
    setTimerSeconds(0);
    setTimerActive(true);
  };

  const completeTimer = async () => {
    const minutes = Math.ceil(timerSeconds / 60);
    setTimerActive(false);
    if (minutes > 0) {
      const skill = LANGUAGE_SKILLS.find(item => item.id === timerSkill);
      await registerPractice(timerSkill, minutes);
      toast({
        title: 'Práctica guardada',
        description: `${minutes} min de ${skill?.label ?? 'práctica'} añadidos a tu día.`,
      });
    } else {
      toast({
        title: 'Sesión descartada',
        description: 'No llegó a completarse ni un minuto.',
      });
    }
    setTimerSeconds(0);
  };

  const cancelTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  if (isLoading || trackingLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="mx-auto max-w-4xl space-y-5">
        <LanguageHeader
          currentLanguage={currentLanguage}
          onSetLanguage={setLanguage}
          streak={streak}
          level={currentLevel}
        />

        <LanguageQuickStats
          progress={progress}
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          weeklyTotal={weeklyTotal}
          weeklyPercent={weeklyPercent}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-6">
            <TabsTrigger value="today" className="text-[11px] sm:text-sm">
              📝 Hoy
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-[11px] sm:text-sm">
              🎯 Plan
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-[11px] sm:text-sm">
              ⏱️ Práctica
            </TabsTrigger>
            <TabsTrigger value="tutor" className="text-[11px] sm:text-sm">
              🎓 Tutor
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-[11px] sm:text-sm">
              📊 Stats
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="text-[11px] sm:text-sm">
              📚 Vocab
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <LanguageSkillsChecklist
              skills={LANGUAGE_SKILLS}
              completions={tracking.completions}
              skillKeyPrefix={`idioma-${currentArea}`}
              activeSkillId={timerActive ? timerSkill : null}
              onToggle={skillId => toggleCompletion(skillCompletionKey(currentArea, skillId))}
              onStartTimer={startTimer}
            />

            <LanguageTipCard currentLanguage={currentLanguage} />
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <StudyPlanPanel language={currentLanguage} level={currentLevel} />
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            <LanguagePracticeTimerCard
              skills={LANGUAGE_SKILLS}
              timerActive={timerActive}
              timerSeconds={timerSeconds}
              selectedSkill={timerSkill}
              onSelectSkill={skillId => {
                setActiveSkill(skillId);
                setTimerSkill(skillId);
              }}
              onStart={startSelectedTimer}
              onComplete={completeTimer}
              onCancel={cancelTimer}
              formatTime={formatTime}
            />

            <LanguageResourcesCard language={currentLanguage} />
          </TabsContent>

          <TabsContent value="tutor" className="space-y-4" forceMount>
            <LanguageTutorPanel
              language={currentLanguage}
              level={currentLevel}
              active={activeTab === 'tutor'}
              onLogPractice={registerPractice}
            />
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

          <TabsContent value="vocabulary" className="space-y-4">
            <VocabularyPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
