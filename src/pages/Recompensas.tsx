import { useState } from "react"
import { useRecompensas } from "@/hooks/useRecompensas"
import { CATEGORIAS, type Recompensa } from "@/data/recompensas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTimeframe } from "@/contexts/TimeframeContext"
import { TimeframeSelector } from "@/components/TimeframeSelector"
import {
  Sparkles, ShoppingCart, History, Trophy, TrendingUp,
  Gift, ScrollText, Coins, Plus, Pencil, Trash2,
} from "lucide-react"

type FormData = {
  nombre: string
  descripcion: string
  icono: string
  costo: number
  categoria: string
}

const emptyForm: FormData = { nombre: "", descripcion: "", icono: "🎁", costo: 0, categoria: "ocio" }

export default function Recompensas() {
  const { timeframe, view } = useTimeframe()
  const {
    balance, canjes, scores, scoresLoading, dailyScore, catalogo,
    puntosGanadosHoy, puntosGastadosHoy,
    canjearRecompensa, agregarRecompensa, editarRecompensa, eliminarRecompensa,
  } = useRecompensas()
  const [filtro, setFiltro] = useState<string | null>(null)
  const [mostrarCanjes, setMostrarCanjes] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  const recompensasFiltradas = filtro
    ? catalogo.filter((r) => r.categoria === filtro)
    : catalogo

  const totalGastado = canjes.reduce((sum, c) => sum + c.costo, 0)

  function abrirNueva() {
    setEditandoId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function abrirEditar(r: Recompensa) {
    setEditandoId(r.id)
    setForm({ nombre: r.nombre, descripcion: r.descripcion, icono: r.icono, costo: r.costo, categoria: r.categoria })
    setDialogOpen(true)
  }

  function guardar() {
    if (!form.nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" })
      return
    }
    if (form.costo <= 0) {
      toast({ title: "El costo debe ser mayor a 0", variant: "destructive" })
      return
    }

    if (editandoId) {
      editarRecompensa(editandoId, form as Partial<Omit<Recompensa, "id">>)
      toast({ title: "Recompensa actualizada" })
    } else {
      agregarRecompensa(form as Omit<Recompensa, "id">)
      toast({ title: "Recompensa creada" })
    }
    setDialogOpen(false)
  }

  function confirmarEliminar(id: string, nombre: string) {
    if (window.confirm(`¿Eliminar "${nombre}"?`)) {
      eliminarRecompensa(id)
      toast({ title: "Recompensa eliminada" })
    }
  }

  const handleCanjear = (id: string) => {
    const exito = canjearRecompensa(id)
    if (exito) {
      toast({ title: "Recompensa canjeada", description: "¡Disfrútala! Te lo has ganado." })
    } else {
      toast({ title: "Puntos insuficientes", description: "Sigue esforzándote para ganar más puntos.", variant: "destructive" })
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
                <p className="text-amber-500 font-bold">{dailyScore.loading ? "..." : `${dailyScore.total}`}</p>
                <p className="text-muted-foreground text-xs">pts hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Composition */}
      <Card className="border-amber-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Composición del puntaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total del día */}
          <div className="text-center pb-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground">Puntaje de hoy</span>
            <div className="text-3xl font-bold text-amber-500">
              {dailyScore.loading ? "..." : `${dailyScore.total} pts`}
            </div>
          </div>

          {/* Sosten */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>🔄</span>
                <span className="font-medium">Sosten</span>
                <span className="text-[10px] text-muted-foreground">10%</span>
              </span>
              <span className="font-bold tabular-nums text-xs text-green-500">
                {dailyScore.sosten}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${dailyScore.sosten}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Hábitos y rutinas cumplidas</p>
          </div>

          {/* Acumulativos */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>📈</span>
                <span className="font-medium">Acumulativos</span>
                <span className="text-[10px] text-muted-foreground">40%</span>
              </span>
              <span className="font-bold tabular-nums text-xs text-blue-500">
                {dailyScore.acumulativos}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${dailyScore.acumulativos}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Gym, idiomas, lectura, ajedrez, piano, guitarra</p>
          </div>

          {/* Focus */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>🎯</span>
                <span className="font-medium">Focus</span>
                <span className="text-[10px] text-muted-foreground">50%</span>
              </span>
              <span className="font-bold tabular-nums text-xs text-purple-500">
                {dailyScore.focus}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${dailyScore.focus}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Universidad, emprendimiento, proyectos</p>
          </div>

          {/* Formula hint */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-muted-foreground">
              Sosten × 10% + Acumulativos × 40% + Focus × 50%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
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
          className="gap-1.5"
        >
          <ScrollText className="h-4 w-4" />
          Historial
        </Button>
        <Button size="sm" onClick={abrirNueva} className="gap-1.5 ml-auto">
          <Plus className="h-4 w-4" />
          Nueva
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
                          "transition-all hover:shadow-md relative group",
                          puedeCanjear ? "border-amber-500/20" : "opacity-60"
                        )}
                      >
                        {/* Edit/Delete buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => abrirEditar(recompensa)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => confirmarEliminar(recompensa.id, recompensa.nombre)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar recompensa" : "Nueva recompensa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: 1 hora de gaming"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe la recompensa..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icono">Icono (emoji)</Label>
                <Input
                  id="icono"
                  value={form.icono}
                  onChange={(e) => setForm({ ...form, icono: e.target.value })}
                  placeholder="🎮"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costo">Costo (puntos)</Label>
                <Input
                  id="costo"
                  type="number"
                  min={1}
                  value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.icono} {cat.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="otro">🌍 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar}>{editandoId ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
