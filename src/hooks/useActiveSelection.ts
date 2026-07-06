import { useEffect, useState, useCallback } from "react";

const EVT = "active-selection-changed";

export type ActiveKey =
  | "activeSubjectId"
  | "activeEntrepreneurshipId"
  | "selectedProjectId";

export function useActiveSelection(key: ActiveKey) {
  const [value, setValue] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(key) : null
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: string | null }>).detail;
      if (detail?.key === key) setValue(detail.value);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === key) setValue(e.newValue);
    };
    window.addEventListener(EVT, handler as EventListener);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(EVT, handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, [key]);

  const set = useCallback(
    (next: string | null) => {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
      setValue(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key, value: next } }));
    },
    [key]
  );

  const toggle = useCallback(
    (id: string) => set(value === id ? null : id),
    [value, set]
  );

  return { value, set, toggle };
}
