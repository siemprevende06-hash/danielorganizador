import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface PhysicalGoal {
  startWeight: number;
  targetWeight: number;
  currentWeight: number;
}

interface QuarterGoal {
  title: string;
  progress: number;
  category: string;
}

export function QuickProgress() {
  const [physicalGoal, setPhysicalGoal] = useState<PhysicalGoal | null>(null);
  const [topGoal, setTopGoal] = useState<QuarterGoal | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    // Load physical goal
    const { data: goal } = await supabase
      .from('physical_goals')
      .select('start_weight, target_weight')
      .eq('is_active', true)
      .maybeSingle();

    const { data: latestMeasurement } = await supabase
      .from('physical_tracking')
      .select('weight')
      .order('measurement_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (goal) {
      setPhysicalGoal({
        startWeight: Number(goal.start_weight),
        targetWeight: Number(goal.target_weight),
        currentWeight: latestMeasurement ? Number(latestMeasurement.weight) : Number(goal.start_weight)
      });
    }

    // Load top quarter goal
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const { data: goals } = await supabase
      .from('twelve_week_goals')
      .select('title, progress_percentage, category')
      .eq('quarter', currentQuarter)
      .eq('year', 2026)
      .eq('status', 'active')
      .order('progress_percentage', { ascending: false })
      .limit(1);

    if (goals && goals.length > 0) {
      setTopGoal({
        title: goals[0].title,
        progress: goals[0].progress_percentage || 0,
        category: goals[0].category
      });
    }
  };

  const calculatePhysicalProgress = () => {
    if (!physicalGoal) return 0;
    const { startWeight, targetWeight, currentWeight } = physicalGoal;
    const totalChange = targetWeight - startWeight;
    const currentChange = currentWeight - startWeight;
    return Math.max(0, Math.min(100, (currentChange / totalChange) * 100));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Physical Transformation */}
      <Link 
        to="/vida-daniel"
        className="block p-4 bg-card rounded-lg border border-border hover:border-foreground transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Transformación Física
          </span>
        </div>
        
        {physicalGoal ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-lg">{physicalGoal.currentWeight}kg</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-mono text-lg font-bold">{physicalGoal.targetWeight}kg</span>
            </div>
            <Progress value={calculatePhysicalProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {physicalGoal.targetWeight - physicalGoal.currentWeight > 0 
                ? `Faltan ${(physicalGoal.targetWeight - physicalGoal.currentWeight).toFixed(1)}kg`
                : '¡Meta alcanzada!'
              }
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Configura tu meta física</p>
        )}
      </Link>

      {/* Quarter Goal */}
      <Link 
        to="/12-week-year"
        className="block p-4 bg-card rounded-lg border border-border hover:border-foreground transition-colors"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Meta Principal Q{Math.ceil((new Date().getMonth() + 1) / 3)}
          </span>
        </div>
        
        {topGoal ? (
          <>
            <p className="font-medium text-foreground mb-2 truncate">{topGoal.title}</p>
            <Progress value={topGoal.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {topGoal.progress}% completado
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sin metas activas</p>
        )}
      </Link>
    </div>
  );
}
