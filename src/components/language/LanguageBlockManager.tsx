import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from './LanguageSelector';
import { LanguageSubTasks } from './LanguageSubTasks';
import { useLanguageLearning, BlockType } from '@/hooks/useLanguageLearning';
import { Loader2 } from 'lucide-react';

interface LanguageBlockManagerProps {
  blockDurationMinutes: number;
  startTime: string;
  endTime: string;
}

export const LanguageBlockManager: React.FC<LanguageBlockManagerProps> = ({
  blockDurationMinutes,
  startTime,
  endTime,
}) => {
  const {
    settings,
    isLoading,
    currentLanguage,
    setLanguage,
    getSubTasksForDuration,
    toggleSubTask,
    getProgress,
  } = useLanguageLearning();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const blockType: BlockType = blockDurationMinutes >= 60 ? 'morning' : 'afternoon';
  const subTasks = getSubTasksForDuration(blockDurationMinutes);
  const progress = getProgress();

  return (
    <div className="space-y-4">
      {/* Selector de idioma */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Idioma del día
        </h4>
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={setLanguage}
          englishLevel={settings?.englishLevel}
          italianLevel={settings?.italianLevel}
        />
      </div>

      {/* Sub-tareas */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Actividades ({startTime} - {endTime})
        </h4>
        <LanguageSubTasks
          subTasks={subTasks}
          onToggleTask={toggleSubTask}
          blockType={blockType}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
};

// Componente compacto para usar en DayPlanner
export const LanguageDaySelector: React.FC<{
  onLanguageChange?: (language: 'english' | 'italian') => void;
}> = ({ onLanguageChange }) => {
  const { currentLanguage, setLanguage, settings, isLoading } = useLanguageLearning();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleChange = async (lang: 'english' | 'italian') => {
    await setLanguage(lang);
    onLanguageChange?.(lang);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🌍 Idioma del Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={handleChange}
          englishLevel={settings?.englishLevel}
          italianLevel={settings?.italianLevel}
          compact
        />
        <p className="text-xs text-muted-foreground mt-3">
          {currentLanguage === 'english' 
            ? 'Inglés: Vocabulario, gramática, conversación, lectura y escucha'
            : 'Italiano: Vocabulario, gramática, conversación, lectura y escucha'
          }
        </p>
      </CardContent>
    </Card>
  );
};
