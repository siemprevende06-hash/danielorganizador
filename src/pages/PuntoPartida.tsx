import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, CheckCircle2, ArrowRight, Crosshair, Target, TrendingUp } from "lucide-react"
import { usePuntoPartida, PuntoPartidaEntry } from "@/hooks/usePuntoPartida"
import { usePointBMetrics } from "@/hooks/usePointBMetrics"
import { useSprints } from "@/hooks/useSprints"
import { useState } from "react"
import { toast } from "sonner"

const AREA_TO_PB_AREA: Record<string, string[]> = {
  salud: ["gym", "apariencia"],
  mente: ["lectura", "idiomas", "musica", "universidad"],
  carrera: ["universidad", "emprendimiento", "proyectos"],
  finanzas: ["finanzas"],
  relaciones: ["relaciones"],
  proposito: ["proposito"],
}

const MAPPED_SPRINT_AREAS: Record<string, string[]> = {
  salud: ["gym"],
  mente: ["lectura", "piano", "guitarra", "idiomas", "ajedrez"],
  carrera: ["universidad", "emprendimiento", "proyectos"],
  finanzas: [],
  relaciones: [],
  proposito: [],
}

const WHEEL_DATA: {
  id: string
  label: string
  nota: number
  sub: { label: string; nota: number; hecho: string }[]
  hechos_generales: string
}[] = [
  {
    id: "salud",
    label: "SALUD FÍSICO APARIENCIA",
    nota: 4,
    sub: [
      { label: "Ejercicio", nota: 3, hecho: "Plan 4d/sem → real 2d. Solo 2 semanas desde reinicio. BMI 16.6 (severamente bajo peso 51kg/175cm)" },
      { label: "Nutrición", nota: 4, hecho: "Control parcial. Sin meal prep semanal aún" },
      { label: "Sueño", nota: 4, hecho: "6-7h promedio. Objetivo: 8-9h" },
      { label: "Estética", nota: 6, hecho: "Skincare mañana+noche. Pero barbero irregular → aspecto descuidado a veces" },
      { label: "Energía", nota: 3, hecho: "BMI 16.6 + sueño insuficiente = poca energía basal" },
    ],
    hechos_generales: "Ectomorfo extremo (51kg/175cm). Viene de meses sin entrenar. Recuperando el hábito. Cuba: acceso limitado a suplementos/proteína.",
  },
  {
    id: "mente",
    label: "MENTE Y DESARROLLO PERSONAL",
    nota: 7,
    sub: [
      { label: "Lectura", nota: 9, hecho: "6 libros de ~250 páginas en 3 meses" },
      { label: "Idiomas", nota: 6, hecho: "Inglés A2→B1. Italiano A1 pasivo. 1.5h/día + curso intensivo mar/vi. Constancia 7-9/10" },
      { label: "Música", nota: 8, hecho: "Piano (1 año, 5 canciones adv). Guitarra (3 años, 5 canciones adv). Constancia 9.8/10 (~30min/día)" },
      { label: "Universidad", nota: 5, hecho: "Ing. Automática 3er año. 5/5 fáciles, 3/5 difíciles (varias convocatorias). No soy solo estudio" },
      { label: "Habilidades técnicas", nota: 8, hecho: "MVP SiempreVende funcional. Proyecto automatización IA. Domino stack moderno" },
    ],
    hechos_generales: "Carrera de alta dificultad (Ing. Automática). Combina estudio + emprendimiento + música + idiomas. Nota baja en uni por tener múltiples frentes.",
  },
  {
    id: "carrera",
    label: "CARRERA / EMPRENDIMIENTO",
    nota: 5,
    sub: [
      { label: "Universidad", nota: 6, hecho: "3er año finalizando. 2 semestres para graduarse" },
      { label: "Emprendimiento", nota: 7, hecho: "MVP SiempreVende (SAAS) funcional. Proyecto automatización IA para restaurante en curso" },
      { label: "Proyectos activos", nota: 6, hecho: "SiempreVende + automatización + varios personales (licencias, cuarto, etc.)" },
      { label: "Experiencia laboral", nota: 4, hecho: "8 meses ayudante abogado (servicio militar). Prácticas CIM. Sin empleo formal" },
      { label: "Networking profesional", nota: 3, hecho: "Sin mentores presenciales. Sin contactos sólidos en industria" },
      { label: "Habilidades de negocio", nota: 6, hecho: "Ha creado MVP funcional. Lee sobre negocios. Pero 0 ventas aún" },
    ],
    hechos_generales: "Emprendedor técnico con producto real. Falta: tracción comercial, networking, y enfoque en una sola cosa. Empresa AUTEC en idea.",
  },
  {
    id: "finanzas",
    label: "FINANZAS",
    nota: 5,
    sub: [
      { label: "Ingresos propios", nota: 2, hecho: "$0 USD/mes. Solo paga familiar (~$15 USD/mes en CUP)" },
      { label: "Control de gastos", nota: 8, hecho: "Presupuesto mensual siempre" },
      { label: "Ahorro", nota: 5, hecho: "$80 USD ($50 emergencia + $30 ahorro). 5800+3000 CUP en tarjetas. Contexto: estudiante en Cuba, salario promedio $15-45 USD/mes. A los 22 años está por encima del promedio nacional" },
      { label: "Inversión", nota: 2, hecho: "No invierte. Sin acceso fácil a mercados desde Cuba" },
      { label: "Educación financiera", nota: 9, hecho: "6+ libros leídos: Padre Rico, Mente Millonaria, Código del Dinero, Babilonia, Hábitos Millonarios, etc." },
    ],
    hechos_generales: "Cuba: economía cerrada, cambio 1 USD = 655 CUP, salario promedio 5-15k CUP/mes. Sus $80 USD ahorrados son decentes para su edad y contexto. Pero $0 ingresos propios es su talón de Aquiles.",
  },
  {
    id: "relaciones",
    label: "RELACIONES / SOCIAL",
    nota: 5,
    sub: [
      { label: "Familia", nota: 9, hecho: "Contacto cercano con padres, hermanos, tíos" },
      { label: "Amistades", nota: 5, hecho: "1 mejor amigo (hermano). Varios conocidos. Pocas amistades profundas" },
      { label: "Pareja / Seducción", nota: 2, hecho: "Nunca ha tenido novia. Virgen. Sin experiencia sexual. PERO: 30min/día aprendiendo seducción/mentalidad atractiva + años de teoría previa. Conocimiento pasivo sin acción" },
      { label: "Networking", nota: 3, hecho: "Sin mentores presenciales. Solo referentes online" },
      { label: "Habilidades sociales", nota: 5, hecho: "Sabe crear buen ambiente, hace reír. No sabe escalar a tensión sexual (friendzone)" },
    ],
    hechos_generales: "Cuba: poca exposición a mujeres por logística/transporte. Su fuerte es la teoría, su debilidad es la acción. Tiene el conocimiento pero no lo ejecuta.",
  },
  {
    id: "proposito",
    label: "PROPÓSITO / ESPIRITUAL",
    nota: 7,
    sub: [
      { label: "Propósito", nota: 8, hecho: "Tiene claro que quiere crear AUTEC y ser empresario tecnológico" },
      { label: "Valores", nota: 8, hecho: "Definidos: disciplina, constancia, determinación, aprendizaje continuo, resiliencia, mejora continua" },
      { label: "Identidad", nota: 8, hecho: "Plan Point A→B creado. Sprint de 90 días activo" },
      { label: "Autoconocimiento", nota: 5, hecho: "Journaling a veces, no constante" },
      { label: "Crecimiento personal", nota: 8, hecho: "Revisión diaria 10/10, semanal 8/10, mensual/trimestral 6/10" },
    ],
    hechos_generales: "Su mayor fortaleza: tiene claridad de dirección poco común para sus 22 años. Su sistema de revisión diaria es su mejor hábito.",
  },
]

const HOMBRE_DATA: {
  id: string
  label: string
  nota: number
  formula: string
  hecho: string
}[] = [
  { id: "liderazgo", label: "LIDERAZGO / DIRECCIÓN", nota: 6, formula: "Carrera 40% + Tasks 30% + Promedio General 30%", hecho: "Propósito claro. Plan identidad. Pero sin resultados tangibles aún" },
  { id: "seguridad", label: "SEGURIDAD / PROTECCIÓN", nota: 4, formula: "= Promedio General", hecho: "BMI 16.6. 51kg/175cm = apariencia frágil. Sin boxeo. Aunque mentalmente quiera proteger, físicamente no lo transmite" },
  { id: "estatus", label: "ESTATUS / RESPETO", nota: 5, formula: "Carrera 60% + Tasks 40%", hecho: "Emprendimiento técnico destacable en Cuba. Pero sin resultados visibles aún" },
  { id: "provision", label: "PROVISIÓN / AMBICIÓN", nota: 5, formula: "Finanzas 50% + Carrera 50%", hecho: "Ambicioso pero $0 ingresos propios. Proyectos en desarrollo" },
  { id: "fortaleza", label: "FORTALEZA FÍSICA / PRESENCIA", nota: 3, formula: "= Salud", hecho: "BMI 16.6. Constancia 2/4 días. Sin presencia física imponente" },
  { id: "ie", label: "INTELIGENCIA EMOCIONAL / CONEXIÓN", nota: 5, formula: "Relaciones 20% + Promedio 80%", hecho: "Autocrítica diaria. Journaling irregular. Sin experiencia validando en pareja" },
  { id: "carisma", label: "CARISMA / DIVERSIÓN", nota: 8, formula: "Mente 60% + extras", hecho: "Música, lectura, idiomas. Interesante. Sabe crear buen ambiente social" },
  { id: "lealtad", label: "LEALTAD / COMPROMISO", nota: 5, formula: "Tasks 60% + Promedio 40%", hecho: "Valores indican lealtad. Sin experiencia de pareja que lo demuestre. Sus valores cuentan pero no están probados en relación" },
]

export default function PuntoPartida() {
  const { saveAll, loading: saving } = usePuntoPartida()
  const { groupedByArea, loading: pbLoading } = usePointBMetrics()
  const { activeSprint } = useSprints()
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const wheelEntries: PuntoPartidaEntry[] = WHEEL_DATA.map((area) => ({
      area_id: area.id,
      area_type: "wheel" as const,
      nota: area.nota,
      sub_scores: Object.fromEntries(area.sub.map((s) => [s.label, s.nota])),
      respuestas: {},
      hechos: Object.fromEntries(area.sub.map((s) => [s.label, s.hecho])),
    }))

    const hombreEntries: PuntoPartidaEntry[] = HOMBRE_DATA.map((area) => ({
      area_id: area.id,
      area_type: "hombre" as const,
      nota: area.nota,
      sub_scores: {},
      respuestas: {},
      hechos: { formula: area.formula, hecho: area.hecho },
    }))

    const allEntries = [...wheelEntries, ...hombreEntries]
    const ok = await saveAll(allEntries)
    if (ok) {
      setSaved(true)
      toast.success("Punto de Partida guardado correctamente")
    } else {
      toast.error("Error al guardar")
    }
  }

  const allPbMetrics = Object.values(groupedByArea).flat()
  const sprintObjectives = activeSprint?.objectives || []

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold uppercase tracking-tight">PUNTO DE PARTIDA</h1>
          <p className="text-muted-foreground">
            Tu línea base — 17 de Junio 2026 — Daniel, 22 años — La Habana, Cuba
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
            Scores basados en hechos objetivos, no en cómo te sientes. Cada nota tiene evidencia concreta detrás.
            A partir de hoy, estos números subirán o bajarán según tus decisiones diarias.
          </p>
        </div>

        {/* Promedio general */}
        <Card className="p-6 text-center bg-primary text-primary-foreground">
          <p className="text-sm uppercase tracking-widest opacity-80">Promedio General</p>
          <p className="text-5xl font-black">6/10</p>
          <p className="text-sm opacity-80 mt-1">Rueda de la Vida</p>
        </Card>

        {/* JERARQUÍA: Point B → Sprint → Score */}
        <Card className="border-amber-500/30">
          <CardContent className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2 mb-4">
              <Crosshair className="h-4 w-4 text-amber-500" />
              JERARQUÍA DE METAS: Point B → Sprint → Punto Partida
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Cada área de la Rueda de la Vida está conectada a un objetivo de Point B (visión a 8 años),
              impulsado por objetivos del sprint actual (90 días), midiendo tu score actual (consistencia diaria).
            </p>
            <div className="space-y-3">
              {WHEEL_DATA.map(area => {
                const pbAreas = AREA_TO_PB_AREA[area.id] || []
                const pbMetrics = allPbMetrics.filter(m => pbAreas.includes(m.area))
                const sprintAreas = MAPPED_SPRINT_AREAS[area.id] || []
                const relatedObjectives = sprintObjectives.filter(o => sprintAreas.includes(o.area))
                return (
                  <div key={area.id} className="text-xs border-l-2 border-amber-500/30 pl-3 py-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{area.label}</span>
                      <span className="font-black">{area.nota}/10</span>
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      {pbMetrics.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <Crosshair className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                          <span>
                            <strong>Point B:</strong>{' '}
                            {pbMetrics.map(m => `${m.metric_name} → ${m.target_value} ${m.unit} (ahora ${m.current_value})`).join(', ')}
                          </span>
                        </div>
                      )}
                      {relatedObjectives.length > 0 && (
                        <div className="flex items-start gap-1.5">
                          <Target className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span>
                            <strong>Sprint {activeSprint?.name}:</strong>{' '}
                            {relatedObjectives.map(o => `${o.title} (${o.current_value}/${o.target_value} ${o.unit})`).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5">
                        <TrendingUp className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>
                          <strong>Ahora:</strong> Score base {area.nota}/10 — la consistencia diaria mueve este número
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Wheel of Life Areas */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            RUEDA DE LA VIDA — 6 Áreas
          </h2>

          {WHEEL_DATA.map((area) => (
            <Card key={area.id} className="overflow-hidden">
              <div className="bg-primary/5 px-5 py-3 flex items-center justify-between border-b">
                <h3 className="font-bold text-base">{area.label}</h3>
                <span className="text-2xl font-black">{area.nota}/10</span>
              </div>
              <CardContent className="p-5 space-y-3">
                {area.sub.map((s) => (
                  <div key={s.label} className="flex items-start gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          s.nota >= 8 ? "bg-green-500" : s.nota >= 5 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium">{s.label}</span>
                      <span className="font-bold text-xs">{s.nota}/10</span>
                    </div>
                    <span className="text-muted-foreground">{s.hecho}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground/70 mt-2 pt-2 border-t italic">
                  {area.hechos_generales}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hombre Top Areas */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            HOMBRE TOP — 8 Áreas (derivadas)
          </h2>

          <p className="text-xs text-muted-foreground">
            Estas áreas se calculan automáticamente desde las 6 áreas anteriores + datos de tareas. No necesitan entrada manual.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOMBRE_DATA.map((area) => (
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

        {/* Save button */}
        <div className="text-center pt-4">
          {saved ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Punto de Partida guardado — las ruedas ya usan estos datos
            </div>
          ) : (
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              {saving ? "Guardando..." : <> <Save className="w-4 h-4" /> Guardar Punto de Partida </>}
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
            <ArrowRight className="w-3 h-3 inline" /> A partir de ahora, estos scores se actualizarán solos según tus datos reales:
            gym completado, horas de estudio, tareas hechas, hábitos cumplidos. Cada decisión diaria mueve la aguja en
            Hoy, Semana, Mes, Trimestre, Año y Sprint.
          </p>
        </div>
      </div>
    </div>
  )
}
