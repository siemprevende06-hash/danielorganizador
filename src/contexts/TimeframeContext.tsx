import { createContext, useContext, useState, ReactNode } from "react"

export type Timeframe = "today" | "week" | "month" | "quarter" | "year" | "sprint"
export type ScoreView = "esfuerzo" | "resultados" | "ambos"

interface TimeframeContextType {
  timeframe: Timeframe
  setTimeframe: (t: Timeframe) => void
  view: ScoreView
  setView: (v: ScoreView) => void
}

const TimeframeContext = createContext<TimeframeContextType>({
  timeframe: "week",
  setTimeframe: () => {},
  view: "ambos",
  setView: () => {},
})

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week")
  const [view, setView] = useState<ScoreView>("ambos")
  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe, view, setView }}>
      {children}
    </TimeframeContext.Provider>
  )
}

export function useTimeframe() {
  return useContext(TimeframeContext)
}
