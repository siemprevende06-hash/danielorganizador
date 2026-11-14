import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, BookOpenCheck, RotateCcw } from 'lucide-react';

export interface ReviewQueuePreview {
  dueWords: number;
  pendingErrors: number;
  total: number;
  nextWords: string[];
}

/**
 * Cola de repaso del día: vocabulario que vence y errores sin revisar.
 * El botón abre la hoja de repaso con la cola congelada.
 */
export function ReviewQueueCard({
  queue,
  onOpen,
}: {
  queue: ReviewQueuePreview;
  onOpen: () => void;
}) {
  const hasItems = queue.total > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted">
            <RotateCcw className="h-3.5 w-3.5" />
          </span>
          <p className="text-[13px] font-semibold leading-tight">Repaso de hoy</p>
          {hasItems && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] tabular-nums">
              {queue.total}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {hasItems ? (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  Palabras para repasar
                </span>
                <span className="text-[11px] font-semibold tabular-nums">{queue.dueWords}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Errores sin revisar
                </span>
                <span className="text-[11px] font-semibold tabular-nums">{queue.pendingErrors}</span>
              </div>
            </div>

            {queue.nextWords.length > 0 && (
              <p className="line-clamp-2 px-0.5 text-[10px] leading-snug text-muted-foreground">
                Empiezas por: {queue.nextWords.slice(0, 4).join(' · ')}
                {queue.nextWords.length > 4 ? '…' : ''}
              </p>
            )}

            <Button size="sm" className="h-8 w-full gap-1.5 text-[11px]" onClick={onOpen}>
              Repasar ahora
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border/70 p-3 text-center text-[11px] text-muted-foreground">
            Nada pendiente. Las palabras que guardes y los errores que anotes aparecerán aquí.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
