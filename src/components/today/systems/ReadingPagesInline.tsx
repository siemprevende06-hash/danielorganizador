import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { FileText, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useReadingLibrary } from "@/hooks/useReadingLibrary";

interface Props {
  /** Minutos de lectura ya registrados hoy (time_data.lectura). */
  minutes: number;
  /** Persiste los minutos en el tracking del sistema (time_data.lectura). */
  onMinutesChange?: (v: number) => void;
}

/** Bloque compacto "Inicié en / Terminé en" + páginas leídas para la tarjeta de Lectura. */
export const ReadingPagesInline = ({ minutes, onMinutesChange }: Props) => {
  const { sessions, saveSession, refetch } = useReadingSessions();
  const { getCurrentlyReading, updateProgress } = useReadingLibrary();

  const current = getCurrentlyReading();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const lastToday = useMemo(
    () =>
      sessions
        .filter((s) => s.session_date === todayStr)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(-1)[0],
    [sessions, todayStr]
  );

  const [pageStart, setPageStart] = useState<number>(lastToday?.page_end ?? current?.pages_read ?? 0);
  const [pageEnd, setPageEnd] = useState<number>(lastToday?.page_end ?? current?.pages_read ?? 0);

  useEffect(() => {
    const base = lastToday?.page_end ?? current?.pages_read ?? 0;
    setPageStart((p) => (p === 0 ? base : p));
    setPageEnd((p) => (p === 0 ? base : p));
  }, [current?.id, lastToday?.page_end]);

  const lastSavedRef = useRef<{ minutes: number; start: number; end: number; bookId: string | null } | null>(null);
  const savingRef = useRef(false);

  const pages = Math.max(0, (Number(pageEnd) || 0) - (Number(pageStart) || 0));

  const handleSave = async () => {
    if (savingRef.current) return;
    const start = Number(pageStart) || 0;
    const end = Number(pageEnd) || 0;
    const curMinutes = minutes || 0;
    if (curMinutes <= 0 && pages <= 0) {
      toast.info("Ingresa minutos o página inicio/fin");
      return;
    }
    const candidate = { minutes: curMinutes, start, end, bookId: current?.id ?? null };
    const prev = lastSavedRef.current;
    if (
      prev &&
      prev.end === end &&
      prev.minutes === curMinutes &&
      (prev.start === start || pages <= 0)
    ) {
      toast.info("Ya guardaste esta sesión");
      return;
    }
    savingRef.current = true;
    try {
      const saved = await saveSession({
        minutes: curMinutes,
        bookId: current?.id || null,
        pageStart: end >= start && end > 0 ? start : null,
        pageEnd: end >= start && end > 0 ? end : null,
      });
      if (!saved) return;

      if (current?.id && pages > 0) {
        await updateProgress(current.id, (Number(current?.pages_read) || 0) + pages);
      }
      if (curMinutes > 0) onMinutesChange?.(curMinutes);
      if (end > start && end > 0) {
        setPageStart(end);
        setPageEnd(end);
      }
      lastSavedRef.current = candidate;
      refetch();
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <div className="space-y-1.5 pt-1.5 border-t border-border/40">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Páginas leídas
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-muted/40 px-1.5 py-1 space-y-0.5">
          <label className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-muted-foreground">
            <FileText className="h-2.5 w-2.5" /> Inicié en
          </label>
          <Input
            type="number"
            min={0}
            value={pageStart || ""}
            onChange={(e) => setPageStart(parseInt(e.target.value) || 0)}
            placeholder="pág"
            className="h-6 w-full text-center text-[10px] font-bold px-1"
          />
        </div>
        <div className="rounded-lg bg-muted/40 px-1.5 py-1 space-y-0.5">
          <label className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-purple-500">
            <FileText className="h-2.5 w-2.5" /> Terminé en
          </label>
          <Input
            type="number"
            min={0}
            value={pageEnd || ""}
            onChange={(e) => setPageEnd(parseInt(e.target.value) || 0)}
            placeholder="pág"
            className="h-6 w-full text-center text-[10px] font-bold px-1"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {pages > 0 ? (
            <>
              <span className="text-sm font-extrabold tabular-nums text-indigo-500">{pages}</span> pág hoy
            </>
          ) : (
            "— sin páginas nuevas"
          )}
          {current && (
            <span className="ml-1 text-[8px] text-muted-foreground/70 truncate max-w-[120px] inline-block align-middle">
              · {current.pages_read}/{current.pages_total || "?"}
            </span>
          )}
        </span>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-bold transition-colors",
            "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <Save className="h-2.5 w-2.5" /> Guardar
        </button>
      </div>
    </div>
  );
};