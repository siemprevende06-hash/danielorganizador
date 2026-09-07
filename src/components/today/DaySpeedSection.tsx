import { Card, CardContent } from "@/components/ui/card";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { useAreaCovers, coverKey } from "@/hooks/useAreaCovers";
import { useSystemSpeed } from "@/hooks/useSystemSpeed";
import { DAY_SYSTEMS, type DaySystem } from "@/lib/daySystems";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

export function SystemSpeedCell({ system }: { system: DaySystem }) {
  const { getSpeed, setSpeed } = useSystemSpeed();
  const level = getSpeed(system.id);
  const covers = useAreaCovers();
  const coverUrl = covers.covers[coverKey(system.cover.type, system.cover.id)] ?? null;

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/40">
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn("w-7 h-7 rounded-lg overflow-hidden relative bg-gradient-to-br shrink-0", getCoverGradient(system.cover.id))}>
          {coverUrl ? (
            <img src={coverUrl} alt={system.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-sm">🖼️</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{system.name}</p>
          <p className="text-[9px] text-muted-foreground">
            ~{system.speedOptions.find(o => o.id === level)?.minutes} min
          </p>
          {system.streakMinutes > 0 && (
            <p className="text-[9px] flex items-center gap-1 mt-0.5">
              <span className={system.streakMinutes >= 30 ? "text-yellow-600" : "text-orange-500"}>
                {system.streakMinutes >= 30 ? "🏆" : "🔥"}
              </span>
              <span className="text-muted-foreground">Salvar racha {system.streakMinutes}'</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {system.speedOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSpeed(system.id, opt.id)}
            className={cn(
              "px-2 py-1 rounded-lg text-[9px] font-medium transition-all border",
              level === opt.id
                ? opt.id === "minimo"
                  ? "bg-blue-500 text-white border-blue-500"
                  : opt.id === "maximo"
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-amber-500 text-white border-amber-500"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-foreground/30"
            )}
          >
            {opt.label === "Extra" ? "Extra" : opt.label === "Mín" ? "Mín" : "Máx"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DaySpeedSection() {
  const centralAreas = DAY_SYSTEMS.filter(a => a.kind === "central");

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-amber-500" /> Velocidad de Sistemas
          <span className="text-[9px] text-muted-foreground font-normal">
            — define la meta de minutos de cada sistema
          </span>
        </h2>
        <div className="space-y-4">
          {centralAreas.map(area => (
            <div key={area.id} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {area.name}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {area.systems.map(sys => (
                  <SystemSpeedCell key={sys.id} system={sys} />
                ))}
              </div>
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground px-1">
            La opción marcada se guarda (localStorage) y se usa en la vista Sistemas como tiempo máximo (verde). Extra suma un bloque de 60 min; los minutos reales los registras en la vista Sistemas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}