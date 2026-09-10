import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUI } from "./SheetStack";
import { cn } from "@/lib/utils";

const clock = (sec: number) =>
  Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");

export function RestTimer() {
  const { timer, work, addRest, stopRest, finishWorkEarly, stopWork } = useUI();
  const on = work || timer;

  useEffect(() => {
    if (!on) return;
    document.body.style.paddingBottom = "96px";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [!!on]);

  if (!on) return null;
  const pct = (on.left / on.total) * 100;

  if (work)
    return (
      <div className="fixed inset-x-0 bottom-14 z-[60] mx-auto w-full max-w-lg px-3">
        <div className="rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold tabular-nums text-primary">{clock(work.left)}</div>
            <div className="min-w-0 flex-1">
              {work.label && (
                <div className="truncate text-sm font-medium">{work.label}</div>
              )}
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-1000"
                  style={{ width: pct + "%" }}
                />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={stopWork}>
              Cancelar
            </Button>
            <Button size="sm" onClick={finishWorkEarly}>
              ✓ Hecho
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-x-0 bottom-14 z-[60] mx-auto w-full max-w-lg px-3">
      <div className="rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold tabular-nums">{clock(timer!.left)}</div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full bg-primary transition-[width] duration-1000", pct < 25 && "bg-yellow-500")}
              style={{ width: pct + "%" }}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addRest(-15)}
          >
            −15s
          </Button>
          <Button size="sm" variant="outline" onClick={() => addRest(15)}>
            +15s
          </Button>
          <Button size="sm" onClick={stopRest}>
            Saltar
          </Button>
        </div>
      </div>
    </div>
  );
}