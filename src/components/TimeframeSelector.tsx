import { useTimeframe, Timeframe } from "@/contexts/TimeframeContext"
import type { ScoreView } from "@/contexts/TimeframeContext"
import { useSprints } from "@/hooks/useSprints"
import { AutocriticaSection } from "@/components/autocritica/AutocriticaSection"
import { MySystemsSection } from "@/components/dashboard/MySystemsSection"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns"

const TIME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
]

const VIEW_OPTIONS: { value: ScoreView; label: string; icon: string }[] = [
  { value: "esfuerzo", label: "Esfuerzo", icon: "🔨" },
  { value: "plan", label: "Plan", icon: "📋" },
  { value: "resultados", label: "Resultados", icon: "📊" },
  { value: "ambos", label: "Ambos", icon: "👁️" },
  { value: "autocritica", label: "Autocrítica", icon: "🔍" },
]

export function TimeframeSelector() {
  const { timeframe, setTimeframe, view, setView } = useTimeframe()
  const { activeSprint } = useSprints()

  const timeOptions = activeSprint
    ? [...TIME_OPTIONS, { value: "sprint" as Timeframe, label: activeSprint.name }]
    : TIME_OPTIONS

  const now = new Date()
  let start = now
  let end = now
  let scope: "day" | "week" | "month" | "quarter" | "year" = "day"
  switch (timeframe) {
    case "week":
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = endOfWeek(now, { weekStartsOn: 1 })
      scope = "week"
      break
    case "month":
      start = startOfMonth(now)
      end = endOfMonth(now)
      scope = "month"
      break
    case "quarter":
      start = startOfQuarter(now)
      end = endOfQuarter(now)
      scope = "quarter"
      break
    case "year":
      start = startOfYear(now)
      end = endOfYear(now)
      scope = "year"
      break
    case "sprint":
      if (activeSprint) {
        start = new Date(`${activeSprint.start_date}T00:00:00`)
        end = new Date(`${activeSprint.end_date}T00:00:00`)
        scope = "week"
      }
      break
    default:
      scope = "day"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-1 flex-wrap">
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
      <div className="flex items-center justify-center gap-1 flex-wrap">
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
      {view === "autocritica" && (
        <div className="w-full max-w-3xl mx-auto mt-2">
          <Tabs defaultValue="autocritica" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="autocritica" className="flex-1">Autocrítica</TabsTrigger>
              <TabsTrigger value="sistemas" className="flex-1">Sistemas</TabsTrigger>
            </TabsList>
            <TabsContent value="autocritica">
              <AutocriticaSection start={start} end={end} scope={scope} />
            </TabsContent>
            <TabsContent value="sistemas">
              <MySystemsSection />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}