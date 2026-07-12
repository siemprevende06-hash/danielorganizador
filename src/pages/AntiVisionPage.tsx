import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePointBMetrics } from '@/hooks/usePointBMetrics'
import { usePuntoPartida } from '@/hooks/usePuntoPartida'
import { useSystemsTracking } from '@/hooks/useSystemsTracking'
import { POINT_B_AREAS } from '@/data/pointB2027'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle, Plus, Target, TrendingDown,
  Pencil, Check, X, ChevronRight, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { EditMetricDialog } from '@/components/vision/EditMetricDialog'
import { AreaSystemsAndGoals } from '@/components/vision/AreaSystemsAndGoals'
import type { PointBMetric } from '@/hooks/usePointBMetrics'

const ANTI_GROUP_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  cimientos: { label: 'RIESGOS BASE', icon: '⚠️', desc: 'Lo que socava tu estructura' },
  construccion: { label: 'BLOQUEOS', icon: '🧱', desc: 'Lo que frena tu avance' },
  recompensas: { label: 'PÉRDIDAS', icon: '💔', desc: 'Lo que destruye tu recompensa' },
}

const HOMBRE_ANTI_LABELS = [
  { id: 'sumision', label: 'Sumisión / Pasividad', icon: '🐑' },
  { id: 'inseguridad', label: 'Inseguridad / Miedo', icon: '😰' },
  { id: 'irrelevancia', label: 'Irrelevancia', icon: '👻' },
  { id: 'dependencia', label: 'Dependencia', icon: '🪢' },
  { id: 'debilidad', label: 'Debilidad Física', icon: '🦴' },
  { id: 'reactividad', label: 'Reactividad Emocional', icon: '🤯' },
  { id: 'antipatia', label: 'Antipatía / Toxicidad', icon: '☠️' },
  { id: 'deslealtad', label: 'Deslealtad / Abandono', icon: '🚪' },
]

const HOMBRE_ANTI_NOTAS: Record<string, number> = {
  sumision: 4, inseguridad: 6, irrelevancia: 5, dependencia: 5,
  debilidad: 7, reactividad: 5, antipatia: 2, deslealtad: 5,
}

function getProgressColor(pct: number) {
  if (pct >= 80) return 'text-red-500'
  if (pct >= 40) return 'text-amber-500'
  return 'text-green-500'
}

function getBarColor(pct: number) {
  if (pct >= 80) return 'bg-red-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-green-500'
}

function calcAntiProgress(current: number, start: number, target: number): number {
  if (start === target) return 100
  const totalDistance = Math.abs(target - start)
  if (totalDistance === 0) return 0
  const traveled = Math.abs(current - start)
  const pct = Math.round((traveled / totalDistance) * 100)
  return Math.max(0, Math.min(100, target > start ? pct : 100 - pct))
}

function getRemainingText(current: number, target: number, unit: string): string {
  const diff = Math.abs(target - current)
  const rounded = Number.isInteger(diff) ? diff : diff.toFixed(1)
  const direction = target > current ? 'Te alejas' : 'Te acercas'
  return `${direction} ${rounded}${unit}`
}

export default function AntiVisionPage() {
  const { entries, loading: ppLoading, updateSubScore } = usePuntoPartida()
  const { metrics, groupedByPointBArea: customMetricsByPB, loading: metricsLoading, addMetric, updateMetric, deleteMetric } = usePointBMetrics()
  const {
    data: sysData, loading: sysLoading,
    toggleCompletion, setTimeValue, setCountValue,
  } = useSystemsTracking()

  const [showEdit, setShowEdit] = useState(false)
  const [editingMetric, setEditingMetric] = useState<PointBMetric | null>(null)
  const [editingSub, setEditingSub] = useState<{ areaId: string; subId: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingSub && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingSub])

  const overallAntiProgress = useCallback(() => {
    let total = 0
    let count = 0
    for (const area of POINT_B_AREAS) {
      for (const sub of area.sub) {
        const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start
        total += calcAntiProgress(current, sub.start, sub.target)
        count++
      }
    }
    return count > 0 ? Math.round(total / count) : 0
  }, [entries])

  const criticalSubAxes = useCallback(() => {
    let total = 0
    let critical = 0
    for (const area of POINT_B_AREAS) {
      for (const sub of area.sub) {
        const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start
        if (calcAntiProgress(current, sub.start, sub.target) >= 80) critical++
        total++
      }
    }
    return { critical, total }
  }, [entries])

  const antiProgress = overallAntiProgress()
  const { critical, total: totalSubAxes } = criticalSubAxes()

  const getCurrent = useCallback((areaId: string, subId: string, start: number) => {
    return entries[areaId]?.sub_scores?.[subId] ?? start
  }, [entries])

  const handleStartEdit = (areaId: string, subId: string, currentValue: number) => {
    setEditingSub({ areaId, subId })
    setEditValue(String(currentValue))
  }

  const handleSaveEdit = async () => {
    if (!editingSub) return
    const val = parseFloat(editValue)
    if (isNaN(val)) return
    const ok = await updateSubScore(editingSub.areaId, editingSub.subId, val)
    if (ok) {
      toast.success('Valor actualizado')
    } else {
      toast.error('Error al guardar')
    }
    setEditingSub(null)
  }

  const handleCancelEdit = () => {
    setEditingSub(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') handleCancelEdit()
  }

  const areaResultados = useCallback((area: typeof POINT_B_AREAS[0]) => {
    let total = 0
    let count = 0
    for (const sub of area.sub) {
      const current = entries[area.id]?.sub_scores?.[sub.id] ?? sub.start
      total += calcAntiProgress(current, sub.start, sub.target)
      count++
    }
    return count > 0 ? Math.round(total / count) : 0
  }, [entries])

  const loading = ppLoading || metricsLoading || sysLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destructive" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Global Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Anti-Visión 2027
            </h1>
            <p className="text-sm text-muted-foreground">
              Lo que te aleja de tu Point B · Cada sub-eje es una trampa a evitar
            </p>
          </div>
          <Link to="/vision">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Ir a Visión
            </Button>
          </Link>
        </div>

        {/* Overall Anti-Progress Card */}
        <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-background overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">Riesgo Global</p>
                <p className="text-5xl font-bold text-destructive">{antiProgress}%</p>
                <Badge variant="destructive" className="mt-2">
                  {critical}/{totalSubAxes} ejes en zona crítica
                </Badge>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground min-w-[100px]">Distancia</span>
                  <span className="font-bold">{antiProgress}%</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', getBarColor(antiProgress))} style={{ width: `${antiProgress}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground min-w-[100px]">Meta</span>
                  <span className="font-bold">0%</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-destructive/30" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <p className={cn('text-lg font-bold', getProgressColor(antiProgress))}>
                  {antiProgress >= 80 ? '🔥 Peligro: tu anti-visión domina' :
                   antiProgress >= 50 ? '⚠️ La anti-visión avanza, actúa ya' :
                   antiProgress >= 25 ? '👀 Vigila, está apareciendo' :
                   '✅ Anti-visión bajo control'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {antiProgress}% de distancia · {100 - antiProgress}% bajo control
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas by Group */}
        {(['cimientos', 'construccion', 'recompensas'] as const).map(group => {
          const areas = POINT_B_AREAS.filter(a => a.group === group)
          const gl = ANTI_GROUP_LABELS[group]
          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{gl.icon}</span>
                <h2 className="text-base font-bold uppercase tracking-wide">{gl.label}</h2>
                {gl.desc && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">— {gl.desc}</span>
                )}
              </div>

              {areas.map(area => {
                const res = areaResultados(area)
                const areaMetrics = customMetricsByPB[area.id] || []
                return (
                  <Card key={area.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: res >= 80 ? '#ef4444' : res >= 40 ? '#f59e0b' : '#6b7280' }}>
                    {/* Area Header */}
                    <CardHeader className="pb-0 pt-4 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{area.icon}</span>
                          <div>
                            <CardTitle className="text-base font-bold">{area.label}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {area.sub.length} sub-ejes · {res}% riesgo
                              {areaMetrics.length > 0 && ` · ${areaMetrics.length} contra-metas`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={res >= 40 ? 'destructive' : 'secondary'} className="text-xs">
                          {res}%
                        </Badge>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', getBarColor(res))}
                          style={{ width: `${res}%` }}
                        />
                      </div>
                    </CardHeader>

                    {/* Sub-axes */}
                    <CardContent className="p-4 pt-3 space-y-1">
                      {area.sub.map(sub => {
                        const current = getCurrent(area.id, sub.id, sub.start)
                        const pct = calcAntiProgress(current, sub.start, sub.target)
                        const isEditing = editingSub?.areaId === area.id && editingSub?.subId === sub.id
                        return (
                          <div
                            key={sub.id}
                            className="group flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              pct >= 80 ? 'bg-red-500' :
                              pct >= 40 ? 'bg-amber-500' :
                              'bg-green-500'
                            )} />

                            <span className="text-sm min-w-[130px] sm:min-w-[160px] text-foreground/80">
                              {sub.label}
                            </span>

                            <div className="flex items-center gap-1.5 text-sm min-w-[140px]">
                              <span className="text-muted-foreground text-xs">{sub.start}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    ref={editRef}
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    type="number"
                                    step="any"
                                    className="h-7 w-16 text-xs px-1.5"
                                  />
                                  <button onClick={handleSaveEdit} className="h-5 w-5 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded">
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={handleCancelEdit} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:bg-muted rounded">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(area.id, sub.id, current)}
                                  className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                  {current}
                                </button>
                              )}
                              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              <span className="font-bold text-destructive">{sub.target}</span>
                              <span className="text-xs text-muted-foreground">{sub.unit}</span>
                            </div>

                            <div className="flex-1 min-w-[60px]">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-700', getBarColor(pct))}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 min-w-[80px] justify-end">
                              <span className={cn('text-sm font-bold', getProgressColor(pct))}>
                                {pct}%
                              </span>
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {getRemainingText(current, sub.target, sub.unit)}
                              </span>
                            </div>

                            {!isEditing && (
                              <button
                                onClick={() => handleStartEdit(area.id, sub.id, current)}
                                className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {/* Systems + Goals */}
                      <AreaSystemsAndGoals
                        pbAreaId={area.id}
                        areaName={area.label}
                        areaIcon={area.icon}
                        completions={sysData.completions}
                        timeData={sysData.timeData}
                        countData={sysData.countData}
                        metrics={areaMetrics}
                        onToggleCompletion={toggleCompletion}
                        onSetTimeValue={setTimeValue}
                        onSetCountValue={setCountValue}
                        onAddMetric={() => { setEditingMetric(null); setShowEdit(true) }}
                        onEditMetric={(m) => { setEditingMetric(m); setShowEdit(true) }}
                        onDeleteMetric={async (id) => {
                          await deleteMetric(id)
                          toast.success('Contra-meta eliminada')
                        }}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        })}

        {/* Hombre Anti-Top */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-bold uppercase tracking-wide">Hombre Anti-Top</h2>
            <span className="text-xs text-muted-foreground">— 8 anti-dimensiones a eliminar</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HOMBRE_ANTI_LABELS.map(h => {
              const nota = HOMBRE_ANTI_NOTAS[h.id] ?? 5
              const pct = Math.round((nota / 10) * 100)
              return (
                <Card key={h.id} className="p-4 border-destructive/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{h.icon}</span>
                      <span className="text-xs font-bold leading-tight">{h.label}</span>
                    </div>
                    <span className={cn('text-lg font-black', getProgressColor(pct))}>
                      {nota}/10
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', getBarColor(pct))} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{pct}%</p>
                </Card>
              )
            })}
          </div>
        </div>

      </div>

      <EditMetricDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        metric={editingMetric}
        onSave={async (data) => {
          if (editingMetric) {
            await updateMetric(editingMetric.id, data)
            toast.success('Contra-meta actualizada')
          } else {
            await addMetric(data)
            toast.success('Contra-meta añadida')
          }
        }}
      />
    </div>
  )
}
