import { useMemo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Gauge, Plus, Target, X } from "lucide-react";
import { SPEED_PLAN_SYSTEMS } from "@/lib/daySystems";
import {
  autoSystemForBlock,
  blockDurationMinutes,
  blockFocusOf,
  clearBlockFocus,
  clearBlockPlan,
  describeBlockFocus,
  describeSystemMinutes,
  fragmentFocusOf,
  focusForSystem,
  fragmentSlots,
  isDeepWorkBlock,
  isExtraBlock,
  isFragmentableBlock,
  isProfessionalFocusSystem,
  minutesBetween,
  parseTimeToMinutes,
  setFragmentBlock,
  setFragmentSystem,
  setWholeBlock,
  showSpeedPlanControl,
  type BlockFocus,
  type SpeedBlockLike,
  type SpeedPlan,
  type SpeedPlanFragment,
  type SpeedState,
} from "@/lib/speedPlan";

const STATE_CLS: Record<SpeedState, string> = {
  "sin-plan": "border-border/50 text-muted-foreground",
  "sin-dosis": "border-red-400/50 text-red-500",
  racha: "border-rose-400/50 text-rose-500",
  minimo: "border-blue-400/50 text-blue-500",
  maximo: "border-green-500/50 text-green-600",
  extra: "border-amber-500/50 text-amber-600",
};

interface Props {
  block: SpeedBlockLike;
  nextBlock?: SpeedBlockLike;
  plan: SpeedPlan;
  onChange: (next: SpeedPlan) => void;
  compact?: boolean;
  /**
   * Selector de enfoque (asignatura/tema, emprendimiento o proyecto).
   * En Deep Work y Focus el sistema se deduce del enfoque; en el Bloque Extra
   * solo aparece cuando el sistema elegido es profesional.
   */
  renderFocus?: (fragment?: SpeedPlanFragment) => ReactNode;
}

function systemName(systemId: string): string {
  return SPEED_PLAN_SYSTEMS.find(system => system.id === systemId)?.name ?? systemId;
}

function DoseLine({ entries }: { entries: { systemId: string; minutes: number }[] }) {
  const grouped = useMemo(() => {
    const result = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.systemId || entry.systemId === "none" || entry.minutes <= 0) continue;
      result.set(entry.systemId, (result.get(entry.systemId) ?? 0) + entry.minutes);
    }
    return [...result.entries()];
  }, [entries]);

  if (grouped.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 pt-0.5">
      {grouped.map(([systemId, minutes]) => {
        const dose = describeSystemMinutes(systemId, minutes);
        if (!dose) return null;
        return (
          <Badge
            key={systemId}
            variant="outline"
            className={cn("text-[8px] h-4 px-1 font-medium", STATE_CLS[dose.state])}
          >
            {dose.name} {minutes}′ · {dose.label}
          </Badge>
        );
      })}
    </div>
  );
}

function FocusLine({ focus }: { focus: BlockFocus }) {
  const summary = describeBlockFocus(focus);
  if (!summary) return null;
  return (
    <p
      className="truncate pl-[78px] text-[8px] leading-tight text-muted-foreground"
      title={summary.secondary ? `${summary.primary} · ${summary.secondary}` : summary.primary}
    >
      <span className="font-medium text-foreground/80">{summary.primary}</span>
      {summary.secondary ? <span> · {summary.secondary}</span> : null}
    </p>
  );
}

export function BlockSpeedPlanControl({
  block,
  nextBlock,
  plan,
  onChange,
  compact,
  renderFocus,
}: Props) {
  const fragmentable = isFragmentableBlock(block);
  const entry = plan.blocks[block.id];
  const isFragments = entry?.kind === "fragments";
  const fragments: SpeedPlanFragment[] = isFragments ? entry.fragments : [];
  const auto = autoSystemForBlock(block);
  const wholeValue = entry?.kind === "whole" ? entry.systemId : auto ?? "none";
  const slots = fragmentSlots(block, nextBlock);
  // Deep Work/Focus integran el enfoque; el sistema ya no se elige a mano.
  const focusMode = isDeepWorkBlock(block) && Boolean(renderFocus);

  if (!showSpeedPlanControl(block)) return null;

  const wholeSystem = entry?.kind === "whole" && entry.systemId !== "none" ? entry.systemId : "";

  const setWhole = (systemId: string) => {
    onChange(setWholeBlock(plan, block.id, systemId));
  };

  const startFragments = () => {
    const fallbackSystem = fragments.find(fragment => fragment.systemId)?.systemId
      ?? (focusMode ? wholeSystem : wholeValue !== "none" ? wholeValue : "");
    const initial = slots.map((slot, index) => ({
      id: `${block.id}-f${Date.now()}-${index}`,
      start: slot.start,
      end: slot.end,
      systemId: fallbackSystem,
    }));
    onChange(setFragmentBlock(plan, block.id, initial));
  };

  const backToWhole = () => {
    const systemId = fragments.find(fragment => fragment.systemId)?.systemId
      || (focusMode ? wholeSystem : wholeValue !== "none" ? wholeValue : "none");
    onChange(setWholeBlock(plan, block.id, systemId || "none"));
  };

  const updateFragment = (fragmentId: string, systemId: string) => {
    onChange(setFragmentSystem(plan, block.id, fragmentId, systemId));
  };

  const addFragment = () => {
    const slot = slots.find(
      candidate => !fragments.some(fragment => fragment.start === candidate.start && fragment.end === candidate.end),
    );
    if (!slot) return;
    const fallbackSystem =
      [...fragments].reverse().find(fragment => fragment.systemId)?.systemId
      ?? (focusMode ? wholeSystem : wholeValue !== "none" ? wholeValue : "");
    onChange(
      setFragmentBlock(plan, block.id, [
        ...fragments,
        {
          id: `${block.id}-f${Date.now()}`,
          start: slot.start,
          end: slot.end,
          systemId: fallbackSystem,
        },
      ]),
    );
  };

  const removeFragment = (fragmentId: string) => {
    const next = fragments.filter(fragment => fragment.id !== fragmentId);
    if (next.length === 0) {
      onChange(clearBlockPlan(plan, block.id));
      return;
    }
    onChange(setFragmentBlock(plan, block.id, next));
  };

  const clearPlan = () => {
    onChange(clearBlockPlan(clearBlockFocus(plan, block.id), block.id));
  };

  const absorbsBreak =
    isFragments &&
    fragments.some(fragment => parseTimeToMinutes(fragment.end) > parseTimeToMinutes(block.endTime));

  const toggle = fragmentable ? (
    <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted">
      <button
        type="button"
        onClick={backToWhole}
        className={cn(
          "px-2 py-0.5 rounded-md text-[9px] font-medium transition-all",
          !isFragments ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        Entero
      </button>
      <button
        type="button"
        onClick={startFragments}
        className={cn(
          "px-2 py-0.5 rounded-md text-[9px] font-medium transition-all",
          isFragments ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        )}
      >
        Fragmentar
      </button>
    </div>
  ) : null;

  const wholeLegacySystem =
    entry?.kind === "whole" &&
    entry.systemId !== "none" &&
    !isProfessionalFocusSystem(entry.systemId);

  if (focusMode) {
    return (
      <div
        className={cn(
          "mt-2 rounded-xl border border-dashed border-border/60 bg-background/50 p-2 space-y-1.5",
          compact && "mt-1.5 p-1.5",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3 text-sky-500" /> Enfoque
          </span>
          <div className="ml-auto flex items-center gap-1">
            {toggle}
            {entry && (
              <button
                type="button"
                onClick={clearPlan}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive/10"
                title="Quitar el enfoque del bloque"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </div>
        </div>

        {isFragments ? (
          <div className="space-y-1">
            {fragments.map(fragment => {
              const legacySystem =
                Boolean(fragment.systemId) && !isProfessionalFocusSystem(fragment.systemId);
              return (
                <div
                  key={fragment.id}
                  className="space-y-1 rounded-lg border border-border/40 bg-background/40 p-1.5"
                >
                  <div className="flex items-center gap-1">
                    <span className="w-[74px] shrink-0 font-mono text-[9px] text-muted-foreground">
                      {fragment.start}–{fragment.end}
                    </span>
                    <Badge variant="outline" className="h-4 shrink-0 px-1 text-[8px]">
                      {minutesBetween(fragment.start, fragment.end)}′
                    </Badge>
                    {legacySystem && (
                      <Badge
                        variant="outline"
                        className="h-4 shrink-0 border-amber-400/50 px-1 text-[8px] text-amber-600 dark:text-amber-400"
                        title="Sistema heredado; elige un enfoque para actualizarlo"
                      >
                        {systemName(fragment.systemId)}
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFragment(fragment.id)}
                      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive/10"
                      title="Quitar tramo"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  {renderFocus?.(fragment)}
                  {legacySystem && (
                    <p className="text-[8px] leading-tight text-amber-600 dark:text-amber-400">
                      Sistema heredado. Elige un enfoque para actualizar este tramo.
                    </p>
                  )}
                  <DoseLine
                    entries={[{
                      systemId: fragment.systemId,
                      minutes: minutesBetween(fragment.start, fragment.end),
                    }]}
                  />
                </div>
              );
            })}

            {fragments.length < slots.length && (
              <button
                type="button"
                onClick={addFragment}
                className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <Plus className="h-2.5 w-2.5" /> Agregar tramo
              </button>
            )}

            {absorbsBreak && (
              <p className="text-[8px] text-muted-foreground">Absorbe el descanso de 10 min.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {renderFocus?.()}
            {wholeLegacySystem && (
              <p className="text-[8px] leading-tight text-amber-600 dark:text-amber-400">
                Sistema heredado ({systemName(wholeValue)}). Elige un enfoque para actualizarlo.
              </p>
            )}
            {entry && wholeValue !== "none" && (
              <DoseLine entries={[{ systemId: wholeValue, minutes: blockDurationMinutes(block) }]} />
            )}
          </div>
        )}
      </div>
    );
  }

  const label = isExtraBlock(block) ? "Asignar" : "Velocidad";

  return (
    <div
      className={cn(
        "mt-2 rounded-xl border border-dashed border-border/60 bg-background/50 p-2 space-y-1.5",
        compact && "mt-1.5 p-1.5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Gauge className="h-3 w-3 text-amber-500" /> {label}
        </span>
        <div className="flex items-center gap-1">
          {toggle}
          {entry && (
            <button
              type="button"
              onClick={() => setWhole("none")}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive/10"
              title="Quitar la asignación de este bloque"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>
      </div>

      {isFragments ? (
        <div className="space-y-1">
          {fragments.map(fragment => (
            <div key={fragment.id} className="space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="w-[74px] shrink-0 font-mono text-[9px] text-muted-foreground">
                  {fragment.start}–{fragment.end}
                </span>
                <Select
                  value={fragment.systemId || "none"}
                  onValueChange={value => updateFragment(fragment.id, value === "none" ? "" : value)}
                >
                  <SelectTrigger className="h-6 flex-1 text-[10px]">
                    <SelectValue placeholder="Sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Sin asignar</SelectItem>
                    {SPEED_PLAN_SYSTEMS.map(system => (
                      <SelectItem key={system.id} value={system.id} className="text-xs">
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="h-4 shrink-0 px-1 text-[8px]">
                  {minutesBetween(fragment.start, fragment.end)}′
                </Badge>
                <button
                  type="button"
                  onClick={() => removeFragment(fragment.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-destructive/10"
                  title="Quitar tramo"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {isProfessionalFocusSystem(fragment.systemId) && renderFocus?.(fragment)}
              {!renderFocus && (
                <FocusLine focus={focusForSystem(fragmentFocusOf(fragment), fragment.systemId)} />
              )}
            </div>
          ))}

          {fragments.length < slots.length && (
            <button
              type="button"
              onClick={addFragment}
              className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Plus className="h-2.5 w-2.5" /> Agregar tramo
            </button>
          )}

          {absorbsBreak && (
            <p className="text-[8px] text-muted-foreground">Absorbe el descanso de 10 min.</p>
          )}

          <DoseLine
            entries={fragments.map(fragment => ({
              systemId: fragment.systemId,
              minutes: minutesBetween(fragment.start, fragment.end),
            }))}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Select value={wholeValue} onValueChange={setWhole}>
              <SelectTrigger className="h-6 flex-1 text-[10px]">
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Sin asignar</SelectItem>
                {SPEED_PLAN_SYSTEMS.map(system => (
                  <SelectItem key={system.id} value={system.id} className="text-xs">
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="h-4 shrink-0 px-1 text-[8px]">
              {blockDurationMinutes(block)}′
            </Badge>
          </div>
          {auto && !entry && (
            <p className="text-[8px] text-muted-foreground">Automático por el bloque.</p>
          )}
          {isProfessionalFocusSystem(wholeValue) && renderFocus?.()}
          {wholeValue !== "none" && (
            <DoseLine entries={[{ systemId: wholeValue, minutes: blockDurationMinutes(block) }]} />
          )}
          {!renderFocus && wholeValue !== "none" && entry && (
            <FocusLine focus={focusForSystem(blockFocusOf(entry), wholeValue)} />
          )}
        </div>
      )}
    </div>
  );
}
