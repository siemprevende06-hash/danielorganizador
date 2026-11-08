import { BookOpen, ExternalLink, Globe2, Headphones, PlayCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Resource {
  name: string;
  hint: string;
  url: string;
  Icon: typeof BookOpen;
  tone: string;
}

const RESOURCES: Record<'english' | 'italian', Resource[]> = {
  english: [
    {
      name: 'Duolingo',
      hint: 'Gramática y vocabulario diario',
      url: 'https://www.duolingo.com/',
      Icon: Sparkles,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      name: 'Anki',
      hint: 'Repaso espaciado',
      url: 'https://apps.ankiweb.net/',
      Icon: BookOpen,
      tone: 'bg-sky-500/10 text-sky-600',
    },
    {
      name: 'BBC Learning English',
      hint: 'Podcast y noticias',
      url: 'https://www.bbc.co.uk/learningenglish/',
      Icon: Headphones,
      tone: 'bg-rose-500/10 text-rose-600',
    },
    {
      name: 'YouTube',
      hint: 'Listening con subtítulos',
      url: 'https://www.youtube.com/',
      Icon: PlayCircle,
      tone: 'bg-red-500/10 text-red-600',
    },
    {
      name: 'Netflix',
      hint: 'Inmersión con series',
      url: 'https://www.netflix.com/',
      Icon: Globe2,
      tone: 'bg-violet-500/10 text-violet-600',
    },
  ],
  italian: [
    {
      name: 'Duolingo',
      hint: 'Gramática y vocabulario diario',
      url: 'https://www.duolingo.com/',
      Icon: Sparkles,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      name: 'Anki',
      hint: 'Repaso espaciado',
      url: 'https://apps.ankiweb.net/',
      Icon: BookOpen,
      tone: 'bg-sky-500/10 text-sky-600',
    },
    {
      name: 'Coffee Break Italian',
      hint: 'Podcast para hispanohablantes',
      url: 'https://coffeebreaklanguages.com/coffeebreakitalian/',
      Icon: Headphones,
      tone: 'bg-amber-500/10 text-amber-600',
    },
    {
      name: 'RaiPlay',
      hint: 'Series y programas en italiano',
      url: 'https://www.raiplay.it/',
      Icon: PlayCircle,
      tone: 'bg-rose-500/10 text-rose-600',
    },
    {
      name: 'YouTube',
      hint: 'Listening con subtítulos',
      url: 'https://www.youtube.com/',
      Icon: Globe2,
      tone: 'bg-red-500/10 text-red-600',
    },
  ],
};

export function LanguageResourcesCard({ language = 'english' }: { language?: 'english' | 'italian' }) {
  const resources = RESOURCES[language];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">🔗 Recursos recomendados</CardTitle>
        <p className="text-xs text-muted-foreground">Herramientas para practicar fuera del plan.</p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {resources.map(resource => (
          <button
            key={resource.name}
            type="button"
            onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
            className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-2.5 text-left transition-colors hover:border-border hover:bg-muted/30"
          >
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', resource.tone)}>
              <resource.Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{resource.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{resource.hint}</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
