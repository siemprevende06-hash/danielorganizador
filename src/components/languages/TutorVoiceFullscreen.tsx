import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
  Hand,
  Loader2,
  MessageCircle,
  Mic,
  Minimize2,
  Pause,
  Play,
  Save,
  Timer,
  Wand2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';
import type { TutorFeedback, TutorSuggestion } from '@/hooks/useLanguageTutorCoach';
import { TutorFeedbackBubble } from './TutorFeedbackBubble';
import { TutorSuggestionCard } from './TutorSuggestionCard';
import { TutorAvatar } from './TutorAvatar';
import type { SpeakingStructure } from './speakingStructures';

const md: Components = {
  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-lg font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1 text-base font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 text-lg leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-6 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-6 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-lg leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/40 pl-4 text-lg italic text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-base">{children}</code>,
  a: ({ children, ...props }) => (
    <a className="text-primary underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-base">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b bg-muted/50 px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
};

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  flag: string;
  name: string;
  level: string;
  modeLabel: string;
  language: Language;
  aiText: string;
  aiSpeaking: boolean;
  loading: boolean;
  thinking: boolean;
  stopSpeak: () => void;
  sttSupported: boolean;
  sttListening: boolean;
  sttInterim: string;
  handsFree: boolean;
  onToggleHandsFree: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
  showFeedback?: boolean;
  lastUserText?: string;
  lastUserFeedback?: TutorFeedback | null;
  feedbackEvaluating?: boolean;
  feedbackExplaining?: boolean;
  onExplainFeedback?: () => void;
  onSpeakCorrection?: () => void;
  onRetryFeedback?: () => void;
  showSuggestion?: boolean;
  suggestion?: TutorSuggestion | null;
  suggestionLoading?: boolean;
  suggestionError?: string | null;
  onRefreshSuggestion?: () => void;
  onUseSuggestion?: () => void;
  onSendSuggestion?: () => void;
  onSpeakSuggestion?: () => void;
  onDismissSuggestion?: () => void;
  sessionElapsedMs: number;
  sessionRunning: boolean;
  sessionGoalMinutes: number;
  onSetSessionGoal: (minutes: number) => void;
  onToggleSession: () => void;
  onFinishSession: () => void;
  longTalk: boolean;
  onToggleLongTalk: () => void;
  structure?: SpeakingStructure | null;
  onOpenStructures?: () => void;
}

const CANCEL_THRESHOLD = 70;
const GOALS = [5, 10, 15, 20];

export function TutorVoiceFullscreen({
  open,
  onClose,
  flag,
  name,
  level,
  modeLabel,
  language,
  aiText,
  aiSpeaking,
  loading,
  thinking,
  stopSpeak,
  sttSupported,
  sttListening,
  sttInterim,
  handsFree,
  onToggleHandsFree,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
  showFeedback,
  lastUserText,
  lastUserFeedback,
  feedbackEvaluating,
  feedbackExplaining,
  onExplainFeedback,
  onSpeakCorrection,
  onRetryFeedback,
  showSuggestion,
  suggestion,
  suggestionLoading,
  suggestionError,
  onRefreshSuggestion,
  onUseSuggestion,
  onSendSuggestion,
  onSpeakSuggestion,
  onDismissSuggestion,
  sessionElapsedMs,
  sessionRunning,
  sessionGoalMinutes,
  onSetSessionGoal,
  onToggleSession,
  onFinishSession,
  longTalk,
  onToggleLongTalk,
  structure,
  onOpenStructures,
}: Props) {
  const [showCancel, setShowCancel] = useState(false);
  const holdingRef = useRef(false);
  const startYRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      holdingRef.current = false;
      setShowCancel(false);
    }
  }, [open]);

  if (!open) return null;

  const goalMs = sessionGoalMinutes * 60_000;
  const progress = goalMs > 0 ? Math.min(1, sessionElapsedMs / goalMs) : 0;
  const goalReached = goalMs > 0 && sessionElapsedMs >= goalMs;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!sttSupported || loading || holdingRef.current) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    holdingRef.current = true;
    startYRef.current = e.clientY;
    setShowCancel(false);
    stopSpeak();
    onHoldStart();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdingRef.current) return;
    setShowCancel(startYRef.current - e.clientY > CANCEL_THRESHOLD);
  };

  const finishHold = (clientY: number | null, forceCancel: boolean) => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const dragged = clientY !== null && startYRef.current - clientY > CANCEL_THRESHOLD;
    setShowCancel(false);
    if (forceCancel || dragged) onHoldCancel();
    else onHoldEnd();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-fullscreen-title"
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-background"
    >
      {/* Cabecera */}
      <header className="flex flex-shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="p-1.5 rounded-md bg-foreground text-background">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p id="tutor-fullscreen-title" className="text-sm font-medium leading-tight">
            {flag} {name} · Tutor IA
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Nivel {level} · {modeLabel}
            {goalReached ? ' · objetivo alcanzado' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClose}
          ref={closeRef}
          aria-label="Salir de pantalla completa"
          title="Salir de pantalla completa"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </header>

      {/* Barra de sesión */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1.5">
          <Timer className={cn('h-4 w-4', sessionRunning ? 'text-primary' : 'text-muted-foreground')} />
          <span className="font-mono text-lg font-semibold tabular-nums">{formatClock(sessionElapsedMs)}</span>
          <span className="text-[11px] text-muted-foreground">/ {sessionGoalMinutes} min</span>
        </div>

        <div className="hidden h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-muted sm:block">
          <div
            className={cn('h-full rounded-full transition-all duration-500', goalReached ? 'bg-success' : 'bg-primary')}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          {GOALS.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => onSetSessionGoal(goal)}
              className={cn(
                'h-7 rounded-full border px-2 text-[11px] font-medium transition-colors',
                sessionGoalMinutes === goal
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={sessionGoalMinutes === goal}
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
            onClick={onToggleSession}
          >
            {sessionRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {sessionRunning ? 'Pausar' : sessionElapsedMs > 0 ? 'Seguir' : 'Empezar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2 text-[11px]"
            onClick={onFinishSession}
            disabled={sessionElapsedMs < 1000}
            title="Guarda los minutos y pide el resumen final"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Terminar y guardar</span>
            <span className="sm:hidden">Guardar</span>
          </Button>
        </div>
      </div>

      {/* Cara + conversación */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center gap-4">
          <div className="w-[min(46vw,190px)] shrink-0 sm:w-[220px]">
            <TutorAvatar
              speaking={aiSpeaking}
              listening={sttListening}
              thinking={thinking}
              language={language}
              progress={sessionElapsedMs > 0 ? progress : undefined}
              label={aiSpeaking ? 'Tutor hablando' : sttListening ? 'Tutor escuchando' : 'Tutor IA'}
            />
          </div>

          {structure && (
            <div className="w-full rounded-xl border border-focus/30 bg-focus/[0.04] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 shrink-0 text-focus" />
                <p className="min-w-0 flex-1 truncate text-xs font-medium">{structure.question[language]}</p>
                {onOpenStructures && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={onOpenStructures}
                  >
                    Ver
                  </Button>
                )}
              </div>
              <div className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {structure.steps.map((step, index) => (
                  <span
                    key={`${structure.id}-${index}`}
                    className="shrink-0 rounded-full border border-focus/25 bg-background px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                  >
                    {index + 1}. {step.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="w-full" aria-live="polite">
            {sttListening ? (
              <p className="text-center text-lg italic text-muted-foreground whitespace-pre-wrap">
                {sttInterim || 'Escuchando…'}
              </p>
            ) : aiText ? (
              <div className="text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                  {aiText}
                </ReactMarkdown>
                {loading && (
                  <span className="ml-0.5 inline-block h-5 w-2 animate-pulse rounded-sm bg-primary/60 align-middle" />
                )}
              </div>
            ) : loading ? (
              <p className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Pensando…
              </p>
            ) : (
              <p className="text-center text-base text-muted-foreground">
                {handsFree
                  ? 'Toca el micro una vez y habla: el tutor te contesta en voz alta y el micro se reactiva solo.'
                  : 'Mantén pulsado el botón y habla. Al soltarlo se envía al Tutor.'}
              </p>
            )}
          </div>

          {showFeedback && lastUserText && (
            <div className="w-full">
              <TutorFeedbackBubble
                original={lastUserText}
                feedback={lastUserFeedback ?? null}
                evaluating={!!feedbackEvaluating}
                explaining={!!feedbackExplaining}
                onExplain={onExplainFeedback ?? (() => undefined)}
                onSpeakCorrection={onSpeakCorrection ?? (() => undefined)}
                onRetry={onRetryFeedback ?? (() => undefined)}
              />
            </div>
          )}

          {showSuggestion && (suggestion || suggestionLoading || suggestionError) && (
            <div className="w-full">
              <TutorSuggestionCard
                loading={!!suggestionLoading}
                error={suggestionError ?? null}
                suggestion={suggestion ?? null}
                onRefresh={onRefreshSuggestion ?? (() => undefined)}
                onUse={onUseSuggestion ?? (() => undefined)}
                onSend={onSendSuggestion ?? (() => undefined)}
                onSpeak={onSpeakSuggestion ?? (() => undefined)}
                onDismiss={onDismissSuggestion ?? (() => undefined)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-shrink-0 flex-col items-center gap-2 border-t border-border px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Button
            type="button"
            variant={longTalk ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 px-2.5 text-[11px]"
            onClick={onToggleLongTalk}
            aria-pressed={longTalk}
            title={longTalk ? 'Respuestas largas: el tutor habla más en cada turno' : 'Respuestas cortas: un turno breve por pregunta'}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {longTalk ? 'Charla larga' : 'Turnos cortos'}
          </Button>
          <Button
            type="button"
            variant={handsFree ? 'default' : 'outline'}
            size="sm"
            className="h-8 gap-1 px-2.5 text-[11px]"
            onClick={onToggleHandsFree}
            aria-pressed={handsFree}
            title={handsFree ? 'Manos libres activo' : 'Activar manos libres'}
          >
            <Hand className="h-3.5 w-3.5" />
            {handsFree ? 'Manos libres' : 'Pulsar para hablar'}
          </Button>
          {onOpenStructures && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2.5 text-[11px]"
              onClick={onOpenStructures}
              title="Ver estructuras para responder"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Estructuras
            </Button>
          )}
        </div>

        <div className="flex h-14 items-center justify-center">
          {showCancel && (
            <div className="flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive animate-in fade-in-0 zoom-in-95 duration-150">
              <X className="h-4 w-4" />
              Suelta para descartar
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!sttSupported || loading}
          onClick={
            handsFree
              ? () => {
                  if (sttListening) onHoldEnd();
                  else onHoldStart();
                }
              : undefined
          }
          onPointerDown={handsFree ? undefined : handlePointerDown}
          onPointerMove={handsFree ? undefined : handlePointerMove}
          onPointerUp={handsFree ? undefined : e => finishHold(e.clientY, false)}
          onPointerCancel={handsFree ? undefined : () => finishHold(null, true)}
          onContextMenu={e => e.preventDefault()}
          className={cn(
            'flex touch-none select-none items-center justify-center rounded-full transition-all duration-150',
            'h-[4.5rem] w-[4.5rem]',
            showCancel
              ? 'scale-95 bg-destructive text-white shadow-lg shadow-destructive/30'
              : sttListening
                ? 'scale-110 animate-pulse bg-blue-600 text-white shadow-lg shadow-blue-600/40'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 active:scale-95',
            (!sttSupported || loading) && 'pointer-events-none opacity-40'
          )}
          aria-label={handsFree ? (sttListening ? 'Parar y enviar' : 'Hablar') : 'Mantén pulsado para hablar'}
          aria-pressed={handsFree ? sttListening : undefined}
        >
          {showCancel ? <X className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </button>

        <p className="max-w-sm text-center text-[11px] leading-snug text-muted-foreground">
          {!sttSupported
            ? 'Reconocimiento de voz no disponible: usa Chrome o Edge'
            : handsFree
              ? sttListening
                ? 'Habla con normalidad · toca para parar y enviar'
                : 'Toca una vez y habla · el tutor responde en voz alta y el micro se reactiva solo'
              : 'Mantén pulsado para hablar · suelta para enviar · desliza hacia arriba para descartar'}
        </p>
      </div>
    </div>
  );
}
