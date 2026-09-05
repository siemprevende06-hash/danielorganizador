import type { ScoreView } from "@/contexts/TimeframeContext"

interface WheelOfLifeProps {
  values?: number[]
  values2?: number[]
  labels?: string[]
  average?: number
  average2?: number
  view?: ScoreView
  loading?: boolean
}

const DEFAULT_LABELS = [
  "SALUD\nBIENESTAR",
  "FUERZA\nMENTAL",
  "PROPÓSITO\nAUTOCONOCIMIENTO",
  "APARIENCIA\nENTORNO",
  "DESARROLLO\nPERSONAL",
  "PROFESIONAL\nACADÉMICO",
  "FINANZAS",
  "FAMILIA\nAMISTAD",
  "AMOR\nROMANCE",
  "OCIO\nEXPERIENCIAS",
]

const DEFAULT_VALUES = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function WheelOfLife({
  values = DEFAULT_VALUES,
  values2,
  labels = DEFAULT_LABELS,
  average: avgProp,
  average2: avg2Prop,
  view = "ambos",
  loading,
}: WheelOfLifeProps) {
  const cx = 200
  const cy = 200
  const maxR = 145
  const levels = [0.25, 0.5, 0.75, 1]
  const n = values.length
  const angleStep = 360 / n
  const mappedView = view === "plan" ? "esfuerzo" : view === "autocritica" ? "ambos" : view
  const showEsfuerzo = mappedView === "esfuerzo" || mappedView === "ambos"
  const showResultados = mappedView === "resultados" || mappedView === "ambos"

  const displayAvg = avgProp !== undefined
    ? avgProp
    : Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const displayAvg2 = avg2Prop !== undefined
    ? avg2Prop
    : values2 ? Math.round(values2.reduce((a, b) => a + b, 0) / values2.length) : displayAvg

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="animate-pulse text-sm">Cargando datos...</div>
      </div>
    )
  }

  const gridPolygons = levels.map((level) => {
    const r = maxR * level
    const points = Array.from({ length: n }, (_, i) => {
      const p = polarToCartesian(cx, cy, r, i * angleStep)
      return `${p.x},${p.y}`
    }).join(" ")
    return points
  })

  const axes = Array.from({ length: n }, (_, i) => {
    const p = polarToCartesian(cx, cy, maxR, i * angleStep)
    return { x1: cx, y1: cy, x2: p.x, y2: p.y }
  })

  const esfuerzoPoints = values.map((val, i) => {
    const r = (Math.min(val, 10) / 10) * maxR
    return polarToCartesian(cx, cy, r, i * angleStep)
  })
  const esfuerzoPolygon = esfuerzoPoints.map((p) => `${p.x},${p.y}`).join(" ")

  const resultadoPoints = values2
    ? values2.map((val, i) => {
        const r = (Math.min(val, 10) / 10) * maxR
        return polarToCartesian(cx, cy, r, i * angleStep)
      })
    : []
  const resultadoPolygon = resultadoPoints.length > 0
    ? resultadoPoints.map((p) => `${p.x},${p.y}`).join(" ")
    : ""

  const labelPositions = values.map((_, i) => {
    const p = polarToCartesian(cx, cy, maxR + 34, i * angleStep)
    const lines = (labels[i] || "").split("\n")
    return { x: p.x, y: p.y, lines }
  })

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 450" className="w-full max-w-md h-auto">
        {gridPolygons.map((points, i) => (
          <polygon
            key={`grid-${i}`}
            points={points}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {axes.map((ax, i) => (
          <line key={`axis-${i}`} {...ax} stroke="hsl(var(--border))" strokeWidth={1} opacity={0.4} />
        ))}

        {showResultados && resultadoPolygon && (
          <>
            <polygon
              points={resultadoPolygon}
              fill="hsl(35, 85%, 55%)"
              fillOpacity={0.12}
              stroke="hsl(35, 85%, 55%)"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            {resultadoPoints.map((p, i) => (
              <circle key={`rdot-${i}`} cx={p.x} cy={p.y} r={3.5} fill="hsl(35, 85%, 55%)" />
            ))}
          </>
        )}

        {showEsfuerzo && (
          <>
            <polygon points={esfuerzoPolygon} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} />
            {esfuerzoPoints.map((p, i) => (
              <circle key={`edot-${i}`} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" />
            ))}
          </>
        )}

        <circle cx={cx} cy={cy} r={32} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
        {mappedView === "ambos" && (
          <>
            <text x={cx} y={cy - 10} textAnchor="middle" className="fill-muted-foreground" fontSize={8} fontWeight={600}>
              ESFUERZO
            </text>
            <text x={cx} y={cy + 2} textAnchor="middle" className="fill-foreground" fontSize={14} fontWeight={800}>
              {displayAvg}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={7} fontWeight={600}>
              RESULTADOS
            </text>
            <text x={cx} y={cy + 26} textAnchor="middle" fill="hsl(35, 85%, 55%)" fontSize={12} fontWeight={800}>
              {displayAvg2}
            </text>
          </>
        )}
        {mappedView === "esfuerzo" && (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={600}>
              PROMEDIO
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-foreground" fontSize={20} fontWeight={800}>
              {displayAvg}
            </text>
          </>
        )}
        {mappedView === "resultados" && (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={600}>
              PROMEDIO
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(35, 85%, 55%)" fontSize={20} fontWeight={800}>
              {displayAvg2}
            </text>
          </>
        )}

        {labelPositions.map((pos, i) => (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={7.5}
            fontWeight={600}
            style={{ textTransform: "uppercase", letterSpacing: "0.3px" }}
          >
            {pos.lines.map((line, li) => (
              <tspan key={li} x={pos.x} dy={li === 0 ? 0 : 10}>
                {line}
              </tspan>
            ))}
          </text>
        ))}
      </svg>

      {/* Legend */}
      {mappedView === "ambos" && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary inline-block" />
            <span>Esfuerzo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: "hsl(35, 85%, 55%)" }} />
            <span>Resultados</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-1 text-xs">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground truncate">{label.replace(/\n/g, " ")}</span>
            <span className="font-bold text-foreground">
              {showEsfuerzo ? values[i] : ""}
              {mappedView === "ambos" && <span className="text-muted-foreground font-normal"> / </span>}
              {showResultados && values2 ? (
                <span style={{ color: "hsl(35, 85%, 55%)" }}>{values2[i]}</span>
              ) : ""}
              /10
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
