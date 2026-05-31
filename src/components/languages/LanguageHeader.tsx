import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

export function LanguageHeader({
  currentLanguage,
  onSetLanguage,
  streak,
}: {
  currentLanguage: 'english' | 'italian';
  onSetLanguage: (lang: 'english' | 'italian') => void;
  streak: number;
}) {
  return (
    <>
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">🌍 Idiomas</h1>
        <p className="text-sm text-muted-foreground">
          {currentLanguage === 'english' ? 'Aprendiendo Inglés' : 'Aprendiendo Italiano'}
        </p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <Badge
            variant={currentLanguage === 'english' ? 'default' : 'outline'}
            className="cursor-pointer transition-all"
            onClick={() => onSetLanguage('english')}
          >
            🇺🇸 Inglés
          </Badge>
          <Badge
            variant={currentLanguage === 'italian' ? 'default' : 'outline'}
            className="cursor-pointer transition-all"
            onClick={() => onSetLanguage('italian')}
          >
            🇮🇹 Italiano
          </Badge>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 w-fit">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-sm font-bold">{streak} días</span>
          </div>
        )}
      </div>
    </>
  );
}
