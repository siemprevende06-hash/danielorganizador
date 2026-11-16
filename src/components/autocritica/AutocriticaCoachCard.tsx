import { useState } from 'react';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CoachChat } from '@/components/coach/CoachChat';

interface AutocriticaCoachCardProps {
  /** Resumen de la autocrítica que se envía al Coach con las preguntas rápidas. */
  context: string;
  scopeLabel: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Analiza mi autocrítica y dime qué mejorar.',
  '¿Qué debería priorizar mañana?',
  'Dame un plan concreto para recuperar lo pendiente.',
  '¿Cómo convierto mi esfuerzo en resultados?',
];

export function AutocriticaCoachCard({
  context,
  scopeLabel,
  suggestions = DEFAULT_SUGGESTIONS,
}: AutocriticaCoachCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Brain className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight">Coach IA</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Convierte tu autocrítica de {scopeLabel.toLowerCase()} en acciones.
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="group h-8 shrink-0 gap-1.5 text-xs text-muted-foreground"
                aria-expanded={open}
              >
                {open ? 'Cerrar' : 'Abrir chat'}
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Contexto del período incluido
              </span>
              <div className="h-[360px] rounded-2xl border border-border/60 bg-muted/20 p-3 sm:h-[420px]">
                <CoachChat
                  quickPrompts={suggestions}
                  context={context}
                  emptyText="Pregúntale al Coach IA sobre tu autocrítica, tus áreas o el plan del próximo período."
                  placeholder="Escribe tu pregunta..."
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
