import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";
import { HABIT_META } from "@/lib/areaSystemsMap";
import {
  formatTimeDisplay,
  parseTime,
  useRoutineBlocks,
  type RoutineBlock,
} from "@/hooks/useRoutineBlocks";
import { cn } from "@/lib/utils";

const SYSTEM_FALLBACK: Record<string, { emoji: string; name: string }> = {
  universidad: { emoji: "🎓", name: "Universidad" },
  emprendimiento: { emoji: "🚀", name: "Emprendimiento" },
  proyectos: { emoji: "📁", name: "Proyectos" },
  musica: { emoji: "🎸", name: "Música" },
  idiomas: { emoji: "🌍", name: "Idiomas" },
  ajedrez: { emoji: "♟️", name: "Ajedrez" },
  game: { emoji: "🎮", name: "Game" },
  lectura: { emoji: "📖", name: "Lectura" },
  finanzas: { emoji: "💰", name: "Finanzas" },
};

function systemsForBlock(block: RoutineBlock): string[] {
  const t = block.title.toLowerCase();

  if (t.includes("desactivacion"))
    return ["rutina-desactivacion", "habit-skincare-pm", "skincare-noche"];
  if (t.includes("sueno")) return ["horario-regular", "habit-sueno"];
  if (t.includes("activacion")) return ["rutina-activacion"];
  if (t.includes("gym") || t.includes("entrenamiento")) return ["gym", "pre-entreno"];
  if (t.includes("alistamiento") || t.includes("desayuno"))
    return ["alistamiento-desayuno", "desayuno", "banarme-vestirme", "skincare-manana"];
  if (t.includes("lectura")) return ["lectura"];
  if (t.includes("ajedrez") && t.includes("almuerzo")) return ["ajedrez", "almuerzo"];
  if (t.includes("ajedrez")) return ["ajedrez"];
  if (t.includes("almuerzo")) return ["almuerzo"];
  if (t.includes("comida") || t.includes("cena")) return ["comida"];
  if (t.includes("idiomas")) return ["idiomas"];
  if (t.includes("musica") || t.includes("piano") || t.includes("guitarra")) return ["musica"];
  if (t.includes("deep") || t.includes("focus") || t.includes("trabajo") || t.includes("bloque"))
    return ["universidad", "emprendimiento", "proyectos"];
  if (t.includes("ocio")) return [];
  return [];
}

function blockCovers(block: RoutineBlock, time: string): boolean {
  const start = parseTime(block.startTime);
  let end = parseTime(block.endTime);
  if (end <= start) end += 24 * 60;
  const target = parseTime(time);
  return target >= start && target < end;
}

function planSystems(block: RoutineBlock): string[] {
  const ids = systemsForBlock(block);
  if (blockCovers(block, "10:30") && !ids.includes("merienda-1")) ids.push("merienda-1");
  if (blockCovers(block, "17:00") && !ids.includes("merienda-2")) ids.push("merienda-2");
  return ids;
}

function blockRange(block: RoutineBlock): { start: number; end: number } {
  const start = parseTime(block.startTime);
  let end = parseTime(block.endTime);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

function chipFor(id: string) {
  const meta = HABIT_META[id];
  const fallback = SYSTEM_FALLBACK[id];
  const emoji = meta?.emoji ?? fallback?.emoji;
  const name = meta?.name ?? fallback?.name ?? id;
  return { id, emoji, name };
}

export function PlanSistemaSection() {
  const { blocks, isLoaded, routineInfo } = useRoutineBlocks();
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = useMemo(
    () => now.getHours() * 60 + now.getMinutes(),
    [now]
  );

  const status = useMemo(() => {
    let activeIndex = -1;
    let done = 0;
    for (let i = 0; i < safeBlocks.length; i++) {
      try {
        const { start, end } = blockRange(safeBlocks[i]);
        if (nowMinutes >= end) done++;
        if (nowMinutes >= start && nowMinutes < end && activeIndex === -1) activeIndex = i;
      } catch (e) {
        continue;
      }
    }
    return { activeIndex, done, total: safeBlocks.length };
  }, [safeBlocks, nowMinutes]);

  if (!isLoaded) return null;

  const currentBlock = status.activeIndex >= 0 ? safeBlocks[status.activeIndex] : null;
  const currentRange = currentBlock ? blockRange(currentBlock) : null;
  const currentPct = currentRange
    ? Math.round(
        Math.min(100, Math.max(0, ((nowMinutes - currentRange.start) / (currentRange.end - currentRange.start)) * 100))
      )
    : 0;

  const sleepChip = HABIT_META["horario-regular"];
  const sleepStart = routineInfo?.sleepTime ?? "22:30";

  return (
    <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-background to-background backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          📋 Plan Sistema
        </h2>
        {routineInfo && (
          <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[9px]">
            {routineInfo.icon} {routineInfo.label} · {routineInfo.wakeTime}–{routineInfo.sleepTime}
          </span>
        )}
        <span className="ml-auto text-[9px] font-semibold text-muted-foreground">
          {open ? "Ocultar" : "Ver"} plan
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap rounded-xl border border-border/60 bg-background/70 px-2.5 py-2 text-[9px]">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">
              🕒 Hora actual
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">
              {formatTimeDisplay(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)}
            </span>
            {currentBlock ? (
              <span className="text-muted-foreground font-medium">
                Estás en <b className="text-foreground">{currentBlock.title}</b> ({currentPct}%)
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">Fuera de la rutina</span>
            )}
            <span className="ml-auto font-semibold text-muted-foreground">
              Bloque {Math.min(status.done + 1, blocks.length)} de {blocks.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[9px] border border-border/60 rounded-xl bg-background/70 px-2.5 py-2">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">Sueño</span>
            <span className="px-2 py-0.5 rounded-lg bg-foreground/5 text-muted-foreground font-medium border border-border/60">
              {sleepChip.emoji} {sleepChip.name} · dormir antes de {sleepStart}
            </span>
          </div>

          <Progress
            value={blocks.length > 0 ? (status.done / blocks.length) * 100 : 0}
            className="h-1.5"
            indicatorClassName="bg-primary"
          />

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            No pienses en los sistemas: solo sigue cada bloque de la rutina. Cada bloque completa sus
            sistemas y al final del día todo queda hecho.
          </p>

          <ol className="space-y-1.5">
            {safeBlocks.map((block, index) => {
              const systems = planSystems(block);
              const { start, end } = blockRange(block);
              const past = nowMinutes >= end;
              const current = nowMinutes >= start && nowMinutes < end;
              const blockPct = current
                ? Math.round(Math.min(100, Math.max(0, ((nowMinutes - start) / (end - start)) * 100)))
                : 0;

              return (
                <li
                  key={block.id}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                    current
                      ? "border-primary bg-primary/10"
                      : past
                      ? "border-border/40 bg-background/40 opacity-60"
                      : "border-border/60 bg-background/70"
                  )}
                >
                  <span className="w-[68px] shrink-0 text-[9px] font-bold text-muted-foreground pt-0.5">
                    {formatTimeDisplay(block.startTime)}–{formatTimeDisplay(block.endTime)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {current && (
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-wide">
                          Ahora · {blockPct}%
                        </span>
                      )}
                      {past && (
                        <span className="text-[10px] font-bold text-emerald-500 shrink-0">✓</span>
                      )}
                      <span
                        className={cn(
                          "text-[11px] font-semibold truncate",
                          current ? "text-primary" : past ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {block.title}
                      </span>
                    </div>
                    {systems.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {systems.map(id => {
                          const chip = chipFor(id);
                          return (
                            <span
                              key={id}
                              className={cn(
                                "px-2 py-0.5 rounded-lg text-[9px] font-medium border",
                                current
                                  ? "bg-background/80 border-primary/30 text-primary"
                                  : "bg-foreground/5 border-border/60 text-muted-foreground"
                              )}
                            >
                              {chip.emoji} {chip.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/70 font-medium">
                        🧘 Descanso libre · sin sistema
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}