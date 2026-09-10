import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAreaScores, type AreaScore } from '@/hooks/useAreaScores';
import { usePhysicalTracking } from '@/hooks/usePhysicalTracking';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePersonalLists, type PersonalList, type PersonalListTask } from '@/hooks/usePersonalLists';
import { useAreaCovers, coverKey } from '@/hooks/useAreaCovers';
import { AreaCover, getCoverGradient } from '@/components/areas/AreaCover';
import { SubAreaCard } from '@/components/areas/SubAreaCard';
import type { Timeframe } from '@/contexts/TimeframeContext';
import { POINT_B_AREAS } from '@/data/pointB2027';
import {
  Camera, Target, Timer, Trophy, CheckCircle2, Circle, ListChecks
} from 'lucide-react';
import danielFlaco from '@/assets/daniel-flaco.jpg';
import danielFuerte from '@/assets/daniel-fuerte.jpg';

type Version = 'actual' | 'comodidad';

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
          <div className="relative w-28 h-40 md:w-32 md:h-44 rounded-lg overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
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

function ActualAreaCard({
  area, coverUrl, getSubCover, uploading, onUploadCover, busySubId, onSubUploadCover, listProgress,
}: {
  area: AreaScore;
  coverUrl: string | null;
  getSubCover: (id: string) => string | null | undefined;
  uploading: boolean;
  onUploadCover: (file: File) => void;
  busySubId: string | null;
  onSubUploadCover: (id: string, file: File) => void;
  listProgress?: { lists: number; done: number; total: number };
}) {
  const gradient = getCoverGradient(area.id);
  const pointBArea = POINT_B_AREAS.find(a => a.id === area.id);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <AreaCover
        cover={coverUrl}
        gradient={gradient}
        label={area.label}
        icon={pointBArea?.icon}
        showCamera
        uploading={uploading}
        onUpload={onUploadCover}
        className="h-28"
      />
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Timer className="h-3 w-3" />
              Esfuerzo
            </div>
            <span className="text-2xl font-extrabold">{area.esfuerzo}%</span>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Trophy className="h-3 w-3" />
              Resultados
            </div>
            <span className="text-2xl font-extrabold">{area.resultados}%</span>
          </div>
        </div>

        {area.sub.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sub-áreas</p>
            <div className="space-y-2">
              {area.sub.map(sub => (
                <SubAreaCard
                  key={sub.id}
                  data={sub}
                  getCover={getSubCover}
                  showCamera
                  getUploading={(id) => busySubId === coverKey('sub', id)}
                  onUploadCover={onSubUploadCover}
                />
              ))}
            </div>
          </div>
        )}

        {listProgress && listProgress.total > 0 && (
          <div className="rounded-lg border p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              Tus listas
            </span>
            <span className="text-xs font-semibold">
              {listProgress.done}/{listProgress.total} tareas · {listProgress.lists} lista{listProgress.lists !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComodidadAreaCard({
  area, lists, tasks,
}: {
  area: AreaScore;
  lists: PersonalList[];
  tasks: PersonalListTask[];
}) {
  const gradient = getCoverGradient(area.id);
  const pointBArea = POINT_B_AREAS.find(a => a.id === area.id);
  const areaLists = lists.filter(l => LIST_AREA_MAP[l.area_id] === area.id);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <AreaCover
        gradient={gradient}
        label={area.label}
        icon={pointBArea?.icon}
        className="h-28"
      />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            PUNTO DE REFERENCIA
          </span>
        </div>

        {areaLists.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Crea listas en "Mi Lista Personal" para ver tus metas aquí
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {areaLists.map(list => {
              const listTasks = tasks.filter(t => t.list_id === list.id);
              const roots = listTasks.filter(t => !t.parent_id);
              const done = roots.filter(t => t.completed).length;
              const pct = roots.length ? Math.round((done / roots.length) * 100) : 0;

              return (
                <Card key={list.id} className="overflow-hidden">
                  {list.cover_image_url ? (
                    <img
                      src={list.cover_image_url}
                      alt={`Portada de ${list.title}`}
                      loading="lazy"
                      className="h-16 w-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-full bg-muted flex items-center justify-center">
                      <ListChecks className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3 space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm leading-tight truncate">{list.title}</h4>
                      {list.sub_area && (
                        <p className="text-[10px] text-muted-foreground">{list.sub_area}</p>
                      )}
                    </div>

                    {list.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{list.description}</p>
                    )}

                    {roots.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{done}/{roots.length} tareas</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    )}

                    <div className="space-y-1">
                      {roots.slice(0, 4).map(t => (
                        <div key={t.id} className="flex items-center gap-1.5">
                          {t.completed
                            ? <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                            : <Circle className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <span className={cn(
                            'text-[11px] truncate',
                            t.completed && 'line-through text-muted-foreground'
                          )}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                      {roots.length > 4 && (
                        <p className="text-[10px] text-muted-foreground pl-4.5">
                          +{roots.length - 4} más
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
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
  const { covers, saveCover } = useAreaCovers();
  const [busyCover, setBusyCover] = useState<string | null>(null);

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

  const handleUploadCover = async (type: 'area' | 'sub', id: string, file: File) => {
    const key = coverKey(type, id);
    setBusyCover(key);
    try {
      const url = await uploadImage(file, 'area-covers');
      if (url) await saveCover(type, id, url);
    } finally {
      setBusyCover(null);
    }
  };

  const getSubCover = (id: string) => covers[coverKey('sub', id)] ?? null;

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

        {version === 'actual' && (
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
        )}

        {(!scoresLoading && coreAreas.length > 0) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coreAreas.map(area =>
                version === 'actual' ? (
                  <ActualAreaCard
                    key={area.id}
                    area={area}
                    coverUrl={covers[coverKey('area', area.id)] ?? null}
                    getSubCover={getSubCover}
                    uploading={busyCover === coverKey('area', area.id)}
                    onUploadCover={(file) => handleUploadCover('area', area.id, file)}
                    busySubId={busyCover}
                    onSubUploadCover={(id, file) => handleUploadCover('sub', id, file)}
                    listProgress={listProgress[area.id]}
                  />
                ) : (
                  <ComodidadAreaCard
                    key={area.id}
                    area={area}
                    lists={lists}
                    tasks={tasks}
                  />
                )
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              <div className="flex flex-col">
                {sideLeft ? (
                  version === 'actual' ? (
                    <ActualAreaCard
                      area={sideLeft}
                      coverUrl={covers[coverKey('area', sideLeft.id)] ?? null}
                      getSubCover={getSubCover}
                      uploading={busyCover === coverKey('area', sideLeft.id)}
                      onUploadCover={(file) => handleUploadCover('area', sideLeft.id, file)}
                      busySubId={busyCover}
                      onSubUploadCover={(id, file) => handleUploadCover('sub', id, file)}
                      listProgress={listProgress[sideLeft.id]}
                    />
                  ) : (
                    <ComodidadAreaCard area={sideLeft} lists={lists} tasks={tasks} />
                  )
                ) : (
                  <Card className="h-full flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  </Card>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full justify-center">
                <PhotoCard
                  version={version}
                  latestPhoto={latestPhoto}
                  startPhotoUrl={stats.startPhotoUrl}
                  targetPhotoUrl={stats.targetPhotoUrl}
                  onUpload={handlePhotoUpload}
                />

                {financeArea ? (
                  version === 'actual' ? (
                    <ActualAreaCard
                      area={financeArea}
                      coverUrl={covers[coverKey('area', financeArea.id)] ?? null}
                      getSubCover={getSubCover}
                      uploading={busyCover === coverKey('area', financeArea.id)}
                      onUploadCover={(file) => handleUploadCover('area', financeArea.id, file)}
                      busySubId={busyCover}
                      onSubUploadCover={(id, file) => handleUploadCover('sub', id, file)}
                      listProgress={listProgress['finanzas']}
                    />
                  ) : (
                    <ComodidadAreaCard area={financeArea} lists={lists} tasks={tasks} />
                  )
                ) : (
                  <Card className="h-full flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  </Card>
                )}
              </div>

              <div className="flex flex-col">
                {sideRight ? (
                  version === 'actual' ? (
                    <ActualAreaCard
                      area={sideRight}
                      coverUrl={covers[coverKey('area', sideRight.id)] ?? null}
                      getSubCover={getSubCover}
                      uploading={busyCover === coverKey('area', sideRight.id)}
                      onUploadCover={(file) => handleUploadCover('area', sideRight.id, file)}
                      busySubId={busyCover}
                      onSubUploadCover={(id, file) => handleUploadCover('sub', id, file)}
                      listProgress={listProgress[sideRight.id]}
                    />
                  ) : (
                    <ComodidadAreaCard area={sideRight} lists={lists} tasks={tasks} />
                  )
                ) : (
                  <Card className="h-full flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  </Card>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {socialAreas.map(area =>
                version === 'actual' ? (
                  <ActualAreaCard
                    key={area.id}
                    area={area}
                    coverUrl={covers[coverKey('area', area.id)] ?? null}
                    getSubCover={getSubCover}
                    uploading={busyCover === coverKey('area', area.id)}
                    onUploadCover={(file) => handleUploadCover('area', area.id, file)}
                    busySubId={busyCover}
                    onSubUploadCover={(id, file) => handleUploadCover('sub', id, file)}
                    listProgress={listProgress[area.id]}
                  />
                ) : (
                  <ComodidadAreaCard
                    key={area.id}
                    area={area}
                    lists={lists}
                    tasks={tasks}
                  />
                )
              )}
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
