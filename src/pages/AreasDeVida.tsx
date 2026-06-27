import { useTimeframe } from "@/contexts/TimeframeContext"
import { useAreaScores } from "@/hooks/useAreaScores"
import { TimeframeSelector } from "@/components/TimeframeSelector"
import { WheelOfLife } from "@/components/WheelOfLife"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Heart, Brain, Compass, Shirt, Briefcase, DollarSign,
  BookOpen, Users, HeartIcon, Gamepad2, Crown, Music,
  Target, GraduationCap, Star, Sparkles, Anchor,
  ExternalLink
} from "lucide-react"

const AREA_LINKS: Record<string, { path: string; label: string }[]> = {
  salud: [
    { path: "/gym", label: "Gimnasio" },
    { path: "/alimentacion", label: "Alimentación" },
  ],
  "fuerza-mental": [
    { path: "/chess", label: "Ajedrez" },
    { path: "/self-review", label: "Autocrítica" },
  ],
  proposito: [
    { path: "/life-alignment", label: "Alineación" },
    { path: "/vision", label: "Point B" },
    { path: "/plan-identidad", label: "Plan Identidad" },
  ],
  apariencia: [
    { path: "/morning-prep", label: "Alistamiento" },
  ],
  desarrollo: [
    { path: "/languages-dashboard", label: "Idiomas" },
    { path: "/reading-library", label: "Biblioteca" },
    { path: "/music-dashboard", label: "Música" },
  ],
  profesional: [
    { path: "/university", label: "Universidad" },
    { path: "/entrepreneurship", label: "Emprendimiento" },
    { path: "/projects", label: "Proyectos" },
  ],
  finanzas: [
    { path: "/finance", label: "Finanzas" },
  ],
  familia: [],
  amor: [
    { path: "/vida-social", label: "Vida Social" },
  ],
  ocio: [
    { path: "/chess", label: "Ajedrez" },
  ],
}

const SUB_AREA_GROUPS: Record<string, { label: string; subIds: string[] }[]> = {
  desarrollo: [
    { label: "Habilidades Valiosas", subIds: ["habilidades"] },
    { label: "Idiomas", subIds: ["ingles", "italiano"] },
    { label: "Hobbies", subIds: ["lectura", "piano", "guitarra", "ajedrez"] },
  ],
  profesional: [
    { label: "Universidad", subIds: ["universidad"] },
    { label: "Emprendimiento", subIds: ["siemprevende", "autec"] },
    { label: "Proyectos", subIds: ["proyectos"] },
  ],
}

const SECTION_CONFIG = [
  {
    key: "cimientos",
    title: "ÁREAS ESTRUCTURALES",
    subtitle: "Cimientos de tu vida — la base sobre la que construyes todo",
    icon: Anchor,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/20",
    badgeColor: "bg-blue-500/10 text-blue-600",
    progressColor: "bg-blue-500",
  },
  {
    key: "construccion",
    title: "ÁREAS CENTRALES",
    subtitle: "Construcción activa — donde pones tu energía para crecer",
    icon: Target,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/20",
    badgeColor: "bg-amber-500/10 text-amber-600",
    progressColor: "bg-amber-500",
  },
  {
    key: "recompensas",
    title: "ÁREAS DE RECOMPENSA",
    subtitle: "El resultado de tu esfuerzo — lo que disfrutas al construir",
    icon: Sparkles,
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/20",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    progressColor: "bg-emerald-500",
  },
]

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-500"
  if (score >= 40) return "text-amber-500"
  return "text-red-500"
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-red-500"
}

function AreaCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  )
}

export default function AreasDeVida() {
  const { timeframe, view } = useTimeframe()
  const { scores, averages, loading } = useAreaScores(timeframe, view)

  const wheelValues = scores.map((s) => Math.round(s.esfuerzo / 10))
  const wheelValues2 = scores.map((s) => Math.round(s.resultados / 10))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-8">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-64 w-full max-w-md mx-auto" />
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AreaCardSkeleton />
              <AreaCardSkeleton />
              <AreaCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-10">
      {/* Header */}
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">RUEDA DE LA VIDA</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Áreas de Vida
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Las 10 áreas que definen tu vida. Visualiza tu esfuerzo y resultados en cada una.
        </p>

        {/* Averages row */}
        {!loading && scores.length > 0 && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <span className="text-muted-foreground">Esfuerzo:</span>
              <span className={cn("font-bold", getScoreColor(averages.esfuerzo))}>
                {averages.esfuerzo}%
              </span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <span className="text-muted-foreground">Resultados:</span>
              <span className={cn("font-bold", getScoreColor(averages.resultados))}>
                {averages.resultados}%
              </span>
            </Badge>
          </div>
        )}
      </header>

      {/* Timeframe Selector */}
      <TimeframeSelector />

      {/* Wheel of Life */}
      <div className="max-w-md mx-auto">
        <WheelOfLife
          values={wheelValues}
          values2={wheelValues2}
          average={Math.round(averages.esfuerzo / 10)}
          average2={Math.round(averages.resultados / 10)}
          view={view}
        />
      </div>

      {/* Sections */}
      {SECTION_CONFIG.map((section) => {
        const sectionAreas = scores.filter((s) => s.group === section.key)
        if (sectionAreas.length === 0) return null
        const Icon = section.icon

        return (
          <section key={section.key} className="space-y-5">
            {/* Section Header */}
            <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r", section.color, section.border)}>
              <div className={cn("p-2 rounded-full", section.badgeColor)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-wide">{section.title}</h2>
                <p className="text-xs text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>

            {/* Areas Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sectionAreas.map((area) => (
                <AreaCard
                  key={area.id}
                  area={area}
                  links={AREA_LINKS[area.id] || []}
                  subGroups={SUB_AREA_GROUPS[area.id]}
                  progressColor={section.progressColor}
                  borderColor={section.border}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AreaCard({
  area,
  links,
  subGroups,
  progressColor,
  borderColor,
}: {
  area: {
    id: string
    label: string
    icon: string
    esfuerzo: number
    resultados: number
    sub: { id: string; label: string; esfuerzo: number; resultados: number; unit: string }[]
  }
  links: { path: string; label: string }[]
  subGroups?: { label: string; subIds: string[] }[]
  progressColor: string
  borderColor: string
}) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", borderColor)}>
      <CardHeader className={cn("pb-3 border-b", borderColor)}>
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="text-2xl">{area.icon}</span>
          <span>{area.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Effort */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Esfuerzo</span>
            <span className={cn("font-bold tabular-nums", getScoreColor(area.esfuerzo))}>
              {area.esfuerzo}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getScoreBg(area.esfuerzo))}
              style={{ width: `${area.esfuerzo}%` }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Resultados</span>
            <span className={cn("font-bold tabular-nums", getScoreColor(area.resultados))}>
              {area.resultados}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getScoreBg(area.resultados))}
              style={{ width: `${area.resultados}%` }}
            />
          </div>
        </div>

        {/* Sub-areas groups */}
        {subGroups && subGroups.length > 0 && (
          <div className="space-y-2 pt-1">
            {subGroups.map((group) => {
              const matchedSubs = area.sub.filter((s) => group.subIds.includes(s.id))
              if (matchedSubs.length === 0) return null
              return (
                <div key={group.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSubs.map((sub) => (
                      <Badge
                        key={sub.id}
                        variant="secondary"
                        className="text-[10px] font-normal gap-1"
                      >
                        <span>{sub.label}</span>
                        <span className={cn("font-bold", getScoreColor(sub.resultados))}>
                          {sub.resultados}%
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
              >
                <ExternalLink className="h-3 w-3" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
