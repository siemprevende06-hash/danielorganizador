import { useMemo } from 'react';
import { Check, ChevronDown, Play, Sparkles, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  elegirVoz,
  esEdge,
  esVozNatural,
  etiquetaVoz,
  vocesDelIdioma,
  vozNaturalDisponible,
} from '@/hooks/useSpeechSynthesis';

/** Frase de prueba por idioma: sirve para comparar voces de un vistazo. */
const MUESTRAS: Record<string, string> = {
  en: "Hi! Let's practise English together. Repeat after me: I'd love to grab a coffee sometime.",
  it: "Ciao! Facciamo un po' di pratica insieme. Ripeti dopo di me: vorrei un caffè, per favore.",
  es: 'Hola, así suena la voz que leerá la explicación de tus errores.',
};

function muestra(lang: string): string {
  const base = lang.split(/[-_]/)[0].toLowerCase();
  return MUESTRAS[base] ?? 'Hello! This is how I will sound.';
}

export interface VoiceSection {
  id: string;
  /** Pestaña del selector: "Inglés", "Explicaciones"... */
  label: string;
  lang: string;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  /** Voz resuelta ahora mismo (útil para explicar qué hace "Automática"). */
  voice: SpeechSynthesisVoice | null;
  onChange: (uri: string | null) => void;
  onPreview: (text: string) => void;
  onStop: () => void;
  previewing: boolean;
}

interface Props {
  sections: VoiceSection[];
  className?: string;
}

export function VoicePicker({ sections, className }: Props) {
  const principal = sections[0];
  if (!principal) return null;

  const titulo = principal.voice ? etiquetaVoz(principal.voice) : 'Voz automática';
  const faltaNatural = sections.some(s => s.voices.length > 0 && !vozNaturalDisponible(s.voices, s.lang));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-8 max-w-[11rem] gap-1 text-xs', className)}
          title="Elegir la voz del tutor"
        >
          <Volume2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{titulo}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>

      {/* z por encima de la pantalla completa del tutor (z-[100]) */}
      <PopoverContent align="end" className="z-[130] w-[19rem] p-0">
        {sections.length > 1 ? (
          <Tabs defaultValue={principal.id}>
            <TabsList className="m-2 grid grid-cols-2">
              {sections.map(section => (
                <TabsTrigger key={section.id} value={section.id} className="text-[11px]">
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {sections.map(section => (
              <TabsContent key={section.id} value={section.id} className="mt-0">
                <VoiceList section={section} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <VoiceList section={principal} />
        )}

        {!esEdge() && faltaNatural && (
          <p className="border-t px-3 py-2 text-[10px] leading-snug text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
            En Microsoft Edge hay voces <span className="font-medium text-foreground">Natural</span> gratis que suenan
            mucho más humanas.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function VoiceList({ section }: { section: VoiceSection }) {
  const { lang, voices, voiceURI, onChange, onPreview, onStop, previewing } = section;
  const lista = useMemo(() => vocesDelIdioma(voices, lang), [voices, lang]);
  // Qué voz usaría el modo automático, aunque ahora haya una fijada a mano.
  const automatica = useMemo(() => elegirVoz(voices, lang, null), [voices, lang]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <p className="text-[11px] font-medium text-muted-foreground">Voz</p>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang}</span>
      </div>

      <div className="max-h-60 overflow-y-auto">
        <div className="space-y-0.5 p-1.5">
          <OpcionVoz
            activa={voiceURI === null}
            titulo="Automática"
            subtitulo={automatica ? `Usaría: ${etiquetaVoz(automatica)}` : 'La mejor disponible'}
            onClick={() => onChange(null)}
          />

          {lista.map(v => (
            <OpcionVoz
              key={v.voiceURI}
              activa={voiceURI === v.voiceURI}
              titulo={etiquetaVoz(v)}
              subtitulo={v.localService ? 'Instalada en el sistema' : 'En línea'}
              natural={esVozNatural(v)}
              onClick={() => onChange(v.voiceURI)}
            />
          ))}

          {!lista.length && (
            <p className="px-2 py-3 text-[11px] leading-snug text-muted-foreground">
              No hay voces de este idioma instaladas en el sistema.
            </p>
          )}
        </div>
      </div>

      <div className="border-t px-2 py-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-full text-[11px]"
          onClick={() => (previewing ? onStop() : onPreview(muestra(lang)))}
        >
          {previewing ? <Square className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
          {previewing ? 'Parar' : 'Probar voz'}
        </Button>
      </div>
    </div>
  );
}

function OpcionVoz({
  activa,
  titulo,
  subtitulo,
  natural,
  onClick,
}: {
  activa: boolean;
  titulo: string;
  subtitulo: string;
  natural?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
        activa ? 'bg-primary/10' : 'hover:bg-accent'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{titulo}</span>
          {natural && (
            <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none text-secondary-foreground">
              Natural
            </span>
          )}
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{subtitulo}</p>
      </div>
      {activa && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}
