import { BookOpen, MessageCircle, Timer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Language } from '@/hooks/useLanguageLearning';
import { LanguagePracticeTimerCard } from './LanguagePracticeTimerCard';
import { LanguageResourcesCard } from './LanguageResourcesCard';
import { LanguageTutorPanel, type TutorRequest } from './LanguageTutorPanel';
import VocabularyPanel from './VocabularyPanel';
import { LANGUAGE_SKILLS, type LanguageSkillId } from './skills';

export type PracticeView = 'tutor' | 'timer' | 'vocab';

export function PracticePanel({
  language,
  level,
  view,
  onViewChange,
  active,
  request,
  onRequestHandled,
  onLogPractice,
  timerActive,
  timerSeconds,
  timerSkill,
  onSelectSkill,
  onStartTimer,
  onCompleteTimer,
  onCancelTimer,
  formatTime,
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
  timerActive: boolean;
  timerSeconds: number;
  timerSkill: LanguageSkillId;
  onSelectSkill: (skill: LanguageSkillId) => void;
  onStartTimer: () => void;
  onCompleteTimer: () => void;
  onCancelTimer: () => void;
  formatTime: (seconds: number) => string;
}) {
  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={value => onViewChange(value as PracticeView)}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
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

        {/* El tutor se queda montado: así no se corta una conversación al
            cambiar de sub-pestaña. `active` decide si la voz y el micro viven. */}
        <TabsContent value="tutor" forceMount className="mt-3 data-[state=inactive]:hidden">
          <LanguageTutorPanel
            language={language}
            level={level}
            active={active && view === 'tutor'}
            request={request}
            onRequestHandled={onRequestHandled}
            onLogPractice={onLogPractice}
          />
        </TabsContent>

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
