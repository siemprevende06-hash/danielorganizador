import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  sostenPercent: number;
  mejoraPercent: number;
  focoPercent: number;
}

export function VisionAntiVisionPanel({ sostenPercent, mejoraPercent, focoPercent }: Props) {
  // Visión activa = promedio de las 3 áreas
  const visionPower = Math.round((sostenPercent + mejoraPercent + focoPercent) / 3);
  const antiVisionPower = 100 - visionPower;

  const visionActive = visionPower >= 50;

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="p-4 md:p-5 bg-gradient-to-br from-primary/5 via-background to-destructive/5">
        <div className="text-center mb-4">
          <h3 className="text-lg md:text-xl font-bold mb-1">⚖️ Balance Visión vs Anti-Visión</h3>
          <p className="text-xs text-muted-foreground">
            Tus 3 áreas se conectan: lo que haces hoy define quién serás
          </p>
        </div>

        {/* Las 3 fuerzas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-muted-foreground mb-1">Sostén</div>
            <div className="text-lg font-bold text-blue-500">{sostenPercent}%</div>
            <div className="text-[10px] text-muted-foreground">Te mantiene</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-xs text-muted-foreground mb-1">Mejora</div>
            <div className="text-lg font-bold text-purple-500">{mejoraPercent}%</div>
            <div className="text-[10px] text-muted-foreground">Te transforma</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-xs text-muted-foreground mb-1">Foco</div>
            <div className="text-lg font-bold text-amber-500">{focoPercent}%</div>
            <div className="text-[10px] text-muted-foreground">Te avanza</div>
          </div>
        </div>

        {/* Barra visual visión vs anti-visión */}
        <div className="relative h-12 rounded-xl overflow-hidden border-2 border-border mb-3">
          <div className="absolute inset-0 flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-primary transition-all duration-700 flex items-center justify-end pr-3"
              style={{ width: `${visionPower}%` }}
            >
              {visionPower > 15 && (
                <div className="flex items-center gap-1 text-xs font-bold text-white drop-shadow">
                  <Sparkles className="h-3 w-3" />
                  {visionPower}%
                </div>
              )}
            </div>
            <div
              className="bg-gradient-to-l from-destructive to-orange-500 transition-all duration-700 flex items-center pl-3"
              style={{ width: `${antiVisionPower}%` }}
            >
              {antiVisionPower > 15 && (
                <div className="flex items-center gap-1 text-xs font-bold text-white drop-shadow">
                  {antiVisionPower}%
                  <AlertTriangle className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje según activación */}
        <div className={cn(
          "p-3 rounded-lg border-2 text-center transition-all",
          visionActive
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-destructive/10 border-destructive/30"
        )}>
          {visionActive ? (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-500">
                🌟 Tu Visión está activándose. Sigue así.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                ⚠️ Tu Anti-Visión está ganando terreno. Actúa ahora.
              </p>
            </div>
          )}
        </div>

        {/* Conexión visual */}
        <div className="mt-4 grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground">
          <div>🛡️ Base sólida</div>
          <div>🚀 Crecimiento</div>
          <div>🎯 Resultados</div>
        </div>
      </div>
    </Card>
  );
}
