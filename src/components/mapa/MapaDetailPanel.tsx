import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { MapaNode } from "@/hooks/useMapaDeVida"
import { PILARES_DIRECCION, PILAR_DESEOS } from "@/hooks/useMapaDeVida"
import type { AreaScore } from "@/hooks/useAreaScores"
import type { Necesidad } from "@/lib/definitions"
import { Clock, ArrowRight, X } from "lucide-react"

const NEED_PAGE: Record<string, string> = {
  moto: "/finanzas",
  dinero: "/finanzas",
  novia: "/novia",
  amigos: "/vida-social",
  intimidad: "/vida-social",
  boxeo: "/boxeo",
  exito: "/life-alignment",
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0m"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function statusText(p: number): string {
  if (p >= 80) return "✅ Satisfecha"
  if (p >= 50) return "🔄 En camino"
  if (p >= 20) return "⚠️ Insuficiente"
  return "❌ Insatisfecha"
}

function statusTextColor(p: number): string {
  if (p >= 80) return "#34d399"
  if (p >= 50) return "#fbbf24"
  if (p >= 20) return "#fb923c"
  return "#f87171"
}

function DualBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function MapaDetailPanel({
  node,
  areas,
  needs,
  onClose,
}: {
  node: MapaNode
  areas: AreaScore[]
  needs: Necesidad[]
  onClose: () => void
}) {
  const navigate = useNavigate()
  const area = areas.find((a) => a.id === node.id)
  const need = needs.find((n) => n.necesidad_id === node.id)

  return (
    <Card className="animate-scale-in">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="text-2xl">{node.icon}</span>
          <span>{node.label}</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {node.kind === "hub" ? "Energía" : node.kind === "area" ? "Área de Vida" : node.kind === "deseo" ? "Deseo" : "Pilar de Dirección"}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {node.kind === "hub" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <DualBar label="Esfuerzo promedio" value={node.score} color="#22d3ee" />
              <DualBar label="Resultados Promedio" value={node.score2} color="#34d399" />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatMinutes(areas.reduce((s, a) => s + (a.sub ? sumSubMinutes(a) : 0), 0))} de
              esfuerzo registrado en el período.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <span>{a.icon}</span>
                  <span className="text-xs flex-1 truncate">{a.label}</span>
                  <span className="tabular-nums font-semibold" style={{ color: a.esfuerzo >= 70 ? "#22d3ee" : a.esfuerzo >= 40 ? "#38bdf8" : "#64748b" }}>
                    {a.esfuerzo}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {node.kind === "area" && area && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <DualBar label="Esfuerzo invertido" value={node.score} color="#22d3ee" />
              <DualBar label="Avance a resultados" value={node.score2} color="#34d399" />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {formatMinutes(node.minutes)} invertidos en esta área
            </p>
            <div className="space-y-2">
              {area.sub.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs flex-1 truncate">{s.label}</span>
                  <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${s.esfuerzo}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">{s.esfuerzo}%</span>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/areas-de-vida")}>
              Ver todas las áreas <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </>
        )}

        {node.kind === "deseo" && need && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="muted-foreground">Progreso de este deseo</span>
                <span className="font-bold tabular-nums">{need.progreso}%</span>
              </div>
              <Progress value={need.progreso} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground">{need.descripcion}</p>
            <Badge variant="secondary">{statusText(need.progreso)}</Badge>
            <div className="flex flex-wrap gap-1.5">
              {areas
                .filter((a) => isFeeder(node.id, a.id))
                .map((a) => (
                  <Badge key={a.id} variant="outline" className="gap-1">
                    <span>{a.icon}</span>
                    {a.label}
                  </Badge>
                ))}
            </div>
            {NEED_PAGE[node.id] && (
              <Button size="sm" onClick={() => navigate(NEED_PAGE[node.id])}>
                Trabajar en esto <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </>
        )}

        {node.kind === "pilar" &&
          (() => {
            const pilar = PILARES_DIRECCION.find((p) => p.id === node.id)
            const feeding = needs.filter((n) => (PILAR_DESEOS[node.id] ?? []).includes(n.necesidad_id))
            const avg = feeding.length
              ? Math.round(feeding.reduce((s, n) => s + (n.progreso ?? 0), 0) / feeding.length)
              : 0
            return (
              <>
                {pilar && <p className="text-sm text-muted-foreground">{pilar.desc}</p>}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deseos que lo alimentan</span>
                    <span className="font-bold tabular-nums">{avg}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avg}%`, backgroundColor: "#f59e0b" }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {feeding.map((n) => (
                    <Badge key={n.necesidad_id} variant="outline" className="gap-1">
                      <span>{n.icono}</span>
                      {n.titulo}
                      <span className="tabular-nums font-semibold" style={{ color: statusTextColor(n.progreso ?? 0) }}>
                        {(n.progreso ?? 0)}%
                      </span>
                    </Badge>
                  ))}
                </div>
              </>
            )
          })()}
      </CardContent>
    </Card>
  )
}

function isFeeder(needId: string, areaId: string): boolean {
  const map: Record<string, string[]> = {
    moto: ["finanzas", "profesional"],
    dinero: ["finanzas", "profesional"],
    amigos: ["familia"],
    novia: ["apariencia", "amor"],
    intimidad: ["amor"],
    boxeo: ["salud", "fuerza-mental"],
    exito: ["proposito", "desarrollo"],
  }
  return (map[needId] ?? []).includes(areaId)
}

function sumSubMinutes(area: AreaScore): number {
  let total = 0
  const walk = (subs: AreaScore["sub"]) => {
    for (const s of subs) {
      if (s.children && s.children.length > 0) walk(s.children)
      else total += s.minutes
    }
  }
  walk(area.sub)
  return total
}