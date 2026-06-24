import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useNecesidades } from '@/hooks/useNecesidades';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, Target, Sparkles } from 'lucide-react';

const AREA_LINKS: Record<string, string> = {
  goals: '/goals',
  finance: '/finance',
  'vida-social': '/vida-social',
  boxeo: '/boxeo',
  vision: '/life-alignment',
};

const NEED_EMOJIS: Record<string, string> = {
  moto: '🏍️',
  dinero: '💰',
  novia: '❤️',
  amigos: '🎉',
  intimidad: '🔞',
  boxeo: '🥊',
  exito: '🧭',
};

export default function MisNecesidades() {
  const { necesidades, loading, actualizarProgreso, getProgresoGeneral } = useNecesidades();
  const navigate = useNavigate();

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

  const progresoGeneral = getProgresoGeneral();

  const getColorByProgreso = (p: number) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-amber-500';
    if (p >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (p: number) => {
    if (p >= 80) return '✅ Satisfecha';
    if (p >= 50) return '🔄 En camino';
    if (p >= 20) return '⚠️ Insuficiente';
    return '❌ Insatisfecha';
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          Mis 7 Necesidades
        </h1>
        <p className="text-muted-foreground mt-1">De necesidad insatisfecha a realidad vivida</p>
      </header>

      <Card className="bg-gradient-to-r from-primary/10 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso General
            </h2>
            <Badge variant="outline" className="text-base px-3 py-1">{progresoGeneral}%</Badge>
          </div>
          <Progress value={progresoGeneral} className="h-4" />
          <p className="text-xs text-muted-foreground mt-2">
            {progresoGeneral >= 80 ? '🔥 Viviendo tu mejor vida' :
             progresoGeneral >= 50 ? '💪 Buen progreso, sigue así' :
             progresoGeneral >= 20 ? '🚀 Tiempo de acelerar' :
             '🎯 Empieza hoy, un paso a la vez'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {necesidades.map(n => (
          <Card key={n.necesidad_id} className={`overflow-hidden border-l-4 ${getColorByProgreso(n.progreso).replace('bg-', 'border-l-')}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{NEED_EMOJIS[n.necesidad_id] || n.icono}</span>
                  <div>
                    <h3 className="font-bold text-lg">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground">{n.descripcion}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{getStatusText(n.progreso)}</Badge>
              </div>

              <Progress value={n.progreso} className="h-3 mb-2" />
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold">{n.progreso}%</span>
                <div className="flex gap-1">
                  {[25, 50, 75, 100].map(marker => (
                    <button
                      key={marker}
                      onClick={() => actualizarProgreso(n.necesidad_id, marker)}
                      className={`text-xs px-2 py-0.5 rounded ${
                        n.progreso >= marker
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {marker}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={n.progreso}
                  onChange={e => actualizarProgreso(n.necesidad_id, +e.target.value)}
                  className="h-8 w-20 text-sm"
                />
                {AREA_LINKS[n.area_referencia] && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate(AREA_LINKS[n.area_referencia])}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Ir a {n.area_referencia === 'goals' ? 'Metas' :
                           n.area_referencia === 'finance' ? 'Finanzas' :
                           n.area_referencia === 'vida-social' ? 'Vida Social' :
                           n.area_referencia === 'boxeo' ? 'Boxeo' :
                           n.area_referencia === 'vision' ? 'Alineación' : n.area_referencia}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Cada necesidad tiene su propia página. Usa los botones "Ir a..." para trabajar en cada una.
            Actualiza el progreso manualmente aquí o déjalo reflejar automáticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
