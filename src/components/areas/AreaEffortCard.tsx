import { useEffortConfig } from '@/hooks/useEffortConfig'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { getDaysInPeriod } from '@/hooks/useWeeklyData'

interface AreaEffortCardProps {
  areaId: string
  areaLabel: string
  areaIcon: string
  areaColor: string
  periodType: 'week' | 'month' | 'quarter'
  periodDays: number
  actualMinutes: number
}

export function AreaEffortCard({ areaId, areaLabel, areaIcon, areaColor, periodType, periodDays, actualMinutes }: AreaEffortCardProps) {
  const { getConfig, updateConfig } = useEffortConfig()
  const config = getConfig(areaId)
  const days = periodDays > 0 ? periodDays : getDaysInPeriod(periodType, new Date())
  const avgDailyMinutes = days > 0 ? Math.round(actualMinutes / days) : 0
  const effectiveLevel = avgDailyMinutes >= config.alto ? 'alto' : avgDailyMinutes >= config.normal ? 'normal' : avgDailyMinutes >= config.bajo ? 'bajo' : null

  const targetForPeriod = (level: number) => level * days
  const bajoTarget = targetForPeriod(config.bajo)
  const normalTarget = targetForPeriod(config.normal)
  const altoTarget = targetForPeriod(config.alto)

  const progressVs = (target: number) => target > 0 ? Math.min(100, Math.round((actualMinutes / target) * 100)) : 0
  const activeProgress = config.normal > 0 ? progressVs(config.normal * days) : 0

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", areaColor)} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Esfuerzo</span>
      </div>

      <div className="flex items-center gap-2">
        {(['bajo', 'normal', 'alto'] as const).map(level => {
          const val = config[level]
          const pct = progressVs(targetForPeriod(val))
          const isActive = effectiveLevel === level
          return (
            <div key={level} className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className={cn(
                  "text-[10px] font-medium uppercase",
                  isActive ? "text-foreground" : "text-muted-foreground/60"
                )}>
                  {level}
                </span>
                <div className="flex items-center gap-0.5 ml-auto">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    className={cn(
                      "w-12 h-6 text-xs text-center rounded-md border bg-transparent",
                      "focus:outline-none focus:ring-1 focus:ring-primary",
                      isActive && "border-primary/50"
                    )}
                    value={val}
                    onChange={e => {
                      const v = parseInt(e.target.value) || 1
                      updateConfig(areaId, { ...config, [level]: v })
                    }}
                  />
                  <span className="text-[9px] text-muted-foreground">min</span>
                </div>
              </div>
              <Progress
                value={pct}
                className={cn("h-1.5", isActive ? "opacity-100" : "opacity-30")}
              />
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 text-right">
                {actualMinutes}/{targetForPeriod(val)}min
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5">
        <span>Promedio real: <strong>{avgDailyMinutes} min/día</strong></span>
        <span>
          Meta activa: <strong className={cn(
            effectiveLevel === 'alto' && 'text-green-500',
            effectiveLevel === 'normal' && 'text-amber-500',
            effectiveLevel === 'bajo' && 'text-blue-500',
            !effectiveLevel && 'text-muted-foreground'
          )}>
            {effectiveLevel ? `${config[effectiveLevel]} min/día (${effectiveLevel})` : 'Sin actividad'}
          </strong>
        </span>
      </div>
    </div>
  )
}
