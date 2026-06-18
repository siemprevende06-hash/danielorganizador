import { useTimeframe, Timeframe } from "@/contexts/TimeframeContext"
import type { ScoreView } from "@/contexts/TimeframeContext"
import { useSprints } from "@/hooks/useSprints"

const TIME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
]

const VIEW_OPTIONS: { value: ScoreView; label: string; icon: string }[] = [
  { value: "esfuerzo", label: "Esfuerzo", icon: "🔨" },
  { value: "resultados", label: "Resultados", icon: "📊" },
  { value: "ambos", label: "Ambos", icon: "👁️" },
]

export function TimeframeSelector() {
  const { timeframe, setTimeframe, view, setView } = useTimeframe()
  const { activeSprint } = useSprints()

  const timeOptions = activeSprint
    ? [...TIME_OPTIONS, { value: "sprint" as Timeframe, label: activeSprint.name }]
    : TIME_OPTIONS

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1">
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimeframe(opt.value)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-all ${
              timeframe === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1">
        {VIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setView(opt.value)}
            className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-all ${
              view === opt.value
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
