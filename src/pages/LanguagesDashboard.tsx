import { useEffect, useMemo, useRef, useState } from 'react';
import { startOfWeek } from 'date-fns';
import { BarChart3, CalendarRange, Dumbbell, Home } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { useLanguageWeeklyStats } from '@/hooks/useLanguageWeeklyStats';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { useLanguageStudyPlan } from '@/hooks/useLanguageStudyPlan';
import { useLanguageFocus } from '@/hooks/useLanguageFocus';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useToast } from '@/hooks/use-toast';
import { getDayGoalEffective, getWeekGoalEffective } from '@/lib/hierarchy';
import {
  getMonthLanguagePlans,
  normalizeCefr,
  skillCompletionKey,
  type LanguageId,
  type LanguageSkillId,
} from '@/lib/languagePlan';
import type { StudyErrorCategory } from '@/lib/languageStudyPlan';
import { STUDY_ERROR_CATEGORIES } from '@/lib/languageStudyPlan';
import { LanguageHero } from '@/components/languages/LanguageHero';
import { FocusSkillPicker } from '@/components/languages/FocusSkillPicker';
import { TodaySessionPath, type SessionStepState } from '@/components/languages/TodaySessionPath';
import { SkillMap } from '@/components/languages/SkillMap';
import { TutorRailCard } from '@/components/languages/TutorRailCard';
import { ReviewQueueCard } from '@/components/languages/ReviewQueueCard';
import { FocusTacticCard } from '@/components/languages/FocusTacticCard';
import { ReviewSheet, type ReviewItem } from '@/components/languages/ReviewSheet';
import { SessionCloseSheet } from '@/components/languages/SessionCloseSheet';
import { LanguageProgressPanel } from '@/components/languages/LanguageProgressPanel';
import { PracticePanel, type PracticeView } from '@/components/languages/PracticePanel';
import { StudyPlanPanel } from '@/components/languages/StudyPlanPanel';
import { LanguageTipCard } from '@/components/languages/LanguageTipCard';
import {
  composeSession,
  sessionMinutes,
  SKILL_CATALOG,
  tacticPrompt,
  type SessionStep,
} from '@/components/languages/playbook';
import { LANGUAGE_SKILLS } from '@/components/languages/skills';
import type { TutorRequest } from '@/components/languages/LanguageTutorPanel';
import { getCubaDate } from '@/lib/cubaTime';

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

const CANONICAL_TO_TUTOR = {
  gramatica: 'grammar',
  vocabulario: 'vocabulary',
  'lectura-l': 'reading',
  listening: 'listening',
  speaking: 'speaking',
  escritura: 'writing',
} as const;

const CANONICAL_IDS = new Set<LanguageSkillId>(LANGUAGE_SKILLS.map(skill => skill.id));

function normalizeSkillId(raw: string): LanguageSkillId {
  if (CANONICAL_IDS.has(raw as LanguageSkillId)) return raw as LanguageSkillId;
  return TUTOR_TO_CANONICAL[raw] ?? 'vocabulario';
}

const CLOSED_KEY = 'languages-session-closed-v1';

/** Horas antes de que una palabra en repaso vuelva a la cola. */
const REVIEW_COOLDOWN_HOURS = 20;

function hoursSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return (Date.now() - time) / 36e5;
}

function readClosedKeys(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CLOSED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/** Lleva la vista a las pestañas tras abrir el tutor o el temporizador. */
function scrollToTabs() {
  window.setTimeout(() => {
    document.getElementById('language-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

export default function LanguagesDashboard() {
  const { settings, isLoading, currentLanguage, setLanguage, logPracticeMinutes } = useLanguageLearning();
  const { data: tracking, loading: trackingLoading, toggleCompletion, setTimeValue } = useSystemsTracking();
  const { weeklyData, history, streak, skillDays, skillLastDate, loading: weeklyLoading } =
    useLanguageWeeklyStats(currentLanguage);
  const { toast } = useToast();
  const { words, updateWord } = useVocabulary();
  const focus = useLanguageFocus();

  const [activeTab, setActiveTab] = useState('today');
  const [practiceView, setPracticeView] = useState<PracticeView>('tutor');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerSkill, setTimerSkill] = useState<LanguageSkillId>('vocabulario');
  const [tutorRequest, setTutorRequest] = useState<TutorRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closedKeys, setClosedKeys] = useState<Record<string, boolean>>(readClosedKeys);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;
  const requestSeq = useRef(0);

  const currentArea: LanguageId = currentLanguage === 'italian' ? 'italiano' : 'ingles';
  const currentLevel = normalizeCefr(
    currentLanguage === 'italian' ? settings?.italianLevel : settings?.englishLevel,
    currentLanguage === 'italian' ? 'A1.1' : 'B1.1'
  );

  const studyPlan = useLanguageStudyPlan(currentLanguage, currentLevel);

  const weeklyGoal = getWeekGoalEffective(startOfWeek(new Date(), { weekStartsOn: 1 }), currentArea);
  const dailyGoal = getDayGoalEffective(new Date(), currentArea);

  const doneIds = useMemo(
    () => LANGUAGE_SKILLS.filter(skill => !!tracking.completions[skillCompletionKey(currentArea, skill.id)]).map(skill => skill.id),
    [tracking.completions, currentArea]
  );
  const completedSkills = doneIds.length;
  const todayMinutes = Number(tracking.timeData[currentArea]) || 0;

  // El anillo y las barras salen de la BD, que puede ir un guardado por detrás.
  // El día de hoy se pinta con el estado optimista de `useSystemsTracking`.
  const todayKey = getCubaDate();
  const weeklyDataLive = useMemo(
    () =>
      weeklyData.map(day =>
        day.date === todayKey
          ? { ...day, minutes: todayMinutes, skills: Math.max(day.skills, completedSkills) }
          : day
      ),
    [weeklyData, todayKey, todayMinutes, completedSkills]
  );

  const weeklyTotal = useMemo(() => weeklyDataLive.reduce((sum, day) => sum + day.minutes, 0), [weeklyDataLive]);
  const weeklyPercent = weeklyGoal > 0 ? Math.min((weeklyTotal / weeklyGoal) * 100, 100) : 0;

  // Mismo criterio optimista para las 6 habilidades: si hoy ya la marcaste,
  // cuenta como día practicado aunque el guardado aún no haya vuelto de la BD.
  const skillDaysLive = useMemo(() => {
    const next: Record<string, number> = { ...skillDays };
    doneIds.forEach(id => {
      next[id] = Math.min(7, Math.max(next[id] ?? 0, 1));
    });
    return next;
  }, [skillDays, doneIds]);

  const skillLastDateLive = useMemo(() => {
    if (doneIds.length === 0) return skillLastDate;
    const next: Record<string, string> = { ...skillLastDate };
    doneIds.forEach(id => {
      next[id] = todayKey;
    });
    return next;
  }, [skillLastDate, doneIds, todayKey]);

  const historyLive = useMemo(
    () =>
      history.map(day =>
        day.date === todayKey
          ? { ...day, minutes: todayMinutes, skills: Array.from(new Set([...day.skills, ...doneIds])) }
          : day
      ),
    [history, todayKey, todayMinutes, doneIds]
  );

  // La racha de la BD ya contempla ayer cuando hoy aún no está guardado. Si la
  // sesión de hoy está en marcha, se suma el día en curso una sola vez y solo
  // cuando las estadísticas ya cargaron (si no, se inflaría al arrancar).
  const todayRow = history.find(day => day.date === todayKey) ?? null;
  const todayActiveDb = !!todayRow && (todayRow.minutes > 0 || todayRow.skills.length > 0);
  const todayActiveLive = todayMinutes > 0 || completedSkills > 0;
  const streakLive = !weeklyLoading && todayActiveLive && !todayActiveDb ? streak + 1 : streak;

  // Sin foco explícito se sugiere la habilidad con menos días practicados y,
  // en empate, la que lleva más tiempo sin tocarse.
  const suggestedFocus = useMemo<LanguageSkillId | null>(() => {
    const ranked = [...SKILL_CATALOG].sort((a, b) => {
      const daysA = skillDaysLive[a.id] ?? 0;
      const daysB = skillDaysLive[b.id] ?? 0;
      if (daysA !== daysB) return daysA - daysB;
      const lastA = skillLastDateLive[a.id] ?? '';
      const lastB = skillLastDateLive[b.id] ?? '';
      return lastA.localeCompare(lastB);
    });
    return ranked[0]?.id ?? null;
  }, [skillDaysLive, skillLastDateLive]);

  const focusMeta = focus.skill ? SKILL_CATALOG.find(item => item.id === focus.skill) ?? null : null;
  const tacticMeta =
    (focus.skill ? focusMeta : null) ??
    (suggestedFocus ? SKILL_CATALOG.find(item => item.id === suggestedFocus) ?? null : null);

  const closeKey = `${currentLanguage}:${todayKey}`;
  const closedToday = !!closedKeys[closeKey];

  const sessionSteps = useMemo<SessionStepState[]>(() => {
    const base = composeSession(studyPlan.tasksToday, focus.skill);
    return base.map(step => {
      if (step.kind === 'task') {
        const task = studyPlan.tasksToday.find(item => item.id === step.taskId);
        return { ...step, done: !!task?.done };
      }
      if (step.kind === 'focus' && step.skill) {
        return { ...step, done: !!tracking.completions[skillCompletionKey(currentArea, step.skill)] };
      }
      return { ...step, done: closedToday };
    });
  }, [studyPlan.tasksToday, focus.skill, tracking.completions, currentArea, closedToday]);

  const nextStep = sessionSteps.find(step => !step.done) ?? null;
  const sessionTotalMinutes = sessionMinutes(sessionSteps);
  const sessionDoneSteps = sessionSteps.filter(step => step.done).length;

  const languageWords = useMemo(
    () => words.filter(word => (word.language || 'english') === currentLanguage),
    [words, currentLanguage]
  );

  const vocabularyStats = useMemo(
    () => ({
      total: languageWords.length,
      learned: languageWords.filter(word => word.status === 'learned').length,
      learning: languageWords.filter(word => word.status === 'learning').length,
      fresh: languageWords.filter(word => !word.status || word.status === 'new').length,
    }),
    [languageWords]
  );

  const dueWords = useMemo(
    () =>
      languageWords
        .filter(word => {
          if (!word.translation) return false;
          const status = word.status || 'new';
          if (status === 'new') return true;
          return status === 'learning' && hoursSince(word.updated_at) >= REVIEW_COOLDOWN_HOURS;
        })
        .sort((a, b) => {
          const rankA = a.status === 'learning' ? 0 : 1;
          const rankB = b.status === 'learning' ? 0 : 1;
          if (rankA !== rankB) return rankA - rankB;
          return (a.created_at ?? '').localeCompare(b.created_at ?? '');
        }),
    [languageWords]
  );

  const reviewQueue = useMemo(
    () => ({
      dueWords: dueWords.length,
      pendingErrors: studyPlan.pendingErrors.length,
      total: dueWords.length + studyPlan.pendingErrors.length,
      nextWords: dueWords.slice(0, 8).map(word => word.word),
    }),
    [dueWords, studyPlan.pendingErrors]
  );

  const selfEvaluation = useMemo(
    () => getMonthLanguagePlans(new Date())[currentArea].selfEvaluation,
    [currentArea]
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
    setTutorRequest(null);
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

  const openTutor = (skill: LanguageSkillId, prompt: string, title?: string) => {
    requestSeq.current += 1;
    setTutorRequest({
      skill: CANONICAL_TO_TUTOR[skill],
      prompt,
      title,
      nonce: requestSeq.current,
    });
    setPracticeView('tutor');
    setActiveTab('practice');
    scrollToTabs();
  };

  const learnSkill = (skill: LanguageSkillId) => {
    const meta = SKILL_CATALOG.find(item => item.id === skill);
    openTutor(skill, tacticPrompt(skill, currentLevel), meta ? `Sesión · ${meta.label}` : undefined);
  };

  const openStep = (step: SessionStep) => {
    if (step.kind === 'close') {
      setCloseOpen(true);
      return;
    }
    if (!step.skill) return;
    const base = tacticPrompt(step.skill, currentLevel);
    const prompt =
      step.kind === 'task'
        ? `${base}\n\nTarea de hoy del plan: ${step.title}.\n${step.detail}\nDuración orientativa: ${step.minutes} min.`
        : base;
    openTutor(step.skill, prompt, `Hoy · ${step.title}`);
  };

  const toggleStep = (step: SessionStep) => {
    if (step.kind === 'task' && step.taskId) {
      studyPlan.toggleTask(step.taskId);
      return;
    }
    if (step.kind === 'focus' && step.skill) {
      toggleCompletion(skillCompletionKey(currentArea, step.skill));
      return;
    }
    if (closedToday) {
      const next = { ...closedKeys };
      delete next[closeKey];
      setClosedKeys(next);
      try {
        localStorage.setItem(CLOSED_KEY, JSON.stringify(next));
      } catch {
        // Sin almacenamiento: el cierre vive en memoria.
      }
    } else {
      setCloseOpen(true);
    }
  };

  const markClosed = () => {
    const next = { ...closedKeys, [closeKey]: true };
    setClosedKeys(next);
    try {
      localStorage.setItem(CLOSED_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento: el cierre vive en memoria.
    }
  };

  const toggleSkillDone = (skill: LanguageSkillId) => {
    toggleCompletion(skillCompletionKey(currentArea, skill));
  };

  const startSkillTimer = (skill: LanguageSkillId) => {
    setTimerSkill(skill);
    setTimerSeconds(0);
    setTimerActive(true);
    setPracticeView('timer');
    setActiveTab('practice');
    scrollToTabs();
  };

  const startSelectedTimer = () => {
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
      toast({ title: 'Sesión descartada', description: 'No llegó a completarse ni un minuto.' });
    }
    setTimerSeconds(0);
  };

  const cancelTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const openReview = () => {
    const items: ReviewItem[] = [
      ...dueWords.slice(0, 8).map<ReviewItem>(word => ({
        id: word.id,
        kind: 'word',
        prompt: word.word,
        answer: word.translation || '',
        hint: word.context_en || word.context_es || null,
        badge: word.status === 'learning' ? 'En repaso' : 'Nueva',
      })),
      ...studyPlan.pendingErrors.slice(0, 4).map<ReviewItem>(entry => ({
        id: entry.id,
        kind: 'error',
        prompt: entry.wrong,
        answer: entry.correct,
        hint: entry.note || null,
        badge: STUDY_ERROR_CATEGORIES.find(item => item.id === entry.category)?.label ?? entry.category,
      })),
    ];
    if (items.length === 0) {
      toast({ title: 'Nada que repasar', description: 'Guarda palabras o errores para llenar la cola.' });
      return;
    }
    setReviewItems(items);
    setReviewOpen(true);
  };

  const gradeReviewItem = (item: ReviewItem, known: boolean) => {
    if (item.kind === 'word') {
      const word = languageWords.find(entry => entry.id === item.id);
      void updateWord(item.id, {
        status: known ? 'learned' : 'learning',
        review_count: (word?.review_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      });
      return;
    }
    // La cola solo trae errores pendientes: si acertó, sale del repaso.
    if (known) studyPlan.toggleErrorReviewed(item.id);
  };

  const finishReview = async (minutes: number, summary: { known: number; total: number }) => {
    const skill: LanguageSkillId = reviewItems.some(item => item.kind === 'word') ? 'vocabulario' : 'gramatica';
    setReviewOpen(false);
    await registerPractice(skill, minutes);
    toast({
      title: 'Repaso guardado',
      description: `${summary.known}/${summary.total} recuperadas · ${minutes} min de ${SKILL_CATALOG.find(item => item.id === skill)?.label ?? 'repaso'}.`,
    });
  };

  const addError = (input: {
    wrong: string;
    correct: string;
    note: string;
    category: StudyErrorCategory;
  }) => studyPlan.addError(input);

  if (isLoading || trackingLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 pb-24">
        <div className="mx-auto max-w-6xl space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pt-20 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        <LanguageHero
          currentLanguage={currentLanguage}
          onSetLanguage={setLanguage}
          level={currentLevel}
          streak={streakLive}
          goal={studyPlan.today?.theme ?? studyPlan.week?.focus ?? 'Sesión de hoy'}
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          weekMinutes={weeklyTotal}
          weekGoal={weeklyGoal}
          weekPercent={weeklyPercent}
          doneIds={doneIds}
          completedToday={completedSkills}
          totalSkills={LANGUAGE_SKILLS.length}
          sessionTotalMinutes={sessionTotalMinutes}
          sessionDoneSteps={sessionDoneSteps}
          sessionTotalSteps={sessionSteps.length}
          reviewCount={reviewQueue.total}
          onStartSession={() => {
            if (nextStep) openStep(nextStep);
            else setActiveTab('today');
          }}
          onSpeak={() => learnSkill('speaking')}
          onReview={openReview}
        />

        <FocusSkillPicker
          mode={focus.mode}
          onModeChange={focus.setMode}
          skill={focus.skill}
          label={focus.label}
          suggested={suggestedFocus}
          onSelect={focus.setSkill}
          onClear={focus.clear}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList id="language-tabs" className="grid h-auto w-full grid-cols-4 gap-1">
            <TabsTrigger value="today" className="gap-1.5 text-[11px] sm:text-sm">
              <Home className="h-3.5 w-3.5" />
              Hoy
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-1.5 text-[11px] sm:text-sm">
              <Dumbbell className="h-3.5 w-3.5" />
              Practicar
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1.5 text-[11px] sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              Progreso
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5 text-[11px] sm:text-sm">
              <CalendarRange className="h-3.5 w-3.5" />
              Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
              <div className="space-y-3">
                <div id="session-path">
                  <TodaySessionPath
                    steps={sessionSteps}
                    weekLabel={
                      studyPlan.week ? `Semana ${studyPlan.currentWeek} · ${studyPlan.week.title}` : undefined
                    }
                    focus={focusMeta?.label ?? null}
                    onStart={openStep}
                    onToggle={toggleStep}
                  />
                </div>

                <SkillMap
                  doneIds={doneIds}
                  focus={focus.skill}
                  focusMode={focus.mode}
                  weekDays={skillDaysLive}
                  lastDate={skillLastDateLive}
                  onToggle={toggleSkillDone}
                  onLearn={learnSkill}
                  onTimer={startSkillTimer}
                  onFocus={focus.toggleSkill}
                />

                <LanguageTipCard currentLanguage={currentLanguage} />
              </div>

              <aside className="space-y-3 self-start lg:sticky lg:top-24">
                <TutorRailCard
                  language={currentLanguage}
                  level={currentLevel}
                  focusLabel={focusMeta?.label ?? null}
                  onSpeak={() => learnSkill('speaking')}
                  onWrite={() => learnSkill('escritura')}
                  onOpen={() => {
                    setPracticeView('tutor');
                    setActiveTab('practice');
                    scrollToTabs();
                  }}
                />
                <ReviewQueueCard queue={reviewQueue} onOpen={openReview} />
                <FocusTacticCard
                  skillId={tacticMeta?.id ?? null}
                  isFocus={!!focus.skill && tacticMeta?.id === focus.skill}
                  onPractice={learnSkill}
                />
              </aside>
            </div>
          </TabsContent>

          {/* forceMount conserva la conversación y el temporizador al cambiar de
              pestaña; `active` es lo que apaga voz y micro. */}
          <TabsContent value="practice" forceMount className="mt-3 data-[state=inactive]:hidden">
            <PracticePanel
              language={currentLanguage}
              level={currentLevel}
              active={activeTab === 'practice'}
              view={practiceView}
              onViewChange={setPracticeView}
              request={tutorRequest}
              onRequestHandled={() => setTutorRequest(null)}
              onLogPractice={registerPractice}
              timerActive={timerActive}
              timerSeconds={timerSeconds}
              timerSkill={timerSkill}
              onSelectSkill={setTimerSkill}
              onStartTimer={startSelectedTimer}
              onCompleteTimer={completeTimer}
              onCancelTimer={cancelTimer}
              formatTime={formatTime}
            />
          </TabsContent>

          <TabsContent value="progress" className="mt-3">
            {weeklyLoading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map(index => (
                    <Skeleton key={index} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
                <div className="grid gap-3 lg:grid-cols-2">
                  <Skeleton className="h-44 w-full rounded-2xl" />
                  <Skeleton className="h-44 w-full rounded-2xl" />
                </div>
              </div>
            ) : (
              <LanguageProgressPanel
                level={currentLevel}
                weeklyData={weeklyDataLive}
                history={historyLive}
                streak={streakLive}
                skillDays={skillDaysLive}
                selfEvaluation={selfEvaluation}
                errors={studyPlan.errors}
                vocabulary={vocabularyStats}
                weekProgress={studyPlan.weekProgress}
                dailyGoal={dailyGoal}
                weeklyGoal={weeklyGoal}
              />
            )}
          </TabsContent>

          <TabsContent value="plan" className="mt-3">
            <StudyPlanPanel language={currentLanguage} level={currentLevel} />
          </TabsContent>
        </Tabs>
      </div>

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        items={reviewItems}
        onGrade={gradeReviewItem}
        onComplete={finishReview}
      />

      <SessionCloseSheet
        open={closeOpen}
        onOpenChange={setCloseOpen}
        language={currentLanguage}
        onAddError={addError}
        onFinish={() => {
          markClosed();
          toast({ title: 'Sesión cerrada', description: 'Mañana la cola de repaso empieza por tus errores.' });
        }}
      />
    </div>
  );
}
