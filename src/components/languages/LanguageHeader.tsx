import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Languages, Sparkles } from 'lucide-react';

export function LanguageHeader({
  currentLanguage,
  onSetLanguage,
  streak,
  level,
}: {
  currentLanguage: 'english' | 'italian';
  onSetLanguage: (lang: 'english' | 'italian') => void;
  streak: number;
  level?: string;
}) {
  const isEnglish = currentLanguage === 'english';

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-500/15 via-background to-emerald-500/10 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-2xl shadow-sm ring-1 ring-border/60">
              {isEnglish ? '🇺🇸' : '🇮🇹'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Idiomas</h1>
                {level && (
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <Sparkles className="h-3 w-3" />
                    {level}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Aprendiendo {isEnglish ? 'inglés' : 'italiano'} · práctica diaria, plan y errores
              </p>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5">
              <Flame className="h-4 w-4 text-warning" />
              <span className="text-sm font-bold tabular-nums">{streak} días</span>
              <span className="text-[11px] text-muted-foreground">de racha</span>
            </div>
          )}
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border bg-background/70 p-1">
            <Button
              type="button"
              size="sm"
              variant={isEnglish ? 'default' : 'ghost'}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => onSetLanguage('english')}
            >
              <Languages className="h-3.5 w-3.5" />
              🇺🇸 Inglés
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isEnglish ? 'default' : 'ghost'}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
              onClick={() => onSetLanguage('italian')}
            >
              <Languages className="h-3.5 w-3.5" />
              🇮🇹 Italiano
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Cambia de idioma para adaptar el plan, las habilidades y el tutor.
          </span>
        </div>
      </div>
    </div>
  );
}
