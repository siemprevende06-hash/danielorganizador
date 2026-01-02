import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Target, Flame } from "lucide-react";

interface WeekContextData {
  weekNumber: number;
  quarter: number;
  daysRemaining: number;
  weeklyGoals: string[];
  mainFocus: string;
}

export function WeekContext() {
  const [context, setContext] = useState<WeekContextData | null>(null);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekOfYear = Math.ceil((dayOfYear + 1) / 7);
    
    // Calculate 12-week year context
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const quarterStartMonth = (quarter - 1) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
    const dayInQuarter = Math.floor((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
    const weekInQuarter = Math.min(12, Math.ceil((dayInQuarter + 1) / 7));
    
    // Days remaining in this week
    const dayOfWeek = now.getDay();
    const daysRemaining = 7 - dayOfWeek;

    // Load current quarter goals
    const { data: goals } = await supabase
      .from('twelve_week_goals')
      .select('title, category')
      .eq('quarter', quarter)
      .eq('year', 2026)
      .eq('status', 'active')
      .limit(3);

    const weeklyGoals = goals?.map(g => g.title) || [];
    const mainFocus = goals?.[0]?.title || 'Enfócate en tus prioridades';

    setContext({
      weekNumber: weekInQuarter,
      quarter,
      daysRemaining,
      weeklyGoals,
      mainFocus
    });
  };

  if (!context) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  return (
    <div className="bg-foreground text-background rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">
            Semana {context.weekNumber}/12 • Q{context.quarter}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Flame className="w-4 h-4" />
          <span>{context.daysRemaining} días restantes</span>
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs opacity-75 uppercase tracking-wider mb-1">Foco Principal</p>
          <p className="font-medium">{context.mainFocus}</p>
        </div>
      </div>

      {context.weeklyGoals.length > 1 && (
        <div className="mt-3 pt-3 border-t border-background/20">
          <p className="text-xs opacity-75 mb-2">Metas activas:</p>
          <div className="flex flex-wrap gap-2">
            {context.weeklyGoals.slice(1, 4).map((goal, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-background/20 rounded">
                {goal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
