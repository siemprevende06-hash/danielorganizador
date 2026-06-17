import { createContext, useContext, useState, ReactNode } from "react"

export type Timeframe = "today" | "week" | "month" | "quarter" | "year"

interface TimeframeContextType {
  timeframe: Timeframe
  setTimeframe: (t: Timeframe) => void
}

const TimeframeContext = createContext<TimeframeContextType>({
  timeframe: "week",
  setTimeframe: () => {},
})

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week")
  return (
    <TimeframeContext.Provider value={{ timeframe, setTimeframe }}>
      {children}
    </TimeframeContext.Provider>
  )
}

export function useTimeframe() {
  return useContext(TimeframeContext)
}
