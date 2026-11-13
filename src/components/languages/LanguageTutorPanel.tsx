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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowDown,
  CheckCircle2,
  CornerDownLeft,
  Hand,
  History,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  Save,
  Send,
  Sparkles,
  Square,
  SquarePen,
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
import { useLanguageTutor, type SendMessageOptions } from '@/hooks/useLanguageTutor';
import { useLanguageTutorCoach } from '@/hooks/useLanguageTutorCoach';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { limpiarRepeticiones, useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Language } from '@/hooks/useLanguageLearning';
import { TUTOR_EMPTY, TUTOR_GENERAL, TUTOR_HEADER, TUTOR_MODES, type TutorModeDef, type TutorSkill } from './tutorModes';
import { SCENARIO_END_MSG, SCENARIO_START_MSG, SESSION_END_MSG, SPEAKING_SCENARIOS } from './speakingScenarios';
import { SPEAKING_STRUCTURES, type SpeakingStructure } from './speakingStructures';
import { TutorFeedbackBubble } from './TutorFeedbackBubble';
import { TutorSuggestionCard } from './TutorSuggestionCard';
import { TutorVoiceFullscreen } from './TutorVoiceFullscreen';
import { TutorAvatar } from './TutorAvatar';
import { SpeakingStructuresPanel } from './SpeakingStructuresPanel';
import { ActiveStructurePanel } from './ActiveStructurePanel';
import { StructureReviewCard } from './StructureReviewCard';

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

interface Props {
  language: Language;
  level: string;
  /** false cuando la pestaña del tutor no está visible: corta voz y micro. */
  active?: boolean;
  onLogPractice?: (
    skillId: string,
    minutes: number,
    blockType: 'morning' | 'afternoon',
    language?: Language
  ) => Promise<void>;
}

export function LanguageTutorPanel({ language, level, active = true, onLogPractice }: Props) {
  const [mode, setMode] = useState<TutorSkill | null>(null);
  const [input, setInput] = useState('');
  const [logged, setLogged] = useState<string[]>([]);
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
  const [customStructures, setCustomStructures] = useState<SpeakingStructure[]>([]);
  const [sessionGoal, setSessionGoal] = useState(10);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSendRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  /** true cuando la grabación viene del botón de pantalla completa (siempre envía al soltar) */
  const fullSendRef = useRef(false);
  /** Mensajes ya evaluados: evita repetir la llamada de feedback. */
  const evaluatedRef = useRef<Set<string>>(new Set());
  /** Mensajes ya revisados contra la estructura activa. */
  const reviewedRef = useRef<Set<string>>(new Set());
  /** Última respuesta del tutor para la que ya se pidió sugerencia. */
  const suggestionForRef = useRef<string | null>(null);
  const goalReachedRef = useRef(false);
  const sessionElapsedRef = useRef(0);
  /** Idioma al que pertenece la sesión en curso (no cambia al cambiar de idioma). */
  const sessionLanguageRef = useRef<Language>(language);

  const {
    conversations,
    conversationId,
    messages,
    memories,
    loading,
    error,
    sendMessage,
    stop,
    openConversation,
    newConversation,
    deleteConversation,
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
    reviewStructure,
    clearStructureReviews,
    reset: resetCoach,
  } = useLanguageTutorCoach(language, level);

  const speechLang = language === 'italian' ? 'it-IT' : 'en-US';
  const rate = mode === 'listening' ? 0.9 : 1;
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
    voiceOk,
  } = useSpeechSynthesis(speechLang, rate);

  // Voz aparte en español: la explicación del error se lee en su idioma.
  const {
    speak: speakExplanation,
    stop: stopExplanation,
    speaking: explanationSpeaking,
  } = useSpeechSynthesis('es-ES', 1);

  const { supported: sttSupported, listening: sttListening, interim: sttInterim, start: sttStart, stop: sttStop, abort: sttAbort } =
    useSpeechRecognition({
      lang: speechLang,
      onFinal: text => handleFinal(text),
      onError: () => {
        // Cualquier error corta el modo manos libres para no reabrir el micro en bucle.
        setMicArmed(false);
      },
    });

  const {
    running: sessionRunning,
    elapsedMs: sessionElapsedMs,
    start: startSession,
    pause: pauseSession,
    finish: finishTimer,
    reset: resetSession,
  } = usePracticeSession(minutes => {
    if (minutes > 0) void onLogPractice?.('speaking', minutes, 'morning', sessionLanguageRef.current);
  });

  sessionElapsedRef.current = sessionElapsedMs;

  const header = TUTOR_HEADER[language];
  const activeMode: TutorModeDef | null = TUTOR_MODES.find(m => m.id === mode) ?? null;
  const activeScenario = scenario ? SPEAKING_SCENARIOS.find(s => s.id === scenario) ?? null : null;
  const quick = activeMode ? activeMode.quick[language] : TUTOR_GENERAL[language];
  const esSpeaking = mode === 'speaking';
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

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant') ?? null;
  const lastUser = [...messages].reverse().find(m => m.role === 'user') ?? null;
  const lastAssistantId = lastAssistant?.id;
  const lastAssistantIndex = lastAssistant ? messages.findIndex(m => m.id === lastAssistant.id) : -1;
  const showLogButton = !loading && messages.length > 0 && lastAssistantId && !logged.includes(lastAssistantId);
  const lastUserReview = lastUser ? structureReviews[lastUser.id] ?? null : null;
  const structures = useMemo(() => [...customStructures, ...SPEAKING_STRUCTURES], [customStructures]);

  const sessionGoalMs = sessionGoal * 60_000;
  const sessionProgress = sessionGoalMs > 0 ? Math.min(1, sessionElapsedMs / sessionGoalMs) : 0;
  const goalReached = sessionElapsedMs >= sessionGoalMs;

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
    // Los mensajes que ya están en pantalla no se reevalúan al cambiar de hilo.
    messages.forEach(m => {
      if (m.role === 'user') {
        evaluatedRef.current.add(m.id);
        reviewedRef.current.add(m.id);
      }
    });
    suggestionForRef.current = lastAssistantId ?? null;
    resetCoach();
  };

  const ensureSession = () => {
    if (!sessionRunning && sessionElapsedMs === 0) {
      sessionLanguageRef.current = language;
      startSession();
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

  useEffect(() => {
    if (!loading && !handsFree) inputRef.current?.focus();
  }, [loading, conversationId, handsFree]);

  // Al cambiar de idioma se cierra la sesión anterior y se guardan sus minutos.
  useEffect(() => {
    if (sessionElapsedRef.current > 0) finishTimer();
    else resetSession();
    setLogged([]);
    setMode(null);
    setInput('');
    setScenario(null);
    setHandsFree(false);
    setMicArmed(false);
    setFeedbackOn(false);
    setSuggestOn(false);
    setLongTalk(true);
    setActiveStructure(null);
    setCustomStructures([]);
    setStructuresOpen(false);
    setFullScreen(false);
    setSessionGoal(10);
    setShowJump(false);
    goalReachedRef.current = false;
    clearStructureReviews();
    stopSpeak();
    stopExplanation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, stopSpeak, stopExplanation, resetCoach, resetSession, finishTimer, clearStructureReviews]);

  // Al salir de la pestaña se corta todo: la voz no debe seguir sonando.
  useEffect(() => {
    if (active) return;
    stopSpeak();
    stopExplanation();
    if (sttListening) sttAbort();
    setMicArmed(false);
    setFullScreen(false);
    if (sessionRunning) pauseSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, sessionRunning, sttListening, stopSpeak, stopExplanation, pauseSession]);

  // La voz empieza a sonar en cuanto hay una frase, sin esperar la respuesta completa.
  useEffect(() => {
    if (!autoSpeak) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last || !last.content) return;
    // El historial guardado no se lee en voz alta al abrirlo
    if (!last.id.startsWith('tmp-a-')) return;
    speakStream(last.id, last.content, !loading);
  }, [messages, loading, autoSpeak, speakStream]);

  // Feedback automático: evalúa cada frase nueva del estudiante.
  useEffect(() => {
    if (!feedbackOn) return;
    messages.forEach((m, index) => {
      if (m.role !== 'user' || !m.id.startsWith('tmp-u-')) return;
      if (evaluatedRef.current.has(m.id)) return;
      evaluatedRef.current.add(m.id);
      void evaluate(m.id, m.content, historyBefore(index));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, feedbackOn, evaluate]);

  // Revisión de estructura: solo para respuestas nuevas mientras hay una activa.
  useEffect(() => {
    if (!feedbackOn || !activeStructure) return;
    messages.forEach((m, index) => {
      if (m.role !== 'user' || !m.id.startsWith('tmp-u-')) return;
      if (reviewedRef.current.has(m.id)) return;
      reviewedRef.current.add(m.id);
      void reviewStructure(m.id, m.content, activeStructure, historyBefore(index));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, feedbackOn, activeStructure, reviewStructure]);

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

  const startListening = () => {
    if (!sttSupported || loading) return;
    stopSpeak();
    stopExplanation();
    sttStart();
  };

  const applyMode = (next: TutorSkill | null) => {
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
    }
    if (sttListening) sttAbort();
    clearSuggestion();
    suggestionForRef.current = lastAssistantId ?? null;
  };

  const toggleSpeak = (id: string, text: string) => {
    if (isSpeaking(id)) {
      stopSpeak();
      return;
    }
    setAutoSpeak(false);
    speak(id, text);
  };

  function submit(text: string, scenarioId?: string | null, options?: SendMessageOptions) {
    const limpio = text.trim();
    if (!limpio || loading) return;
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

  function handleFinal(text: string) {
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

  // Manos libres: tras la respuesta (y su voz) el micro se reactiva solo.
  useEffect(() => {
    if (!handsFree || !micArmed || !esSpeaking) return;
    if (loading || speaking || explanationSpeaking || sttListening || !sttSupported) return;
    // Margen para que termine el audio del TTS antes de abrir el micro (evita eco)
    const t = window.setTimeout(() => sttStart(), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, micArmed, esSpeaking, loading, speaking, explanationSpeaking, sttListening, sttSupported]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const startScenario = (id: string) => {
    if (loading) return;
    const def = SPEAKING_SCENARIOS.find(s => s.id === id);
    setScenario(id);
    setActiveStructure(null);
    clearStructureReviews();
    setHandsFree(true);
    setAutoSpeak(true);
    setLongTalk(true);
    markCurrentAsEvaluated();
    setFeedbackOn(true);
    ensureSession();
    submit(SCENARIO_START_MSG[language], id, {
      hidden: true,
      start: true,
      title: def ? `Simulación · ${def.label[language]}` : undefined,
    });
  };

  const finishScenario = () => {
    if (!scenario || loading) return;
    submit(SCENARIO_END_MSG, scenario);
    setScenario(null);
  };

  const practiceStructure = (structure: SpeakingStructure) => {
    if (loading) return;
    setActiveStructure(structure);
    setStructuresOpen(false);
    clearStructureReviews();
    setScenario(null);
    setMode('speaking');
    setAutoSpeak(true);
    setAutoSend(true);
    setHandsFree(true);
    setFeedbackOn(true);
    setLongTalk(true);
    setMicArmed(false);
    markCurrentAsEvaluated();
    ensureSession();
    submit(`Ask me this question and wait for my answer: "${structure.question[language]}"`, null, {
      hidden: true,
      start: true,
      title: `Speaking · ${structure.questionEs}`,
      structureQuestion: structure.question[language],
    });
  };

  const generateCustomStructure = async (question: string) => {
    const structure = await generateStructure(question);
    if (structure) {
      setCustomStructures(prev => [structure, ...prev]);
      toast.success('Estructura creada. Pulsa "Practicar" para usarla.');
    }
    return structure;
  };

  const clearActiveStructure = () => {
    setActiveStructure(null);
    clearStructureReviews();
  };

  const toggleSession = () => {
    if (sessionRunning) {
      pauseSession();
    } else {
      if (sessionElapsedMs === 0) sessionLanguageRef.current = language;
      startSession();
    }
  };

  const finishSession = () => {
    const minutes = sessionElapsedMs > 0 ? finishTimer() : 0;
    if (minutes > 0) toast.success(`${minutes} min de speaking guardados en tu día`);
    setFullScreen(false);
    if (messages.length > 0 && !loading) {
      const scenarioId = scenario;
      setScenario(null);
      setActiveStructure(null);
      clearStructureReviews();
      submit(SESSION_END_MSG, scenarioId, { hidden: true, sessionEnd: true });
      toast.info('Preparando el resumen de la sesión…');
    }
  };

  const startNewThread = () => {
    const minutes = sessionElapsedMs > 0 ? finishTimer() : 0;
    if (minutes > 0) toast.success(`${minutes} min de speaking guardados en tu día`);
    stopSpeak();
    stopExplanation();
    if (sttListening) sttAbort();
    setScenario(null);
    setActiveStructure(null);
    clearStructureReviews();
    setMicArmed(false);
    setFeedbackOn(false);
    setSuggestOn(false);
    setLogged([]);
    setInput('');
    setShowJump(false);
    nearBottomRef.current = true;
    setConfirmNewOpen(false);
    resetCoachTracking();
    newConversation();
  };

  const openThread = (id: string) => {
    stopSpeak();
    stopExplanation();
    setScenario(null);
    setActiveStructure(null);
    clearStructureReviews();
    setMicArmed(false);
    setFullScreen(false);
    resetCoachTracking();
    openConversation(id);
  };

  const handleDeleteConversation = async (id: string) => {
    const wasCurrent = id === conversationId;
    await deleteConversation(id);
    if (wasCurrent) {
      resetCoachTracking();
      setScenario(null);
      setActiveStructure(null);
      clearStructureReviews();
      setFullScreen(false);
    }
    toast.success('Conversación borrada');
  };

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
    void evaluate(messageId, text, historyBefore(index));
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

  const speakCorrection = (messageId: string) => {
    const current = feedback[messageId];
    if (!current?.corrected) return;
    stopExplanation();
    stopSpeak();
    speak(`fix-${messageId}`, current.corrected);
  };

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

  const logPractice = async (messageId: string, minutes: number) => {
    const statId = activeMode?.statId ?? 'vocabulary';
    await onLogPractice?.(statId, minutes, 'morning');
    setLogged(prev => [...prev, messageId]);
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

      {/* Herramientas de conversación */}
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
            variant={longTalk ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setLongTalk(value => !value)}
            title={
              longTalk
                ? 'Charla larga: el tutor habla más en cada turno para que la conversación fluya'
                : 'Turnos cortos: una pregunta breve por respuesta'
            }
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            {longTalk ? 'Charla larga' : 'Turnos cortos'}
          </Button>
        )}
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

        {speechSupported && (
          <div className="ml-auto flex gap-1.5">
            {esSpeaking && sttSupported && (
              <Button
                variant={handsFree ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  if (handsFree) {
                    setHandsFree(false);
                    setMicArmed(false);
                  } else {
                    setHandsFree(true);
                  }
                }}
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
            <Button
              variant={autoSpeak ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                if (autoSpeak) {
                  setAutoSpeak(false);
                  stopSpeak();
                } else {
                  setAutoSpeak(true);
                }
              }}
              title={autoSpeak ? 'La IA lee sus respuestas en voz alta' : 'Activar lectura en voz alta'}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 mr-1 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 mr-1" />}
              {autoSpeak ? 'Voz on' : 'Voz off'}
            </Button>
          </div>
        )}
      </div>

      {mode === 'speaking' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-0.5">Simulaciones:</span>
          {SPEAKING_SCENARIOS.map(s => {
            const isActive = scenario === s.id;
            return (
              <Button
                key={s.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => (isActive ? setScenario(null) : startScenario(s.id))}
                disabled={loading}
                title={s.goal[language]}
              >
                <s.Icon className="w-3 h-3 mr-1" />
                {s.label[language]}
              </Button>
            );
          })}
        </div>
      )}

      {esSpeaking && handsFree && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          {micArmed
            ? 'Manos libres activo: habla cuando quieras, se envía al dejar de hablar y el micro se reactiva solo al terminar la respuesta.'
            : 'Toca el micro una vez: a partir de ahí tú hablas y el tutor responde en voz alta sin que toques nada más.'}
          {!sttSupported && ' (Este navegador no tiene reconocimiento de voz: usa Chrome o Edge.)'}
          {speechSupported && !voiceOk && ' Instala una voz de inglés/italiano en tu sistema para que la pronunciación sea correcta.'}
        </p>
      )}

      {activeScenario && (
        <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs">
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
      )}

      {/* Cronómetro de sesión */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Timer className={cn('h-4 w-4', sessionRunning ? 'text-primary' : 'text-muted-foreground')} />
          <span className="font-mono text-base font-semibold tabular-nums">{formatClock(sessionElapsedMs)}</span>
          <span className="text-[11px] text-muted-foreground">/ {sessionGoal} min</span>
        </div>

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
            title="Guarda los minutos y pide el resumen final"
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
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-3">
        {/* Chat */}
        <Card className="flex h-[62vh] flex-col lg:h-[70vh]">
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
              <SheetContent side="right" className="flex w-[min(22rem,92vw)] flex-col p-0">
                <SheetHeader className="border-b px-4 pb-3 pr-12 pt-5 text-left">
                  <SheetTitle className="text-base">Historial y memoria</SheetTitle>
                  <SheetDescription className="text-xs leading-relaxed">
                    Retoma una conversación anterior o revisa lo que el tutor recuerda de ti.
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
                    <ScrollArea className="h-[calc(100dvh-12rem)] pr-2">
                      <div className="space-y-1">
                        {conversations.length === 0 && (
                          <p className="p-2 text-xs text-muted-foreground">Sin conversaciones de {header.name} aún.</p>
                        )}
                        {conversations.map(c => (
                          <div
                            key={c.id}
                            className={cn(
                              'flex items-start gap-1 rounded-md transition-colors',
                              c.id === conversationId && 'bg-muted'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => openThread(c.id)}
                              className="min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                            >
                              <span className="line-clamp-2">{c.title || 'Conversación'}</span>
                              <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatDate(c.updated_at)}</span>
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => void handleDeleteConversation(c.id)}
                              aria-label={`Borrar ${c.title || 'conversación'}`}
                              title="Borrar conversación"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
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
                  const state = lastUserReview?.covered.find(item => item.label.toLowerCase() === step.label.toLowerCase())?.ok;
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

          <div
            ref={scrollRef}
            onScroll={handleChatScroll}
            className="relative min-h-0 flex-1 overflow-y-auto p-3"
          >
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <div className="w-[min(38vw,150px)]">
                    <TutorAvatar language={language} listening={sttListening} thinking={loading} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tu tutor te escucha</p>
                    <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">{TUTOR_EMPTY[language]}</p>
                  </div>
                  <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
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
                    <button
                      type="button"
                      onClick={() => setStructuresOpen(true)}
                      className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-focus/40 hover:bg-focus/[0.03]"
                    >
                      <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-focus" />
                      <span>
                        <span className="block text-xs font-semibold">Estructuras para responder</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          Aprende el esqueleto de una buena respuesta
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quick.map(q => (
                      <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => submit(q)} disabled={loading}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(m => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] space-y-1">
                      <div className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground whitespace-pre-wrap">
                        {m.content}
                      </div>
                      {feedbackOn && (
                        <TutorFeedbackBubble
                          original={m.content}
                          feedback={feedback[m.id] ?? null}
                          evaluating={!!evaluating[m.id]}
                          explaining={explainingId === m.id}
                          onExplain={() => void explainFeedback(m.id, m.content)}
                          onSpeakCorrection={() => speakCorrection(m.id)}
                          onRetry={() => retryFeedback(m.id, m.content)}
                        />
                      )}
                      {feedbackOn && activeStructure && (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('mt-0.5 h-7 w-7 flex-shrink-0 p-0', isSpeaking(m.id) && 'animate-pulse text-primary')}
                            onClick={() => toggleSpeak(m.id, m.content)}
                            aria-label={isSpeaking(m.id) ? 'Detener lectura' : 'Escuchar en voz alta'}
                            title={isSpeaking(m.id) ? 'Detener lectura' : `Escuchar en ${speechLang}`}
                          >
                            {isSpeaking(m.id) ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
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

                      {showLogButton && m.id === lastAssistantId && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[10, 20, 30].map(min => (
                            <Button
                              key={min}
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => void logPractice(m.id, min)}
                            >
                              <SquarePen className="h-3 w-3 mr-1" />
                              Registrar {min} min
                            </Button>
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

          {messages.length > 0 && (
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
            <div className="flex items-center gap-1.5 px-3 pb-1 text-[11px] italic text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-destructive" />
              <span className="truncate">{sttInterim || 'Escuchando... habla con normalidad'}</span>
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

          <form onSubmit={handleSubmit} className="border-t border-border p-3 pt-2">
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
                placeholder={placeholder}
                disabled={loading}
                rows={2}
                className="max-h-32 min-h-[2.75rem] flex-1 resize-none text-sm"
              />
              <div className="flex flex-col gap-1">
                {sttSupported && (
                  <Button
                    type="button"
                    variant={autoSend ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setAutoSend(value => !value)}
                    disabled={loading}
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
                  className={cn('h-9 w-9 p-0', sttListening && 'animate-pulse')}
                  onClick={() => {
                    if (sttListening) {
                      setMicArmed(false);
                      sttStop();
                    } else {
                      setMicArmed(handsFree && esSpeaking);
                      startListening();
                    }
                  }}
                  disabled={loading || !sttSupported}
                  aria-label={sttListening ? 'Parar y enviar' : 'Hablar con el Tutor'}
                  title={
                    !sttSupported
                      ? 'Reconocimiento de voz no disponible: usa Chrome o Edge'
                      : sttListening
                        ? 'Parar y enviar lo que has dicho'
                        : 'Hablar con el Tutor'
                  }
                >
                  {sttListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {loading ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0"
                    onClick={() => {
                      setMicArmed(false);
                      stopSpeak();
                      stop();
                    }}
                    aria-label="Detener respuesta"
                    title="Detener la respuesta del tutor"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" className="h-9 w-9 p-0" disabled={!input.trim()} aria-label="Enviar">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[10px] leading-snug text-muted-foreground">
                {esSpeaking ? 'Habla o escribe: el feedback va aparte para no cortar la conversación.' : 'Enter para enviar · Shift+Enter para nueva línea'}
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
        onToggleHandsFree={() => {
          if (handsFree) {
            setHandsFree(false);
            setMicArmed(false);
          } else {
            setHandsFree(true);
          }
        }}
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

      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Empezar un hilo nuevo?</AlertDialogTitle>
            <AlertDialogDescription>
              La conversación actual se queda en el historial. Si hay una sesión de speaking en marcha, se guardarán sus minutos antes de empezar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={startNewThread}>Empezar de nuevo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
