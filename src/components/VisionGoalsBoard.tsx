import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CompletionLevel = 'none' | 'minimum' | 'normal' | 'maximum';

interface VisionGoalCard {
  id: string;
  title: string;
  completionLevel: CompletionLevel;
}

interface VisionGoalsData {
  professional: VisionGoalCard[];
  hobbies: VisionGoalCard[];
}

const VISION_GOALS_KEY = 'visionGoalsBoard';

export const VisionGoalsBoard = () => {
  const [goals, setGoals] = useState<VisionGoalsData>({
    professional: [
      { id: 'prof-1', title: '', completionLevel: 'none' },
      { id: 'prof-2', title: '', completionLevel: 'none' },
      { id: 'prof-3', title: '', completionLevel: 'none' },
    ],
    hobbies: [
      { id: 'hobby-1', title: '', completionLevel: 'none' },
      { id: 'hobby-2', title: '', completionLevel: 'none' },
      { id: 'hobby-3', title: '', completionLevel: 'none' },
    ],
  });

  useEffect(() => {
    const stored = localStorage.getItem(VISION_GOALS_KEY);
    if (stored) {
      setGoals(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VISION_GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  const updateGoalTitle = (category: 'professional' | 'hobbies', id: string, title: string) => {
    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === id ? { ...goal, title } : goal
      ),
    }));
  };

  const updateCompletionLevel = (
    category: 'professional' | 'hobbies',
    id: string,
    level: CompletionLevel
  ) => {
    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === id ? { ...goal, completionLevel: level } : goal
      ),
    }));
  };

  const getCardColor = (level: CompletionLevel) => {
    switch (level) {
      case 'minimum':
        return 'bg-yellow-500/10 border-yellow-500';
      case 'normal':
        return 'bg-blue-500/10 border-blue-500';
      case 'maximum':
        return 'bg-green-500/10 border-green-500';
      default:
        return 'bg-card border-border';
    }
  };

  const renderGoalCard = (goal: VisionGoalCard, category: 'professional' | 'hobbies') => (
    <Card key={goal.id} className={cn("transition-all", getCardColor(goal.completionLevel))}>
      <CardContent className="pt-4 space-y-3">
        <Input
          value={goal.title}
          onChange={(e) => updateGoalTitle(category, goal.id, e.target.value)}
          placeholder="Meta u objetivo..."
          className="text-center font-medium"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={goal.completionLevel === 'minimum' ? 'default' : 'outline'}
            onClick={() => updateCompletionLevel(category, goal.id, 'minimum')}
            className={cn(
              "flex-1 text-xs",
              goal.completionLevel === 'minimum' && "bg-yellow-500 hover:bg-yellow-600"
            )}
          >
            Mínimo
          </Button>
          <Button
            size="sm"
            variant={goal.completionLevel === 'normal' ? 'default' : 'outline'}
            onClick={() => updateCompletionLevel(category, goal.id, 'normal')}
            className={cn(
              "flex-1 text-xs",
              goal.completionLevel === 'normal' && "bg-blue-500 hover:bg-blue-600"
            )}
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant={goal.completionLevel === 'maximum' ? 'default' : 'outline'}
            onClick={() => updateCompletionLevel(category, goal.id, 'maximum')}
            className={cn(
              "flex-1 text-xs",
              goal.completionLevel === 'maximum' && "bg-green-500 hover:bg-green-600"
            )}
          >
            Máximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Profesional-Académico Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Profesional-Académico</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.professional.map(goal => renderGoalCard(goal, 'professional'))}
        </div>
      </div>

      {/* Desarrollo Personal Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Desarrollo Personal</h3>
        
        {/* Hobbies Subsection */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-muted-foreground">Hobbies</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.hobbies.map(goal => renderGoalCard(goal, 'hobbies'))}
          </div>
        </div>
      </div>
    </div>
  );
};