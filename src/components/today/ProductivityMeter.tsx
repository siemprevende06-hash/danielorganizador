import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes } from "date-fns";
import { Zap, Target, Clock, Coffee, Brain, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { useRoutineBlocks } from "@/hooks/useRoutineBlocks";

interface ProductivityStats {
  energyLevel: number;
  energyLabel: string;
  productivity: number;
  productivityGrade: string;
  criticalTasks: number;
  nextBreakMinutes: number;
  focusScore: number;
  blocksCompleted: number;
  blocksTotal: number;
}

export function ProductivityMeter() {
  const [stats, setStats] = useState<ProductivityStats>({
    energyLevel: 70,
    energyLabel: "Alta",
    productivity: 0,
    productivityGrade: "B",
    criticalTasks: 0,
    nextBreakMinutes: 45,
    focusScore: 0,
    blocksCompleted: 0,
    blocksTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { blocks } = useRoutineBlocks();

  useEffect(() => {
    loadProductivityStats();
  }, [blocks]);

  const loadProductivityStats = async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const today = format(now, "yyyy-MM-dd");

      // Calculate energy based on time of day
      let energyLevel: number;
      let energyLabel: string;
      
      if (currentHour >= 5 && currentHour < 10) {
        energyLevel = 95;
        energyLabel = "Máxima";
      } else if (currentHour >= 10 && currentHour < 14) {
        energyLevel = 80;
        energyLabel = "Alta";
      } else if (currentHour >= 14 && currentHour < 16) {
        energyLevel = 55;
        energyLabel = "Media";
      } else if (currentHour >= 16 && currentHour < 19) {
        energyLevel = 70;
        energyLabel = "Media-Alta";
      } else {
        energyLevel = 40;
        energyLabel = "Baja";
      }

      // Get today's tasks stats
      const { data: todayTasks } = await supabase
        .from("tasks")
        .select("completed, priority")
        .gte("due_date", `${today}T00:00:00`)
        .lt("due_date", `${today}T23:59:59`);

      const completedCount = (todayTasks || []).filter(t => t.completed).length;
      const totalCount = (todayTasks || []).length;
      const criticalTasks = (todayTasks || []).filter(t => t.priority === "high" && !t.completed).length;

      // Calculate productivity percentage
      const productivity = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      // Calculate productivity grade
      let productivityGrade: string;
      if (productivity >= 90) productivityGrade = "A+";
      else if (productivity >= 80) productivityGrade = "A";
      else if (productivity >= 70) productivityGrade = "B";
      else if (productivity >= 60) productivityGrade = "C";
      else if (productivity >= 50) productivityGrade = "D";
      else productivityGrade = "F";

      // Calculate next break time
      const currentTimeStr = format(now, "HH:mm");
      const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      let nextBreakMinutes = 45; // Default
      for (let i = 0; i < sortedBlocks.length; i++) {
        const block = sortedBlocks[i];
        if (currentTimeStr >= block.startTime && currentTimeStr < block.endTime) {
          // We're in this block, calculate time until it ends
          const [endH, endM] = block.endTime.split(':').map(Number);
          const endDate = new Date(now);
          endDate.setHours(endH, endM, 0);
          nextBreakMinutes = Math.max(0, differenceInMinutes(endDate, now));
          break;
        }
      }

      // Calculate blocks completed today
      const { count: blocksCompletedCount } = await supabase
        .from("routine_completions")
        .select("*", { count: "exact", head: true })
        .eq("completion_date", today)
        .eq("routine_type", "block");

      // Calculate focus score based on deep work blocks completed
      const deepWorkBlocks = blocks.filter(b => 
        b.title.toLowerCase().includes("deep work") || 
        b.title.toLowerCase().includes("focus")
      );
      const focusScore = deepWorkBlocks.length > 0 
        ? Math.round(((blocksCompletedCount || 0) / deepWorkBlocks.length) * 100)
        : 0;

      setStats({
        energyLevel,
        energyLabel,
        productivity,
        productivityGrade,
        criticalTasks,
        nextBreakMinutes,
        focusScore: Math.min(focusScore, 100),
        blocksCompleted: blocksCompletedCount || 0,
        blocksTotal: blocks.length,
      });
    } catch (error) {
      console.error("Error loading productivity stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnergyIcon = () => {
    if (stats.energyLevel >= 80) return <BatteryFull className="w-5 h-5 text-green-500" />;
    if (stats.energyLevel >= 50) return <BatteryMedium className="w-5 h-5 text-yellow-500" />;
    return <BatteryLow className="w-5 h-5 text-red-500" />;
  };

  const getEnergyColor = () => {
    if (stats.energyLevel >= 80) return "bg-green-500";
    if (stats.energyLevel >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-32 p-4" />
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Energy Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getEnergyIcon()}
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Energía
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.energyLevel}%</span>
                <span className="text-xs text-muted-foreground">{stats.energyLabel}</span>
              </div>
              <Progress value={stats.energyLevel} className={`h-1.5 ${getEnergyColor()}`} />
            </div>
          </div>

          {/* Productivity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Productividad
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.productivityGrade}</span>
              <span className="text-sm text-muted-foreground">({stats.productivity}%)</span>
            </div>
          </div>

          {/* Critical Tasks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Críticas
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.criticalTasks}</span>
              <span className="text-xs text-muted-foreground">pendientes</span>
            </div>
          </div>

          {/* Next Break */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Próx. Pausa
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.nextBreakMinutes}</span>
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>
        </div>

        {/* Focus Score Bar */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium">Focus Score</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {stats.blocksCompleted}/{stats.blocksTotal} bloques
            </span>
          </div>
          <Progress value={stats.focusScore} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
