import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Language } from '@/hooks/useLanguageLearning';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  englishLevel?: string;
  italianLevel?: string;
  compact?: boolean;
}

const LANGUAGES = [
  {
    id: 'english' as Language,
    name: 'English',
    flag: '🇬🇧',
    nativeName: 'Inglés',
  },
  {
    id: 'italian' as Language,
    name: 'Italiano',
    flag: '🇮🇹',
    nativeName: 'Italiano',
  },
];

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  englishLevel = 'intermediate',
  italianLevel = 'beginner',
  compact = false,
}) => {
  const getLevel = (langId: Language) => {
    return langId === 'english' ? englishLevel : italianLevel;
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onLanguageChange(lang.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              currentLanguage === lang.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-accent border-border"
            )}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="font-medium text-sm">{lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {LANGUAGES.map((lang) => {
        const isSelected = currentLanguage === lang.id;
        const level = getLevel(lang.id);

        return (
          <Card
            key={lang.id}
            onClick={() => onLanguageChange(lang.id)}
            className={cn(
              "p-4 cursor-pointer transition-all hover:scale-[1.02]",
              isSelected
                ? "ring-2 ring-primary bg-primary/5 border-primary"
                : "hover:bg-accent"
            )}
          >
            <div className="text-center space-y-2">
              <span className="text-4xl block">{lang.flag}</span>
              <h3 className="font-semibold text-lg">{lang.name}</h3>
              <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                {LEVEL_LABELS[level] || level}
              </Badge>
              {isSelected && (
                <p className="text-xs text-primary font-medium">✓ Seleccionado</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
