interface WheelOfLifeProps {
  values?: number[]
  labels?: string[]
  average?: number
  loading?: boolean
}

const DEFAULT_LABELS = [
  "SALUD\nFÍSICO\nAPARIENCIA",
  "MENTE Y\nDESARROLLO\nPERSONAL",
  "CARRERA\nEMPRENDIMIENTO",
  "FINANZAS",
  "RELACIONES\nSOCIAL",
  "PROPÓSITO\nESPIRITUAL",
]

const DEFAULT_VALUES = [8, 7, 6, 5, 7, 6]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function WheelOfLife({
  values = DEFAULT_VALUES,
  labels = DEFAULT_LABELS,
  average: avgProp,
  loading,
}: WheelOfLifeProps) {
  const cx = 200
  const cy = 200
  const maxR = 160
  const levels = [0.25, 0.5, 0.75, 1]
  const n = values.length
  const angleStep = 360 / n
  const displayAvg = avgProp !== undefined ? avgProp : Math.round(values.reduce((a, b) => a + b, 0) / values.length)

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

  const dataPoints = values.map((val, i) => {
    const r = (Math.min(val, 10) / 10) * maxR
    return polarToCartesian(cx, cy, r, i * angleStep)
  })
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ")

  const labelPositions = values.map((_, i) => {
    const p = polarToCartesian(cx, cy, maxR + 38, i * angleStep)
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

        <polygon points={dataPolygon} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2} />

        {dataPoints.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" />
        ))}

        <circle cx={cx} cy={cy} r={28} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
        <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground" fontSize={11} fontWeight={600}>
          PROMEDIO
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-foreground" fontSize={20} fontWeight={800}>
          {displayAvg}
        </text>

        {labelPositions.map((pos, i) => (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={8.5}
            fontWeight={600}
            style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            {pos.lines.map((line, li) => (
              <tspan key={li} x={pos.x} dy={li === 0 ? 0 : 12}>
                {line}
              </tspan>
            ))}
          </text>
        ))}
      </svg>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-2 text-xs">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{label.replace(/\n/g, " ")}</span>
            <span className="font-bold text-foreground">{values[i]}/10</span>
          </div>
        ))}
      </div>
    </div>
  )
}
