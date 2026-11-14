import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Flag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCubaDate } from '@/lib/cubaTime';
import { STUDY_ERROR_CATEGORIES, type StudyErrorCategory } from '@/lib/languageStudyPlan';
import type { Language } from '@/hooks/useLanguageLearning';

const NOTE_KEY = 'languages-session-note-v1';

function noteKey(language: Language) {
  return `${language}:${getCubaDate()}`;
}

function readNote(language: Language): string {
  try {
    const raw = localStorage.getItem(NOTE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[noteKey(language)] ?? '';
  } catch {
    return '';
  }
}

function saveNote(language: Language, text: string) {
  try {
    const raw = localStorage.getItem(NOTE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[noteKey(language)] = text;
    localStorage.setItem(NOTE_KEY, JSON.stringify(parsed));
  } catch {
    // Sin almacenamiento: la frase vive solo en esta sesión.
  }
}

/**
 * Cierre de la sesión: guarda un error en el cuaderno y la frase que te llevas
 * del día. Es el paso que convierte la práctica en memoria a largo plazo.
 */
export function SessionCloseSheet({
  open,
  onOpenChange,
  language,
  onAddError,
  onFinish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
  onAddError: (input: {
    wrong: string;
    correct: string;
    note: string;
    category: StudyErrorCategory;
  }) => { ok: boolean; reason?: 'empty' | 'duplicate' };
  onFinish: () => void;
}) {
  const [wrong, setWrong] = useState('');
  const [correct, setCorrect] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<StudyErrorCategory>('gramatica');
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (!open) return;
    setWrong('');
    setCorrect('');
    setNote('');
    setCategory('gramatica');
    setPhrase(readNote(language));
  }, [open, language]);

  const save = () => {
    if (wrong.trim() || correct.trim()) {
      const result = onAddError({ wrong, correct, note, category });
      if (!result.ok) {
        toast.error(
          result.reason === 'duplicate'
            ? 'Ese error ya está en tu cuaderno.'
            : 'Para guardar el error necesitas la frase incorrecta y la correcta.'
        );
        return;
      }
      toast.success('Error guardado para repasar');
    }
    if (phrase.trim()) saveNote(language, phrase.trim());
    onFinish();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-3 p-4 sm:p-5">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
              <Flag className="h-3.5 w-3.5 text-primary" />
            </span>
            Cerrar la sesión
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Anota un error y la frase que te llevas. Mañana el repaso empieza por aquí.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-xl border border-border/60 p-3">
          <p className="text-[11px] font-semibold">Error para el cuaderno (opcional)</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <Input
              value={wrong}
              onChange={event => setWrong(event.target.value)}
              placeholder={language === 'english' ? 'I have 20 years' : 'Io sono 20 anni'}
              className="h-8 text-[12px]"
            />
            <Input
              value={correct}
              onChange={event => setCorrect(event.target.value)}
              placeholder={language === 'english' ? 'I am 20 years old' : 'Ho 20 anni'}
              className="h-8 text-[12px]"
            />
          </div>
          <Input
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder="Nota: por qué falla (opcional)"
            className="h-8 text-[12px]"
          />
          <div className="flex flex-wrap gap-1">
            {STUDY_ERROR_CATEGORIES.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                aria-pressed={category === item.id}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  category === item.id
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl border border-border/60 p-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" />
            Una frase que hayas aprendido hoy
          </p>
          <Textarea
            value={phrase}
            onChange={event => setPhrase(event.target.value)}
            placeholder={language === 'english' ? 'The best part of my day was…' : 'La parte migliore della mia giornata è stata…'}
            className="min-h-[64px] resize-none text-[12px]"
          />
          <Badge variant="outline" className="text-[9px]">
            Se guarda solo en este dispositivo
          </Badge>
        </div>

        <div className="flex flex-col-reverse gap-1.5 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="sm" className="h-8 text-[11px]" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-[11px]" onClick={save}>
            <Check className="h-3.5 w-3.5" />
            Guardar cierre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
