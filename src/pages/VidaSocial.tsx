import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVidaSocial } from '@/hooks/useVidaSocial';
import { Heart, Users, Sparkles, Plus, Trash2, Star, Calendar, Hotel, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VidaSocial() {
  const {
    eventos, citas, intimidad, loading,
    agregarEvento, eliminarEvento,
    agregarCita, eliminarCita,
    agregarIntimidad, eliminarIntimidad,
    getStatsMes,
  } = useVidaSocial();

  const [citaDialog, setCitaDialog] = useState(false);
  const [nuevaCita, setNuevaCita] = useState({ persona: '', lugar: '', rating: 3, notas: '' });
  const [eventoDialog, setEventoDialog] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({ tipo: 'amigos', con_quien: '', descripcion: '', gasto: 0, rating: 3, notas: '' });
  const [intimidadDialog, setIntimidadDialog] = useState(false);
  const [nuevaIntimidad, setNuevaIntimidad] = useState({ calidad: 3, posiciones: '', notas: '' });

  const stats = getStatsMes();

  const handleAddCita = async () => {
    if (!nuevaCita.persona) return;
    await agregarCita({ fecha: new Date().toISOString().split('T')[0], ...nuevaCita });
    setCitaDialog(false);
    setNuevaCita({ persona: '', lugar: '', rating: 3, notas: '' });
  };

  const handleAddEvento = async () => {
    const conQuienArray = nuevoEvento.con_quien.split(',').map(s => s.trim()).filter(Boolean);
    await agregarEvento({
      fecha: new Date().toISOString().split('T')[0],
      tipo: nuevoEvento.tipo as any,
      con_quien: conQuienArray,
      descripcion: nuevoEvento.descripcion,
      gasto: nuevoEvento.gasto,
      rating: nuevoEvento.rating,
      notas: nuevoEvento.notas,
    });
    setEventoDialog(false);
    setNuevoEvento({ tipo: 'amigos', con_quien: '', descripcion: '', gasto: 0, rating: 3, notas: '' });
  };

  const handleAddIntimidad = async () => {
    const posArray = nuevaIntimidad.posiciones.split(',').map(s => s.trim()).filter(Boolean);
    await agregarIntimidad({
      fecha: new Date().toISOString().split('T')[0],
      calidad: nuevaIntimidad.calidad,
      posiciones: posArray,
      notas: nuevaIntimidad.notas,
    });
    setIntimidadDialog(false);
    setNuevaIntimidad({ calidad: 3, posiciones: '', notas: '' });
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Vida Social y Romance
        </h1>
        <p className="text-muted-foreground mt-1">Citas, amigos, experiencias e intimidad</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCitas}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalEventos}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Intimidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalIntimidad}</p>
            <p className="text-xs text-muted-foreground">veces este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.posicionesUnicas.length}</p>
            <p className="text-xs text-muted-foreground">únicas este mes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="citas">
        <TabsList>
          <TabsTrigger value="citas"><Heart className="h-4 w-4 mr-2" />Citas</TabsTrigger>
          <TabsTrigger value="amigos"><Users className="h-4 w-4 mr-2" />Amigos</TabsTrigger>
          <TabsTrigger value="intimidad"><Sparkles className="h-4 w-4 mr-2" />Intimidad</TabsTrigger>
        </TabsList>

        <TabsContent value="citas" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{citas.length} citas registradas</p>
            <Dialog open={citaDialog} onOpenChange={setCitaDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nueva Cita</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Cita</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input value={nuevaCita.persona} onChange={e => setNuevaCita(p => ({ ...p, persona: e.target.value }))} placeholder="Nombre de la persona" />
                  <Input value={nuevaCita.lugar} onChange={e => setNuevaCita(p => ({ ...p, lugar: e.target.value }))} placeholder="Lugar" />
                  <div>
                    <label className="text-xs text-muted-foreground">Rating</label>
                    <Select value={String(nuevaCita.rating)} onValueChange={v => setNuevaCita(p => ({ ...p, rating: +v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea value={nuevaCita.notas} onChange={e => setNuevaCita(p => ({ ...p, notas: e.target.value }))} placeholder="Notas..." />
                  <Button onClick={handleAddCita} className="w-full">Guardar Cita ❤️</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {citas.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❤️</div>
                  <div>
                    <p className="font-semibold">{c.persona}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(c.fecha), 'd MMM yyyy', { locale: es })} {c.lugar && `· ${c.lugar}`}
                    </p>
                    <div className="flex mt-1">{renderStars(c.rating)}</div>
                    {c.notas && <p className="text-xs text-muted-foreground mt-1">{c.notas}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => eliminarCita(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {citas.length === 0 && <p className="text-center text-muted-foreground py-8">No hay citas registradas aún</p>}
        </TabsContent>

        <TabsContent value="amigos" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{eventos.length} experiencias</p>
            <Dialog open={eventoDialog} onOpenChange={setEventoDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nueva Experiencia</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Experiencia</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Select value={nuevoEvento.tipo} onValueChange={v => setNuevoEvento(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigos">Amigos</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="fiesta">Fiesta</SelectItem>
                      <SelectItem value="experiencia">Experiencia</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={nuevoEvento.con_quien} onChange={e => setNuevoEvento(p => ({ ...p, con_quien: e.target.value }))} placeholder="Con quién (separado por coma)" />
                  <Input value={nuevoEvento.descripcion} onChange={e => setNuevoEvento(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción" />
                  <Input type="number" value={nuevoEvento.gasto} onChange={e => setNuevoEvento(p => ({ ...p, gasto: +e.target.value }))} placeholder="Gasto ($)" />
                  <Select value={String(nuevoEvento.rating)} onValueChange={v => setNuevoEvento(p => ({ ...p, rating: +v }))}>
                    <SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea value={nuevoEvento.notas} onChange={e => setNuevoEvento(p => ({ ...p, notas: e.target.value }))} placeholder="Notas..." />
                  <Button onClick={handleAddEvento} className="w-full">Guardar 🎉</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {eventos.map(e => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {e.tipo === 'hotel' ? '🏨' : e.tipo === 'fiesta' ? '🎉' : e.tipo === 'experiencia' ? '✨' : '👥'}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{e.tipo} {e.descripcion && `· ${e.descripcion}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.fecha), 'd MMM yyyy', { locale: es })}
                      {e.con_quien && Array.isArray(e.con_quien) && e.con_quien.length > 0 && ` · con ${e.con_quien.join(', ')}`}
                      {e.gasto > 0 && ` · $${e.gasto}`}
                    </p>
                    <div className="flex mt-1">{renderStars(e.rating)}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => eliminarEvento(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {eventos.length === 0 && <p className="text-center text-muted-foreground py-8">No hay experiencias registradas aún</p>}
        </TabsContent>

        <TabsContent value="intimidad" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {intimidad.length} registros · Calidad promedio: {stats.promedioCalidad}/5
              {stats.posicionesUnicas.length > 0 && ` · ${stats.posicionesUnicas.length} posiciones diferentes`}
            </p>
            <Dialog open={intimidadDialog} onOpenChange={setIntimidadDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Registrar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Intimidad</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Select value={String(nuevaIntimidad.calidad)} onValueChange={v => setNuevaIntimidad(p => ({ ...p, calidad: +v }))}>
                    <SelectTrigger><SelectValue placeholder="Calidad" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'🔥'.repeat(n)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={nuevaIntimidad.posiciones} onChange={e => setNuevaIntimidad(p => ({ ...p, posiciones: e.target.value }))} placeholder="Posiciones (separadas por coma)" />
                  <Textarea value={nuevaIntimidad.notas} onChange={e => setNuevaIntimidad(p => ({ ...p, notas: e.target.value }))} placeholder="Notas..." />
                  <Button onClick={handleAddIntimidad} className="w-full">Guardar 🔥</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {intimidad.map(i => (
            <Card key={i.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔞</div>
                  <div>
                    <p className="font-semibold">
                      {format(new Date(i.fecha), 'd MMM yyyy', { locale: es })}
                      <span className="ml-2">{'🔥'.repeat(i.calidad)}</span>
                    </p>
                    {i.posiciones && Array.isArray(i.posiciones) && i.posiciones.length > 0 && (
                      <p className="text-xs text-muted-foreground">Posiciones: {i.posiciones.join(', ')}</p>
                    )}
                    {i.notas && <p className="text-xs text-muted-foreground mt-1">{i.notas}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => eliminarIntimidad(i.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {intimidad.length === 0 && <p className="text-center text-muted-foreground py-8">No hay registros aún</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
