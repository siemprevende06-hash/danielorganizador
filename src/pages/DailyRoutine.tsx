import { useState, useEffect } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Battery, Dumbbell, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const storedBlocks = localStorage.getItem('dailyRoutineBlocks');
    if (storedBlocks) {
      setBlocks(JSON.parse(storedBlocks));
    } else {
      const initialBlocks: RoutineBlock[] = [
        { id: "1", title: "Rutina Activación", startTime: "05:00", endTime: "05:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "2", title: "Idiomas", startTime: "05:30", endTime: "06:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "3", title: "Gym", startTime: "06:00", endTime: "07:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "4", title: "Alistamiento y Desayuno", startTime: "07:00", endTime: "07:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "5", title: "Focus Emprendimiento", startTime: "07:30", endTime: "08:25", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "6", title: "Lectura", startTime: "08:25", endTime: "08:40", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "7", title: "Viaje a CUJAE (Podcast)", startTime: "08:40", endTime: "09:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "8", title: "1er Deep Work", startTime: "09:00", endTime: "10:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "9", title: "2do Deep Work", startTime: "10:30", endTime: "11:50", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "10", title: "3er Deep Work", startTime: "12:00", endTime: "13:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "11", title: "Almuerzo (Game y Ajedrez)", startTime: "13:20", endTime: "14:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "12", title: "4to Deep Work", startTime: "14:00", endTime: "15:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "13", title: "5to Deep Work", startTime: "15:30", endTime: "16:50", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "14", title: "Viaje a Casa (Podcast)", startTime: "16:50", endTime: "17:05", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "15", title: "Rutina de Llegada", startTime: "17:05", endTime: "17:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "16", title: "Focus Universidad", startTime: "17:30", endTime: "19:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "17", title: "Comida y Serie", startTime: "19:00", endTime: "19:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "18", title: "PS4", startTime: "19:30", endTime: "20:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "19", title: "Guitarra o Piano", startTime: "20:00", endTime: "20:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "20", title: "Bloque de Emergencia", startTime: "20:30", endTime: "21:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "21", title: "Emergencia Deep Work", startTime: "21:00", endTime: "23:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
        { id: "22", title: "Sueño", startTime: "23:00", endTime: "04:55", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false] },
      ];
      setBlocks(initialBlocks);
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(initialBlocks));
    }
  }, []);

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

      {/* Energy Mode Buttons */}
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
