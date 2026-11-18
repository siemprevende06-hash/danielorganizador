import { BookOpen, MessageCircle, Mic, Timer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Language } from '@/hooks/useLanguageLearning';
import type { SpeakingSessionRecord } from '@/hooks/useSpeakingSessions';
import { LanguagePracticeTimerCard } from './LanguagePracticeTimerCard';
import { LanguageResourcesCard } from './LanguageResourcesCard';
import { LanguageTutorPanel, type TutorErrorInput, type TutorRequest } from './LanguageTutorPanel';
import VocabularyPanel from './VocabularyPanel';
import { LANGUAGE_SKILLS, type LanguageSkillId } from './skills';

export type PracticeView = 'speaking' | 'tutor' | 'timer' | 'vocab';

export function PracticePanel({
  language,
  level,
  view,
  onViewChange,
  active,
  request,
  onRequestHandled,
  onLogPractice,
  onAddError,
  onShowProgress,
  onSessionComplete,
  timerActive,
  timerSeconds,
  timerSkill,
  onSelectSkill,
  onStartTimer,
  onCompleteTimer,
  onCancelTimer,
  formatTime,
  timerBusy,
  onTimerStateChange,
}: {
  language: Language;
  level: string;
  view: PracticeView;
  onViewChange: (view: PracticeView) => void;
  /** La pestaña Practicar del dashboard está visible. */
  active: boolean;
  request: TutorRequest | null;
  onRequestHandled: () => void;
  onLogPractice: (
    skillId: string,
    minutes: number,
    blockType: 'morning' | 'afternoon',
    language?: Language
  ) => Promise<void>;
  onAddError: (input: TutorErrorInput) => Promise<void> | void;
  onShowProgress: () => void;
  onSessionComplete: (record: SpeakingSessionRecord) => void;
  timerActive: boolean;
  timerSeconds: number;
  timerSkill: LanguageSkillId;
  onSelectSkill: (id: LanguageSkillId) => void;
  onStartTimer: () => void;
  onCompleteTimer: () => void;
  onCancelTimer: () => void;
  formatTime: (seconds: number) => string;
  /** Hay un cronómetro del tutor en marcha (B6). */
  timerBusy: boolean;
  onTimerStateChange: (running: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={value => onViewChange(value as PracticeView)}>
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1">
          <TabsTrigger value="speaking" className="gap-1.5 text-[11px] sm:text-xs">
            <Mic className="h-3.5 w-3.5" />
            Hablar
          </TabsTrigger>
          <TabsTrigger value="tutor" className="gap-1.5 text-[11px] sm:text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            Tutor IA
          </TabsTrigger>
          <TabsTrigger value="timer" className="gap-1.5 text-[11px] sm:text-xs">
            <Timer className="h-3.5 w-3.5" />
            Temporizador
          </TabsTrigger>
          <TabsTrigger value="vocab" className="gap-1.5 text-[11px] sm:text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Vocabulario
          </TabsTrigger>
        </TabsList>

        {/* El tutor vive una sola vez, fuera de las pestañas: así Speaking y
            Tutor comparten la misma conversación y cambiar de pestaña no corta
            nada. `active` decide si la voz y el micro viven. */}
        <div className={view === 'speaking' || view === 'tutor' ? 'mt-3' : 'mt-3 hidden'}>
          <LanguageTutorPanel
            language={language}
            level={level}
            active={active && (view === 'speaking' || view === 'tutor')}
            speakingFocus={view === 'speaking'}
            request={request}
            onRequestHandled={onRequestHandled}
            onLogPractice={onLogPractice}
            onAddError={onAddError}
            onShowProgress={onShowProgress}
            onSessionComplete={onSessionComplete}
            timerBusy={timerBusy}
            onTimerStateChange={onTimerStateChange}
          />
        </div>

        <TabsContent value="timer" className="mt-3">
          <LanguagePracticeTimerCard
            skills={LANGUAGE_SKILLS}
            timerActive={timerActive}
            timerSeconds={timerSeconds}
            selectedSkill={timerSkill}
            onSelectSkill={onSelectSkill}
            onStart={onStartTimer}
            onComplete={onCompleteTimer}
            onCancel={onCancelTimer}
            formatTime={formatTime}
            disabled={timerBusy && !timerActive && timerSeconds === 0}
            disabledReason="Hay una sesión de Speaking en marcha. Termínala o pausa su cronómetro para usar este temporizador."
          />
        </TabsContent>

        <TabsContent value="vocab" className="mt-3">
          <VocabularyPanel />
        </TabsContent>
      </Tabs>

      <LanguageResourcesCard language={language} />
    </div>
  );
}
