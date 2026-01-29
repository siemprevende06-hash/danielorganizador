import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { Globe, BookOpen, Headphones, MessageCircle, PenTool, Volume2 } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LanguagesDashboard() {
  const { settings, todaySession, isLoading, currentLanguage, setLanguage } = useLanguageLearning();

  const weeklyGoal = 300; // 5 hours per week
  const dailyGoal = 45; // 45 minutes per day

  const LanguageCard = ({ 
    language, 
    level, 
    isActive,
  }: { 
    language: string;
    level: string;
    isActive: boolean;
  }) => {
    const todayMinutes = todaySession?.totalDuration || 0;
    const dailyPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

    const skills = [
      { id: 'vocabulary', label: 'Vocabulario', icon: BookOpen, completed: todaySession?.vocabularyCompleted },
      { id: 'grammar', label: 'Gramática', icon: PenTool, completed: todaySession?.grammarCompleted },
      { id: 'speaking', label: 'Speaking', icon: MessageCircle, completed: todaySession?.speakingCompleted },
      { id: 'listening', label: 'Listening', icon: Headphones, completed: todaySession?.listeningCompleted },
      { id: 'reading', label: 'Reading', icon: Volume2, completed: todaySession?.readingCompleted },
    ];

    return (
      <Card className={isActive ? 'border-primary' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {language === 'english' ? '🇺🇸' : '🇮🇹'} {language === 'english' ? 'Inglés' : 'Italiano'}
            </CardTitle>
            <Badge variant={isActive ? 'default' : 'outline'}>{level}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{todayMinutes}min</p>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(dailyPercent)}%</p>
              <p className="text-xs text-muted-foreground">Meta diaria</p>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Meta diaria</span>
              <span>{todayMinutes}/{dailyGoal} min</span>
            </div>
            <Progress value={dailyPercent} className="h-2" />
          </div>

          {/* Skills */}
          {isActive && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Habilidades de hoy</p>
              <div className="grid grid-cols-5 gap-2">
                {skills.map(skill => (
                  <div 
                    key={skill.id}
                    className={`flex flex-col items-center p-2 rounded-lg text-center transition-colors ${
                      skill.completed 
                        ? 'bg-green-500/10 text-green-600' 
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <skill.icon className="w-4 h-4 mb-1" />
                    <span className="text-xs">{skill.label.slice(0, 4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🌍 Dashboard de Idiomas
        </h1>
        <p className="text-muted-foreground">
          Tu progreso en inglés e italiano
        </p>
      </header>

      {/* Language Selection */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">Idioma activo hoy:</span>
        <Badge 
          variant={currentLanguage === 'english' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setLanguage('english')}
        >
          🇺🇸 Inglés
        </Badge>
        <Badge 
          variant={currentLanguage === 'italian' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setLanguage('italian')}
        >
          🇮🇹 Italiano
        </Badge>
      </div>

      {/* Language Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <LanguageCard 
          language="english"
          level={settings.englishLevel || 'intermediate'}
          isActive={currentLanguage === 'english'}
        />
        <LanguageCard 
          language="italian"
          level={settings.italianLevel || 'beginner'}
          isActive={currentLanguage === 'italian'}
        />
      </div>

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium">Consejo del día</p>
              <p className="text-sm text-muted-foreground">
                {currentLanguage === 'english' 
                  ? "Practice makes perfect! Try to think in English during your daily activities."
                  : "La pratica rende perfetti! Prova a pensare in italiano durante le tue attività quotidiane."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
