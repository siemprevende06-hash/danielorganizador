import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  return (
    <Card className="border-0 overflow-hidden rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight">Coach IA</h2>
              <p className="text-[10px] text-muted-foreground">
                Convierte tu autocrítica de {scopeLabel.toLowerCase()} en acciones
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3 w-3" />
            Contexto incluido
          </span>
        </div>

        <div className="h-[420px] rounded-xl border border-border/60 bg-muted/20 p-3">
          <CoachChat
            quickPrompts={suggestions}
            context={context}
            emptyText="Pregúntale al Coach IA sobre tu autocrítica, tus áreas o el plan de mañana."
            placeholder="Escribe tu pregunta..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
