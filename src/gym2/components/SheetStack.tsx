import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { beep, vibrate } from "../lib/sound";
import { getGym } from "../store";

export type SheetKind = "sheet" | "center";

interface SheetDef {
  id: string;
  kind: SheetKind;
  locked?: boolean;
  render: (close: () => void) => ReactNode;
}

export interface UITimer {
  left: number;
  total: number;
  endsAt: number;
  label?: string;
}

export interface UIAPI {
  open: (
    render: (close: () => void) => ReactNode,
    opts?: { kind?: SheetKind; locked?: boolean }
  ) => { close: () => void };
  close: (id: string) => void;
  closeAll: () => void;
  timer: UITimer | null;
  work: UITimer | null;
  startRest: (sec: number) => void;
  addRest: (sec: number) => void;
  stopRest: () => void;
  startWork: (sec: number, label: string, onDone: (elapsed: number) => void) => void;
  finishWorkEarly: () => void;
  stopWork: () => void;
}

const UICtx = createContext<UIAPI>(null as unknown as UIAPI);

export const useUI = () => useContext(UICtx);

let uiApi: UIAPI | null = null;
export const getUI = (): UIAPI => uiApi!;

let n = 0;
const nextId = () => "ui" + Date.now().toString(36) + (n++).toString(36);

let timerInt: ReturnType<typeof setInterval> | null = null;
let timerTick: (() => void) | null = null;
let workInt: ReturnType<typeof setInterval> | null = null;
let workTick: (() => void) | null = null;
let workDone: ((elapsed: number) => void) | null = null;

const snd = () => getGym().S.sound;

export function UIProvider({ children }: { children: ReactNode }) {
  const [sheets, setSheets] = useState<SheetDef[]>([]);
  const [timer, setTimer] = useState<UITimer | null>(null);
  const [work, setWork] = useState<UITimer | null>(null);

  const close = useCallback((id: string) => {
    setSheets((s) => s.filter((x) => x.id !== id));
  }, []);

  const open = useCallback<UIAPI["open"]>(
    (render, opts) => {
      const id = nextId();
      setSheets((s) => [
        ...s,
        {
          id,
          kind: opts?.kind || "sheet",
          locked: !!opts?.locked,
          render,
        },
      ]);
      return { close: () => close(id) };
    },
    [close]
  );

  const closeAll = useCallback(() => {
    setSheets([]);
  }, []);

  const stopRest = useCallback(() => {
    if (timerInt) clearInterval(timerInt);
    timerInt = null;
    if (timerTick) document.removeEventListener("visibilitychange", timerTick);
    timerTick = null;
    setTimer(null);
  }, []);

  const stopWork = useCallback(() => {
    if (workInt) clearInterval(workInt);
    workInt = null;
    if (workTick) document.removeEventListener("visibilitychange", workTick);
    workTick = null;
    workDone = null;
    setWork(null);
  }, []);

  const startRest = useCallback(
    (sec: number) => {
      stopRest();
      stopWork();
      const endsAt = Date.now() + sec * 1000;
      setTimer({ left: sec, total: sec, endsAt });
      timerTick = () => {
        const tm = getUI().timer;
        if (!tm) return;
        const left = Math.max(0, Math.round((tm.endsAt - Date.now()) / 1000));
        if (left === tm.left) return;
        if (left <= 0) {
          beep(snd(), 880, 0.15);
          beep(snd(), 880, 0.15, 0.25);
          beep(snd(), 1320, 0.4, 0.5);
          vibrate([200, 100, 200]);
          stopRest();
          toast("Descanso terminado — ¡siguiente serie!");
          return;
        }
        if (left <= 3) beep(snd(), 660, 0.1);
        setTimer({ ...tm, left });
      };
      timerInt = setInterval(timerTick, 1000);
      document.addEventListener("visibilitychange", timerTick);
    },
    [stopRest, stopWork]
  );

  const addRest = useCallback(
    (sec: number) => {
      const tm = getUI().timer;
      if (!tm) return;
      const left = tm.left + sec;
      if (left <= 0) {
        stopRest();
        return;
      }
      setTimer({ left, total: tm.total + sec, endsAt: tm.endsAt + sec * 1000 });
    },
    [stopRest]
  );

  const startWork = useCallback(
    (sec: number, label: string, onDone: (elapsed: number) => void) => {
      stopWork();
      stopRest();
      const total = Math.max(1, Math.round(sec) || 1);
      const endsAt = Date.now() + total * 1000;
      workDone = onDone;
      setWork({ left: total, total, endsAt, label });
      workTick = () => {
        const wk = getUI().work;
        if (!wk) return;
        const left = Math.max(0, Math.round((wk.endsAt - Date.now()) / 1000));
        if (left === wk.left) return;
        if (left <= 0) {
          beep(snd(), 880, 0.15);
          beep(snd(), 880, 0.15, 0.25);
          beep(snd(), 1320, 0.4, 0.5);
          vibrate([200, 100, 200]);
          const done = workDone;
          stopWork();
          if (done) done(wk.total);
          return;
        }
        if (left <= 3) beep(snd(), 660, 0.1);
        setWork({ ...wk, left });
      };
      workInt = setInterval(workTick, 1000);
      document.addEventListener("visibilitychange", workTick);
    },
    [stopRest, stopWork]
  );

  const finishWorkEarly = useCallback(() => {
    const wk = getUI().work;
    if (!wk) return;
    const elapsed = Math.max(1, wk.total - wk.left);
    const done = workDone;
    vibrate(30);
    stopWork();
    if (done) done(elapsed);
  }, [stopWork]);

  const api = useMemo(
    () => ({
      open,
      close,
      closeAll,
      timer,
      work,
      startRest,
      addRest,
      stopRest,
      startWork,
      finishWorkEarly,
      stopWork,
    }),
    [open, close, closeAll, timer, work, startRest, addRest, stopRest, startWork, finishWorkEarly, stopWork]
  );
  uiApi = api;

  useEffect(() => {
    return () => {
      if (timerInt) clearInterval(timerInt);
      if (workInt) clearInterval(workInt);
    };
  }, []);

  return (
    <UICtx.Provider value={api}>
      {children}
      {sheets.map((s) => {
        if (s.kind === "center") {
          if (s.locked)
            return (
              <div
                key={s.id}
                className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
              >
                <div className="absolute inset-0 bg-black/70" aria-hidden />
                <div className="relative z-10 mb-0 w-full max-w-lg rounded-t-2xl border bg-background p-6 shadow-xl sm:mb-0 sm:rounded-2xl max-h-[88dvh] overflow-y-auto">
                  {s.render(() => close(s.id))}
                </div>
              </div>
            );
          return (
            <Dialog
              key={s.id}
              open
              onOpenChange={(o) => {
                if (!o) close(s.id);
              }}
            >
              <DialogContent className="max-h-[88dvh] overflow-y-auto">
                {s.render(() => close(s.id))}
              </DialogContent>
            </Dialog>
          );
        }
        return (
          <Drawer
            key={s.id}
            open
            onOpenChange={(o) => {
              if (!o && !s.locked) close(s.id);
            }}
            dismissible={!s.locked}
            shouldScaleBackground={false}
          >
            <DrawerContent className="max-h-[88dvh]">
              <div className="max-h-[80dvh] overflow-y-auto px-4 pb-6">
                {s.render(() => close(s.id))}
              </div>
            </DrawerContent>
          </Drawer>
        );
      })}
    </UICtx.Provider>
  );
}