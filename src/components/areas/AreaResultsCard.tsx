import type { MetricDef } from '@/data/areaMetricsData'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AreaResultsCardProps {
  areaId: string
  metrics: MetricDef[]
  getCurrentValue: (metricId: string) => number
  targetForPeriod: (metric: MetricDef) => number
  editable: boolean
  onMetricChange?: (metricId: string, value: number) => void
  periodLabel?: string
}

export function AreaResultsCard({ areaId, metrics, getCurrentValue, targetForPeriod, editable, onMetricChange, periodLabel }: AreaResultsCardProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Resultados
          {periodLabel && <span className="font-normal lowercase ml-1">({periodLabel})</span>}
        </span>
      </div>

      <div className="space-y-2">
        {metrics.map(m => {
          const current = getCurrentValue(m.id)
          const target = targetForPeriod(m)
          const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : current > 0 ? 100 : 0
          const hasTarget = target > 0

          return (
            <div key={m.id} className="bg-muted/20 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground truncate">{m.label}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {editable ? (
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      className="w-14 h-6 text-xs text-right rounded-md border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                      value={current}
                      onChange={e => onMetricChange?.(m.id, parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="text-xs font-semibold tabular-nums">{current}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">/ {target}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{m.unit}</span>
                </div>
              </div>
              {hasTarget && (
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="h-1.5 flex-1" />
                  <span className={cn(
                    "text-[10px] font-mono font-semibold w-8 text-right",
                    progress >= 100 ? "text-green-500" : progress >= 50 ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    {progress}%
                  </span>
                </div>
              )}
              {!editable && current === 0 && (
                <p className="text-[9px] text-muted-foreground/50 italic">
                  Sin datos de semanas anteriores
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
