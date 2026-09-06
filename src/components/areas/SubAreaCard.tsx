import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { AreaCover, getCoverGradient } from "./AreaCover"

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
  getCover?: (id: string) => string | null | undefined
  showCamera?: boolean
  getUploading?: (id: string) => boolean
  onUploadCover?: (id: string, file: File) => void
}

function resolveUploading(getUploading: SubAreaCardProps["getUploading"], id: string): boolean {
  return getUploading ? getUploading(id) : false
}

export function SubAreaCard({
  data,
  depth = 0,
  getCover,
  showCamera,
  getUploading,
  onUploadCover,
}: SubAreaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = data.children && data.children.length > 0
  const gradient = getCoverGradient(data.id)
  const cover = getCover ? (getCover(data.id) ?? null) : null
  const uploading = resolveUploading(getUploading, data.id)

  return (
    <Card className={cn("overflow-hidden border-0 shadow-sm", depth > 0 && "ml-3")}>
      <AreaCover
        cover={cover}
        gradient={gradient}
        label={data.label}
        showCamera={showCamera}
        uploading={uploading}
        onUpload={onUploadCover ? (file) => onUploadCover(data.id, file) : undefined}
        className="h-16"
      />

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
            <SubAreaCard
              key={child.id}
              data={child}
              depth={depth + 1}
              getCover={getCover}
              showCamera={showCamera}
              getUploading={getUploading}
              onUploadCover={onUploadCover}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
