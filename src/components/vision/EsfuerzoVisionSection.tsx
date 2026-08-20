import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MIRROR_AREAS, useEsfuerzoIslas } from "@/hooks/useEsfuerzoIslas";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useVisionBalance } from "@/hooks/useVisionBalance";
import { EsfuerzoIslas } from "@/components/mapa/EsfuerzoIslas";
import { VisionAntiVisionPanel } from "@/components/systems/VisionAntiVisionPanel";
import type { MapaNode } from "@/hooks/useMapaDeVida";

const formatTotal = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function EsfuerzoVisionSection() {
  const { islands, totalMinutes } = useEsfuerzoIslas();
  const { averages, loading: scoresLoading } = useAreaScores("month", "ambos");
  const { sostenPercent, mejoraPercent, focoPercent, dailyPercent } = useVisionBalance();

  const areaNodes: MapaNode[] = useMemo(() => {
    const maxMinutes = Math.max(1, ...islands.map((i) => i.minutes));
    const positions = MIRROR_AREAS.map((_, i) =>
      Math.round(110 + (i * (1200 - 220)) / (MIRROR_AREAS.length - 1))
    );
    return MIRROR_AREAS.map((area, i) => {
      const minutes = islands[i]?.minutes ?? 0;
      return {
        id: area.id,
        kind: "area",
        label: area.label,
        icon: area.icon,
        x: positions[i],
        y: 62,
        r: 17,
        score: Math.round((minutes / maxMinutes) * 100),
        score2: 0,
        minutes,
      };
    });
  }, [islands]);

  const resultsDirection = !scoresLoading && averages.resultados >= averages.esfuerzo;
  const visionActive = dailyPercent >= 50;

  return (
    <section className="space-y-4" id="esfuerzo-vision">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <Flame className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary text-sm">ESFUERZO · TU REALIDAD DIARIA</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
          Lo que haces cada día y tus resultados te acercan a tu Visión o a tu Anti-Visión
        </p>
      </header>

      <div className="relative">
        <EsfuerzoIslas
          islands={islands}
          totalMinutes={totalMinutes}
          areaNodes={areaNodes}
          selectedAreaId={null}
          onSelectArea={() => {}}
        />
        {totalMinutes === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
            <p className="text-xs text-muted-foreground px-4 text-center">
              Planifica tu rutina para ver tu esfuerzo repartido por áreas
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VisionAntiVisionPanel
            sostenPercent={sostenPercent}
            mejoraPercent={mejoraPercent}
            focoPercent={focoPercent}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold">🌱 Resultados acumulados</h3>
                <p className="text-[10px] text-muted-foreground">Últimos 30 días</p>
              </div>
              {!scoresLoading && (
                <div
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1",
                    resultsDirection ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {resultsDirection
                    ? (<><TrendingUp className="h-3 w-3" /> en alza</>)
                    : (<><TrendingDown className="h-3 w-3" /> por construir</>)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Esfuerzo</span>
                  <span className="font-bold">{scoresLoading ? "—" : `${averages.esfuerzo}%`}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-700"
                    style={{ width: `${scoresLoading ? 0 : averages.esfuerzo}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Resultados</span>
                  <span className="font-bold">{scoresLoading ? "—" : `${averages.resultados}%`}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${scoresLoading ? 0 : averages.resultados}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              {scoresLoading
                ? "Calculando tus resultados..."
                : resultsDirection
                ? "Tus resultados confirman tu dirección: te acercas a tu Visión."
                : "Tu esfuerzo aún no se refleja en resultados. Sigue sumando en tus áreas."}
            </p>
          </Card>

          <Card className="p-4 border-2 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚖️</span>
              <h3 className="text-sm font-bold">Hoy te acercas a tu…</h3>
            </div>
            <div className={cn(
              "p-3 rounded-xl text-center border-2",
              visionActive
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-destructive/10 border-destructive/30"
            )}>
              <p className={cn("text-xl font-bold", visionActive ? "text-emerald-500" : "text-destructive")}>
                {visionActive ? "🌟 VISIÓN" : "⚠️ ANTI-VISIÓN"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {visionActive
                  ? `Día completo: ${dailyPercent}% de tus 3 fuerzas activas`
                  : `Solo ${dailyPercent}% de tus 3 fuerzas activas hoy`}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Sostén ({sostenPercent}%) · Mejora ({mejoraPercent}%) · Foco ({focoPercent}%) · {formatTotal(totalMinutes)} de rutina
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}