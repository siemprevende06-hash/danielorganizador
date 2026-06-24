import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBoxeo } from '@/hooks/useBoxeo';
import { Dumbbell, Plus, Flame, Target, Clock, Activity, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BoxeoPage() {
  const {
    tecnicas, sesiones, loading,
    seedTecnicas, actualizarDominio,
    agregarSesion, eliminarSesion,
    getNivelGeneral, getSesionesEstaSemana,
  } = useBoxeo();

  const [sesionDialog, setSesionDialog] = useState(false);
  const [nuevaSesion, setNuevaSesion] = useState({
    tipo: 'saco',
    duracion_minutos: 30,
    rounds: 3,
    intensidad: 'media',
    tecnicas_practicadas: '[]',
    notas: '',
  });

  const nivelGeneral = getNivelGeneral();
  const niveles = ['', '🥊 Principiante', '🥊 Intermedio', '🥊 Avanzado', '🥊 Experto', '🥊 Maestro'];
  const sesionesSemana = getSesionesEstaSemana();

  const handleAddSesion = async () => {
    const tecnicasArray = nuevaSesion.tecnicas_practicadas
      ? nuevaSesion.tecnicas_practicadas.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    await agregarSesion({
      fecha: new Date().toISOString().split('T')[0],
      tipo: nuevaSesion.tipo as any,
      duracion_minutos: nuevaSesion.duracion_minutos,
      rounds: nuevaSesion.rounds,
      intensidad: nuevaSesion.intensidad as any,
      tecnicas_practicadas: tecnicasArray,
      notas: nuevaSesion.notas,
    });
    setSesionDialog(false);
    setNuevaSesion({ tipo: 'saco', duracion_minutos: 30, rounds: 3, intensidad: 'media', tecnicas_practicadas: '[]', notas: '' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const categoriaColor = (cat: string) => {
    switch (cat) {
      case 'basico': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'intermedio': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'avanzado': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Dumbbell className="h-8 w-8" />
            Boxeo Técnico
          </h1>
          <p className="text-muted-foreground mt-1">Progresión de habilidades y sesiones de entrenamiento</p>
        </div>
        <div className="text-right">
          <Badge className="text-lg px-4 py-2">{niveles[nivelGeneral]}</Badge>
        </div>
      </header>

      {tecnicas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No hay técnicas de boxeo cargadas aún</p>
            <Button onClick={seedTecnicas}><Zap className="mr-2 h-4 w-4" />Cargar técnicas predefinidas</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tecnicas">
        <TabsList>
          <TabsTrigger value="tecnicas"><Target className="h-4 w-4 mr-2" />Técnicas</TabsTrigger>
          <TabsTrigger value="sesiones"><Activity className="h-4 w-4 mr-2" />Sesiones</TabsTrigger>
          <TabsTrigger value="stats"><BarChartIcon className="h-4 w-4 mr-2" />Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="tecnicas" className="space-y-4 mt-4">
          {['basico', 'intermedio', 'avanzado'].map(cat => {
            const filtradas = tecnicas.filter(t => t.categoria === cat);
            if (filtradas.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2 capitalize">{cat}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtradas.map(t => (
                    <Card key={t.id} className={`border-l-4 ${t.nivel_dominio >= 80 ? 'border-l-green-500' : t.nivel_dominio >= 40 ? 'border-l-amber-500' : 'border-l-muted'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{t.nombre}</h4>
                            <p className="text-xs text-muted-foreground">{t.descripcion}</p>
                          </div>
                          <Badge variant="outline" className={categoriaColor(t.categoria)}>
                            {t.categoria}
                          </Badge>
                        </div>
                        <Progress value={t.nivel_dominio} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Dominio: {t.nivel_dominio}%</span>
                          <span>Nivel req: {t.nivel_requerido}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => actualizarDominio(t.id, Math.min(100, t.nivel_dominio + 10))}>
                            +10%
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => actualizarDominio(t.id, Math.max(0, t.nivel_dominio - 10))}>
                            -10%
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="sesiones" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{sesiones.length} sesiones registradas</p>
            <Dialog open={sesionDialog} onOpenChange={setSesionDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nueva Sesión</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Sesión de Boxeo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={nuevaSesion.tipo} onValueChange={v => setNuevaSesion(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saco">Saco</SelectItem>
                      <SelectItem value="sombra">Sombra</SelectItem>
                      <SelectItem value="sparring">Sparring</SelectItem>
                      <SelectItem value="bolsa">Bolsa</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Duración (min)</label>
                      <Input type="number" value={nuevaSesion.duracion_minutos} onChange={e => setNuevaSesion(p => ({ ...p, duracion_minutos: +e.target.value }))} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Rounds</label>
                      <Input type="number" value={nuevaSesion.rounds} onChange={e => setNuevaSesion(p => ({ ...p, rounds: +e.target.value }))} />
                    </div>
                  </div>
                  <Select value={nuevaSesion.intensidad} onValueChange={v => setNuevaSesion(p => ({ ...p, intensidad: v }))}>
                    <SelectTrigger><SelectValue placeholder="Intensidad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>
                    <label className="text-xs text-muted-foreground">Técnicas practicadas (separadas por coma)</label>
                    <Input value={nuevaSesion.tecnicas_practicadas} onChange={e => setNuevaSesion(p => ({ ...p, tecnicas_practicadas: e.target.value }))} placeholder="jab, cross, hook" />
                  </div>
                  <Textarea value={nuevaSesion.notas} onChange={e => setNuevaSesion(p => ({ ...p, notas: e.target.value }))} placeholder="Notas..." />
                  <Button onClick={handleAddSesion} className="w-full">Guardar Sesión</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sesiones.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{s.tipo === 'saco' ? '🥊' : s.tipo === 'sombra' ? '👻' : s.tipo === 'sparring' ? '🤼' : '💪'}</div>
                  <div>
                    <p className="font-semibold capitalize">{s.tipo} · {s.duracion_minutos}min</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.fecha), 'd MMM', { locale: es })} · {s.rounds} rounds · {s.intensidad}
                    </p>
                    {s.tecnicas_practicadas && Array.isArray(s.tecnicas_practicadas) && s.tecnicas_practicadas.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">Técnicas: {s.tecnicas_practicadas.join(', ')}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => eliminarSesion(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {sesiones.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay sesiones registradas. ¡Empieza hoy!</p>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Esta Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sesionesSemana.length} sesiones</p>
                <p className="text-xs text-muted-foreground">{sesionesSemana.reduce((s, s2) => s + s2.duracion_minutos, 0)} min totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Total Sesiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sesiones.length}</p>
                <p className="text-xs text-muted-foreground">desde que empezaste</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Técnicas Dominadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tecnicas.filter(t => t.nivel_dominio >= 80).length}/{tecnicas.length}</p>
                <Progress value={tecnicas.length > 0 ? (tecnicas.filter(t => t.nivel_dominio >= 80).length / tecnicas.length) * 100 : 0} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}
