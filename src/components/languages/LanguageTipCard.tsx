import { useMemo, useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const TIPS: Record<'english' | 'italian', { title: string; body: string }[]> = {
  english: [
    {
      title: 'Piensa en inglés',
      body: 'Narra tu día mentalmente en inglés durante 2 minutos. Si te bloqueas, apunta la palabra que te faltó y búscala después.',
    },
    {
      title: 'Habla antes de sentirte listo',
      body: 'La fluidez no llega por estudiar más gramática, sino por hablar con errores y corregirlos después.',
    },
    {
      title: 'Repite en voz alta',
      body: 'Haz shadowing con 10 frases de una serie. Imita el ritmo y la entonación, no solo las palabras.',
    },
    {
      title: 'Aprende frases, no palabras sueltas',
      body: 'Guarda “take a decision”… mejor aún: “I need to make a decision”. El contexto fija el significado.',
    },
    {
      title: 'Conecta ideas',
      body: 'Usa conectores como however, although, therefore y besides. Elevan tu nivel sin necesidad de vocabulario raro.',
    },
    {
      title: 'Escucha sin subtítulos en español',
      body: 'Primero con subtítulos en inglés, luego sin ellos. Aunque no entiendas todo, tu oído se está entrenando.',
    },
  ],
  italian: [
    {
      title: 'Parla ad alta voce',
      body: 'Describe lo que haces mientras lo haces: “Sto preparando il caffè”. Dos minutos al día cambian la fluidez.',
    },
    {
      title: 'Il congiuntivo non morde',
      body: 'Empieza con fórmulas fijas: “Penso che sia…”, “Spero che vada…”. La estructura se automatiza con repetición.',
    },
    {
      title: 'Ascolta e ripeti',
      body: 'Elige 10 frases de una canción o serie y repítelas imitando el ritmo. La melodía ayuda a la memoria.',
    },
    {
      title: 'Preposiciones en contexto',
      body: 'No memorices listas: aprende “vado a Roma”, “vivo in Italia”, “penso a te”. Las preposiciones viven en frases.',
    },
    {
      title: 'Escribe un diario mini',
      body: 'Tres frases al día sobre lo que hiciste. Revisa solo un error por frase; no te bloquees con la perfección.',
    },
    {
      title: 'Usa el italiano que ya sabes',
      body: 'Si no sabes una palabra, descríbela: “la cosa che serve per…” La paráfrasis también es fluidez.',
    },
  ],
};

export function LanguageTipCard({ currentLanguage }: { currentLanguage: 'english' | 'italian' }) {
  const tips = TIPS[currentLanguage];
  const dayIndex = Math.floor(Date.now() / 86_400_000) % tips.length;
  const [offset, setOffset] = useState(0);
  const tip = useMemo(() => tips[(dayIndex + offset) % tips.length], [tips, dayIndex, offset]);

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-focus/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Consejo del día</p>
                <p className="text-sm font-semibold">{tip.title}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 text-muted-foreground"
                aria-label="Ver otro consejo"
                onClick={() => setOffset(value => value + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
