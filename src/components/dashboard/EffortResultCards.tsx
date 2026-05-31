import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, CheckCircle2, Clock, Zap, Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { type AreaEffortResult, type EffortResultSummary } from '@/hooks/useEffortResultStats';

// Global Score Cards
export function EffortResultScoreCards({ data }: { data: EffortResultSummary }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <div className="text-xl font-bold text-foreground">{data.effortScore}%</div>
          <div className="text-[10px] text-muted-foreground">Esfuerzo</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {data.totalMinutesToday}/{data.totalMinutesGoal} min
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
          <div className="text-xl font-bold text-foreground">{data.resultScore}%</div>
          <div className="text-[10px] text-muted-foreground">Resultados</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {data.totalTasksCompleted}/{data.totalTasksTotal} tareas
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <Zap className="h-5 w-5 mx-auto text-primary mb-1" />
          <div className="text-xl font-bold text-foreground">{data.overallScore}%</div>
          <div className="text-[10px] text-muted-foreground">Global</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            50% esfuerzo + 50% resultado
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact horizontal score bars
export function EffortResultBars({ data }: { data: EffortResultSummary }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" /> Esfuerzo (Constancia + Minutos)
            </span>
            <span className="text-xs font-bold text-blue-500">{data.effortScore}%</span>
          </div>
          <Progress value={data.effortScore} className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Resultados (Tareas + KPIs)
            </span>
            <span className="text-xs font-bold text-green-500">{data.resultScore}%</span>
          </div>
          <Progress value={data.resultScore} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Per-area detailed cards
export function AreaEffortResultGrid({ areas }: { areas: AreaEffortResult[] }) {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {areas.map(area => {
        const isExpanded = expandedArea === area.id;
        const effortPct = area.minutesGoal > 0 ? Math.min(100, Math.round((area.minutesToday / area.minutesGoal) * 100)) : 0;
        const resultPct = area.tasksTotal > 0 ? Math.round((area.tasksCompleted / area.tasksTotal) * 100) : 0;
        const combinedPct = Math.round((effortPct + resultPct) / 2);

        return (
          <Card key={area.id} className="border-border">
            <CardContent className="p-0">
              <div 
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpandedArea(isExpanded ? null : area.id)}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${area.color}15` }}>
                  {area.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{area.name}</span>
                    <div className="flex items-center gap-2">
                      {area.currentStreak > 0 && (
                        <Badge variant="secondary" className="text-[9px] gap-0.5 h-5">
                          <Flame className="h-2.5 w-2.5 text-orange-500" /> {area.currentStreak}d
                        </Badge>
                      )}
                      <span className="text-xs font-bold" style={{ color: area.color }}>{combinedPct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${effortPct}%` }} />
                    </div>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${resultPct}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-blue-500">{area.minutesToday}min/{area.minutesGoal}</span>
                    <span className="text-[9px] text-green-500">{area.tasksCompleted}/{area.tasksTotal} tareas</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                  {/* Effort detail */}
                  <div className="p-2 rounded-lg bg-blue-500/5">
                    <p className="text-[10px] font-semibold text-blue-500 uppercase mb-1.5">Esfuerzo</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-foreground">{area.minutesToday}</div>
                        <div className="text-[9px] text-muted-foreground">Min hoy</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{area.currentStreak}</div>
                        <div className="text-[9px] text-muted-foreground">Racha</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{area.daysActiveThisWeek}/7</div>
                        <div className="text-[9px] text-muted-foreground">Sem activa</div>
                      </div>
                    </div>
                  </div>

                  {/* Result detail */}
                  <div className="p-2 rounded-lg bg-green-500/5">
                    <p className="text-[10px] font-semibold text-green-500 uppercase mb-1.5">Resultados</p>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className="text-sm font-bold text-foreground">{area.tasksCompleted}/{area.tasksTotal}</div>
                        <div className="text-[9px] text-muted-foreground">Tareas</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{area.subtasksCompleted}/{area.subtasksTotal}</div>
                        <div className="text-[9px] text-muted-foreground">Subtareas</div>
                      </div>
                    </div>
                  </div>

                  {/* KPIs */}
                  {area.kpis.length > 0 && (
                    <div className="p-2 rounded-lg bg-primary/5">
                      <p className="text-[10px] font-semibold text-primary uppercase mb-1.5">KPIs</p>
                      <div className="space-y-1">
                        {area.kpis.map((kpi, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                            <span className="text-xs font-medium text-foreground">
                              {kpi.value}{kpi.target && <span className="text-muted-foreground">/{kpi.target}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Compact version for embedding
export function EffortResultCompact({ data }: { data: EffortResultSummary }) {
  return (
    <div className="space-y-3">
      <EffortResultScoreCards data={data} />
      <EffortResultBars data={data} />
    </div>
  );
}
