import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  CornerDownLeft,
  GraduationCap,
  Hand,
  History,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Plus,
  Send,
  Sparkles,
  Square,
  SquarePen,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisualBlock, VisualCanvas } from '@/components/coach/VisualCanvas';
import { useLanguageTutor } from '@/hooks/useLanguageTutor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Language } from '@/hooks/useLanguageLearning';
import { TUTOR_EMPTY, TUTOR_GENERAL, TUTOR_HEADER, TUTOR_MODES, type TutorModeDef, type TutorSkill } from './tutorModes';
import { SCENARIO_END_MSG, SCENARIO_START_MSG, SPEAKING_SCENARIOS } from './speakingScenarios';
import { TutorVoiceFullscreen } from './TutorVoiceFullscreen';

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

interface Props {
  language: Language;
  level: string;
  onLogPractice?: (skillId: string, minutes: number, blockType: 'morning' | 'afternoon') => Promise<void>;
}

export function LanguageTutorPanel({ language, level, onLogPractice }: Props) {
  const [mode, setMode] = useState<TutorSkill | null>(null);
  const [input, setInput] = useState('');
  const [logged, setLogged] = useState<string[]>([]);
  const [scenario, setScenario] = useState<string | null>(null);
  const [autoSend, setAutoSend] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [micArmed, setMicArmed] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSendRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  /** true cuando la grabación viene del botón de pantalla completa (siempre envía al soltar) */
  const fullSendRef = useRef(false);

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
    deleteMemory,
  } = useLanguageTutor(language, level, mode);

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

  const header = TUTOR_HEADER[language];
  const activeMode: TutorModeDef | null = TUTOR_MODES.find(m => m.id === mode) ?? null;
  const activeScenario = scenario ? SPEAKING_SCENARIOS.find(s => s.id === scenario) ?? null : null;
  const quick = activeMode ? activeMode.quick[language] : TUTOR_GENERAL[language];
  const esSpeaking = mode === 'speaking';
  const placeholder = activeScenario
    ? 'Habla con el micro (se envía solo) o escribe tu respuesta...'
    : esSpeaking
      ? 'Pulsa el micro y habla, o escribe lo que quieras decir...'
      : activeMode
        ? activeMode.placeholder
        : 'Escribe tu pregunta o tu texto para corregirlo...';
  const allVisuals = messages.flatMap(m => m.visuals);

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant') ?? null;
  const lastAssistantId = lastAssistant?.id;
  const showLogButton = !loading && messages.length > 0 && lastAssistantId && !logged.includes(lastAssistantId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && !handsFree) inputRef.current?.focus();
  }, [loading, conversationId, handsFree]);

  // Al cambiar de pestaña/idioma el registro de práctica ya no aplica
  useEffect(() => {
    setLogged([]);
    setMode(null);
    setInput('');
    setScenario(null);
    setHandsFree(false);
    setMicArmed(false);
    stopSpeak();
  }, [language, stopSpeak]);

  // La voz empieza a sonar en cuanto hay una frase, sin esperar la respuesta completa
  useEffect(() => {
    if (!autoSpeak) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last || !last.content) return;
    // El historial guardado no se lee en voz alta al abrirlo
    if (!last.id.startsWith('tmp-a-')) return;
    speakStream(last.id, last.content, !loading);
  }, [messages, loading, autoSpeak, speakStream]);

  const { supported: sttSupported, listening: sttListening, interim: sttInterim, start: sttStart, stop: sttStop, abort: sttAbort } =
    useSpeechRecognition({
      lang: speechLang,
      onFinal: text => handleFinal(text),
      onError: code => {
        if (code === 'silencio') {
          setMicArmed(false);
        }
      },
    });

  const startListening = () => {
    if (!sttSupported || loading) return;
    stopSpeak();
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
    if (next !== 'speaking') setScenario(null);
    if (sttListening) sttAbort();
  };

  const toggleSpeak = (id: string, text: string) => {
    if (isSpeaking(id)) {
      stopSpeak();
      return;
    }
    setAutoSpeak(false);
    speak(id, text);
  };

  function submit(text: string, scenarioId?: string | null) {
    const limpio = text.trim();
    if (!limpio || loading) return;
    // Evita el doble envío típico: onend del micro + clic en enviar
    const ahora = Date.now();
    if (lastSendRef.current.text === limpio && ahora - lastSendRef.current.at < 1500) return;
    lastSendRef.current = { text: limpio, at: ahora };
    fullSendRef.current = false;

    stopSpeak();
    sendMessage(limpio, scenarioId ?? scenario ?? undefined);
    setInput('');
    if (sttListening) sttAbort();
  }

  function handleFinal(text: string) {
    const fromFullscreen = fullSendRef.current;
    fullSendRef.current = false;
    if (!text.trim()) return;
    if (fromFullscreen || autoSend || handsFree) {
      submit(text);
    } else {
      setInput(prev => (prev ? `${prev} ${text}` : text));
      inputRef.current?.focus();
    }
  }

  // Manos libres: tras la respuesta (y su voz) el micro se reactiva solo
  useEffect(() => {
    if (!handsFree || !micArmed || !esSpeaking) return;
    if (loading || speaking || sttListening || !sttSupported) return;
    // Margen para que arranque el TTS antes de abrir el micro (evita eco)
    const t = window.setTimeout(() => sttStart(), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, micArmed, esSpeaking, loading, speaking, sttListening, sttSupported]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const startScenario = (id: string) => {
    if (loading) return;
    setScenario(id);
    setHandsFree(true);
    setAutoSpeak(true);
    submit(SCENARIO_START_MSG, id);
  };

  const finishScenario = () => {
    if (!scenario || loading) return;
    submit(SCENARIO_END_MSG, scenario);
    setScenario(null);
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
      : speaking
        ? 'Hablando…'
        : '';

  return (
    <div className="space-y-3">
      {/* Selector de habilidad */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant={mode === null ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs"
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
            className="h-8 text-xs"
            onClick={() => applyMode(mode === m.id ? null : m.id)}
          >
            <m.Icon className="w-3.5 h-3.5 mr-1" />
            {m.label}
            {m.id === 'listening' && (
              <Volume2 className={cn('w-3 h-3 ml-1', mode === m.id ? 'opacity-90' : 'text-muted-foreground')} />
            )}
          </Button>
        ))}

        {speechSupported && (
          <div className="ml-auto flex gap-1.5">
            {esSpeaking && sttSupported && (
              <Button
                variant={handsFree ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => (handsFree ? (setHandsFree(false), setMicArmed(false)) : setHandsFree(true))}
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
              onClick={() => (autoSpeak ? (setAutoSpeak(false), stopSpeak()) : setAutoSpeak(true))}
              title={autoSpeak ? 'La IA lee sus respuestas en voz alta' : 'Activar lectura en voz alta'}
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 mr-1 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 mr-1" />}
              {autoSpeak ? 'Voz on' : 'Voz off'}
            </Button>
          </div>
        )}
      </div>

      {mode === 'speaking' && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-muted-foreground mr-0.5">Simulaciones:</span>
          {SPEAKING_SCENARIOS.map(s => {
            const active = scenario === s.id;
            return (
              <Button
                key={s.id}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => (active ? setScenario(null) : startScenario(s.id))}
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

      <div className="grid lg:grid-cols-[1fr_340px] gap-3">
        {/* Chat */}
        <Card className="flex flex-col h-[62vh] lg:h-[70vh]">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-foreground text-background">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">
                Tutor IA · {header.flag} {header.name}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Nivel {level} · {activeMode ? activeMode.label : 'Chat libre'}
                {status ? ` · ${status}` : speechSupported && autoSpeak ? ' · leyendo en voz alta' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                stopSpeak();
                setScenario(null);
                setMicArmed(false);
                newConversation();
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setFullScreen(true)}
              aria-label="Ampliar a pantalla completa"
              title="Pantalla completa con voz"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" aria-label="Historial y memoria">
                  <History className="w-3.5 h-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <Tabs defaultValue="hilos" className="mt-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="hilos" className="flex-1 text-xs">
                      Historial
                    </TabsTrigger>
                    <TabsTrigger value="memoria" className="flex-1 text-xs">
                      Memoria
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="hilos">
                    <ScrollArea className="h-[70vh] pr-2">
                      <div className="space-y-1">
                        {conversations.length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">Sin conversaciones de {header.name} aún.</p>
                        )}
                        {conversations.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              stopSpeak();
                              setScenario(null);
                              setMicArmed(false);
                              openConversation(c.id);
                            }}
                            className={cn(
                              'w-full text-left text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors',
                              c.id === conversationId && 'bg-muted font-medium'
                            )}
                          >
                            <span className="line-clamp-2">{c.title || 'Conversación'}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="memoria">
                    <ScrollArea className="h-[70vh] pr-2">
                      <div className="space-y-2">
                        {memories.length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">
                            El Tutor todavía no ha guardado errores ni objetivos tuyos.
                          </p>
                        )}
                        {memories.map(m => (
                          <div key={m.id} className="border border-border rounded-md p-2 flex gap-2 items-start">
                            <div className="flex-1">
                              {m.kind && <p className="text-[10px] uppercase text-muted-foreground">{m.kind.replace(/_/g, ' ')}</p>}
                              <p className="text-xs">{m.content}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteMemory(m.id)}>
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

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="py-6 text-center space-y-4">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{TUTOR_EMPTY[language]}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
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
                    <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="text-sm flex-1">
                          {m.content ? (
                            <>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                                {m.content}
                              </ReactMarkdown>
                              {m.streaming && (
                                <span className="inline-block w-1.5 h-4 align-middle bg-primary/60 animate-pulse rounded-sm" />
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
                            </span>
                          )}
                        </div>
                        {speechSupported && m.content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('h-7 w-7 p-0 flex-shrink-0 mt-0.5', isSpeaking(m.id) && 'text-primary animate-pulse')}
                            onClick={() => toggleSpeak(m.id, m.content)}
                            aria-label={isSpeaking(m.id) ? 'Detener lectura' : 'Escuchar en voz alta'}
                            title={isSpeaking(m.id) ? 'Detener lectura' : `Escuchar en ${speechLang}`}
                          >
                            {isSpeaking(m.id) ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>

                      {m.acciones.length > 0 && (
                        <div className="space-y-1">
                          {m.acciones.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
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
                              onClick={() => logPractice(m.id, min)}
                            >
                              <SquarePen className="w-3 h-3 mr-1" />
                              Registrar {min} min
                            </Button>
                          ))}
                        </div>
                      )}

                      <div className="lg:hidden space-y-2">
                        {m.visuals.map((v, i) => (
                          <VisualBlock key={i} visual={v} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {error && <div className="text-sm text-destructive border border-destructive/30 rounded-md p-2">{error}</div>}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {messages.length > 0 && (
            <div className="px-3 pb-1 flex gap-1 flex-wrap">
              {quick.map(q => (
                <Button
                  key={q}
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-6 px-2"
                  onClick={() => submit(q)}
                  disabled={loading}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          {sttListening && (
            <div className="px-3 pb-1 text-[11px] italic text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
              <span className="truncate">{sttInterim || 'Escuchando... habla con normalidad'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 pt-2 border-t border-border flex gap-2 items-end">
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
              className="text-sm resize-none min-h-[2.5rem] max-h-32"
            />
            <div className="flex flex-col gap-1">
              {sttSupported && (
                <Button
                  type="button"
                  variant={autoSend ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => setAutoSend(v => !v)}
                  disabled={loading}
                  aria-label={autoSend ? 'Auto-envío al parar el micro: activado' : 'Auto-envío al parar el micro: desactivado'}
                  title={
                    autoSend
                      ? 'Auto-envío: al parar el micro, el texto reconocido se envía solo'
                      : 'Sin auto-envío: el texto del micro se añade al campo para que lo edites'
                  }
                >
                  <CornerDownLeft className={cn('w-4 h-4', autoSend && 'animate-pulse')} />
                </Button>
              )}
              <Button
                type="button"
                variant={sttListening ? 'default' : 'outline'}
                size="sm"
                className={cn('w-9 h-9 p-0', sttListening && 'animate-pulse')}
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
                {sttListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              {loading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-9 h-9 p-0"
                  onClick={() => {
                    setMicArmed(false);
                    stopSpeak();
                    stop();
                  }}
                  aria-label="Detener respuesta"
                  title="Detener la respuesta del tutor"
                >
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" size="sm" className="w-9 h-9 p-0" disabled={!input.trim()} aria-label="Enviar">
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Lienzo visual */}
        <Card className="hidden lg:block h-[70vh] overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <h2 className="text-sm font-medium">Apoyo visual</h2>
          </div>
          <ScrollArea className="h-[calc(70vh-37px)]">
            <VisualCanvas
              visuals={allVisuals}
              emptyText="Aquí el Tutor dibujará tablas de conjugación, comparaciones de tus errores, listas de vocabulario y tu progreso."
            />
          </ScrollArea>
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
        modeLabel={activeScenario ? `🎭 ${activeScenario.label[language]}` : activeMode ? activeMode.label : 'Chat libre'}
        aiText={lastAssistant?.content ?? ''}
        aiSpeaking={speakingId !== null}
        loading={loading}
        stopSpeak={stopSpeak}
        sttSupported={sttSupported}
        sttListening={sttListening}
        sttInterim={sttInterim}
        handsFree={handsFree}
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
      />
    </div>
  );
}
