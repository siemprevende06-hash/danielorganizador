import { useTimeframe, Timeframe } from "@/contexts/TimeframeContext"
import { useSprints } from "@/hooks/useSprints"
import { cn } from "@/lib/utils"
import { Zap, CalendarDays, BarChart3, TrendingUp, Activity, Target } from "lucide-react"

const OPTIONS: { value: Timeframe; label: string; icon: React.ReactNode }[] = [
  { value: "today", label: "Hoy", icon: <Zap className="h-3 w-3" /> },
  { value: "week", label: "Semana", icon: <CalendarDays className="h-3 w-3" /> },
  { value: "month", label: "Mes", icon: <BarChart3 className="h-3 w-3" /> },
  { value: "quarter", label: "Trimestre", icon: <TrendingUp className="h-3 w-3" /> },
  { value: "year", label: "Año", icon: <Activity className="h-3 w-3" /> },
]

export function TimeframeSelector() {
  const { timeframe, setTimeframe } = useTimeframe()
  const { activeSprint } = useSprints()

  const allOptions = activeSprint
    ? [...OPTIONS, { value: "sprint" as Timeframe, label: activeSprint.name, icon: <Target className="h-3 w-3" /> }]
    : OPTIONS

  return (
    <div className="flex items-center justify-center gap-1.5">
      {allOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTimeframe(opt.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
            timeframe === opt.value
              ? "bg-primary/10 text-primary shadow-none"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <span className={cn(timeframe === opt.value ? "text-primary" : "text-muted-foreground/50")}>
            {opt.icon}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
