import { useEffect, useRef, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextSection } from "@/hooks/useTextSection";
import { StickyNote, ChevronDown, ChevronUp, Loader2, ImagePlus, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  BoardSectionEditor,
  type BoardSection,
} from "@/components/vision/BoardSectionEditor";
import { EsfuerzoVisionSection } from "@/components/vision/EsfuerzoVisionSection";

const START_DATE = new Date(2026, 6, 16);
const END_DATE = new Date(2027, 6, 16);
const TOTAL_DAYS = 365;

function getDayNumber(today: Date): number {
  const diff = today.getTime() - START_DATE.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, Math.min(days, TOTAL_DAYS));
}

function getMonthsInRange(): { year: number; month: number; days: number }[] {
  const months: { year: number; month: number; days: number }[] = [];
  const start = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), 1);
  const end = new Date(END_DATE.getFullYear(), END_DATE.getMonth() + 1, 0);
  let current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    months.push({ year, month, days: lastDay });
    current = new Date(year, month + 1, 1);
  }
  return months;
}

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export default function ObjetivoVision1Ano() {
  const {
    data: visionSections,
    setData: setVisionSections,
    loading,
    saving,
    saveNow,
  } = useTextSection<BoardSection[]>("objetivo-vision-data", []);
  const {
    data: antiSections,
    setData: setAntiSections,
    loading: antiLoading,
  } = useTextSection<BoardSection[]>("antivision-data", []);
  const { data: notesText, setData: setNotesText } = useTextSection<string>(
    "objetivo-vision-notas",
    ""
  );
  const [today, setToday] = useState(new Date());
  const [showAllMonths, setShowAllMonths] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dayNumber = useMemo(() => getDayNumber(today), [today]);
  const progress = (dayNumber / TOTAL_DAYS) * 100;
  const months = useMemo(() => getMonthsInRange(), []);
  const currentMonthIndex = useMemo(() => {
    const cm = today.getMonth();
    const cy = today.getFullYear();
    return months.findIndex((m) => m.year === cy && m.month === cm);
  }, [today, months]);

  const visibleMonths = showAllMonths
    ? months
    : months.filter((_, i) => i === currentMonthIndex);

  const handleNotesChange = (val: string) => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => setNotesText(val), 800);
  };

  const isDayInRange = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    return date >= START_DATE && date <= END_DATE;
  };

  const isDayTicked = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return isDayInRange(year, month, day) && date < todayStart;
  };

  const isTodayDay = (year: number, month: number, day: number): boolean => {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading || antiLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Objetivo Visión 1 Año</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(START_DATE)} → {formatDate(END_DATE)} · 365 días de visión
          </p>
        </div>

        <Card className="p-6">
          <div className="text-center mb-4">
            <span className="text-5xl font-bold tracking-tight">
              {dayNumber > 0 && dayNumber <= TOTAL_DAYS ? dayNumber : 0}
            </span>
            <span className="text-xl text-muted-foreground ml-2">/ {TOTAL_DAYS}</span>
          </div>
          <div className="text-center text-sm text-muted-foreground mb-4">
            {dayNumber >= TOTAL_DAYS
              ? "¡Objetivo cumplido!"
              : dayNumber <= 0
              ? "Aún no comienza"
              : `Día ${dayNumber} de 365`}
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </Card>

        {/* === VISIÓN (ARRIBA) === */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">🌟 Tablero de Visión</h2>
            <p className="text-sm text-muted-foreground">
              A dónde quiero llegar este año
            </p>
          </div>
          <Button variant="outline" onClick={saveNow} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-1.5" />
            )}
            Guardar
          </Button>
        </div>

        <BoardSectionEditor
          sections={visionSections}
          setSections={setVisionSections}
          uploadFolder="objetivo-vision"
          emptyTitle="No hay secciones aún. Crea una para empezar a añadir imágenes de visión."
          emptyAction="Crear Primera Sección"
          accent="vision"
        />

        {/* === ESFUERZO (EN EL MEDIO) === */}
        <div className="border-t border-border/40 pt-6">
          <EsfuerzoVisionSection />
        </div>

        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Notas y Reflexiones</h2>
          </div>
          <Textarea
            defaultValue={notesText}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Escribe tus notas, reflexiones y aprendizajes durante este año de visión..."
            className="min-h-[150px] resize-y text-sm leading-relaxed"
          />
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Progreso Mensual</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-xs gap-1"
            >
              {showAllMonths ? "Ver menos" : "Ver todos"}
              {showAllMonths ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          <div className="space-y-3">
            {visibleMonths.map(({ year, month, days }) => {
              const firstDay = new Date(year, month, 1).getDay();
              const startOffset = firstDay === 0 ? 6 : firstDay - 1;
              const hasToday = isTodayDay(year, month, new Date().getDate());

              return (
                <div key={`${year}-${month}`} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold">{MONTH_NAMES_SHORT[month]} {year}</h3>
                    {hasToday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Hoy
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-[2px]">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                      <div key={i} className="text-center text-[9px] text-muted-foreground/40 font-semibold pb-1">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: startOffset }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {Array.from({ length: days }, (_, i) => {
                      const day = i + 1;
                      const inRange = isDayInRange(year, month, day);
                      const ticked = isDayTicked(year, month, day);
                      const isTodayDayFlag = isTodayDay(year, month, day);

                      if (!inRange) {
                        return <div key={day} />;
                      }

                      return (
                        <div
                          key={day}
                          className={`
                            aspect-square rounded-sm flex items-center justify-center text-[11px] font-medium
                            transition-colors select-none
                            ${ticked
                              ? "bg-green-500/25 text-green-700 dark:text-green-300 border border-green-500/20"
                              : isTodayDayFlag
                              ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                              : "bg-muted/40 text-muted-foreground/70"}
                            ${isTodayDayFlag ? "ring-1 ring-primary" : ""}
                          `}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* === ANTI-VISIÓN (ABAJO) === */}
        <div className="border-t border-border/40 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">⚠️ Tablero de Anti-Visión</h2>
              <p className="text-sm text-muted-foreground">
                Lo que NO quiero llegar a ser este año
              </p>
            </div>
          </div>
          <BoardSectionEditor
            sections={antiSections}
            setSections={setAntiSections}
            uploadFolder="antivision"
            emptyTitle="No hay secciones aún. Crea una para empezar a definir tu anti-visión."
            emptyAction="Crear Primera Sección"
            accent="anti"
          />
        </div>
      </div>
    </div>
  );
}