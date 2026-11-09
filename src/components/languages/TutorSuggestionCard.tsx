import { Lightbulb, Loader2, RefreshCw, Send, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TutorSuggestion } from '@/hooks/useLanguageTutorCoach';

interface Props {
  loading: boolean;
  error: string | null;
  suggestion: TutorSuggestion | null;
  onRefresh: () => void;
  onUse: () => void;
  onSend: () => void;
  onSpeak: () => void;
  onDismiss: () => void;
}

export function TutorSuggestionCard({
  loading,
  error,
  suggestion,
  onRefresh,
  onUse,
  onSend,
  onSpeak,
  onDismiss,
}: Props) {
  return (
    <div className="mx-3 mb-1 rounded-xl border border-focus/30 bg-focus/5 p-2.5">
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-focus" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-focus">Respuesta sugerida</span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={onRefresh}
            aria-label="Generar otra sugerencia"
            title="Generar otra sugerencia"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={onDismiss}
            aria-label="Ocultar sugerencia"
            title="Ocultar sugerencia"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pensando una respuesta para ti…
        </p>
      ) : error ? (
        <div className="mt-1">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 h-7 px-2 text-[11px]"
            onClick={onRefresh}
          >
            Reintentar
          </Button>
        </div>
      ) : suggestion ? (
        <>
          <p className="mt-1 text-sm font-medium leading-snug">{suggestion.text}</p>
          {suggestion.translation && (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{suggestion.translation}</p>
          )}
          {suggestion.hint && (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">💡 {suggestion.hint}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={onUse}
            >
              Usar
            </Button>
            <Button type="button" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={onSend}>
              <Send className="h-3 w-3" />
              Enviar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={onSpeak}
            >
              <Volume2 className="h-3 w-3" />
              Escuchar
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          La sugerencia aparecerá cuando el tutor te responda.
        </p>
      )}
    </div>
  );
}
