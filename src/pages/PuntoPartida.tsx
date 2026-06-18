import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, CheckCircle2, ArrowRight, Crosshair, Target, TrendingUp, Eye } from "lucide-react"
import { usePuntoPartida, PuntoPartidaEntry } from "@/hooks/usePuntoPartida"
import { POINT_B_AREAS, VISION_3_YEARS } from "@/data/pointB2027"
import { useState } from "react"
import { toast } from "sonner"

const HOMBRE_LABELS = [
  { id: "liderazgo", label: "LIDERAZGO / DIRECCIÓN", nota: 6, formula: "Profesional 40% + Tasks 30% + Promedio 30%", hecho: "Propósito claro. Plan identidad. Sin resultados tangibles aún" },
  { id: "seguridad", label: "SEGURIDAD / PROTECCIÓN", nota: 4, formula: "= Promedio General (10 áreas)", hecho: "BMI 16.6, 51kg/175cm. Mentalmente quiere proteger, físicamente no lo transmite" },
  { id: "estatus", label: "ESTATUS / RESPETO", nota: 5, formula: "Profesional 60% + Tasks 40%", hecho: "Emprendimiento técnico destacable en Cuba. Sin resultados visibles aún" },
  { id: "provision", label: "PROVISIÓN / AMBICIÓN", nota: 5, formula: "Finanzas 50% + Profesional 50%", hecho: "Ambicioso pero $0 ingresos propios. Proyectos en desarrollo" },
  { id: "fortaleza", label: "FORTALEZA FÍSICA / PRESENCIA", nota: 3, formula: "= Salud y Bienestar", hecho: "BMI 16.6. Constancia 2/4 días. Sin presencia física imponente" },
  { id: "ie", label: "INTELIGENCIA EMOCIONAL / CONEXIÓN", nota: 5, formula: "(Familia+Amor) 20% + Promedio 80%", hecho: "Autocrítica diaria. Journaling irregular. Sin experiencia validando en pareja" },
  { id: "carisma", label: "CARISMA / DIVERSIÓN", nota: 8, formula: "Desarrollo Personal 60% + Ocio 40%", hecho: "Música, lectura, idiomas, ajedrez. Interesante. Sabe crear buen ambiente social" },
  { id: "lealtad", label: "LEALTAD / COMPROMISO", nota: 5, formula: "Tasks 60% + Promedio 40%", hecho: "Valores indican lealtad. Sin experiencia de pareja que lo demuestre" },
]

export default function PuntoPartida() {
  const { saveAll, loading: saving } = usePuntoPartida()
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const wheelEntries: PuntoPartidaEntry[] = POINT_B_AREAS.map((area) => ({
      area_id: area.id,
      area_type: "wheel" as const,
      nota: Math.round(area.sub.reduce((s, sub) => s + progressPct(sub.start, sub.target, sub.start), 0) / area.sub.length) || 5,
      sub_scores: Object.fromEntries(area.sub.map((s) => [s.id, s.start])),
      respuestas: {},
      hechos: {},
    }))

    const hombreEntries: PuntoPartidaEntry[] = HOMBRE_LABELS.map((area) => ({
      area_id: area.id,
      area_type: "hombre" as const,
      nota: area.nota,
      sub_scores: {},
      respuestas: {},
      hechos: { formula: area.formula, hecho: area.hecho },
    }))

    const ok = await saveAll([...wheelEntries, ...hombreEntries])
    if (ok) {
      setSaved(true)
      toast.success("Punto de Partida guardado")
    } else {
      toast.error("Error al guardar")
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tight">PUNTO DE PARTIDA</h1>
          <p className="text-muted-foreground">
            Tu línea base — 18 de Junio 2026 — Daniel, 22 años — La Habana, Cuba
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
            Cada score tiene dos dimensiones: <strong>Esfuerzo</strong> (consistencia diaria) y <strong>Resultados</strong> (% hacia Point B 2027).
            Las pestañas en Inicio alternan entre ambas.
          </p>
        </div>

        {/* Visión 3 años */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-amber-500" />
              VISIÓN 3 AÑOS — Brújula (no medible)
            </h2>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {VISION_3_YEARS}
            </p>
          </CardContent>
        </Card>

        {/* Point B 1 año — por áreas */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            POINT B 2027 — Metas a 1 año
          </h2>

          {["cimientos", "construccion", "recompensas"].map(group => {
            const areas = POINT_B_AREAS.filter(a => a.group === group)
            const groupLabels: Record<string, string> = {
              cimientos: "🏗️ CIMIENTOS — Estructura y Hábitos",
              construccion: "🔨 CONSTRUCCIÓN — Trabajo duro y Enfoque",
              recompensas: "🎁 RECOMPENSAS",
            }

            return (
              <div key={group} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {groupLabels[group]}
                </h3>
                {areas.map(area => {
                  const avgProgress = Math.round(
                    area.sub.reduce((s, sub) => s + progressPct(sub.start, sub.target, sub.start), 0) / area.sub.length
                  )
                  return (
                    <Card key={area.id} className="overflow-hidden">
                      <div className="bg-primary/5 px-5 py-3 flex items-center justify-between border-b">
                        <h4 className="font-bold text-base flex items-center gap-2">
                          <span>{area.icon}</span>
                          {area.label}
                        </h4>
                        <span className="text-sm font-bold text-muted-foreground">
                          0% · Point B 2027
                        </span>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {area.sub.map(sub => {
                            const pct = progressPct(sub.start, sub.target, sub.start)
                            return (
                              <div key={sub.id} className="flex items-center gap-2 text-muted-foreground">
                                <div className={`w-1.5 h-1.5 rounded-full ${pct >= 50 ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                <span className="font-medium text-foreground min-w-[100px]">{sub.label}</span>
                                <span>{sub.start} → {sub.target} {sub.unit}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Hombre Top */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            HOMBRE TOP — 8 Áreas (derivadas)
          </h2>
          <p className="text-xs text-muted-foreground">
            Se calculan automáticamente desde las 10 áreas + tareas. También tienen doble dimensión: Esfuerzo y Resultados.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOMBRE_LABELS.map(area => (
              <Card key={area.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm">{area.label}</h4>
                  <span className="text-lg font-black">{area.nota}/10</span>
                </div>
                <p className="text-xs text-muted-foreground/70">{area.formula}</p>
                <p className="text-xs text-muted-foreground mt-1">{area.hecho}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="text-center pt-4">
          {saved ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Punto de Partida guardado
            </div>
          ) : (
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              {saving ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar Punto de Partida</>}
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
            <ArrowRight className="w-3 h-3 inline" /> En Inicio puedes ver el progreso dual: <strong>Esfuerzo</strong> (🔨) y <strong>Resultados</strong> (📊).
            Los números se actualizan solos según tus datos diarios.
          </p>
        </div>
      </div>
    </div>
  )
}

function progressPct(start: number, target: number, current: number): number {
  if (start === target) return 100
  return Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)))
}
