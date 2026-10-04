import { useCallback, useEffect, useRef, useState } from 'react';
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
  GraduationCap,
  History,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Send,
  Sparkles,
  SquarePen,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisualBlock, VisualCanvas } from '@/components/coach/VisualCanvas';
import { useLanguageTutor } from '@/hooks/useLanguageTutor';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Language } from '@/hooks/useLanguageLearning';
import { TUTOR_EMPTY, TUTOR_GENERAL, TUTOR_HEADER, TUTOR_MODES, type TutorModeDef, type TutorSkill } from './tutorModes';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

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
  const [listening, setListening] = useState(false);
  const [logged, setLogged] = useState<string[]>([]);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSpokenRef = useRef<string | null>(null);

  const { conversations, conversationId, messages, memories, loading, error, sendMessage, openConversation, newConversation, deleteMemory } =
    useLanguageTutor(language, level, mode);

  const speechLang = language === 'italian' ? 'it-IT' : 'en-US';
  const { supported: speechSupported, speakingId, isSpeaking, speak, stop: stopSpeak, autoSpeak, setAutoSpeak } = useSpeechSynthesis(
    speechLang,
    mode === 'listening' ? 0.9 : 0.95
  );

  const header = TUTOR_HEADER[language];
  const activeMode: TutorModeDef | null = TUTOR_MODES.find(m => m.id === mode) ?? null;
  const quick = activeMode ? activeMode.quick[language] : TUTOR_GENERAL[language];
  const placeholder = activeMode ? activeMode.placeholder : 'Escribe tu pregunta o tu texto para corregirlo...';
  const allVisuals = messages.flatMap(m => m.visuals);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading, conversationId]);

  // Al cambiar de pestaña/idioma el registro de práctica ya no aplica
  useEffect(() => {
    setLogged([]);
    setMode(null);
    setInput('');
    autoSpokenRef.current = null;
  }, [language]);

  // Lectura automática: al terminar una respuesta del tutor, suéltala en voz alta
  useEffect(() => {
    if (!autoSpeak || loading) return;
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last || autoSpokenRef.current === last.id) return;
    autoSpokenRef.current = last.id;
    speak(last.id, last.content);
  }, [messages, loading, autoSpeak, speak]);

  const applyMode = (next: TutorSkill | null) => {
    setMode(next);
    setAutoSpeak(next === 'listening');
    if (next !== 'listening') stopSpeak();
  };

  const toggleSpeak = (id: string, text: string) => {
    if (isSpeaking(id)) {
      stopSpeak();
      return;
    }
    setAutoSpeak(false);
    speak(id, text);
  };

  const stopRecognition = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  useEffect(() => stopRecognition, [stopRecognition]);

  const toggleMic = () => {
    if (listening) {
      stopRecognition();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopSpeak();
    const rec = new SR();
    recRef.current = rec;
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript || '';
      setInput(prev => (prev ? `${prev} ${t}` : t));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    stopSpeak();
    autoSpokenRef.current = null;
    sendMessage(text);
    setInput('');
    setListening(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const logPractice = async (messageId: string, minutes: number) => {
    const statId = activeMode?.statId ?? 'vocabulary';
    await onLogPractice?.(statId, minutes, 'morning');
    setLogged(prev => [...prev, messageId]);
  };

  const lastAssistantId = [...messages].reverse().find(m => m.role === 'assistant')?.id;
  const showLogButton = !loading && messages.length > 0 && lastAssistantId && !logged.includes(lastAssistantId);

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
          <Button
            variant={autoSpeak ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs ml-auto"
            onClick={() => (autoSpeak ? (setAutoSpeak(false), stopSpeak()) : setAutoSpeak(true))}
            title={autoSpeak ? 'La IA lee sus respuestas en voz alta' : 'Activar lectura en voz alta'}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 mr-1 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 mr-1" />}
            {autoSpeak ? 'Voz on' : 'Voz off'}
          </Button>
        )}
      </div>

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
                {speechSupported && autoSpeak ? ' · leyendo en voz alta' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                stopSpeak();
                autoSpokenRef.current = null;
                newConversation();
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo
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
                              autoSpokenRef.current = null;
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
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                        {speechSupported && (
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

              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
                </div>
              )}
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
              <Button
                type="button"
                variant={listening ? 'default' : 'outline'}
                size="sm"
                className={cn('w-9 h-9 p-0', listening && 'animate-pulse')}
                onClick={toggleMic}
                disabled={loading}
                aria-label={listening ? 'Detener dictado' : 'Hablar con el Tutor'}
                title={listening ? 'Detener dictado' : 'Hablar con el Tutor'}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" size="sm" className="w-9 h-9 p-0" disabled={loading || !input.trim()} aria-label="Enviar">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
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
    </div>
  );
}
