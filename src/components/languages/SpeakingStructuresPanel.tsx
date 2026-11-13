import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Loader2,
  Play,
  Search,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguageLearning';
import {
  STRUCTURE_CATEGORIES,
  type SpeakingStructure,
  type StructureCategory,
} from './speakingStructures';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  structures: SpeakingStructure[];
  onPractice: (structure: SpeakingStructure) => void;
  onSpeak: (text: string) => void;
  onGenerate: (question: string) => Promise<SpeakingStructure | null>;
  generating: boolean;
  generateError: string | null;
}

type Filter = StructureCategory | 'todas';

export function SpeakingStructuresPanel({
  open,
  onOpenChange,
  language,
  structures,
  onPractice,
  onSpeak,
  onGenerate,
  generating,
  generateError,
}: Props) {
  const [filter, setFilter] = useState<Filter>('todas');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return structures.filter(item => {
      if (filter !== 'todas' && item.category !== filter) return false;
      if (!q) return true;
      return (
        item.question[language].toLowerCase().includes(q) ||
        item.questionEs.toLowerCase().includes(q) ||
        item.goal.toLowerCase().includes(q)
      );
    });
  }, [structures, filter, query, language]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todas: structures.length };
    for (const item of structures) map[item.category] = (map[item.category] ?? 0) + 1;
    return map;
  }, [structures]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = customQuestion.trim();
    if (!question || generating) return;
    const generated = await onGenerate(question);
    if (generated) {
      setCustomQuestion('');
      setFilter('todas');
      setQuery('');
      setExpandedId(generated.id);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(31rem,94vw)] flex-col p-0">
        <SheetHeader className="border-b px-4 pb-3 pr-12 pt-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-focus/10">
              <Wand2 className="h-4 w-4 text-focus" />
            </span>
            Estructuras para responder
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            Elige una pregunta, sigue los pasos y practica con el tutor. La estructura queda visible
            mientras hablas para que no te quedes en blanco.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 border-b px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar una pregunta..."
              className="h-9 pl-8 text-sm"
              aria-label="Buscar estructura"
            />
          </div>

          <form onSubmit={handleGenerate} className="flex gap-1.5">
            <Input
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder="Otra pregunta: “Tell me about a time you failed”"
              className="h-9 text-sm"
              aria-label="Pregunta para generar una estructura"
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 shrink-0 gap-1 px-2.5 text-xs"
              disabled={!customQuestion.trim() || generating}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{generating ? 'Creando' : 'Crear'}</span>
            </Button>
          </form>
          {generateError && <p className="text-[11px] text-destructive">{generateError}</p>}

          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setFilter('todas')}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                filter === 'todas'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              Todas ({counts.todas ?? 0})
            </button>
            {STRUCTURE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                  filter === cat.id
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <cat.Icon className="h-3 w-3" />
                {cat.label}
                {counts[cat.id] ? ` (${counts[cat.id]})` : ''}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 px-3 py-3">
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No hay estructuras con ese filtro</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prueba otra búsqueda o crea una estructura para tu propia pregunta.
                </p>
              </div>
            )}

            {filtered.map(item => {
              const expanded = expandedId === item.id;
              const showExample = exampleId === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'overflow-hidden rounded-xl border transition-colors',
                    expanded ? 'border-focus/40 bg-focus/[0.04]' : 'border-border/70 bg-card'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                    aria-expanded={expanded}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold leading-snug">{item.question[language]}</p>
                        {item.custom && (
                          <span className="rounded-full bg-focus/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-focus">
                            Generada
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{item.questionEs}</p>
                    </div>
                    <ChevronDown
                      className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                    />
                  </button>

                  {expanded && (
                    <div className="space-y-3 border-t border-border/60 px-3 py-3">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{item.goal}</p>

                      <ol className="space-y-2">
                        {item.steps.map((step, index) => (
                          <li key={`${item.id}-${index}`} className="flex gap-2">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-focus/10 text-[10px] font-bold text-focus">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-focus/90">{step.label}</p>
                              <p className="text-sm font-medium leading-snug">{step.template[language]}</p>
                              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{step.tip}</p>
                            </div>
                          </li>
                        ))}
                      </ol>

                      {item.phrases[language].length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Expresiones útiles
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.phrases[language].map(phrase => (
                              <button
                                key={phrase}
                                type="button"
                                onClick={() => onSpeak(phrase)}
                                className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-foreground/90 transition-colors hover:border-focus/40 hover:bg-focus/5"
                                title="Escuchar"
                              >
                                {phrase}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1 px-2.5 text-[11px]"
                          onClick={() => onPractice(item)}
                        >
                          <Play className="h-3 w-3" />
                          Practicar esta pregunta
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 px-2.5 text-[11px]"
                          onClick={() => onSpeak(item.question[language])}
                        >
                          <Volume2 className="h-3 w-3" />
                          Escuchar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-[11px]"
                          onClick={() => setExampleId(showExample ? null : item.id)}
                        >
                          {showExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                        </Button>
                      </div>

                      {showExample && (
                        <div className="rounded-lg border border-border/70 bg-background p-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Respuesta modelo
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">{item.example[language]}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.exampleEs}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="mt-1 h-7 gap-1 px-2 text-[11px]"
                            onClick={() => onSpeak(item.example[language])}
                          >
                            <Volume2 className="h-3 w-3" />
                            Escuchar ejemplo
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
