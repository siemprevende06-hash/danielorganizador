import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAreaScores, AreaScore } from '@/hooks/useAreaScores';
import { usePhysicalTracking } from '@/hooks/usePhysicalTracking';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePersonalLists } from '@/hooks/usePersonalLists';
import type { Timeframe } from '@/contexts/TimeframeContext';
import {
  HeartPulse, Brain, Sparkles, Briefcase, BookOpen, Users, Heart, Gamepad2,
  Camera, Target, Timer, Trophy, DollarSign
} from 'lucide-react';
import danielFlaco from '@/assets/daniel-flaco.jpg';
import danielFuerte from '@/assets/daniel-fuerte.jpg';

type Version = 'actual' | 'comodidad';

const AREA_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  salud: { bar: 'bg-gradient-to-r from-emerald-500 to-green-400', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'fuerza-mental': { bar: 'bg-gradient-to-r from-violet-500 to-purple-400', text: 'text-violet-500', bg: 'bg-violet-500/10' },
  apariencia: { bar: 'bg-gradient-to-r from-rose-500 to-pink-400', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  profesional: { bar: 'bg-gradient-to-r from-sky-500 to-blue-400', text: 'text-sky-500', bg: 'bg-sky-500/10' },
  desarrollo: { bar: 'bg-gradient-to-r from-amber-500 to-yellow-400', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  familia: { bar: 'bg-gradient-to-r from-orange-500 to-amber-400', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  amor: { bar: 'bg-gradient-to-r from-red-500 to-rose-400', text: 'text-red-500', bg: 'bg-red-500/10' },
  ocio: { bar: 'bg-gradient-to-r from-cyan-500 to-teal-400', text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  finanzas: { bar: 'bg-gradient-to-r from-yellow-500 to-lime-400', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const AREA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  salud: HeartPulse,
  'fuerza-mental': Brain,
  apariencia: Sparkles,
  profesional: Briefcase,
  desarrollo: BookOpen,
  familia: Users,
  amor: Heart,
  ocio: Gamepad2,
  finanzas: DollarSign,
};

const LIST_AREA_MAP: Record<string, string> = {
  salud_bienestar: 'salud',
  fuerza_mental: 'fuerza-mental',
  apariencia: 'apariencia',
  desarrollo_personal: 'desarrollo',
  profesional_academico: 'profesional',
  finanzas: 'finanzas',
  amor_romance: 'amor',
  familia_amistad: 'familia',
  ocio_experiencias: 'ocio',
};

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function AreaScoreRow({ label, icon: Icon, value, color }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <StatBar value={value} color={color} />
      <span className="text-xs font-bold w-9 text-right shrink-0">{value}%</span>
    </div>
  );
}

function AreaCard({ area, listProgress }: {
  area: AreaScore;
  listProgress?: { lists: number; done: number; total: number };
}) {
  const color = AREA_COLORS[area.id] || AREA_COLORS.salud;
  const Icon = AREA_ICONS[area.id] || Target;
  const visibleSubs = area.sub.slice(0, 4);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Card className="h-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn("p-1.5 rounded-lg", color.bg, color.text)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{area.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <AreaScoreRow label="Esfuerzo" icon={Timer} value={area.esfuerzo} color={color.bar} />
              <AreaScoreRow label="Resultados" icon={Trophy} value={area.resultados} color="bg-gradient-to-r from-green-500 to-lime-400" />
            </div>
            <div className="space-y-1.5 pt-2 border-t">
              {visibleSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground truncate">{sub.label}</span>
                  <span className="text-[11px] font-semibold shrink-0">
                    {sub.esfuerzo}% / {sub.resultados}%
                  </span>
                </div>
              ))}
            </div>
            {listProgress && listProgress.total > 0 && (
              <div className="pt-2 border-t flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Tus listas
                </span>
                <span className="text-[11px] font-semibold">
                  {listProgress.done}/{listProgress.total} tareas · {listProgress.lists} lista{listProgress.lists !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogContent className="w-[94vw] max-w-4xl h-[90vh] flex flex-col gap-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <span className={cn("p-2 rounded-xl", color.bg, color.text)}>
              <Icon className="h-6 w-6" />
            </span>
            {area.label}
          </DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  Esfuerzo
                </span>
                <span className="text-3xl font-extrabold">{area.esfuerzo}%</span>
              </div>
              <StatBar value={area.esfuerzo} color={color.bar} />
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  Resultados
                </span>
                <span className="text-3xl font-extrabold">{area.resultados}%</span>
              </div>
              <StatBar value={area.resultados} color="bg-gradient-to-r from-green-500 to-lime-400" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Desglose por sub-área</p>
            <div className="space-y-3">
              {area.sub.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay sub-áreas con datos.</p>
              )}
              {area.sub.map((sub) => (
                <div key={sub.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{sub.label}</span>
                    <span className="text-xs text-muted-foreground">
                      Esf {sub.esfuerzo}% · Res {sub.resultados}%
                      {sub.minutes > 0 && ` · ${sub.minutes} min`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <StatBar value={sub.esfuerzo} color={color.bar} />
                    </div>
                    <div className="flex-1">
                      <StatBar value={sub.resultados} color="bg-gradient-to-r from-green-500 to-lime-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {listProgress && listProgress.total > 0 && (
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Tus listas
              </span>
              <span className="text-sm font-semibold">
                {listProgress.done}/{listProgress.total} tareas en {listProgress.lists} lista{listProgress.lists !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PhotoCard({ version, latestPhoto, startPhotoUrl, targetPhotoUrl, onUpload }: {
  version: Version;
  latestPhoto: string | null;
  startPhotoUrl: string | null;
  targetPhotoUrl: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isActual = version === 'actual';

  const mainSrc = isActual
    ? latestPhoto || startPhotoUrl || danielFlaco
    : targetPhotoUrl || danielFuerte;

  const referenceSrc = isActual
    ? targetPhotoUrl || danielFuerte
    : latestPhoto || startPhotoUrl || danielFlaco;

  const mainLabel = isActual ? 'Versión Actual' : 'Versión Comodidad';
  const referenceLabel = isActual ? 'Meta (referencia)' : 'Hoy';

  return (
    <Card className="h-full">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative w-32 h-44 md:w-36 md:h-48 rounded-lg overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
            <img src={mainSrc} alt={mainLabel} className="w-full h-full object-cover object-top" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <span className="text-white text-[10px] font-medium">{mainLabel}</span>
            </div>
          </div>
          <div className="relative w-20 h-28 md:w-24 md:h-32 rounded-lg overflow-hidden border-2 border-muted shadow-md opacity-90">
            <img src={referenceSrc} alt={referenceLabel} className="w-full h-full object-cover object-top" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
              <span className="text-white text-[9px] font-medium">{referenceLabel}</span>
            </div>
          </div>
        </div>
        <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
          <Camera className="h-4 w-4" />
          Subir foto del día
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </CardContent>
    </Card>
  );
}

function PhotoTimeline({ photos }: { photos: { url: string; date: string }[] }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        Sube una foto cada día para ver tu evolución aquí
      </div>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {photos.map((p, i) => (
        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-14 h-20 rounded-lg overflow-hidden border">
            <img src={p.url} alt={p.date} className="w-full h-full object-cover object-top" />
          </div>
          <span className="text-[10px] text-muted-foreground">{p.date}</span>
        </div>
      ))}
    </div>
  );
}

const ObjetivoPrioritario = () => {
  const [version, setVersion] = useState<Version>('actual');
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [stats, setStats] = useState({
    startWeight: 50,
    currentWeight: 50,
    targetWeight: 70,
    startPhotoUrl: null as string | null,
    targetPhotoUrl: null as string | null,
  });

  const { measurements, isLoading, getStats, reload } = usePhysicalTracking();
  const { scores, loading: scoresLoading } = useAreaScores(timeframe, 'esfuerzo');
  const { uploadImage, uploading } = useImageUpload();
  const { lists, tasks } = usePersonalLists();

  useEffect(() => {
    const load = async () => {
      const s = await getStats();
      setStats({
        startWeight: s.startWeight,
        currentWeight: s.currentWeight,
        targetWeight: s.targetWeight,
        startPhotoUrl: s.startPhotoUrl,
        targetPhotoUrl: s.targetPhotoUrl,
      });
    };
    if (!isLoading) load();
  }, [isLoading, getStats, measurements]);

  const dailyPhotos = useMemo(
    () =>
      (measurements || [])
        .filter(m => m.front_photo_url)
        .map(m => ({
          url: m.front_photo_url as string,
          date: m.measurement_date.slice(5).replace('-', '/'),
        })),
    [measurements]
  );

  const latestPhoto = dailyPhotos[0]?.url || null;

  const byId = useMemo(() => {
    const map: Record<string, AreaScore> = {};
    scores.forEach(a => { map[a.id] = a; });
    return map;
  }, [scores]);

  const listProgress = useMemo(() => {
    const map: Record<string, { lists: number; done: number; total: number }> = {};
    for (const list of lists) {
      const areaId = LIST_AREA_MAP[list.area_id];
      if (!areaId) continue;
      if (!map[areaId]) map[areaId] = { lists: 0, done: 0, total: 0 };
      map[areaId].lists += 1;
      const listTasks = tasks.filter(t => t.list_id === list.id);
      map[areaId].total += listTasks.length;
      map[areaId].done += listTasks.filter(t => t.completed).length;
    }
    return map;
  }, [lists, tasks]);

  const coreAreas = ['salud', 'fuerza-mental', 'apariencia']
    .map(id => byId[id])
    .filter(Boolean) as AreaScore[];
  const sideLeft = byId['profesional'];
  const sideRight = byId['desarrollo'];
  const financeArea = byId['finanzas'];
  const socialAreas = ['familia', 'amor', 'ocio']
    .map(id => byId[id])
    .filter(Boolean) as AreaScore[];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    const url = await uploadImage(file, 'physical-daily');
    if (url) {
      await reload();
      const s = await getStats();
      setStats({
        startWeight: s.startWeight,
        currentWeight: s.currentWeight,
        targetWeight: s.targetWeight,
        startPhotoUrl: s.startPhotoUrl,
        targetPhotoUrl: s.targetPhotoUrl,
      });
    }
    e.target.value = '';
  };

  const emptyArea: AreaScore = {
    id: '',
    label: '—',
    icon: '❓',
    group: '',
    esfuerzo: 0,
    resultados: 0,
    sub: [],
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Objetivo Prioritario
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50">
              {(['actual', 'comodidad'] as Version[]).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVersion(v)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                    version === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === 'actual' ? 'Versión Actual' : 'Versión Comodidad'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50">
            {TIMEFRAMES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={cn(
                  "px-4 py-1 rounded-full text-xs font-semibold transition-all",
                  timeframe === t.id ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {(!scoresLoading && coreAreas.length > 0) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coreAreas.map(area => (
                <AreaCard key={area.id} area={area} listProgress={listProgress[area.id]} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <div className="flex flex-col">
                {sideLeft ? (
                  <AreaCard area={sideLeft} listProgress={listProgress[sideLeft.id]} />
                ) : (
                  <AreaCard area={emptyArea} />
                )}
              </div>

              <div className="flex flex-col gap-4 w-full">
                <PhotoCard
                  version={version}
                  latestPhoto={latestPhoto}
                  startPhotoUrl={stats.startPhotoUrl}
                  targetPhotoUrl={stats.targetPhotoUrl}
                  onUpload={handlePhotoUpload}
                />

                {financeArea ? (
                  <AreaCard area={financeArea} listProgress={listProgress['finanzas']} />
                ) : (
                  <AreaCard area={emptyArea} />
                )}
              </div>

              <div className="flex flex-col">
                {sideRight ? (
                  <AreaCard area={sideRight} listProgress={listProgress[sideRight.id]} />
                ) : (
                  <AreaCard area={emptyArea} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {socialAreas.map(area => (
                <AreaCard key={area.id} area={area} listProgress={listProgress[area.id]} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-sm text-muted-foreground">
            {scoresLoading ? 'Cargando estadísticas...' : 'Sin datos disponibles'}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Camera className="h-4 w-4 text-primary" />
              Línea de tiempo física
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoTimeline photos={dailyPhotos} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObjetivoPrioritario;