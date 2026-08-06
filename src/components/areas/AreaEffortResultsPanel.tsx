import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AREAS_WITH_METRICS } from '@/data/areaMetricsData'
import { useWeeklyData, getWeekKey, getWeeksInRange } from '@/hooks/useWeeklyData'
import { AreaEffortCard } from './AreaEffortCard'
import { AreaResultsCard } from './AreaResultsCard'

interface AreaEffortResultsPanelProps {
  periodType: 'week' | 'month' | 'quarter'
  periodStart: Date
}

export function AreaEffortResultsPanel({ periodType, periodStart }: AreaEffortResultsPanelProps) {
  const { getWeek, setEffortMinutes, setMetricValue, sumEffortForWeeks, sumMetricForWeeks, getEffortMinutes, getMetricValue } = useWeeklyData()

  const { weekKeys, daysInPeriod, periodLabel } = useMemo(() => {
    if (periodType === 'week') {
      const wk = getWeekKey(periodStart)
      return { weekKeys: [wk], daysInPeriod: 7, periodLabel: `Sem ${format(periodStart, "w", { locale: es })}` }
    }
    if (periodType === 'month') {
      const start = startOfMonth(periodStart)
      const end = endOfMonth(periodStart)
      const keys = getWeeksInRange(start, end)
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return { weekKeys: keys, daysInPeriod: days, periodLabel: format(periodStart, 'MMMM', { locale: es }) }
    }
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
    const end = new Date(periodStart.getFullYear(), periodStart.getMonth() + 3, 0)
    const keys = getWeeksInRange(start, end)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return { weekKeys: keys, daysInPeriod: days, periodLabel: `Q${Math.floor(periodStart.getMonth() / 3) + 1}` }
  }, [periodType, periodStart])

  const editable = periodType === 'week'
  const mainWeekKey = weekKeys[0]

  const groups = useMemo(() => {
    const principales = AREAS_WITH_METRICS.filter(a => a.group === 'principales')
    const adicionales = AREAS_WITH_METRICS.filter(a => a.group === 'adicionales')
    return [principales, adicionales].filter(g => g.length > 0)
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {periodType === 'week' ? 'Edita tu esfuerzo y resultados de esta semana.' :
         periodType === 'month' ? 'Resumen del mes basado en tus semanas. Los valores son de solo lectura.' :
         'Resumen del trimestre basado en tus semanas. Los valores son de solo lectura.'}
        {!editable && weekKeys.length > 0 && (
          <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
            Datos agregados de {weekKeys.length} semana{weekKeys.length !== 1 ? 's' : ''}
          </span>
        )}
      </p>

      {groups.map((group, gi) => (
        <div key={gi} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="h-px flex-1 bg-border" />
            <span>{gi === 0 ? 'Metas Principales' : 'Metas Adicionales'}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {group.map(area => {
              const actualMinutes = editable
                ? getEffortMinutes(mainWeekKey, area.areaId)
                : sumEffortForWeeks(weekKeys, area.areaId)

              const getCurrentValue = (metricId: string) => {
                if (editable) return getMetricValue(mainWeekKey, area.areaId, metricId)
                return sumMetricForWeeks(weekKeys, area.areaId, metricId)
              }

              const targetForPeriod = (m: typeof area.metrics[0]) => {
                if (periodType === 'week' && m.targetWeek !== null) return m.targetWeek
                if (periodType === 'month') return m.targetMonth
                return m.targetQuarter
              }

              return (
                <Card key={area.areaId} className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                  <div className={cn("h-1", area.color)} />
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{area.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{area.label}</p>
                        {editable && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">Esfuerzo semanal:</span>
                            <input
                              type="number"
                              min={0}
                              className="w-16 h-5 text-[10px] text-center rounded border bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                              value={actualMinutes}
                              onChange={e => setEffortMinutes(mainWeekKey, area.areaId, parseInt(e.target.value) || 0)}
                            />
                            <span className="text-[9px] text-muted-foreground">min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <AreaEffortCard
                      areaId={area.areaId}
                      areaLabel={area.label}
                      areaIcon={area.icon}
                      areaColor={area.color}
                      periodType={periodType}
                      periodDays={daysInPeriod}
                      actualMinutes={actualMinutes}
                    />

                    <div className="border-t border-border/50 pt-3">
                      <AreaResultsCard
                        areaId={area.areaId}
                        metrics={area.metrics}
                        getCurrentValue={getCurrentValue}
                        targetForPeriod={targetForPeriod}
                        editable={editable}
                        onMetricChange={(metricId, value) => setMetricValue(mainWeekKey, area.areaId, metricId, value)}
                        periodLabel={periodLabel}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
