import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Check, Eye, RotateCcw, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReviewItemKind = 'word' | 'error';

export interface ReviewItem {
  /** id de la palabra o del error. */
  id: string;
  kind: ReviewItemKind;
  /** Lo que se muestra antes de revelar. */
  prompt: string;
  /** Respuesta correcta o traducción. */
  answer: string;
  /** Contexto breve (frase de ejemplo, nota del error...). */
  hint: string | null;
  /** Etiqueta de la tarjeta (p. ej. "Nueva", "En repaso", "Gramática"). */
  badge: string;
}

/**
 * Hoja de repaso con recuperación activa: primero intentas recordar, después
 * revelas y te autoevalúas. La cola se congela al abrir para que no cambie a
 * mitad de sesión si otra vista toca las palabras.
 */
export function ReviewSheet({
  open,
  onOpenChange,
  items,
  onGrade,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ReviewItem[];
  onGrade: (item: ReviewItem, known: boolean) => void;
  onComplete: (minutes: number, summary: { known: number; total: number }) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [seconds, setSeconds] = useState(0);

  // Cada apertura empieza de cero.
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setRevealed(false);
    setResults({});
    setSeconds(0);
  }, [open]);

  const finished = index >= items.length;

  useEffect(() => {
    if (!open || finished) return;
    const id = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, finished]);

  const current = items[index] ?? null;
  const knownCount = useMemo(() => Object.values(results).filter(Boolean).length, [results]);
  const percent = items.length > 0 ? Math.round((Math.min(index, items.length) / items.length) * 100) : 0;
  const minutes = Math.max(1, Math.ceil(seconds / 60));

  const grade = (known: boolean) => {
    if (!current) return;
    onGrade(current, known);
    setResults(prev => ({ ...prev, [current.id]: known }));
    setRevealed(false);
    setIndex(value => value + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-3 p-4 sm:p-5">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
              <RotateCcw className="h-3.5 w-3.5 text-primary" />
            </span>
            Repaso rápido
            <Badge variant="outline" className="ml-auto text-[10px] tabular-nums">
              {Math.min(index + (finished ? 0 : 1), items.length)}/{items.length}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Intenta recordar antes de revelar. Lo que falles vuelve mañana a la cola.
          </DialogDescription>
        </DialogHeader>

        <Progress value={percent} className="h-1.5" />

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">Nada que repasar</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Guarda palabras desde el tutor o la lectura, y anota errores al cerrar la sesión.
            </p>
          </div>
        ) : finished ? (
          <div className="space-y-3 rounded-xl border border-success/30 bg-success/5 p-4 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-success/15">
              <Check className="h-5 w-5 text-success" strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {knownCount} de {items.length} recuperadas
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {knownCount === items.length
                  ? 'Todo salió bien. La próxima vez espaciaremos más el repaso.'
                  : 'Las que fallaste quedan en repaso: vuelven en la próxima sesión.'}
              </p>
            </div>
            <div className="flex flex-col-reverse gap-1.5 sm:flex-row sm:justify-center">
              <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => onOpenChange(false)}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cerrar
              </Button>
              <Button
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => onComplete(minutes, { known: knownCount, total: items.length })}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Guardar {minutes} min
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                  {current.kind === 'word' ? 'Vocabulario' : 'Error'}
                </Badge>
                <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                  {current.badge}
                </Badge>
              </div>
              <p className="mt-2 text-xl font-semibold leading-tight sm:text-2xl">{current.prompt}</p>
              {current.kind === 'error' && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Corrige la frase</p>
              )}

              {revealed ? (
                <div className="mt-3 space-y-1 rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-sm font-semibold text-success">{current.answer}</p>
                  {current.hint && <p className="text-[11px] leading-snug text-muted-foreground">{current.hint}</p>}
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {current.kind === 'word'
                    ? 'Dilo en voz alta antes de revelar.'
                    : 'Piensa la versión correcta antes de revelar.'}
                </p>
              )}
            </div>

            {revealed ? (
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-destructive/30 text-[11px] text-destructive hover:bg-destructive/5"
                  onClick={() => grade(false)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  No la sabía
                </Button>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-success text-[11px] text-success-foreground hover:bg-success/90"
                  onClick={() => grade(true)}
                >
                  <Check className="h-3.5 w-3.5" />
                  La sabía
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-9 w-full gap-1.5 text-[11px]"
                onClick={() => setRevealed(true)}
              >
                <Eye className="h-3.5 w-3.5" />
                Revelar respuesta
              </Button>
            )}

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {items.map((item, itemIndex) => {
                const result = results[item.id];
                return (
                  <span
                    key={`${item.kind}-${item.id}`}
                    aria-hidden
                    className={cn(
                      'h-1.5 w-4 rounded-full transition-colors',
                      itemIndex === index
                        ? 'bg-primary'
                        : result === true
                          ? 'bg-success'
                          : result === false
                            ? 'bg-destructive/60'
                            : 'bg-muted'
                    )}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
