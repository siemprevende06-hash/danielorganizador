import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const COVER_GRADIENTS = [
  "from-blue-600/40 to-cyan-500/40",
  "from-purple-600/40 to-pink-500/40",
  "from-emerald-600/40 to-teal-500/40",
  "from-amber-600/40 to-orange-500/40",
  "from-rose-600/40 to-red-500/40",
  "from-indigo-600/40 to-violet-500/40",
  "from-lime-600/40 to-green-500/40",
  "from-sky-600/40 to-blue-500/40",
]

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
  }
  return Math.abs(hash)
}

function getCoverGradient(id: string): string {
  return COVER_GRADIENTS[hashId(id) % COVER_GRADIENTS.length]
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400"
  if (score >= 40) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

export interface SubAreaCardData {
  id: string
  label: string
  esfuerzo: number
  resultados: number
  unit: string
  minutes: number
  children?: SubAreaCardData[]
}

interface SubAreaCardProps {
  data: SubAreaCardData
  depth?: number
}

export function SubAreaCard({ data, depth = 0 }: SubAreaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = data.children && data.children.length > 0
  const gradient = getCoverGradient(data.id)

  return (
    <Card className={cn("overflow-hidden border-0 shadow-sm", depth > 0 && "ml-3")}>
      <div className={cn("h-14 bg-gradient-to-br flex items-center px-4", gradient)}>
        <span className="text-sm font-bold text-white drop-shadow-sm truncate">
          {data.label}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Consistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-bold tabular-nums", getScoreColor(data.esfuerzo))}>
                {data.esfuerzo}%
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getScoreBg(data.esfuerzo))}
                  style={{ width: `${data.esfuerzo}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Esfuerzo</span>
            </div>
            <span className={cn("text-lg font-bold tabular-nums", data.minutes > 0 ? "text-foreground" : "text-muted-foreground")}>
              {data.minutes}min
            </span>
          </div>
        </div>

        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {data.children!.length} sub-áreas
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="px-4 pb-4 space-y-2">
          {data.children!.map(child => (
            <SubAreaCard key={child.id} data={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </Card>
  )
}
