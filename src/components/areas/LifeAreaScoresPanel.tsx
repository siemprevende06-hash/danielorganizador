import { useTimeframe } from "@/contexts/TimeframeContext"
import type { Timeframe } from "@/contexts/TimeframeContext"
import { useAreaScores } from "@/hooks/useAreaScores"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

const SECTION_CONFIG = [
  {
    key: "cimientos",
    title: "ÁREAS ESTRUCTURALES",
    subtitle: "Cimientos de tu vida",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    key: "construccion",
    title: "ÁREAS CENTRALES",
    subtitle: "Construcción activa",
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    key: "recompensas",
    title: "ÁREAS DE RECOMPENSA",
    subtitle: "Resultado de tu esfuerzo",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
]

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-500"
  if (score >= 40) return "text-amber-500"
  return "text-red-500"
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

interface LifeAreaScoresPanelProps {
  periodType: Timeframe
}

export function LifeAreaScoresPanel({ periodType }: LifeAreaScoresPanelProps) {
  const { view } = useTimeframe()
  const { scores, averages, loading } = useAreaScores(periodType, view)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Áreas de Vida</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Áreas de Vida</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            Esfuerzo: <strong className={cn("font-bold tabular-nums", getScoreColor(averages.esfuerzo))}>{averages.esfuerzo}%</strong>
          </span>
          <span className="flex items-center gap-1">
            Resultados: <strong className={cn("font-bold tabular-nums", getScoreColor(averages.resultados))}>{averages.resultados}%</strong>
          </span>
        </div>
      </div>

      {SECTION_CONFIG.map((section) => {
        const sectionAreas = scores.filter((s) => s.group === section.key)
        if (sectionAreas.length === 0) return null

        return (
          <div key={section.key} className="space-y-2">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r", section.color)}>
              <span className="text-xs font-bold tracking-wider text-muted-foreground">{section.title}</span>
              <span className="text-[10px] text-muted-foreground/60">{section.subtitle}</span>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {sectionAreas.map((area) => (
                <Card key={area.id} className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{area.icon}</span>
                      <span className="text-xs font-semibold truncate">{area.label}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground shrink-0">Esfuerzo</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", getScoreBg(area.esfuerzo))}
                            style={{ width: `${area.esfuerzo}%` }}
                          />
                        </div>
                        <span className={cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", getScoreColor(area.esfuerzo))}>
                          {area.esfuerzo}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground shrink-0">Resultados</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", getScoreBg(area.resultados))}
                            style={{ width: `${area.resultados}%` }}
                          />
                        </div>
                        <span className={cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", getScoreColor(area.resultados))}>
                          {area.resultados}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
