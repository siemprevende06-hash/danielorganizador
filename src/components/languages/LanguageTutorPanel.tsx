import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowDown,
  BookMarked,
  CheckCircle2,
  CornerDownLeft,
  Gauge,
  Hand,
  History,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Pause,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings2,
  Sparkles,
  Square,
  Timer,
  Trash2,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VisualBlock, VisualCanvas } from '@/components/coach/VisualCanvas';
import { useLanguageTutor, type TutorConversation } from '@/hooks/useLanguageTutor';
import { useLanguageTutorCoach } from '@/hooks/useLanguageTutorCoach';
import { AiModelBadge } from '@/components/ai/AiModelBadge';
import { EMPTY_FINISH, usePracticeSession } from '@/hooks/usePracticeSession';
import { useMicLevel } from '@/hooks/useMicLevel';
import { limpiarRepeticiones, useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Language } from '@/hooks/useLanguageLearning';
import { buildSpeakingRecord, type SpeakingSessionRecord } from '@/hooks/useSpeakingSessions';
import type { StudyErrorCategory } from '@/lib/languageStudyPlan';
import {
  computeSpeakingMetrics,
  inferErrorCategory,
  levelBand,
  levelDistance,
  normalizarTexto,
  parseSummaryErrors,
  type SummaryError,
} from '@/lib/speakingMetrics';
import { TUTOR_EMPTY, TUTOR_GENERAL, TUTOR_HEADER, TUTOR_MODES, type TutorModeDef, type TutorSkill } from './tutorModes';
import { SCENARIO_END_MSG, SCENARIO_START_MSG, SESSION_END_MSG, SPEAKING_SCENARIOS } from './speakingScenarios';
import { SPEAKING_STRUCTURES, type SpeakingStructure } from './speakingStructures';
import { TutorFeedbackBubble } from './TutorFeedbackBubble';
import { TutorSuggestionCard } from './TutorSuggestionCard';
import { TutorVoiceFullscreen } from './TutorVoiceFullscreen';
import { VoicePicker, type VoiceSection } from './VoicePicker';
import { TutorAvatar } from './TutorAvatar';
import { SpeakingStructuresPanel } from './SpeakingStructuresPanel';
import { ActiveStructurePanel } from './ActiveStructurePanel';
import { StructureReviewCard } from './StructureReviewCard';
import { SpeakingSessionReport, type SpeakingReportData } from './SpeakingSessionReport';
import { PronunciationTrainer } from './PronunciationTrainer';
import { SpeakingOnboarding, type MicTestState } from './SpeakingOnboarding';

const md: Components = {
  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">{children}</code>,
  a: ({ children, ...props }) => (
    <a className="text-primary underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b bg-muted/50 px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
};

const ACCION_LABEL: Record<string, string> = {
  palabra_guardada: 'Palabra guardada en tu Vocabulario',
  practica_registrada: 'Práctica registrada en tus estadísticas',
  memoria_guardada: 'Anotado en la memoria del Tutor',
};

const SESSION_GOALS = [5, 10, 15, 20];

const ONBOARDING_KEY = 'languages-speaking-onboarding-v1';
const PINS_KEY = 'languages-tutor-pins-v1';
const CUSTOM_STRUCTURES_KEY = 'languages-speaking-structures-v1';
const STRUCTURE_SRS_KEY = 'languages-speaking-structure-srs-v1';

interface StructureSrsEntry {
  fails: number;
  uses: number;
  last: string;
}
type StructureSrs = Record<string, StructureSrsEntry>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: la preferencia dura lo que la sesión.
  }
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // noop
  }
}

function readCustomStructures(language: Language): SpeakingStructure[] {
  const store = readJson<Record<string, SpeakingStructure[]>>(CUSTOM_STRUCTURES_KEY, {});
  const items = store[language];
  return Array.isArray(items) ? items : [];
}

function persistCustomStructures(language: Language, items: SpeakingStructure[]) {
  const store = readJson<Record<string, SpeakingStructure[]>>(CUSTOM_STRUCTURES_KEY, {});
  store[language] = items.slice(0, 20);
  writeJson(CUSTOM_STRUCTURES_KEY, store);
}

const readPins = () => {
  const value = readJson<string[]>(PINS_KEY, []);
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
};

const readStructureSrs = () => readJson<StructureSrs>(STRUCTURE_SRS_KEY, {});

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Arranque externo del tutor: el dashboard manda la habilidad y el prompt de la
 * táctica para que la sesión empiece sola, sin que el usuario copie nada.
 */
export interface TutorRequest {
  skill: TutorSkill;
  prompt: string;
  /** Cambia en cada petición; es lo que dispara el efecto. */
  nonce: number;
  title?: string;
}

/** Error listo para el cuaderno de repaso. */
export interface TutorErrorInput {
  wrong: string;
  correct: string;
  note: string;
  category: StudyErrorCategory;
}

interface Props {
  language: Language;
  level: string;
  /** false cuando la pestaña del tutor no está visible: corta voz y micro. */
  active?: boolean;
  /** La pestaña Speaking está seleccionada: fuerza el modo conversación. */
  speakingFocus?: boolean;
  /** Petición de arranque lanzada desde la sesión guiada o el mapa de habilidades. */
  request?: TutorRequest | null;
  onRequestHandled?: () => void;
  onLogPractice?: (
    skillId: string,
    minutes: number,
    blockType: 'morning' | 'afternoon',
    language?: Language
  ) => Promise<void>;
  onAddError?: (input: TutorErrorInput) => Promise<void> | void;
  onShowProgress?: () => void;
  onSessionComplete?: (record: SpeakingSessionRecord) => void;
  /** Hay un temporizador del dashboard en marcha (B6): el del tutor se bloquea. */
  timerBusy?: boolean;
  /** Avisa al dashboard de que el cronómetro del tutor está en marcha. */
  onTimerStateChange?: (running: boolean) => void;
}

export function LanguageTutorPanel({
  language,
  level,
  active = true,
  speakingFocus = false,
  request = null,
  onRequestHandled,
  onLogPractice,
  onAddError,
  onShowProgress,
  onSessionComplete,
  timerBusy = false,
  onTimerStateChange,
}: Props) {
  const [mode, setMode] = useState<TutorSkill | null>(null);
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState<string | null>(null);
  const [autoSend, setAutoSend] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [micArmed, setMicArmed] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [feedbackOn, setFeedbackOn] = useState(false);
  const [suggestOn, setSuggestOn] = useState(false);
  const [longTalk, setLongTalk] = useState(true);
  const [structuresOpen, setStructuresOpen] = useState(false);
  const [activeStructure, setActiveStructure] = useState<SpeakingStructure | null>(null);
  const [customStructures, setCustomStructures] = useState<SpeakingStructure[]>(() => readCustomStructures(language));
  const [structureSrs, setStructureSrs] = useState<StructureSrs>(() => readStructureSrs());
  const [sessionGoal, setSessionGoal] = useState(10);
  const [pendingLaunch, setPendingLaunch] = useState<TutorRequest | null>(null);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [report, setReport] = useState<SpeakingReportData | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [errorsSaved, setErrorsSaved] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string[]>([]);
  const [pronunciation, setPronunciation] = useState<{ open: boolean; phrase: string | null }>({
    open: false,
    phrase: null,
  });
  const [historyQuery, setHistoryQuery] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [pins, setPins] = useState<string[]>(() => readPins());
  const [deleteTarget, setDeleteTarget] = useState<TutorConversation | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(() => readFlag(ONBOARDING_KEY));
  const [micTest, setMicTest] = useState<MicTestState>('idle');
  const [editDraft, setEditDraft] = useState<{ id: string; text: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSendRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  /** true cuando la grabación viene del botón de pantalla completa (siempre envía al soltar) */
  const fullSendRef = useRef(false);
  /** Mensajes ya evaluados: evita repetir la llamada de feedback. */
  const evaluatedRef = useRef<Set<string>>(new Set());
  /** Respuestas cuya revisión de estructura ya se pidió. */
  const reviewedRef = useRef<Set<string>>(new Set());
  /** Última respuesta del tutor para la que ya se pidió sugerencia. */
  const suggestionForRef = useRef<string | null>(null);
  const goalReachedRef = useRef(false);
  const sessionElapsedRef = useRef(0);
  /** Habilidad real de la sesión: se fija al arrancar el cronómetro (B1). */
  const sessionSkillRef = useRef<string | null>(null);
  /** Índice de mensajes al arrancar la sesión: las métricas no cuentan el historial. */
  const sessionMessageStartRef = useRef(0);
  /** Última petición de arranque ya ejecutada (evita dobles en StrictMode). */
  const handledRequestRef = useRef<number | null>(null);
  /** Idioma al que pertenece la sesión en curso (no cambia al cambiar de idioma). */
  const sessionLanguageRef = useRef<Language>(language);
  const awaitingSummaryRef = useRef(false);
  const summaryMarkerRef = useRef(0);
  const queuedFinishRef = useRef(false);
  const queuedSummaryRef = useRef(false);
  const micTestRef = useRef<MicTestState>('idle');
  const updatedSrsRef = useRef<Set<string>>(new Set());
  const scenarioStartRef = useRef(0);
  const goalOfferedRef = useRef(false);

  const {
    conversations,
    conversationId,
    messages,
    memories,
    loading,
    error,
    engine,
    sendMessage,
    stop,
    openConversation,
    newConversation,
    deleteConversation,
    restoreConversation,
    renameConversation,
    persistUserMeta,
    editUserMessage,
    deleteMemory,
  } = useLanguageTutor(language, level, mode);

  const {
    feedback,
    evaluating,
    explainingId,
    evaluate,
    explain,
    suggestion,
    suggestionLoading,
    suggestionError,
    suggest,
    clearSuggestion,
    structureLoading,
    structureError,
    generateStructure,
    structureReviews,
    structureReviewing,
    structureReviewErrors,
    clearStructureReviews,
    hydrate,
    reset: resetCoach,
  } = useLanguageTutorCoach(language, level);

  const speechLang = language === 'italian' ? 'it-IT' : 'en-US';
  const {
    supported: speechSupported,
    speakingId,
    speaking,
    isSpeaking,
    speak,
    speakStream,
    stop: stopSpeak,
    autoSpeak,
    setAutoSpeak,
    rate,
    setRate,
    voiceOk,
    voices: tutorVoices,
    voice: tutorVoice,
    voiceURI: tutorVoiceURI,
    setVoiceURI: setTutorVoiceURI,
    naturalVoices: tutorNaturalVoices,
  } = useSpeechSynthesis(speechLang, 1);

  // Voz aparte en español: la explicación del error se lee en su idioma.
  const {
    speak: speakExplanation,
    stop: stopExplanation,
    speaking: explanationSpeaking,
    voices: explanationVoices,
    voice: explanationVoice,
    voiceURI: explanationVoiceURI,
    setVoiceURI: setExplanationVoiceURI,
    speakingId: explanationSpeakingId,
  } = useSpeechSynthesis('es-ES', 1);

  const {
    supported: sttSupported,
    listening: sttListening,
    interim: sttInterim,
    start: sttStart,
    stop: sttStop,
    abort: sttAbort,
  } = useSpeechRecognition({
    lang: speechLang,
    onFinal: (text, meta) => handleFinal(text, meta),
    onError: code => {
      // Cualquier error corta el modo manos libres para no reabrir el micro en bucle.
      setMicArmed(false);
      setHandsFree(false);
      if (micTestRef.current === 'testing') {
        micTestRef.current = 'error';
        setMicTest('error');
      }
      if (code === 'silencio') {
        toast.info('Te has quedado en silencio: la conversación sigue cuando quieras.');
      } else if (code !== 'aborted' && code !== 'no-speech') {
        toast.error('El micrófono falló. Revisa el permiso del navegador y vuelve a intentarlo.');
      }
    },
    onEmpty: () => {
      setMicArmed(false);
      setHandsFree(false);
      if (micTestRef.current === 'testing') {
        micTestRef.current = 'error';
        setMicTest('error');
      }
      toast.info('No te he oído. Pulsa el micro y prueba otra vez más cerca.');
    },
  });

  const {
    running: sessionRunning,
    elapsedMs: sessionElapsedMs,
    autoPaused,
    start: startSession,
    pause: pauseSession,
    finish: finishTimer,
    reset: resetSession,
  } = usePracticeSession();

  sessionElapsedRef.current = sessionElapsedMs;

  const header = TUTOR_HEADER[language];
  const activeMode: TutorModeDef | null = TUTOR_MODES.find(m => m.id === mode) ?? null;
  const activeScenario = scenario ? SPEAKING_SCENARIOS.find(s => s.id === scenario) ?? null : null;
  const quick = activeMode ? activeMode.quick[language] : TUTOR_GENERAL[language];
  const esSpeaking = mode === 'speaking';
  const userBand = levelBand(level);
  const micLevel = useMicLevel(sttListening);
  const placeholder = activeStructure
    ? 'Responde siguiendo los pasos de la estructura...'
    : activeScenario
      ? 'Habla con el micro (se envía solo) o escribe tu respuesta...'
      : esSpeaking
        ? 'Pulsa el micro y habla, o escribe lo que quieras decir...'
        : activeMode
          ? activeMode.placeholder
          : 'Escribe tu pregunta o tu texto para corregirlo...';
  const allVisuals = messages.flatMap(m => m.visuals);

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && !m.hidden) ?? null;
  const lastUser = [...messages].reverse().find(m => m.role === 'user' && !m.hidden) ?? null;
  const lastAssistantId = lastAssistant?.id;
  const lastAssistantIndex = lastAssistant ? messages.findIndex(m => m.id === lastAssistant.id) : -1;
  const lastUserReview = lastUser ? structureReviews[lastUser.id] ?? null : null;

  const structures = useMemo(() => {
    return [...customStructures, ...SPEAKING_STRUCTURES].sort(
      (a, b) => levelDistance(levelBand(a.level), userBand) - levelDistance(levelBand(b.level), userBand)
    );
  }, [customStructures, userBand]);

  const scenarios = useMemo(() => {
    return [...SPEAKING_SCENARIOS].sort(
      (a, b) => levelDistance(a.level, userBand) - levelDistance(b.level, userBand)
    );
  }, [userBand]);

  const recommendedScenario = useMemo(
    () => scenarios.find(item => item.level === userBand) ?? scenarios[0] ?? null,
    [scenarios, userBand]
  );

  const recommendedStructure = useMemo(() => {
    const ranked = [...structures].sort((a, b) => {
      const failsA = structureSrs[a.id]?.fails ?? 0;
      const failsB = structureSrs[b.id]?.fails ?? 0;
      if (failsB !== failsA) return failsB - failsA;
      return levelDistance(levelBand(a.level), userBand) - levelDistance(levelBand(b.level), userBand);
    });
    return ranked[0] ?? null;
  }, [structures, structureSrs, userBand]);

  const scenarioTurns = activeScenario
    ? messages.slice(scenarioStartRef.current).filter(m => m.role === 'user' && !m.hidden).length
    : 0;

  const sessionGoalMs = sessionGoal * 60_000;
  const sessionProgress = sessionGoalMs > 0 ? Math.min(1, sessionElapsedMs / sessionGoalMs) : 0;
  const goalReached = sessionElapsedMs >= sessionGoalMs;
  const sessionSkillLabel = sessionSkillRef.current
    ? TUTOR_MODES.find(item => item.statId === sessionSkillRef.current)?.label ?? 'Speaking'
    : 'Chat libre';

  const visibleConversations = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return conversations
      .filter(item => !query || (item.title ?? '').toLowerCase().includes(query))
      .sort((a, b) => {
        const pinnedA = pins.includes(a.id) ? 1 : 0;
        const pinnedB = pins.includes(b.id) ? 1 : 0;
        if (pinnedA !== pinnedB) return pinnedB - pinnedA;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [conversations, historyQuery, pins]);

  const reportErrors = useMemo(() => {
    const out: SummaryError[] = [];
    const push = (wrong: string, correct: string, note: string) => {
      const limpioWrong = wrong.trim();
      const limpioCorrect = correct.trim();
      if (!limpioWrong || !limpioCorrect) return;
      const key = normalizarTexto(limpioWrong);
      if (out.some(item => normalizarTexto(item.wrong) === key)) return;
      out.push({ wrong: limpioWrong, correct: limpioCorrect, note: note.trim() });
    };

    for (const message of messages.slice(sessionMessageStartRef.current)) {
      if (message.role !== 'user' || message.hidden) continue;
      const review = feedback[message.id];
      if (review?.status === 'incorrecto' && review.corrected) {
        push(message.content, review.corrected, [review.explanation, review.tip].filter(Boolean).join(' '));
      }
    }
    for (const item of parseSummaryErrors(summaryText)) push(item.wrong, item.correct, item.note);
    return out.slice(0, 6);
  }, [messages, feedback, summaryText]);

  const markCurrentAsEvaluated = () => {
    messages.forEach(m => {
      if (m.role === 'user') {
        evaluatedRef.current.add(m.id);
        reviewedRef.current.add(m.id);
      }
    });
  };

  const historyBefore = (index: number) =>
    messages
      .slice(0, Math.max(index, 0))
      .filter(m => m.content.trim())
      .map(m => ({ role: m.role, content: m.content }));

  const resetCoachTracking = () => {
    evaluatedRef.current.clear();
    reviewedRef.current.clear();
    messages.forEach(m => {
      if (m.role === 'user') {
        evaluatedRef.current.add(m.id);
        reviewedRef.current.add(m.id);
      }
    });
    suggestionForRef.current = lastAssistantId ?? null;
    resetCoach();
  };

  const closeMic = () => {
    setHandsFree(false);
    setMicArmed(false);
    if (sttListening) sttAbort();
    stopSpeak();
    stopExplanation();
  };

  const logSession = (skillId: string, minutes: number) => {
    if (minutes <= 0 || !onLogPractice) return;
    const label = TUTOR_MODES.find(item => item.statId === skillId)?.label ?? 'Speaking';
    void onLogPractice(skillId, minutes, 'morning', sessionLanguageRef.current);
    toast.success(`${minutes} min de ${label} guardados en tu día`, {
      action: onShowProgress ? { label: 'Ver progreso', onClick: onShowProgress } : undefined,
    });
  };

  /** Cierra el cronómetro, registra si hay habilidad y devuelve el resultado. */
  const closeSession = () => {
    const result = finishTimer();
    onTimerStateChange?.(false);
    const skill = sessionSkillRef.current;
    if (result.elapsedMs > 0 && result.discarded) {
      toast.info('Sesión descartada: menos de 20 segundos no cuentan como práctica.');
    }
    if (result.minutes > 0 && skill) logSession(skill, result.minutes);
    return { ...result, skill };
  };

  /** Navegar por el historial no debe sumar minutos ni dejar el reloj vivo (B10). */
  const closeSessionOnNavigate = () => {
    const closed = closeSession();
    if (closed.minutes > 0 && !closed.skill) {
      toast.info('Sesión de chat libre cerrada sin guardar. Usa «Terminar y guardar» para elegir la habilidad.');
    }
    sessionSkillRef.current = null;
    sessionMessageStartRef.current = messages.length;
  };

  const ensureSession = () => {
    if (!sessionRunning && sessionElapsedMs === 0) {
      if (timerBusy) return;
      sessionLanguageRef.current = language;
      sessionSkillRef.current = activeMode?.statId ?? null;
      sessionMessageStartRef.current = messages.length;
      startSession();
      onTimerStateChange?.(true);
    }
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = true;
    setShowJump(false);
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const handleChatScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    nearBottomRef.current = near;
    setShowJump(!near);
  };

  // Scroll inteligente: solo sigue la conversación si el usuario ya está abajo.
  useEffect(() => {
    if (!nearBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: loading ? 'auto' : 'smooth' });
  }, [messages, loading]);

  // B21: el autofocus solo en puntero fino; en móvil no abre el teclado.
  useEffect(() => {
    if (loading || handsFree || !active) return;
    if (typeof window === 'undefined' || !window.matchMedia?.('(pointer: fine)').matches) return;
    inputRef.current?.focus();
  }, [loading, conversationId, handsFree, active]);

  // Al cambiar de idioma se cierra la sesión anterior y se guardan sus minutos.
  useEffect(() => {
    closeSessionOnNavigate();
    resetSession();
    setMode(null);
    setInput('');
    setScenario(null);
    setHandsFree(false);
    setMicArmed(false);
    setFeedbackOn(false);
    setSuggestOn(false);
    setLongTalk(true);
    setActiveStructure(null);
    setCustomStructures(readCustomStructures(language));
    setStructureSrs(readStructureSrs());
    setStructuresOpen(false);
    setFullScreen(false);
    setSessionGoal(10);
    setShowJump(false);
    setSessionEnded(false);
    setReport(null);
    setReportOpen(false);
    setSummaryText('');
    setSummaryLoading(false);
    setErrorsSaved(false);
    setSavedFeedback([]);
    setEditDraft(null);
    setHistoryQuery('');
    setRenaming(null);
    setDeleteTarget(null);
    setMicTest('idle');
    micTestRef.current = 'idle';
    updatedSrsRef.current.clear();
    scenarioStartRef.current = 0;
    goalOfferedRef.current = false;
    goalReachedRef.current = false;
    awaitingSummaryRef.current = false;
    queuedFinishRef.current = false;
    queuedSummaryRef.current = false;
    clearStructureReviews();
    stopSpeak();
    stopExplanation();
    evaluatedRef.current.clear();
    reviewedRef.current.clear();
    suggestionForRef.current = lastAssistantId ?? null;
    resetCoach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Al salir de la pestaña se corta todo: la voz no debe seguir sonando.
  useEffect(() => {
    if (active) return;
    stopSpeak();
    stopExplanation();
    if (sttListening) sttAbort();
    setMicArmed(false);
    setFullScreen(false);
    if (sessionRunning) pauseSession();
    onTimerStateChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sessionRunning, sttListening, stopSpeak, stopExplanation, pauseSession]);

  // La pestaña Speaking fuerza el modo conversación (U1). No se deshace al
  // volver a Tutor para no pisar un arranque guiado en curso.
  useEffect(() => {
    if (!active || !speakingFocus) return;
    if (mode === 'speaking') return;
    applyMode('speaking');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, speakingFocus]);

  // La voz empieza a sonar en cuanto hay una frase, sin esperar la respuesta completa.
  useEffect(() => {
    if (!autoSpeak) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last || !last.content) return;
    // El historial guardado no se lee en voz alta al abrirlo
    if (!last.id.startsWith('tmp-a-')) return;
    speakStream(last.id, last.content, !loading);
  }, [messages, loading, autoSpeak, speakStream]);

  // Feedback automático: evalúa cada frase nueva del estudiante. La revisión de
  // estructura viaja en la misma llamada (T2).
  useEffect(() => {
    if (!feedbackOn) return;
    messages.forEach((m, index) => {
      if (m.role !== 'user' || !m.id.startsWith('tmp-u-')) return;
      if (evaluatedRef.current.has(m.id)) return;
      evaluatedRef.current.add(m.id);
      reviewedRef.current.add(m.id);
      void evaluate(m.id, m.content, historyBefore(index), {
        structure: activeStructure,
        onPersist: meta => {
          void persistUserMeta(m.id, meta);
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, feedbackOn, evaluate, activeStructure]);

  // Sugerencia bajo demanda: una por cada respuesta nueva del tutor.
  useEffect(() => {
    if (!suggestOn || !lastAssistant || !lastAssistant.content || lastAssistant.streaming || loading) return;
    if (suggestionForRef.current === lastAssistant.id) return;
    suggestionForRef.current = lastAssistant.id;
    void suggest(lastAssistant.id, lastAssistant.content, historyBefore(lastAssistantIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestOn, lastAssistant?.id, lastAssistant?.content, lastAssistant?.streaming, loading, suggest]);

  useEffect(() => {
    if (goalReached && !goalReachedRef.current) {
      goalReachedRef.current = true;
      toast.success(`Objetivo de ${sessionGoal} min alcanzado. Puedes seguir o terminar y guardar.`);
    }
    if (!goalReached) goalReachedRef.current = false;
  }, [goalReached, sessionGoal]);

  // M5: objetivo medible del escenario. Al cumplirse se ofrece cerrar.
  useEffect(() => {
    if (!activeScenario || goalOfferedRef.current) return;
    if (scenarioTurns < activeScenario.targetTurns) return;
    goalOfferedRef.current = true;
    toast.success(
      `Objetivo del escenario cumplido (${scenarioTurns}/${activeScenario.targetTurns} turnos). Puedes terminarlo cuando quieras.`
    );
  }, [activeScenario, scenarioTurns]);

  // M4: una estructura con pasos fallados sube en la cola de repaso.
  useEffect(() => {
    if (!activeStructure || !lastUser) return;
    const review = structureReviews[lastUser.id];
    if (!review) return;
    const key = `${activeStructure.id}:${lastUser.id}`;
    if (updatedSrsRef.current.has(key)) return;
    updatedSrsRef.current.add(key);
    const fails = review.covered.filter(item => !item.ok).length;
    setStructureSrs(prev => {
      const current = prev[activeStructure.id] ?? { fails: 0, uses: 0, last: '' };
      const next: StructureSrs = {
        ...prev,
        [activeStructure.id]: {
          fails: current.fails + fails,
          uses: current.uses + 1,
          last: new Date().toISOString().slice(0, 10),
        },
      };
      writeJson(STRUCTURE_SRS_KEY, next);
      return next;
    });
  }, [activeStructure, lastUser, structureReviews]);

  // B3: si se pidió cerrar mientras el tutor respondía, se hace al terminar.
  useEffect(() => {
    if (loading || !queuedFinishRef.current) return;
    queuedFinishRef.current = false;
    finishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading || !queuedSummaryRef.current) return;
    queuedSummaryRef.current = false;
    requestSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // El resumen final llega como cualquier respuesta: se captura y se pinta en
  // el informe, sin depender de que el usuario siga mirando el chat.
  useEffect(() => {
    if (!awaitingSummaryRef.current || loading) return;
    if (messages.length <= summaryMarkerRef.current) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last || last.streaming || !last.content) return;
    awaitingSummaryRef.current = false;
    setSummaryLoading(false);
    setSummaryText(last.content);
  }, [messages, loading]);

  function startListening() {
    if (!sttSupported || loading) return;
    stopSpeak();
    stopExplanation();
    sttStart();
  }

  function applyMode(next: TutorSkill | null) {
    setMode(next);
    const conVoz = next === 'listening' || next === 'speaking';
    setAutoSpeak(conVoz);
    setAutoSend(next === 'speaking');
    setHandsFree(next === 'speaking');
    setMicArmed(false);
    if (!conVoz) stopSpeak();
    if (next === 'speaking') {
      markCurrentAsEvaluated();
      setFeedbackOn(true);
    } else {
      setFeedbackOn(false);
      setLongTalk(true);
    }
    if (next !== 'speaking') {
      setScenario(null);
      setActiveStructure(null);
      clearStructureReviews();
      if (sessionRunning) pauseSession();
      onTimerStateChange?.(false);
    }
    if (sttListening) sttAbort();
    clearSuggestion();
    suggestionForRef.current = lastAssistantId ?? null;
  }

  function toggleSpeak(id: string, text: string) {
    if (isSpeaking(id)) {
      stopSpeak();
      return;
    }
    // B12: escuchar un mensaje es puntual; no apaga la voz automática.
    speak(id, text);
  }

  function submit(text: string, scenarioId?: string | null, options?: Parameters<typeof sendMessage>[2]) {
    const limpio = text.trim();
    if (!limpio || loading) return;
    // Tras cerrar la sesión, solo pasan los mensajes internos de cierre.
    if (sessionEnded && !options?.sessionEnd && !options?.start) return;
    // Evita el doble envío típico: onend del micro + clic en enviar, o el mismo
    // texto repetido por el reconocimiento al reiniciar la escucha.
    if (!options?.hidden) {
      const ahora = Date.now();
      const clave = limpio.toLowerCase().replace(/\s+/g, ' ');
      if (lastSendRef.current.text === clave && ahora - lastSendRef.current.at < 2500) return;
      lastSendRef.current = { text: clave, at: ahora };
    }
    fullSendRef.current = false;

    stopSpeak();
    stopExplanation();
    if (esSpeaking && !options?.sessionEnd) ensureSession();
    const effectiveScenario = scenarioId === null ? undefined : scenarioId ?? scenario ?? undefined;
    sendMessage(limpio, effectiveScenario, {
      longTalk: esSpeaking ? longTalk : undefined,
      ...options,
    });
    setInput('');
    nearBottomRef.current = true;
    if (sttListening) sttAbort();
    window.setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 0);
  }

  function handleFinal(text: string, _meta?: { confidence: number }) {
    if (micTestRef.current === 'testing') {
      micTestRef.current = 'ok';
      setMicTest('ok');
      toast.success('Micrófono listo: ya puedes hablar con el tutor.');
      return;
    }
    const fromFullscreen = fullSendRef.current;
    fullSendRef.current = false;
    // Segunda barrera: aunque el navegador repita el final, aquí se limpia.
    const limpio = limpiarRepeticiones(text);
    if (!limpio) return;
    if (fromFullscreen || autoSend || handsFree) {
      submit(limpio);
    } else {
      setInput(prev => (prev ? `${prev} ${limpio}` : limpio));
      inputRef.current?.focus();
    }
  }

  function toggleHandsFree() {
    if (handsFree) {
      setHandsFree(false);
      setMicArmed(false);
      if (sttListening) sttAbort();
      return;
    }
    if (!sttSupported) {
      toast.error('Este navegador no tiene reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    // B7: un solo toque activa el ciclo completo y el botón dice la verdad.
    setHandsFree(true);
    setMicArmed(true);
    if (!sttListening && !loading) startListening();
  }

  // Manos libres: tras la respuesta (y su voz) el micro se reactiva solo.
  useEffect(() => {
    if (!handsFree || !micArmed || !esSpeaking || sessionEnded) return;
    if (loading || speaking || explanationSpeaking || sttListening || !sttSupported) return;
    // Margen para que termine el audio del TTS antes de abrir el micro (evita eco)
    const t = window.setTimeout(() => sttStart(), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, micArmed, esSpeaking, sessionEnded, loading, speaking, explanationSpeaking, sttListening, sttSupported]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  function requestSummary(scenarioId?: string | null) {
    if (messages.length === 0) return;
    if (loading) {
      queuedSummaryRef.current = true;
      setSummaryLoading(true);
      return;
    }
    summaryMarkerRef.current = messages.length;
    awaitingSummaryRef.current = true;
    setSummaryLoading(true);
    setSummaryText('');
    submit(SESSION_END_MSG, scenarioId ?? null, { hidden: true, sessionEnd: true });
  }

  function startScenario(id: string) {
    if (loading) return;
    const def = SPEAKING_SCENARIOS.find(s => s.id === id);
    setScenario(id);
    setActiveStructure(null);
    clearStructureReviews();
    setHandsFree(true);
    setMicArmed(false);
    setAutoSpeak(true);
    setLongTalk(true);
    setSessionEnded(false);
    markCurrentAsEvaluated();
    setFeedbackOn(true);
    scenarioStartRef.current = messages.length;
    goalOfferedRef.current = false;
    ensureSession();
    submit(SCENARIO_START_MSG[language], id, {
      hidden: true,
      start: true,
      title: def ? `Simulación · ${def.label[language]}` : undefined,
    });
  }

  function finishScenario() {
    if (!scenario || loading) return;
    const id = scenario;
    const label = activeScenario?.label[language];
    setScenario(null);
    closeMic();
    pauseSession();
    onTimerStateChange?.(false);
    setSessionEnded(true);
    requestSummary(id);
    toast.info(
      `Escenario terminado${label ? ` · ${label}` : ''}. Pulsa «Terminar y guardar» para cerrar la sesión o «Seguir hablando».`
    );
  }

  function practiceStructure(structure: SpeakingStructure) {
    if (loading) return;
    setActiveStructure(structure);
    setStructuresOpen(false);
    clearStructureReviews();
    setScenario(null);
    setSessionEnded(false);
    setMode('speaking');
    setAutoSpeak(true);
    setAutoSend(true);
    setHandsFree(true);
    setMicArmed(false);
    setFeedbackOn(true);
    setLongTalk(true);
    markCurrentAsEvaluated();
    ensureSession();
    submit(`Ask me this question and wait for my answer: "${structure.question[language]}"`, null, {
      hidden: true,
      start: true,
      title: `Speaking · ${structure.questionEs}`,
      structureQuestion: structure.question[language],
    });
  }

  async function generateCustomStructure(question: string) {
    const structure = await generateStructure(question);
    if (structure) {
      const next = [structure, ...customStructures].slice(0, 20);
      setCustomStructures(next);
      persistCustomStructures(language, next);
      toast.success('Estructura creada y guardada. Pulsa "Practicar" para usarla.');
    }
    return structure;
  }

  const clearActiveStructure = () => {
    setActiveStructure(null);
    clearStructureReviews();
  };

  function toggleSession() {
    if (!sessionRunning && sessionElapsedMs === 0 && timerBusy) {
      toast.error('Hay un temporizador del dashboard en marcha. Termínalo o descártalo para usar el del tutor.');
      return;
    }
    if (sessionRunning) {
      pauseSession();
      onTimerStateChange?.(false);
    } else {
      if (sessionElapsedMs === 0) {
        sessionLanguageRef.current = language;
        sessionSkillRef.current = activeMode?.statId ?? null;
        sessionMessageStartRef.current = messages.length;
      }
      startSession();
      onTimerStateChange?.(true);
    }
  }

  function finishSession() {
    // B3: si el tutor está respondiendo, se encola y se ejecuta al terminar.
    if (loading) {
      queuedFinishRef.current = true;
      pauseSession();
      onTimerStateChange?.(false);
      closeMic();
      toast.info('El tutor está respondiendo. En cuanto termine, guardo la sesión y pido el resumen.');
      return;
    }

    const scenarioLabel = activeScenario?.label[language] ?? null;
    const structureLabel = activeStructure?.questionEs ?? null;
    const closed = closeSession();
    const metrics = computeSpeakingMetrics({
      userTexts: messages
        .slice(sessionMessageStartRef.current)
        .filter(m => m.role === 'user' && !m.hidden)
        .map(m => m.content),
      feedback,
      userMessageIds: messages
        .slice(sessionMessageStartRef.current)
        .filter(m => m.role === 'user' && !m.hidden)
        .map(m => m.id),
      language,
      durationMs: closed.elapsedMs,
    });

    setReport({
      minutes: closed.minutes,
      elapsedMs: closed.elapsedMs,
      metrics,
      needsSkill: closed.minutes > 0 && !closed.skill,
      saved: closed.minutes > 0 && !!closed.skill,
      scenarioLabel,
      structureLabel,
    });
    setReportOpen(true);
    setErrorsSaved(false);
    setSummaryText('');
    setSummaryLoading(false);

    if (closed.minutes > 0 && onSessionComplete) {
      onSessionComplete(
        buildSpeakingRecord({
          language: sessionLanguageRef.current,
          minutes: closed.minutes,
          skillId: closed.skill ?? 'speaking',
          metrics,
          scenarioId: scenario,
          structureId: activeStructure?.id ?? null,
        })
      );
    }

    setSessionEnded(true);
    closeMic();
    pauseSession();
    onTimerStateChange?.(false);
    const scenarioId = scenario;
    setScenario(null);
    setActiveStructure(null);
    clearStructureReviews();
    requestSummary(scenarioId);
  }

  function continueSession() {
    setSessionEnded(false);
    setReportOpen(false);
  }

  function startNewThread() {
    closeSessionOnNavigate();
    closeMic();
    setScenario(null);
    setActiveStructure(null);
    clearStructureReviews();
    setSessionEnded(false);
    setReport(null);
    setReportOpen(false);
    setSummaryText('');
    setSummaryLoading(false);
    setErrorsSaved(false);
    setSavedFeedback([]);
    setEditDraft(null);
    setFeedbackOn(false);
    setSuggestOn(false);
    setInput('');
    setShowJump(false);
    setSessionGoal(10);
    setConfirmNewOpen(false);
    resetCoachTracking();
    newConversation();
  }

  // Arranque guiado, en dos tiempos: primero se limpia el hilo y se aplica el
  // modo; cuando React ya asentó el modo (y no hay nada cargando), se envía el
  // prompt. Así `sendMessage` lee la habilidad correcta desde su ref.
  useEffect(() => {
    if (!active || !request) return;
    if (handledRequestRef.current === request.nonce) return;
    startNewThread();
    applyMode(request.skill);
    setPendingLaunch(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, request?.nonce]);

  useEffect(() => {
    if (!active || !pendingLaunch || loading) return;
    const t = window.setTimeout(() => {
      submit(pendingLaunch.prompt, null, {
        hidden: true,
        start: true,
        title: pendingLaunch.title ?? 'Sesión guiada',
      });
      handledRequestRef.current = pendingLaunch.nonce;
      setPendingLaunch(null);
      onRequestHandled?.();
    }, 160);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pendingLaunch, loading]);

  // Un cambio de idioma invalida cualquier arranque que estuviera en cola.
  useEffect(() => {
    setPendingLaunch(null);
  }, [language]);

  async function openThread(id: string) {
    closeSessionOnNavigate();
    closeMic();
    setScenario(null);
    setActiveStructure(null);
    clearStructureReviews();
    setSessionEnded(false);
    setFullScreen(false);
    setReport(null);
    setReportOpen(false);
    setSummaryText('');
    setSummaryLoading(false);
    setSavedFeedback([]);
    setEditDraft(null);
    resetCoachTracking();
    const loaded = await openConversation(id);
    const persisted = loaded
      .filter(message => message.meta?.feedback || message.meta?.structureReview)
      .map(message => ({
        id: message.id,
        feedback: message.meta?.feedback ?? null,
        structureReview: message.meta?.structureReview ?? null,
      }));
    hydrate(persisted);
    setFeedbackOn(persisted.length > 0);
    // Las métricas de la próxima sesión empiezan en el final del hilo cargado.
    sessionMessageStartRef.current = loaded.length;
    // El historial no se reevalúa: si quieres revisar una frase, usa Reintentar.
    loaded.forEach(message => {
      if (message.role === 'user') {
        evaluatedRef.current.add(message.id);
        reviewedRef.current.add(message.id);
      }
    });
  }

  async function confirmDeleteConversation() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const snapshot = await deleteConversation(target.id);
    if (target.id === conversationId) {
      resetCoachTracking();
      setScenario(null);
      setActiveStructure(null);
      clearStructureReviews();
      setFullScreen(false);
      setReportOpen(false);
    }
    setDeleteTarget(null);
    toast.success('Conversación borrada', {
      action: snapshot
        ? {
            label: 'Deshacer',
            onClick: () => {
              void restoreConversation(snapshot);
            },
          }
        : undefined,
    });
  }

  function saveRename() {
    if (!renaming) return;
    void renameConversation(renaming.id, renaming.title);
    setRenaming(null);
  }

  function togglePin(id: string) {
    const next = pins.includes(id) ? pins.filter(item => item !== id) : [...pins, id];
    setPins(next);
    writeJson(PINS_KEY, next);
  }

  const toggleFeedback = () => {
    if (feedbackOn) {
      setFeedbackOn(false);
      return;
    }
    markCurrentAsEvaluated();
    setFeedbackOn(true);
  };

  const toggleSuggestion = () => {
    if (suggestOn) {
      setSuggestOn(false);
      clearSuggestion();
      return;
    }
    setSuggestOn(true);
  };

  const retryFeedback = (messageId: string, text: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    void evaluate(messageId, text, historyBefore(index), {
      structure: activeStructure,
      onPersist: meta => {
        void persistUserMeta(messageId, meta);
      },
    });
  };

  const saveFeedbackError = async (message: { id: string; content: string }) => {
    const review = feedback[message.id];
    if (!review || review.status !== 'incorrecto' || !onAddError) return;
    await onAddError({
      wrong: message.content,
      correct: review.corrected || message.content,
      note: [review.explanation, review.tip].filter(Boolean).join(' '),
      category: inferErrorCategory([review.explanation, review.tip].filter(Boolean).join(' ')),
    });
    setSavedFeedback(prev => (prev.includes(message.id) ? prev : [...prev, message.id]));
    toast.success('Error guardado en tu cuaderno de repaso.');
  };

  const saveReportErrors = async () => {
    if (!onAddError || reportErrors.length === 0 || errorsSaved) return;
    for (const item of reportErrors) {
      await onAddError({
        wrong: item.wrong,
        correct: item.correct,
        note: item.note,
        category: inferErrorCategory(item.note),
      });
    }
    setErrorsSaved(true);
    toast.success(`${reportErrors.length} errores guardados en tu cuaderno de repaso.`);
  };

  const saveReportMinutes = (skill: TutorSkill) => {
    if (!report || report.minutes <= 0) return;
    const statId = TUTOR_MODES.find(item => item.id === skill)?.statId ?? skill;
    logSession(statId, report.minutes);
    setReport({ ...report, needsSkill: false, saved: true });
  };

  const repeatTomorrow = async () => {
    await saveReportErrors();
    setReportOpen(false);
    toast.success('Mañana la cola de repaso empezará por estos errores.');
  };

  const explainFeedback = async (messageId: string, text: string) => {
    const current = feedback[messageId];
    if (!current) return;
    stopSpeak();
    stopExplanation();
    // Si ya se amplió antes, no hace falta otra llamada: se vuelve a leer.
    if (current.longExplanation) {
      speakExplanation(`explain-${messageId}`, current.longExplanation);
      return;
    }
    const long = await explain(messageId, text, current);
    if (!long) {
      toast.error('No pude ampliar la explicación. Inténtalo otra vez.');
      return;
    }
    speakExplanation(`explain-${messageId}`, long);
  };

  const speakCorrection = (messageId: string, slow = false) => {
    const current = feedback[messageId];
    if (!current?.corrected) return;
    stopExplanation();
    stopSpeak();
    speak(`fix-${messageId}${slow ? '-slow' : ''}`, current.corrected, slow ? 0.75 : undefined);
  };

  const saveEditedMessage = async (message: { id: string; content: string }) => {
    if (!editDraft) return;
    const text = editDraft.text.trim();
    setEditDraft(null);
    if (!text || text === message.content) return;
    const index = messages.findIndex(m => m.id === message.id);
    await editUserMessage(message.id, text);
    setSavedFeedback(prev => prev.filter(id => id !== message.id));
    void evaluate(message.id, text, historyBefore(index), {
      structure: activeStructure,
      onPersist: meta => {
        void persistUserMeta(message.id, meta);
      },
    });
  };

  function testMic() {
    if (!sttSupported) {
      toast.error('Este navegador no tiene reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    micTestRef.current = 'testing';
    setMicTest('testing');
    setHandsFree(false);
    setMicArmed(false);
    if (sttListening) sttAbort();
    startListening();
    window.setTimeout(() => {
      if (micTestRef.current === 'testing') sttStop();
    }, 4000);
  }

  function finishOnboarding() {
    writeFlag(ONBOARDING_KEY);
    setOnboardingDone(true);
  }

  // U10: atajos de escritorio. No se disparan mientras se escribe.
  useEffect(() => {
    if (!active) return;
    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || target.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeak();
        stopExplanation();
        if (sttListening) sttAbort();
        setMicArmed(false);
        return;
      }
      if (e.code === 'Space' && !isInteractive(e.target)) {
        if (!esSpeaking || !sttSupported || loading || sessionEnded || e.repeat) return;
        e.preventDefault();
        if (!sttListening) {
          setMicArmed(handsFree);
          startListening();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isInteractive(e.target)) {
        e.preventDefault();
        submit(input);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isInteractive(e.target)) return;
      if (!sttListening) return;
      e.preventDefault();
      sttStop();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, esSpeaking, sttSupported, loading, sessionEnded, handsFree, sttListening, input]);

  const refreshSuggestion = () => {
    if (!lastAssistant || !lastAssistant.content) return;
    void suggest(lastAssistant.id, lastAssistant.content, historyBefore(lastAssistantIndex));
  };

  const useSuggestion = () => {
    if (!suggestion) return;
    setInput(suggestion.text);
    inputRef.current?.focus();
  };

  const sendSuggestion = () => {
    if (!suggestion) return;
    const text = suggestion.text;
    clearSuggestion();
    submit(text);
  };

  const speakSuggestion = () => {
    if (!suggestion) return;
    stopSpeak();
    stopExplanation();
    speak('suggestion', suggestion.text);
  };

  const status = sttListening
    ? 'Escuchando…'
    : loading
      ? lastAssistant?.content
        ? 'Respondiendo…'
        : 'Pensando…'
      : explanationSpeaking
        ? 'Explicando…'
        : speaking
          ? 'Hablando…'
          : '';

  const voiceSections: VoiceSection[] = [
    {
      id: 'tutor',
      label: language === 'italian' ? 'Italiano' : 'Inglés',
      lang: speechLang,
      voices: tutorVoices,
      voiceURI: tutorVoiceURI,
      voice: tutorVoice,
      onChange: setTutorVoiceURI,
      onPreview: text => speak(`voz-tutor-${Date.now()}`, text),
      onStop: stopSpeak,
      previewing: speakingId?.startsWith('voz-tutor-') ?? false,
    },
    {
      id: 'explicaciones',
      label: 'Explicaciones',
      lang: 'es-ES',
      voices: explanationVoices,
      voiceURI: explanationVoiceURI,
      voice: explanationVoice,
      onChange: setExplanationVoiceURI,
      onPreview: text => speakExplanation(`voz-explicacion-${Date.now()}`, text),
      onStop: stopExplanation,
      previewing: explanationSpeakingId?.startsWith('voz-explicacion-') ?? false,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Selector de habilidad */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Button
          variant={mode === null ? 'default' : 'outline'}
          size="sm"
          className="h-8 shrink-0 text-xs"
          onClick={() => applyMode(null)}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Chat libre
        </Button>
        {TUTOR_MODES.map(m => (
          <Button
            key={m.id}
            variant={mode === m.id ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0 text-xs"
            onClick={() => applyMode(mode === m.id ? null : m.id)}
          >
            <m.Icon className="w-3.5 h-3.5 mr-1" />
            {m.label}
            {m.id === 'listening' && (
              <Volume2 className={cn('w-3 h-3 ml-1', mode === m.id ? 'opacity-90' : 'text-muted-foreground')} />
            )}
          </Button>
        ))}
      </div>

      {/* Herramientas: lo que se usa por turno, visible; ajustes, en un popover (U2) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant={feedbackOn ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={toggleFeedback}
          title="Muestra Correcto / Incorrecto en cada frase tuya, con explicación y botón para escucharla"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Feedback {feedbackOn ? 'on' : 'off'}
        </Button>
        <Button
          variant={suggestOn ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
          onClick={toggleSuggestion}
          title="Te propone una respuesta para seguir la conversación cuando te trabas"
        >
          <Lightbulb className="w-3.5 h-3.5 mr-1" />
          Ayuda {suggestOn ? 'on' : 'off'}
        </Button>
        {esSpeaking && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setStructuresOpen(true)}
            title="Aprende la estructura clave para responder una pregunta concreta"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1" />
            Estructuras
          </Button>
        )}
        {esSpeaking && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setPronunciation({ open: true, phrase: null })}
            title="Escuchar, repetir y comparar frases sin gastar llamadas al modelo"
          >
            <Gauge className="w-3.5 h-3.5 mr-1" />
            Pronunciación
          </Button>
        )}
        {esSpeaking && sttSupported && (
          <Button
            variant={handsFree ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={toggleHandsFree}
            title={
              handsFree
                ? 'Manos libres: hablas, el tutor contesta en voz alta y el micro se reactiva solo'
                : 'Activar modo manos libres (conversación continua)'
            }
          >
            <Hand className="w-3.5 h-3.5 mr-1" />
            {handsFree ? 'Manos libres on' : 'Manos libres off'}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Settings2 className="w-3.5 h-3.5 mr-1" />
                Ajustes
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              {speechSupported ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Voz automática</p>
                      <p className="text-[10px] text-muted-foreground">El tutor lee sus respuestas.</p>
                    </div>
                    <Button
                      variant={autoSpeak ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        if (autoSpeak) {
                          setAutoSpeak(false);
                          stopSpeak();
                        } else {
                          setAutoSpeak(true);
                        }
                      }}
                    >
                      {autoSpeak ? <Volume2 className="mr-1 h-3 w-3" /> : <VolumeX className="mr-1 h-3 w-3" />}
                      {autoSpeak ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium">Velocidad</span>
                      <span className="tabular-nums text-muted-foreground">{rate.toFixed(2)}×</span>
                    </div>
                    <Slider
                      value={[rate]}
                      min={0.7}
                      max={1.1}
                      step={0.05}
                      onValueChange={values => setRate(values[0] ?? 1)}
                      aria-label="Velocidad de la voz"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>0,70×</span>
                      <span>1,10×</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium">Voces</p>
                    <VoicePicker sections={voiceSections} />
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">Este navegador no tiene lectura en voz alta.</p>
              )}
              {esSpeaking && (
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Charla larga</p>
                    <p className="text-[10px] text-muted-foreground">Respuestas más ricas en cada turno.</p>
                  </div>
                  <Button
                    variant={longTalk ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setLongTalk(value => !value)}
                  >
                    {longTalk ? 'Sí' : 'No'}
                  </Button>
                </div>
              )}
              {speechSupported && (
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {voiceOk
                    ? tutorNaturalVoices || !/Edg\//.test(navigator.userAgent)
                      ? 'Voces listas.'
                      : 'Para una voz más natural, abre esta página en Microsoft Edge.'
                    : `Falta una voz de ${language === 'italian' ? 'italiano' : 'inglés'} en tu sistema.`}
                </p>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {esSpeaking && !onboardingDone && (
        <SpeakingOnboarding
          language={language}
          micState={micTest}
          sttSupported={sttSupported}
          voiceReady={voiceOk}
          onTestMic={testMic}
          onStart={() => {
            finishOnboarding();
            setMicArmed(handsFree);
            startListening();
          }}
          onDismiss={finishOnboarding}
        />
      )}

      {mode === 'speaking' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-0.5">Simulaciones:</span>
          {scenarios.map(s => {
            const isActive = scenario === s.id;
            return (
              <Button
                key={s.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => (isActive ? finishScenario() : startScenario(s.id))}
                disabled={loading}
                title={`${s.goal[language]} · ${s.targetTurns} turnos · ${s.targetMinutes} min`}
              >
                <s.Icon className="w-3 h-3 mr-1" />
                {s.label[language]}
                {s.level === userBand && <span className="ml-1 text-[9px] opacity-80">tu nivel</span>}
              </Button>
            );
          })}
        </div>
      )}

      {esSpeaking && handsFree && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          {micArmed
            ? sttListening
              ? 'Manos libres activo: te escucho. Al dejar de hablar se envía y el micro se reactiva al terminar la respuesta.'
              : 'Manos libres activo: el micro se abrirá en cuanto termine la respuesta actual.'
            : 'Manos libres en pausa. Toca el micro para reanudar la conversación continua.'}
          {!sttSupported && ' (Este navegador no tiene reconocimiento de voz: usa Chrome o Edge.)'}
          {speechSupported && !voiceOk && ' Instala una voz del idioma en tu sistema para que la pronunciación sea correcta.'}
        </p>
      )}

      {autoPaused && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
          Sesión pausada al salir de la pestaña. El tiempo en segundo plano no cuenta: pulsa «Seguir» si quieres reanudarla.
        </p>
      )}

      {activeScenario && (
        <div className="space-y-1 rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium flex-shrink-0">🎭 Escenario: {activeScenario.label[language]}</span>
            <span className="text-muted-foreground truncate">{activeScenario.goal[language]}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] ml-auto flex-shrink-0"
              onClick={finishScenario}
              disabled={loading}
            >
              Terminar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-primary/15">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  scenarioTurns >= activeScenario.targetTurns ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${Math.min(100, Math.round((scenarioTurns / Math.max(1, activeScenario.targetTurns)) * 100))}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {scenarioTurns}/{activeScenario.targetTurns} turnos · {activeScenario.targetMinutes} min
            </span>
            {scenarioTurns >= activeScenario.targetTurns && (
              <Badge variant="outline" className="shrink-0 border-success/40 text-[9px] text-success">
                Objetivo cumplido
              </Badge>
            )}
          </div>
        </div>
      )}

      {sessionEnded && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-success/35 bg-success/[0.06] px-2.5 py-1.5 text-[11px]">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
          <span className="min-w-0 flex-1">Sesión cerrada: el micrófono está apagado y no se añadirán más minutos.</span>
          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={continueSession}>
            Seguir hablando
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setReportOpen(true)}>
            Ver informe
          </Button>
        </div>
      )}

      {/* Cronómetro de sesión */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Timer className={cn('h-4 w-4', sessionRunning ? 'text-primary' : 'text-muted-foreground')} />
          <span className="font-mono text-base font-semibold tabular-nums">{formatClock(sessionElapsedMs)}</span>
          <span className="text-[11px] text-muted-foreground">/ {sessionGoal} min</span>
        </div>
        <Badge variant="outline" className="max-w-40 truncate text-[10px]">
          Registrando: {sessionSkillLabel}
        </Badge>

        <div className="hidden h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-muted sm:block">
          <div
            className={cn('h-full rounded-full transition-all duration-500', goalReached ? 'bg-success' : 'bg-primary')}
            style={{ width: `${Math.round(sessionProgress * 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          {SESSION_GOALS.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => setSessionGoal(goal)}
              className={cn(
                'h-7 rounded-full border px-2 text-[11px] font-medium transition-colors',
                sessionGoal === goal
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={sessionGoal === goal}
            >
              {goal}′
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant={sessionRunning ? 'secondary' : 'outline'}
            size="sm"
            className="h-8 gap-1 px-2 text-[11px]"
            onClick={toggleSession}
            disabled={timerBusy && !sessionRunning && sessionElapsedMs === 0}
            title={
              timerBusy && !sessionRunning && sessionElapsedMs === 0
                ? 'Hay un temporizador del dashboard en marcha. Termínalo para usar este.'
                : undefined
            }
          >
            {sessionRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {sessionRunning ? 'Pausar' : sessionElapsedMs > 0 ? 'Seguir' : 'Empezar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2 text-[11px]"
            onClick={finishSession}
            disabled={sessionElapsedMs < 1000}
            title="Guarda los minutos, pide el resumen y cierra el micrófono"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Terminar y guardar</span>
            <span className="sm:hidden">Guardar</span>
          </Button>
        </div>
        {goalReached && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            Objetivo alcanzado
          </span>
        )}
        {timerBusy && !sessionRunning && sessionElapsedMs === 0 && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            Temporizador del dashboard activo
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-3">
        {/* Chat */}
        <Card className="flex h-[calc(100dvh-19rem)] min-h-[24rem] flex-col sm:h-[62vh] lg:h-[70vh]">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <TutorAvatar
              size={52}
              speaking={speaking}
              listening={sttListening}
              thinking={loading && !lastAssistant?.content}
              language={language}
              progress={sessionElapsedMs > 0 ? sessionProgress : undefined}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                Tutor IA · {header.flag} {header.name}
              </p>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                Nivel {level} · {activeMode ? activeMode.label : 'Chat libre'}
                {status ? ` · ${status}` : speechSupported && autoSpeak ? ' · leyendo en voz alta' : ''}
              </p>
            </div>
            {sttListening && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                REC
              </span>
            )}
            <AiModelBadge engine={engine} loading={loading} className="shrink-0" />
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 p-0"
              onClick={() => setStructuresOpen(true)}
              aria-label="Estructuras para responder"
              title="Estructuras para responder"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 p-0"
              onClick={() => setFullScreen(true)}
              aria-label="Ampliar a pantalla completa"
              title="Pantalla completa con voz"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 p-0"
              onClick={() => setConfirmNewOpen(true)}
              aria-label="Nuevo hilo"
              title="Empezar un hilo nuevo"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 shrink-0 p-0" aria-label="Historial y memoria">
                  <History className="w-3.5 h-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[min(23rem,94vw)] flex-col p-0">
                <SheetHeader className="border-b px-4 pb-3 pr-12 pt-5 text-left">
                  <SheetTitle className="text-base">Historial y memoria</SheetTitle>
                  <SheetDescription className="text-xs leading-relaxed">
                    Busca, fija o renombra conversaciones. Lo fijado queda arriba.
                  </SheetDescription>
                </SheetHeader>
                <Tabs defaultValue="hilos" className="flex min-h-0 flex-1 flex-col px-3 pt-3">
                  <TabsList className="w-full">
                    <TabsTrigger value="hilos" className="flex-1 text-xs">
                      Historial
                    </TabsTrigger>
                    <TabsTrigger value="memoria" className="flex-1 text-xs">
                      Memoria
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="hilos" className="mt-2 min-h-0 flex-1">
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={historyQuery}
                        onChange={e => setHistoryQuery(e.target.value)}
                        placeholder="Buscar conversación…"
                        className="h-8 pl-7 text-xs"
                        aria-label="Buscar conversación"
                      />
                    </div>
                    <ScrollArea className="h-[calc(100dvh-15rem)] pr-2">
                      <div className="space-y-1">
                        {visibleConversations.length === 0 && (
                          <p className="p-2 text-xs text-muted-foreground">
                            {historyQuery.trim()
                              ? 'Ningún hilo coincide con la búsqueda.'
                              : `Sin conversaciones de ${header.name} aún.`}
                          </p>
                        )}
                        {visibleConversations.map(c => {
                          const pinned = pins.includes(c.id);
                          const isRenaming = renaming?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              className={cn(
                                'rounded-md transition-colors',
                                c.id === conversationId && 'bg-muted'
                              )}
                            >
                              {isRenaming ? (
                                <div className="space-y-1 p-1.5">
                                  <Input
                                    value={renaming.title}
                                    onChange={e => setRenaming({ id: c.id, title: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveRename();
                                      }
                                      if (e.key === 'Escape') setRenaming(null);
                                    }}
                                    className="h-7 text-xs"
                                    autoFocus
                                    aria-label="Nuevo título de la conversación"
                                  />
                                  <div className="flex gap-1">
                                    <Button size="sm" className="h-6 px-2 text-[10px]" onClick={saveRename}>
                                      Guardar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-[10px]"
                                      onClick={() => setRenaming(null)}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void openThread(c.id)}
                                    className="min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                                  >
                                    <span className="line-clamp-2">
                                      {pinned && <Pin className="mr-1 inline h-3 w-3 text-primary" />}
                                      {c.title || 'Conversación'}
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                      {formatDate(c.updated_at)}
                                      {c.id === conversationId ? ' · abierta' : ''}
                                    </span>
                                  </button>
                                  <div className="flex shrink-0 items-center pt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn('h-6 w-6 p-0', pinned && 'text-primary')}
                                      onClick={() => togglePin(c.id)}
                                      aria-label={pinned ? 'Quitar de fijados' : 'Fijar conversación'}
                                      title={pinned ? 'Quitar de fijados' : 'Fijar arriba'}
                                    >
                                      {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground"
                                      onClick={() => setRenaming({ id: c.id, title: c.title ?? '' })}
                                      aria-label="Renombrar conversación"
                                      title="Renombrar"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => setDeleteTarget(c)}
                                      aria-label={`Borrar ${c.title || 'conversación'}`}
                                      title="Borrar conversación"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="memoria" className="mt-2 min-h-0 flex-1">
                    <ScrollArea className="h-[calc(100dvh-12rem)] pr-2">
                      <div className="space-y-2">
                        {memories.length === 0 && (
                          <p className="p-2 text-xs text-muted-foreground">
                            El Tutor todavía no ha guardado errores ni objetivos tuyos.
                          </p>
                        )}
                        {memories.map(m => (
                          <div key={m.id} className="flex items-start gap-2 rounded-md border border-border p-2">
                            <div className="flex-1">
                              {m.kind && <p className="text-[10px] uppercase text-muted-foreground">{m.kind.replace(/_/g, ' ')}</p>}
                              <p className="text-xs">{m.content}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => void deleteMemory(m.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>

          {activeStructure && (
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 shrink-0 text-focus" />
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium">{activeStructure.question[language]}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => setStructuresOpen(true)}
                >
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={clearActiveStructure}
                  aria-label="Quitar estructura"
                  title="Quitar estructura"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeStructure.steps.map((step, index) => {
                  // B13: se empareja por índice; la etiqueta es solo respaldo.
                  const byIndex = lastUserReview?.covered.find(item => item.index === index);
                  const byLabel = lastUserReview?.covered.find(
                    item => item.label.toLowerCase() === step.label.toLowerCase()
                  );
                  const state = byIndex?.ok ?? byLabel?.ok;
                  return (
                    <span
                      key={`${activeStructure.id}-${index}`}
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        state === true
                          ? 'border-success/40 bg-success/10 text-success'
                          : state === false
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                            : 'border-focus/25 bg-focus/[0.04] text-foreground/80'
                      )}
                    >
                      {index + 1}. {step.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={scrollRef} onScroll={handleChatScroll} className="relative min-h-0 flex-1 overflow-y-auto p-3">
            <div className="space-y-4" role="log" aria-live="polite" aria-relevant="additions">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-[min(38vw,150px)]">
                    <TutorAvatar language={language} listening={sttListening} thinking={loading} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tu tutor te escucha</p>
                    <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">{TUTOR_EMPTY[language]}</p>
                  </div>
                  <div className="grid w-full max-w-xl gap-2 sm:grid-cols-3">
                    {recommendedScenario && (
                      <button
                        type="button"
                        onClick={() => startScenario(recommendedScenario.id)}
                        className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                      >
                        <recommendedScenario.Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          <span className="block text-xs font-semibold">Escenario de hoy</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                            {recommendedScenario.label[language]} · {recommendedScenario.targetTurns} turnos
                          </span>
                        </span>
                      </button>
                    )}
                    {recommendedStructure && (
                      <button
                        type="button"
                        onClick={() => practiceStructure(recommendedStructure)}
                        className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-focus/40 hover:bg-focus/[0.03]"
                      >
                        <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-focus" />
                        <span>
                          <span className="block text-xs font-semibold">
                            {structureSrs[recommendedStructure.id]?.fails ? 'Estructura a repasar' : 'Estructura recomendada'}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                            {recommendedStructure.questionEs}
                          </span>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => applyMode('speaking')}
                      className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                    >
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        <span className="block text-xs font-semibold">Conversación libre</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          Habla con el tutor y practica sin guion
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quick.slice(0, 4).map(q => (
                      <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => submit(q)} disabled={loading}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages
                .filter(m => !m.hidden)
                .map(m => (
                  <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] space-y-1">
                        {editDraft?.id === m.id ? (
                          <div className="space-y-1 rounded-lg border border-primary/40 bg-card p-2">
                            <Textarea
                              value={editDraft.text}
                              onChange={e => setEditDraft({ id: m.id, text: e.target.value })}
                              rows={2}
                              className="min-h-[2.5rem] text-sm"
                              autoFocus
                              aria-label="Corregir la transcripción"
                            />
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setEditDraft(null)}>
                                Cancelar
                              </Button>
                              <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => void saveEditedMessage(m)}>
                                Guardar y revisar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap">
                              {m.content}
                            </div>
                            {feedbackOn && (
                              <div className="flex flex-wrap items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                                  onClick={() => setEditDraft({ id: m.id, text: m.content })}
                                  title="Corregir lo que entendió el dictado (U6)"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                                  onClick={() => setPronunciation({ open: true, phrase: m.content })}
                                  title="Repetir esta frase y comparar la pronunciación"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Repetir
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                        {feedbackOn && editDraft?.id !== m.id && (
                          <TutorFeedbackBubble
                            original={m.content}
                            feedback={feedback[m.id] ?? null}
                            evaluating={!!evaluating[m.id]}
                            explaining={explainingId === m.id}
                            onExplain={() => void explainFeedback(m.id, m.content)}
                            onSpeakCorrection={() => speakCorrection(m.id)}
                            onSpeakCorrectionSlow={() => speakCorrection(m.id, true)}
                            onRetry={() => retryFeedback(m.id, m.content)}
                            onSaveError={() => void saveFeedbackError(m)}
                            savedInNotebook={savedFeedback.includes(m.id)}
                            onRepeatCorrection={() =>
                              setPronunciation({ open: true, phrase: feedback[m.id]?.corrected || m.content })
                            }
                          />
                        )}
                        {feedbackOn && activeStructure && editDraft?.id !== m.id && (
                          <StructureReviewCard
                            review={structureReviews[m.id] ?? null}
                            reviewing={!!structureReviewing[m.id]}
                            error={structureReviewErrors[m.id] ?? null}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 text-sm">
                            {m.content ? (
                              <>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                                  {m.content}
                                </ReactMarkdown>
                                {m.streaming && (
                                  <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary/60 align-middle" />
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
                              </span>
                            )}
                          </div>
                          {speechSupported && m.content && (
                            <div className="flex shrink-0 flex-col gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn('mt-0.5 h-7 w-7 p-0', isSpeaking(m.id) && 'animate-pulse text-primary')}
                                onClick={() => toggleSpeak(m.id, m.content)}
                                aria-label={isSpeaking(m.id) ? 'Detener lectura' : 'Escuchar en voz alta'}
                                title={isSpeaking(m.id) ? 'Detener lectura' : `Escuchar en ${speechLang}`}
                              >
                                {isSpeaking(m.id) ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-1 text-[9px] text-muted-foreground"
                                onClick={() => {
                                  stopSpeak();
                                  speak(`${m.id}-slow`, m.content, 0.8);
                                }}
                                title="Repetir más despacio (0,8×)"
                              >
                                0,8×
                              </Button>
                            </div>
                          )}
                        </div>

                        {m.acciones.length > 0 && (
                          <div className="space-y-1">
                            {m.acciones.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {ACCION_LABEL[a.tipo] ??
                                    `${a.tipo}${a.titulo ? `: ${a.titulo}` : ''}${a.minutos ? ` (${a.minutos} min)` : ''}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 lg:hidden">
                          {m.visuals.map((v, i) => (
                            <VisualBlock key={i} visual={v} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {error && <div className="rounded-md border border-destructive/30 p-2 text-sm text-destructive">{error}</div>}
            </div>

            {showJump && (
              <button
                type="button"
                onClick={jumpToBottom}
                className="sticky bottom-2 ml-auto flex h-8 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-[11px] shadow-sm transition-colors hover:bg-muted"
                aria-label="Ir al final de la conversación"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                Ir al final
              </button>
            )}
          </div>

          {messages.length > 0 && !sessionEnded && (
            <div className="flex gap-1 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quick.map(q => (
                <Button
                  key={q}
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-[10px]"
                  onClick={() => submit(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          {sttListening && (
            <div className="flex items-center gap-2 px-3 pb-1.5">
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-destructive/10 px-1 py-0.5 text-[9px] font-bold text-destructive">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                REC
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[11px] italic leading-snug text-muted-foreground">
                  {sttInterim || 'Escuchando… habla con normalidad'}
                </p>
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-destructive/70 transition-[width] duration-100"
                    style={{ width: `${Math.round(micLevel * 100)}%` }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 px-2 text-[10px]"
                onClick={() => {
                  setMicArmed(false);
                  sttAbort();
                }}
              >
                Cancelar
              </Button>
            </div>
          )}

          {suggestOn && (suggestion || suggestionLoading || suggestionError) && (
            <TutorSuggestionCard
              loading={suggestionLoading}
              error={suggestionError}
              suggestion={suggestion}
              onRefresh={refreshSuggestion}
              onUse={useSuggestion}
              onSend={sendSuggestion}
              onSpeak={speakSuggestion}
              onDismiss={toggleSuggestion}
            />
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
          >
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit(input);
                  }
                }}
                placeholder={sessionEnded ? 'Sesión cerrada. Pulsa «Seguir hablando» para continuar.' : placeholder}
                disabled={loading || sessionEnded}
                rows={2}
                className="max-h-32 min-h-[2.75rem] flex-1 resize-none text-sm"
              />
              <div className="flex flex-col gap-1">
                {sttSupported && (
                  <Button
                    type="button"
                    variant={autoSend ? 'default' : 'outline'}
                    size="sm"
                    className="h-11 w-11 p-0 sm:h-9 sm:w-9"
                    onClick={() => setAutoSend(value => !value)}
                    disabled={loading || sessionEnded}
                    aria-label={autoSend ? 'Auto-envío al parar el micro: activado' : 'Auto-envío al parar el micro: desactivado'}
                    title={
                      autoSend
                        ? 'Auto-envío: al parar el micro, el texto reconocido se envía solo'
                        : 'Sin auto-envío: el texto del micro se añade al campo para que lo edites'
                    }
                  >
                    <CornerDownLeft className={cn('h-4 w-4', autoSend && 'animate-pulse')} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant={sttListening ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-11 w-11 p-0 sm:h-9 sm:w-9', sttListening && 'animate-pulse')}
                  onClick={() => {
                    if (sttListening) {
                      setMicArmed(false);
                      sttStop();
                    } else {
                      setMicArmed(handsFree && esSpeaking);
                      startListening();
                    }
                  }}
                  disabled={loading || !sttSupported || sessionEnded}
                  aria-label={sttListening ? 'Parar y enviar' : 'Hablar con el Tutor'}
                  title={
                    !sttSupported
                      ? 'Reconocimiento de voz no disponible: usa Chrome o Edge'
                      : sttListening
                        ? 'Parar y enviar lo que has dicho'
                        : 'Hablar con el Tutor (Espacio para hablar, Esc para cortar)'
                  }
                >
                  {sttListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {loading ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-11 w-11 p-0 sm:h-9 sm:w-9"
                    onClick={() => {
                      setMicArmed(false);
                      stopSpeak();
                      stop();
                    }}
                    aria-label="Detener respuesta"
                    title="Detener la respuesta del tutor y guardar el punto de lectura"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    className="h-11 w-11 p-0 sm:h-9 sm:w-9"
                    disabled={!input.trim() || sessionEnded}
                    aria-label="Enviar"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[10px] leading-snug text-muted-foreground">
                {esSpeaking
                  ? 'Habla o escribe: el feedback va aparte para no cortar la conversación.'
                  : 'Enter para enviar · Shift+Enter para nueva línea · Ctrl/Cmd+Enter también envía'}
              </p>
              <span className="text-[10px] tabular-nums text-muted-foreground">{input.length > 0 ? `${input.length}` : ''}</span>
            </div>
          </form>
        </Card>

        {/* Columna lateral: estructura activa o apoyo visual */}
        <Card className="hidden h-[70vh] flex-col overflow-hidden lg:flex">
          {activeStructure ? (
            <ActiveStructurePanel
              structure={activeStructure}
              language={language}
              review={lastUserReview}
              onSpeak={text => {
                stopSpeak();
                stopExplanation();
                speak('structure-panel', text);
              }}
              onClear={clearActiveStructure}
              onOpenAll={() => setStructuresOpen(true)}
            />
          ) : (
            <>
              <div className="border-b border-border px-3 py-2">
                <h2 className="text-sm font-medium">Apoyo visual</h2>
              </div>
              <ScrollArea className="flex-1">
                <VisualCanvas
                  visuals={allVisuals}
                  emptyText="Aquí el Tutor dibujará tablas de conjugación, comparaciones de tus errores, listas de vocabulario y tu progreso."
                />
              </ScrollArea>
            </>
          )}
        </Card>
      </div>

      <TutorVoiceFullscreen
        open={fullScreen}
        onClose={() => {
          if (sttListening) sttAbort();
          fullSendRef.current = false;
          setMicArmed(false);
          setFullScreen(false);
        }}
        flag={header.flag}
        name={header.name}
        level={level}
        modeLabel={activeStructure ? `Estructura · ${activeStructure.questionEs}` : activeScenario ? `🎭 ${activeScenario.label[language]}` : activeMode ? activeMode.label : 'Chat libre'}
        language={language}
        aiText={lastAssistant?.content ?? ''}
        aiSpeaking={speakingId !== null || explanationSpeaking}
        loading={loading}
        thinking={loading && !lastAssistant?.content}
        stopSpeak={stopSpeak}
        voicePicker={speechSupported ? <VoicePicker sections={voiceSections} /> : undefined}
        sttSupported={sttSupported}
        sttListening={sttListening}
        sttInterim={sttInterim}
        handsFree={handsFree}
        showFeedback={feedbackOn}
        lastUserText={lastUser?.content ?? ''}
        lastUserFeedback={lastUser ? feedback[lastUser.id] ?? null : null}
        feedbackEvaluating={lastUser ? !!evaluating[lastUser.id] : false}
        feedbackExplaining={lastUser ? explainingId === lastUser.id : false}
        onExplainFeedback={() => {
          if (lastUser) void explainFeedback(lastUser.id, lastUser.content);
        }}
        onSpeakCorrection={() => {
          if (lastUser) speakCorrection(lastUser.id);
        }}
        onRetryFeedback={() => {
          if (lastUser) retryFeedback(lastUser.id, lastUser.content);
        }}
        showSuggestion={suggestOn}
        suggestion={suggestion}
        suggestionLoading={suggestionLoading}
        suggestionError={suggestionError}
        onRefreshSuggestion={refreshSuggestion}
        onUseSuggestion={useSuggestion}
        onSendSuggestion={sendSuggestion}
        onSpeakSuggestion={speakSuggestion}
        onDismissSuggestion={toggleSuggestion}
        onToggleHandsFree={toggleHandsFree}
        onHoldStart={() => {
          fullSendRef.current = true;
          setMicArmed(true);
          startListening();
        }}
        onHoldEnd={() => sttStop()}
        onHoldCancel={() => {
          fullSendRef.current = false;
          setMicArmed(false);
          sttAbort();
        }}
        sessionElapsedMs={sessionElapsedMs}
        sessionRunning={sessionRunning}
        sessionGoalMinutes={sessionGoal}
        onSetSessionGoal={setSessionGoal}
        onToggleSession={toggleSession}
        onFinishSession={finishSession}
        longTalk={longTalk}
        onToggleLongTalk={() => setLongTalk(value => !value)}
        structure={activeStructure}
        onOpenStructures={() => {
          setFullScreen(false);
          setStructuresOpen(true);
        }}
      />

      <SpeakingStructuresPanel
        open={structuresOpen}
        onOpenChange={setStructuresOpen}
        language={language}
        structures={structures}
        onPractice={practiceStructure}
        onSpeak={text => {
          stopSpeak();
          stopExplanation();
          speak('structures', text);
        }}
        onGenerate={generateCustomStructure}
        generating={structureLoading}
        generateError={structureError}
      />

      <SpeakingSessionReport
        open={reportOpen}
        onOpenChange={setReportOpen}
        language={language}
        level={level}
        report={report}
        summary={summaryText}
        summaryLoading={summaryLoading}
        errors={reportErrors}
        errorsSaved={errorsSaved}
        onSaveMinutes={saveReportMinutes}
        onSaveErrors={() => void saveReportErrors()}
        onRepeatTomorrow={() => void repeatTomorrow()}
        onRequestSummary={() => requestSummary()}
      />

      <PronunciationTrainer
        open={pronunciation.open}
        onOpenChange={open => setPronunciation(prev => ({ ...prev, open }))}
        language={language}
        level={level}
        initialPhrase={pronunciation.phrase}
      />

      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Empezar un hilo nuevo?</AlertDialogTitle>
            <AlertDialogDescription>
              La conversación actual se queda en el historial. Si hay una sesión en marcha, se guardarán sus minutos antes de
              empezar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={startNewThread}>Empezar de nuevo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => (open ? undefined : setDeleteTarget(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar esta conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran también sus mensajes y correcciones. Podrás deshacerlo justo después desde el aviso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteConversation()}>Borrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
