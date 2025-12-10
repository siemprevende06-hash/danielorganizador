import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ImagePlus, Plus, X, ListTodo } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';

type CompletionLevel = 'none' | 'minimum' | 'normal' | 'maximum';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface VisionGoalCard {
  id: string;
  image?: string;
  completionLevel: CompletionLevel;
  currentTask?: string;
  subTasks?: SubTask[];
}

interface VisionGoalsData {
  professional: VisionGoalCard[];
  hobbiesArtisticos: VisionGoalCard[];
  hobbiesIntelectuales: VisionGoalCard[];
  hobbiesFisicos: VisionGoalCard[];
}

const VISION_GOALS_KEY = 'visionGoalsBoard';

export const VisionGoalsBoard = () => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { uploadImage, uploading } = useImageUpload();
  const [newSubTaskInputs, setNewSubTaskInputs] = useState<{ [key: string]: string }>({});
  const [goals, setGoals] = useState<VisionGoalsData>({
    professional: [
      { id: 'prof-1', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'prof-2', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'prof-3', completionLevel: 'none', currentTask: '', subTasks: [] },
    ],
    hobbiesArtisticos: [
      { id: 'hobby-art-1', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-art-2', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-art-3', completionLevel: 'none', currentTask: '', subTasks: [] },
    ],
    hobbiesIntelectuales: [
      { id: 'hobby-int-1', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-int-2', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-int-3', completionLevel: 'none', currentTask: '', subTasks: [] },
    ],
    hobbiesFisicos: [
      { id: 'hobby-fis-1', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-fis-2', completionLevel: 'none', currentTask: '', subTasks: [] },
      { id: 'hobby-fis-3', completionLevel: 'none', currentTask: '', subTasks: [] },
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

  const handleImageUpload = async (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
    id: string,
    file: File
  ) => {
    const imageUrl = await uploadImage(file, `vision-goals/${category}`);
    
    if (imageUrl) {
      setGoals(prev => ({
        ...prev,
        [category]: prev[category].map(goal =>
          goal.id === id ? { ...goal, image: imageUrl } : goal
        ),
      }));
    }
  };

  const updateCompletionLevel = (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
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

  const updateCurrentTask = (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
    id: string,
    task: string
  ) => {
    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === id ? { ...goal, currentTask: task } : goal
      ),
    }));
  };

  const addSubTask = (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
    goalId: string
  ) => {
    const title = newSubTaskInputs[goalId]?.trim();
    if (!title) return;

    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === goalId 
          ? { 
              ...goal, 
              subTasks: [...(goal.subTasks || []), { id: `st-${Date.now()}`, title, completed: false }] 
            } 
          : goal
      ),
    }));
    setNewSubTaskInputs(prev => ({ ...prev, [goalId]: '' }));
  };

  const toggleSubTask = (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
    goalId: string,
    subTaskId: string
  ) => {
    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === goalId 
          ? { 
              ...goal, 
              subTasks: goal.subTasks?.map(st => 
                st.id === subTaskId ? { ...st, completed: !st.completed } : st
              ) 
            } 
          : goal
      ),
    }));
  };

  const deleteSubTask = (
    category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos',
    goalId: string,
    subTaskId: string
  ) => {
    setGoals(prev => ({
      ...prev,
      [category]: prev[category].map(goal =>
        goal.id === goalId 
          ? { ...goal, subTasks: goal.subTasks?.filter(st => st.id !== subTaskId) } 
          : goal
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

  const renderGoalCard = (goal: VisionGoalCard, category: 'professional' | 'hobbiesArtisticos' | 'hobbiesIntelectuales' | 'hobbiesFisicos') => (
    <Card key={goal.id} className={cn("transition-all overflow-hidden", getCardColor(goal.completionLevel))}>
      <CardContent className="p-0">
        {/* Image Upload Area */}
        <div 
          className="relative aspect-square cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => !uploading && fileInputRefs.current[goal.id]?.click()}
        >
          {uploading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="text-xs mt-2">Subiendo...</span>
            </div>
          ) : goal.image ? (
            <img
              src={goal.image}
              alt="Vision goal"
              className="w-full h-full object-cover"
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

        {/* Current Task Section */}
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ListTodo className="h-4 w-4" />
            <span>Tarea Actual</span>
          </div>
          <Input
            placeholder="¿En qué estás trabajando?"
            value={goal.currentTask || ''}
            onChange={(e) => updateCurrentTask(category, goal.id, e.target.value)}
            className="text-sm h-8"
          />
          
          {/* Subtasks */}
          <div className="space-y-1">
            {goal.subTasks?.map(subTask => (
              <div key={subTask.id} className="flex items-center gap-2 group">
                <Checkbox
                  checked={subTask.completed}
                  onCheckedChange={() => toggleSubTask(category, goal.id, subTask.id)}
                  className="h-4 w-4"
                />
                <span className={cn(
                  "text-xs flex-1",
                  subTask.completed && "line-through text-muted-foreground"
                )}>
                  {subTask.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteSubTask(category, goal.id, subTask.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Subtask */}
          <div className="flex gap-1">
            <Input
              placeholder="Nueva subtarea..."
              value={newSubTaskInputs[goal.id] || ''}
              onChange={(e) => setNewSubTaskInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addSubTask(category, goal.id)}
              className="text-xs h-7"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={() => addSubTask(category, goal.id)}
            >
              <Plus className="h-3 w-3" />
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
        
        {/* Hobbies Artísticos Subsection */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-muted-foreground">Hobbies Artísticos</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.hobbiesArtisticos.map(goal => renderGoalCard(goal, 'hobbiesArtisticos'))}
          </div>
        </div>

        {/* Hobbies Intelectuales Subsection */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-muted-foreground">Hobbies Intelectuales</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.hobbiesIntelectuales.map(goal => renderGoalCard(goal, 'hobbiesIntelectuales'))}
          </div>
        </div>

        {/* Hobbies Físicos Subsection */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-muted-foreground">Hobbies Físicos</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.hobbiesFisicos.map(goal => renderGoalCard(goal, 'hobbiesFisicos'))}
          </div>
        </div>
      </div>
    </div>
  );
};