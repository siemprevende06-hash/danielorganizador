import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';

type CompletionLevel = 'none' | 'minimum' | 'normal' | 'maximum';

interface VisionGoalCard {
  id: string;
  image?: string;
  completionLevel: CompletionLevel;
}

interface VisionGoalsData {
  professional: VisionGoalCard[];
  hobbies: VisionGoalCard[];
}

const VISION_GOALS_KEY = 'visionGoalsBoard';

export const VisionGoalsBoard = () => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [goals, setGoals] = useState<VisionGoalsData>({
    professional: [
      { id: 'prof-1', completionLevel: 'none' },
      { id: 'prof-2', completionLevel: 'none' },
      { id: 'prof-3', completionLevel: 'none' },
    ],
    hobbies: [
      { id: 'hobby-1', completionLevel: 'none' },
      { id: 'hobby-2', completionLevel: 'none' },
      { id: 'hobby-3', completionLevel: 'none' },
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

  const handleImageUpload = (
    category: 'professional' | 'hobbies',
    id: string,
    file: File
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setGoals(prev => ({
        ...prev,
        [category]: prev[category].map(goal =>
          goal.id === id ? { ...goal, image: reader.result as string } : goal
        ),
      }));
    };
    reader.readAsDataURL(file);
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
      case 'none':
        return 'bg-red-500/10 border-red-500 border-2';
      case 'minimum':
        return 'bg-yellow-500/10 border-yellow-500 border-2';
      case 'normal':
        return 'bg-blue-500/10 border-blue-500 border-2';
      case 'maximum':
        return 'bg-green-500/10 border-green-500 border-2';
      default:
        return 'bg-card border-border';
    }
  };

  const renderGoalCard = (goal: VisionGoalCard, category: 'professional' | 'hobbies') => (
    <Card key={goal.id} className={cn("transition-all overflow-hidden", getCardColor(goal.completionLevel))}>
      <CardContent className="p-0">
        {/* Image Upload Area */}
        <div 
          className="relative aspect-square cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => fileInputRefs.current[goal.id]?.click()}
        >
          {goal.image ? (
            <img
              src={goal.image}
              alt="Vision goal"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImagePlus className="h-8 w-8 mb-2" />
              <span className="text-xs">Subir imagen</span>
            </div>
          )}
          <input
            ref={(el) => (fileInputRefs.current[goal.id] = el)}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(category, goal.id, file);
              }
            }}
          />
        </div>
        
        {/* Buttons */}
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={goal.completionLevel === 'none' ? 'default' : 'outline'}
              onClick={() => updateCompletionLevel(category, goal.id, 'none')}
              className={cn(
                "text-xs",
                goal.completionLevel === 'none' && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              No Hecho
            </Button>
            <Button
              size="sm"
              variant={goal.completionLevel === 'minimum' ? 'default' : 'outline'}
              onClick={() => updateCompletionLevel(category, goal.id, 'minimum')}
              className={cn(
                "text-xs",
                goal.completionLevel === 'minimum' && "bg-yellow-500 hover:bg-yellow-600 text-white"
              )}
            >
              Mínimo
            </Button>
            <Button
              size="sm"
              variant={goal.completionLevel === 'normal' ? 'default' : 'outline'}
              onClick={() => updateCompletionLevel(category, goal.id, 'normal')}
              className={cn(
                "text-xs",
                goal.completionLevel === 'normal' && "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={goal.completionLevel === 'maximum' ? 'default' : 'outline'}
              onClick={() => updateCompletionLevel(category, goal.id, 'maximum')}
              className={cn(
                "text-xs",
                goal.completionLevel === 'maximum' && "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              Máximo
            </Button>
          </div>
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