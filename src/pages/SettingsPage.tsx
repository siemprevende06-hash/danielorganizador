import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, BookOpen, Save, CloudUpload, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { syncAll, type SyncReport } from '@/lib/dataSync';
import { getTimeUnit, setTimeUnit as persistTimeUnit, type TimeUnit } from '@/lib/timeUnit';
import { getSetting, setSetting } from '@/lib/settings';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { toast } = useToast();
  const [booksPerMonth, setBooksPerMonth] = useState(2);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(() => getTimeUnit());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSetting<{ books_per_month?: number }>('reading_goals');
      if (data) {
        setBooksPerMonth(data.books_per_month || 2);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReadingGoals = async () => {
    try {
      const ok = await setSetting('reading_goals', { books_per_month: booksPerMonth });
      if (!ok) throw new Error('No se pudo guardar');
      toast({ title: 'Configuración guardada' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-24"><p className="text-muted-foreground">Cargando...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración
        </h1>
        <p className="text-muted-foreground">Ajusta los parámetros de cada área</p>
      </header>

      {/* Unidades de tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Unidades de tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="time-unit">Indicadores de Semana · Mes · Trimestre · Año</Label>
            <div className="inline-flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/40">
              {(['min', 'h'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => { setTimeUnit(u); persistTimeUnit(u); }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    timeUnit === u ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {u === 'min' ? 'Minutos' : 'Horas'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los anillos del panel de control en las páginas Semana, Mes, Trimestre y Año muestran minutaje
              en la unidad que elijas. Se aplica al instante, sin recargar.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Lectura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="books-per-month">Cantidad de libros al mes</Label>
            <div className="flex items-center gap-3">
              <Input
                id="books-per-month"
                type="number"
                min={1}
                max={10}
                value={booksPerMonth}
                onChange={(e) => setBooksPerMonth(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">libros/mes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Este valor se usará como objetivo en la página de Lectura
            </p>
          </div>
          <Button onClick={saveReadingGoals}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </CardContent>
      </Card>

      {/* Data Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CloudUpload className="h-5 w-5" />
            Sincronización de Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tus datos están actualmente en el navegador (localStorage). 
            Sincronízalos con la nube (Supabase) para que el Inicio y otras pantallas 
            muestren datos reales.
          </p>

          <Button
            onClick={async () => {
              setSyncing(true);
              try {
                const report = await syncAll();
                setLastSyncReport(report);
                if (report.totalFailed === 0) {
                  toast({ title: 'Sincronización completa', description: `${report.totalSuccess} registros sincronizados` });
                } else {
                  toast({ title: 'Sincronización parcial', description: `${report.totalSuccess} ok, ${report.totalFailed} fallos`, variant: 'destructive' });
                }
              } catch (err) {
                toast({ title: 'Error', description: 'No se pudo sincronizar', variant: 'destructive' });
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="w-full gap-2"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            {syncing ? 'Sincronizando...' : 'Sincronizar datos locales → Nube'}
          </Button>

          {lastSyncReport && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">
                Última sincronización: {new Date(lastSyncReport.timestamp).toLocaleTimeString()}
              </p>
              <div className="space-y-1">
                {lastSyncReport.results.map(r => (
                  <div key={r.table} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{r.table}</span>
                    <span className={r.success ? 'text-green-500' : 'text-red-500'}>
                      {r.success ? (
                        <><CheckCircle2 className="h-3 w-3 inline mr-1" />{r.count} registros</>
                      ) : (
                        <><XCircle className="h-3 w-3 inline mr-1" />{r.error || 'falló'}</>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-700">
              <strong>Nota:</strong> La sincronización envía tus datos de localStorage a Supabase. 
              No elimina datos locales. Después de sincronizar, recarga la página para ver los cambios en el Inicio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
