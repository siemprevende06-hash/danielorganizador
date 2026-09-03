import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextSection } from "@/hooks/useTextSection";
import { StickyNote, Loader2, ImagePlus } from "lucide-react";
import { BoardSectionEditor, type BoardSection } from "@/components/vision/BoardSectionEditor";

const START_DATE = new Date(2026, 6, 16);
const END_DATE = new Date(2031, 6, 16);
const TOTAL_DAYS = Math.round((END_DATE.getTime() - START_DATE.getTime()) / 86400000);

const MONTH_NAMES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ObjetivoVision5Anos() {
  const {
    data: visionSections,
    setData: setVisionSections,
    loading,
    saving,
    saveNow,
  } = useTextSection<BoardSection[]>("objetivo-vision-5-anos-data", []);
  const { data: antiSections, setData: setAntiSections, loading: antiLoading } =
    useTextSection<BoardSection[]>("antivision-5-anos-data", []);
  const { data: notesText, setData: setNotesText } = useTextSection<string>(
    "objetivo-vision-5-anos-notas",
    ""
  );
  const [today, setToday] = useState(new Date());
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dayNumber = useMemo(() => {
    const days = Math.floor((today.getTime() - START_DATE.getTime()) / 86400000) + 1;
    return Math.max(0, Math.min(days, TOTAL_DAYS));
  }, [today]);
  const progress = (dayNumber / TOTAL_DAYS) * 100;

  const years = useMemo(() => {
    const arr: { year: number; label: string; startYearDay: number; days: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const start = new Date(START_DATE.getFullYear() + i, START_DATE.getMonth(), START_DATE.getDate());
      const end = new Date(START_DATE.getFullYear() + i + 1, START_DATE.getMonth(), START_DATE.getDate());
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      const startYearDay = Math.round((start.getTime() - START_DATE.getTime()) / 86400000);
      arr.push({
        year: start.getFullYear(),
        label: `Año ${i + 1} · ${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getFullYear()} → ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getFullYear()}`,
        startYearDay,
        days,
      });
    }
    return arr;
  }, []);

  const handleNotesChange = (val: string) => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => setNotesText(val), 800);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

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
          <h1 className="text-3xl font-bold">Objetivo Visión 5 Años</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(START_DATE)} → {formatDate(END_DATE)} · {TOTAL_DAYS} días de visión
          </p>
        </div>

        <Card className="p-6">
          <div className="text-center mb-4">
            <span className="text-5xl font-bold tracking-tight">{dayNumber}</span>
            <span className="text-xl text-muted-foreground ml-2">/ {TOTAL_DAYS}</span>
          </div>
          <div className="text-center text-sm text-muted-foreground mb-4">
            {dayNumber >= TOTAL_DAYS
              ? "¡Objetivo cumplido!"
              : dayNumber <= 0
              ? "Aún no comienza"
              : `Día ${dayNumber} de ${TOTAL_DAYS}`}
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">🌟 Tablero de Visión a 5 Años</h2>
            <p className="text-sm text-muted-foreground">A dónde quiero llegar en 5 años</p>
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
          uploadFolder="objetivo-vision-5-anos"
          emptyTitle="No hay secciones aún. Crea una para empezar a añadir imágenes de tu visión a 5 años."
          emptyAction="Crear Primera Sección"
          accent="vision"
        />

        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Notas y Reflexiones</h2>
          </div>
          <Textarea
            defaultValue={notesText}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Escribe tus notas, reflexiones y aprendizajes de estos 5 años de visión..."
            className="min-h-[150px] resize-y text-sm leading-relaxed"
          />
        </Card>

        <Card className="p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Progreso por Año</h2>
          <div className="space-y-3">
            {years.map((y, i) => {
              const done = Math.min(Math.max(dayNumber - y.startYearDay, 0), y.days);
              const pct = (done / y.days) * 100;
              const isCurrent = done > 0 && done < y.days;
              return (
                <div key={y.year} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{y.label}</h3>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Actual
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {done} / {y.days} días
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCurrent ? "bg-primary" : "bg-green-500/60"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="border-t border-border/40 pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">⚠️ Tablero de Anti-Visión (5 Años)</h2>
            <p className="text-sm text-muted-foreground">Lo que NO quiero llegar a ser en 5 años</p>
          </div>
          <BoardSectionEditor
            sections={antiSections}
            setSections={setAntiSections}
            uploadFolder="antivision-5-anos"
            emptyTitle="No hay secciones aún. Crea una para definir tu anti-visión a 5 años."
            emptyAction="Crear Primera Sección"
            accent="anti"
          />
        </div>
      </div>
    </div>
  );
}
