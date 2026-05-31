import { Card, CardContent } from '@/components/ui/card';

export function LanguageTipCard({ currentLanguage }: { currentLanguage: 'english' | 'italian' }) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl sm:text-2xl">💡</span>
          <div>
            <p className="font-medium text-xs sm:text-sm">Consejo</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentLanguage === 'english'
                ? 'Try thinking in English during daily activities. Label objects around you!'
                : 'Prova a pensare in italiano! Etichetta gli oggetti intorno a te.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
