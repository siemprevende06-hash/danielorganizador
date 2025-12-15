import { useState, useEffect } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Battery, Dumbbell, Briefcase, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";

interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  specificTask?: string;
  genericTasks?: string[];
  currentStreak: number;
  maxStreak: number;
  weeklyCompletion: boolean[];
  coverImage?: string;
  isHalfTime?: boolean;
}

type EnergyMode = "normal" | "lowEnergy" | "gymHalf" | "entrepreneurshipHalf";

const DailyRoutine = () => {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [energyMode, setEnergyMode] = useState<EnergyMode>("normal");
  const { getSelectedMode, selectedModeId } = usePerformanceModes();

  const loadBlocks = () => {
    const storedBlocks = localStorage.getItem('dailyRoutineBlocks');
    if (storedBlocks) {
      try {
        setBlocks(JSON.parse(storedBlocks));
      } catch {
        applyModeBlocks();
      }
    } else {
      applyModeBlocks();
    }
  };

  const applyModeBlocks = () => {
    const mode = getSelectedMode();
    if (mode) {
      const routineBlocks = mode.blocks.map(block => ({
        ...block,
        currentStreak: 0,
        maxStreak: 0,
        weeklyCompletion: [false, false, false, false, false, false, false],
      }));
      setBlocks(routineBlocks);
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(routineBlocks));
    }
  };

  useEffect(() => {
    loadBlocks();

    // Listen for routine updates from performance modes
    const handleRoutineUpdate = () => {
      loadBlocks();
    };
    window.addEventListener('routineBlocksUpdated', handleRoutineUpdate);
    
    return () => {
      window.removeEventListener('routineBlocksUpdated', handleRoutineUpdate);
    };
  }, [selectedModeId]);

  useEffect(() => {
    if (blocks.length > 0) {
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(blocks));
    }
  }, [blocks]);

  const updateBlock = (updatedBlock: RoutineBlock) => {
    setBlocks(blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
  };

  const completeBlock = (blockId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0, Sun=6
        const newWeekly = [...block.weeklyCompletion];
        newWeekly[dayIndex] = true;
        
        const newStreak = block.currentStreak + 1;
        return {
          ...block,
          currentStreak: newStreak,
          maxStreak: Math.max(block.maxStreak, newStreak),
          weeklyCompletion: newWeekly
        };
      }
      return block;
    }));
  };

  const completedBlocks = blocks.filter(b => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    return b.weeklyCompletion[dayIndex];
  }).length;
  const progressPercentage = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

  const toggleEnergyMode = (mode: EnergyMode) => {
    if (energyMode === mode) {
      setEnergyMode("normal");
      // Reset all blocks to normal
      setBlocks(blocks.map(block => ({ ...block, isHalfTime: false })));
    } else {
      setEnergyMode(mode);
      // Apply half time to specific blocks based on mode
      setBlocks(blocks.map(block => {
        let shouldHalf = false;
        
        if (mode === "lowEnergy" && block.title === "Idiomas") {
          shouldHalf = true;
        } else if (mode === "gymHalf" && block.title === "Gym") {
          shouldHalf = true;
        } else if (mode === "entrepreneurshipHalf" && block.title === "Focus Emprendimiento") {
          shouldHalf = true;
        }
        
        return { ...block, isHalfTime: shouldHalf };
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      <header>
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          Rutina Diaria - Día de Enfoque
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          5:00 AM - 9:00 PM | Bloques estructurados para máxima productividad
        </p>
      </header>

      {/* Mode Selection and Energy Mode Buttons */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={energyMode === "lowEnergy" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("lowEnergy")}
            className={cn("transition-all")}
          >
            <Battery className="h-4 w-4 mr-2" />
            Mínimo por Energía
          </Button>
          <Button
            variant={energyMode === "gymHalf" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("gymHalf")}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Gym Reducido
          </Button>
          <Button
            variant={energyMode === "entrepreneurshipHalf" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("entrepreneurshipHalf")}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Emprendimiento Reducido
          </Button>
        </div>
        <Link to="/performance-modes">
          <Button variant="outline">
            <Settings2 className="h-4 w-4 mr-2" />
            Cambiar Modo de Rendimiento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso del Día</span>
            <Badge variant="outline" className="text-lg">
              {completedBlocks}/{blocks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progressPercentage)}% completado
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {blocks.map(block => (
          <RoutineBlockCard
            key={block.id}
            block={block}
            onUpdate={updateBlock}
            onComplete={() => completeBlock(block.id)}
          />
        ))}
      </div>

      {progressPercentage === 100 && (
        <Card className="border-2 border-green-500">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">¡Día Completado Perfectamente!</h3>
            <p className="text-muted-foreground">
              Has completado todos los bloques. Tu disciplina es inquebrantable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyRoutine;
