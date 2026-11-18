import { CheckCircle2, Circle, Mic, Sparkles, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';

export type MicTestState = 'idle' | 'testing' | 'ok' | 'error';

interface Props {
  language: Language;
  micState: MicTestState;
  sttSupported: boolean;
  voiceReady: boolean;
  onTestMic: () => void;
  onStart: () => void;
  onDismiss: () => void;
}

/**
 * Arranque guiado de Speaking (U3): micro, voz y primera frase.
 *
 * Los tres fallos que más se repiten («no funciona el micro», «habla con acento
 * raro», «no sé qué decir») se resuelven aquí antes de abrir la conversación.
 */
export function SpeakingOnboarding({ language, micState, sttSupported, voiceReady, onTestMic, onStart, onDismiss }: Props) {
  const steps = [
    {
      done: micState === 'ok',
      icon: <Mic className="h-3.5 w-3.5" />,
      title: 'Micrófono',
      detail:
        micState === 'testing'
          ? 'Escuchando 2 segundos… di «hola, probando».'
          : micState === 'error'
            ? 'No se oyó nada. Revisa el permiso del navegador y vuelve a probar.'
            : sttSupported
              ? 'Prueba rápida para confirmar el permiso.'
              : 'Este navegador no tiene reconocimiento de voz: usa Chrome o Edge.',
      action:
        sttSupported && micState !== 'ok' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={onTestMic}
            disabled={micState === 'testing'}
          >
            {micState === 'testing' ? 'Probando…' : 'Probar 2 s'}
          </Button>
        ) : null,
    },
    {
      done: voiceReady,
      icon: <Volume2 className="h-3.5 w-3.5" />,
      title: 'Voz del idioma',
      detail: voiceReady
        ? `La voz de ${language === 'italian' ? 'italiano' : 'inglés'} está instalada.`
        : `Falta una voz de ${language === 'italian' ? 'italiano' : 'inglés'}. En Edge tienes voces Natural gratis.`,
      action: null,
    },
    {
      done: false,
      icon: <Sparkles className="h-3.5 w-3.5" />,
      title: 'Primera frase',
      detail: 'Pulsa el micro y di una frase corta. El tutor responde y empieza la sesión.',
      action: (
        <Button type="button" size="sm" className="h-7 px-2 text-[11px]" onClick={onStart}>
          Empezar a hablar
        </Button>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold">Antes de empezar (30 segundos)</p>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
            {steps.map(step => (
              <div key={step.title} className="flex min-w-0 items-start gap-1.5">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[11px] font-medium">
                    {step.icon}
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] leading-snug text-muted-foreground',
                      step.title === 'Micrófono' && micState === 'error' && 'text-destructive'
                    )}
                  >
                    {step.detail}
                  </p>
                  {step.action && <div className="mt-1">{step.action}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 shrink-0 p-0 text-muted-foreground"
          onClick={onDismiss}
          aria-label="Ocultar la guía de inicio"
          title="Ya lo tengo configurado"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
