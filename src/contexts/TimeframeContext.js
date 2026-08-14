import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const TimeframeContext = createContext({
    timeframe: "week",
    setTimeframe: () => { },
    view: "ambos",
    setView: () => { },
});
export function TimeframeProvider({ children }) {
    const [timeframe, setTimeframe] = useState("week");
    const [view, setView] = useState("ambos");
    return (_jsx(TimeframeContext.Provider, { value: { timeframe, setTimeframe, view, setView }, children: children }));
}
export function useTimeframe() {
    return useContext(TimeframeContext);
}
