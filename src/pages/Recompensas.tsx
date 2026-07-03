import { useState } from "react"
import { useRecompensas } from "@/hooks/useRecompensas"
import { RECOMPENSAS, CATEGORIAS } from "@/data/recompensas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTimeframe } from "@/contexts/TimeframeContext"
import { TimeframeSelector } from "@/components/TimeframeSelector"
import {
  Sparkles, ShoppingCart, History, Trophy, TrendingUp,
  Gamepad2, Star, Gift, ScrollText, Coins,
} from "lucide-react"

export default function Recompensas() {
  const { timeframe, view } = useTimeframe()
  const {
    balance, canjes, scores, scoresLoading,
    puntosGanadosHoy, puntosGastadosHoy, canjearRecompensa,
  } = useRecompensas()
  const [filtro, setFiltro] = useState<string | null>(null)
  const [mostrarCanjes, setMostrarCanjes] = useState(false)

  const recompensasFiltradas = filtro
    ? RECOMPENSAS.filter((r) => r.categoria === filtro)
    : RECOMPENSAS

  const totalGastado = canjes.reduce((sum, c) => sum + c.costo, 0)

  const handleCanjear = (id: string) => {
    const exito = canjearRecompensa(id)
    if (exito) {
      toast({ title: "🎉 Recompensa canjeada", description: "¡Disfrútala! Te lo has ganado." })
    } else {
      toast({ title: "❌ Puntos insuficientes", description: "Sigue esforzándote para ganar más puntos.", variant: "destructive" })
    }
  }

  if (scoresLoading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-8">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-32 w-full max-w-md mx-auto" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      {/* Header */}
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-amber-500">RECOMPENSAS</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          Tienda de Recompensas
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Acumula puntos con tu esfuerzo diario y cámbialos por ocio y recompensas.
        </p>
      </header>

      {/* Timeframe Selector */}
      <TimeframeSelector />

      {/* Balance Card */}
      <div className="max-w-md mx-auto">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground">Tu saldo</span>
              </div>
              <Badge variant="outline" className="gap-1">
                <History className="h-3 w-3" />
                {totalGastado} gastados
              </Badge>
            </div>
            <div className="text-center">
              <span className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {balance}
              </span>
              <span className="text-xl text-muted-foreground ml-2">pts</span>
            </div>
            <div className="flex justify-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-green-500 font-bold">+{puntosGanadosHoy}</p>
                <p className="text-muted-foreground text-xs">hoy</p>
              </div>
              <div className="text-center">
                <p className="text-red-500 font-bold">-{puntosGastadosHoy}</p>
                <p className="text-muted-foreground text-xs">gastados hoy</p>
              </div>
              <div className="text-center">
                <p className="text-amber-500 font-bold">{scores.length > 0 ? Math.round(scores.reduce((s, a) => s + a.esfuerzo, 0) / scores.length) : 0}%</p>
                <p className="text-muted-foreground text-xs">esfuerzo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card className="border-amber-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Puntos por área
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scores.map((area) => {
            const pct = area.esfuerzo
            return (
              <div key={area.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{area.icon}</span>
                    <span>{area.label}</span>
                  </span>
                  <span className={cn(
                    "font-bold tabular-nums text-xs",
                    pct >= 70 ? "text-green-500" : pct >= 40 ? "text-amber-500" : "text-red-500"
                  )}>
                    {pct} pts
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filtro === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltro(null)}
          className="gap-1.5"
        >
          <Gift className="h-4 w-4" />
          Todas
        </Button>
        {CATEGORIAS.map((cat) => (
          <Button
            key={cat.key}
            variant={filtro === cat.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro(cat.key)}
            className="gap-1.5"
          >
            <span>{cat.icono}</span>
            {cat.label}
          </Button>
        ))}
        <Button
          variant={mostrarCanjes ? "default" : "outline"}
          size="sm"
          onClick={() => setMostrarCanjes(!mostrarCanjes)}
          className="gap-1.5 ml-auto"
        >
          <ScrollText className="h-4 w-4" />
          Historial
        </Button>
      </div>

      {/* Content */}
      {mostrarCanjes ? (
        /* Redemption History */
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Historial de canjes
          </h2>
          {canjes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aún no has canjeado ninguna recompensa</p>
                <p className="text-sm">¡Sigue esforzándote para ganar puntos!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {canjes.map((canje) => (
                <Card key={canje.id} className="border-amber-500/10">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{canje.icono}</span>
                      <div>
                        <p className="font-medium text-sm">{canje.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(canje.fecha).toLocaleDateString("es-ES", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-red-500 font-bold">
                      -{canje.costo} pts
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Rewards Grid */
        <>
          {CATEGORIAS.map((cat) => {
            const items = recompensasFiltradas.filter((r) => r.categoria === cat.key)
            if (items.length === 0) return null
            return (
              <section key={cat.key} className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>{cat.icono}</span>
                  {cat.label}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((recompensa) => {
                    const puedeCanjear = balance >= recompensa.costo
                    return (
                      <Card
                        key={recompensa.id}
                        className={cn(
                          "transition-all hover:shadow-md",
                          puedeCanjear ? "border-amber-500/20" : "opacity-60"
                        )}
                      >
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="text-3xl">{recompensa.icono}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "font-bold",
                                puedeCanjear ? "text-amber-500" : "text-muted-foreground"
                              )}
                            >
                              {recompensa.costo} pts
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{recompensa.nombre}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{recompensa.descripcion}</p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full gap-1.5"
                            variant={puedeCanjear ? "default" : "outline"}
                            disabled={!puedeCanjear}
                            onClick={() => handleCanjear(recompensa.id)}
                          >
                            <Gift className="h-4 w-4" />
                            {puedeCanjear ? "Canjear" : `Faltan ${recompensa.costo - balance} pts`}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}

      {/* Footer */}
      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Trophy className="h-3 w-3" />
          Sigue trabajando en tus áreas para ganar más puntos
          <Sparkles className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}
