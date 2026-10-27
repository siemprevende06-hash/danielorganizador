import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useReadingLibrary } from "@/hooks/useReadingLibrary";
import { useReadingPagesDraft } from "@/hooks/useReadingPagesDraft";

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

  const { pageStart, pageEnd, bookmark, lastToday, changeStart, changeEnd } = useReadingPagesDraft({
    sessions,
    bookId: current?.id ?? null,
    pagesRead: current?.pages_read,
    todayStr,
  });

  const lastSavedRef = useRef<{ minutes: number; start: number; end: number; bookId: string | null } | null>(null);
  const savingRef = useRef(false);

  // Si ya hay una sesión registrada hoy, evita guardar el mismo tramo dos veces.
  useEffect(() => {
    if (!lastToday?.id) return;
    lastSavedRef.current = {
      minutes: 0,
      start: lastToday.page_start ?? 0,
      end: lastToday.page_end ?? 0,
      bookId: current?.id ?? null,
    };
  }, [lastToday?.id, lastToday?.page_start, lastToday?.page_end, current?.id]);

  const pages = Math.max(0, (Number(pageEnd) || 0) - (Number(pageStart) || 0));
  const progressPct = current?.pages_total
    ? Math.min(100, Math.round(((Math.max(Number(current?.pages_read) || 0, Number(pageEnd) || 0)) / current.pages_total) * 100))
    : 0;

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
    const duplicate = !!prev
      && prev.bookId === candidate.bookId
      && prev.end === end
      && (pages > 0 ? prev.start === start : prev.minutes === curMinutes);
    if (duplicate) {
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

      // La biblioteca guarda la página donde quedaste (valor absoluto), no la suma.
      if (current?.id && pages > 0) {
        await updateProgress(current.id, Math.max(Number(current?.pages_read) || 0, end));
      }
      if (curMinutes > 0) onMinutesChange?.(curMinutes);
      // No se reinicia "Inicié en": queda visible el tramo leído hoy.
      lastSavedRef.current = candidate;
      refetch();
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Páginas leídas
        </p>
        {current && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            Vas por la pág. <span className="font-bold tabular-nums text-indigo-500">{bookmark}</span>
            {current.pages_total ? <span className="text-muted-foreground/70">/{current.pages_total}</span> : null}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 px-2 py-1.5 space-y-1">
          <label className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3 w-3" /> Inicié en
          </label>
          <Input
            type="number"
            min={0}
            value={pageStart || ""}
            onChange={(e) => changeStart(parseInt(e.target.value) || 0)}
            placeholder="pág"
            className="h-8 w-full text-center text-sm font-bold px-1"
          />
        </div>
        <div className="rounded-lg bg-purple-500/5 px-2 py-1.5 space-y-1 ring-1 ring-purple-500/20">
          <label className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-purple-500">
            <FileText className="h-3 w-3" /> Terminé en
          </label>
          <Input
            type="number"
            min={0}
            value={pageEnd || ""}
            onChange={(e) => changeEnd(parseInt(e.target.value) || 0)}
            placeholder="pág"
            className="h-8 w-full text-center text-sm font-bold px-1 text-purple-600 dark:text-purple-400"
          />
        </div>
      </div>

      {current?.pages_total ? (
        <Progress value={progressPct} className="h-1.5" indicatorClassName="bg-indigo-500" />
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {pages > 0 ? (
            <>
              <span className="text-lg font-extrabold tabular-nums text-indigo-500">{pages}</span> pág hoy
            </>
          ) : (
            "— sin páginas nuevas"
          )}
        </span>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-colors",
            "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <Save className="h-3 w-3" /> Guardar
        </button>
      </div>
    </div>
  );
};
