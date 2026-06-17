import { useTimeframe, Timeframe } from "@/contexts/TimeframeContext"

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
]

export function TimeframeSelector() {
  const { timeframe, setTimeframe } = useTimeframe()
  return (
    <div className="flex items-center justify-center gap-1">
      {OPTIONS.map((opt) => (
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
  )
}
