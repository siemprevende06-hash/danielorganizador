import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, Mic, PenLine, Sparkles } from 'lucide-react';
import type { Language } from '@/hooks/useLanguageLearning';
import { TutorAvatar } from './TutorAvatar';

/**
 * Tarjeta del tutor en el rail: la puerta de entrada a hablar o escribir.
 * No duplica el panel; solo lanza la sesión con la habilidad ya elegida.
 */
export function TutorRailCard({
  language,
  level,
  focusLabel,
  onSpeak,
  onWrite,
  onOpen,
}: {
  language: Language;
  level: string;
  focusLabel: string | null;
  onSpeak: () => void;
  onWrite: () => void;
  onOpen: () => void;
}) {
  const name = language === 'italian' ? 'Italiano' : 'Inglés';

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-20"
          style={{
            background:
              language === 'italian'
                ? 'linear-gradient(to bottom, hsl(152 65% 40% / 0.14), transparent)'
                : 'linear-gradient(to bottom, hsl(210 90% 50% / 0.14), transparent)',
          }}
        />
        <CardContent className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 shrink-0">
              <TutorAvatar language={language} size={56} />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-background">
                <Sparkles className="h-2.5 w-2.5 text-primary" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold leading-tight">Tutor IA</p>
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px] tabular-nums">
                  {level}
                </Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {focusLabel
                  ? `Sesión enfocada en ${focusLabel.toLowerCase()}. Te corrige con una explicación en cada respuesta.`
                  : `Conversación libre en ${name.toLowerCase()} con corrección sobre la marcha.`}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Button size="sm" className="h-8 gap-1.5 text-[11px]" onClick={onSpeak}>
              <Mic className="h-3.5 w-3.5" />
              Hablar
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]" onClick={onWrite}>
              <PenLine className="h-3.5 w-3.5" />
              Escribir
            </Button>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Abrir el panel completo
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </CardContent>
      </div>
    </Card>
  );
}
