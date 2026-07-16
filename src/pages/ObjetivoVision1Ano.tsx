import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImageUpload } from "@/hooks/useImageUpload";
import { precacheImages } from "@/lib/imageCache";
import { useTextSection } from "@/hooks/useTextSection";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import { toast } from "sonner";

interface VisionCard {
  id: string;
  position: number;
  image_url: string | null;
}

interface VisionSection {
  id: string;
  name: string;
  rows: number;
  cards: VisionCard[];
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function makeCards(rows: number): VisionCard[] {
  return Array.from({ length: rows * 3 }, (_, i) => ({
    id: uid(),
    position: i,
    image_url: null,
  }));
}

const ROW_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

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
  const { data: sections, setData: setSections } = useTextSection<VisionSection[]>(
    "objetivo-vision-data",
    []
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const { data: notesText, setData: setNotesText } = useTextSection<string>(
    "objetivo-vision-notas", ""
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [today, setToday] = useState(new Date());
  const [showAllMonths, setShowAllMonths] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { uploadImage } = useImageUpload();

  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const urls = sections.flatMap((s) => s.cards.map((c) => c.image_url));
    precacheImages(urls);
  }, [sections]);

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

  const persist = useCallback((next: VisionSection[]) => {
    setSections(next);
  }, [setSections]);

  const addSection = () => {
    const rows = 3;
    persist([...sections, { id: uid(), name: `Sección ${sections.length + 1}`, rows, cards: makeCards(rows) }]);
  };

  const updateSection = (id: string, patch: Partial<VisionSection>) => {
    persist(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    persist(sections.filter((s) => s.id !== id));
    toast.success("Sección eliminada");
  };

  const changeRows = (sectionId: string, newRows: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const oldTotal = section.rows * 3;
    const newTotal = newRows * 3;
    let cards = [...section.cards];
    if (newTotal > oldTotal) {
      for (let i = oldTotal; i < newTotal; i++) {
        cards.push({ id: uid(), position: i, image_url: null });
      }
    } else if (newTotal < oldTotal) {
      cards = cards.slice(0, newTotal);
    }
    updateSection(sectionId, { rows: newRows, cards });
  };

  const handleFile = async (sectionId: string, cardId: string, file: File) => {
    setUploadingId(cardId);
    const url = await uploadImage(file, "objetivo-vision");
    if (url) {
      precacheImages([url]);
      persist(
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, cards: s.cards.map((c) => (c.id === cardId ? { ...c, image_url: url } : c)) }
            : s
        )
      );
    }
    setUploadingId(null);
  };

  const clearImage = (sectionId: string, cardId: string) => {
    persist(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, cards: s.cards.map((c) => (c.id === cardId ? { ...c, image_url: null } : c)) }
          : s
      )
    );
  };

  const setInputRef = (cardId: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(cardId, el);
    else inputRefs.current.delete(cardId);
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

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Tablero de Visión</h2>
            <p className="text-sm text-muted-foreground">
              Imágenes que representan tu objetivo a 1 año
            </p>
          </div>
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Sección
          </Button>
        </div>

        {sections.length > 0 && (
          <Card className="p-2 md:p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedSection === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSection(null)}
              >
                Todas
              </Button>
              {sections.map((s) => (
                <Button
                  key={s.id}
                  variant={selectedSection === s.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSection(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {sections.length === 0 && (
          <Card className="p-12 text-center">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No hay secciones aún. Crea una para empezar a añadir imágenes de visión.
            </p>
            <Button onClick={addSection} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear Primera Sección
            </Button>
          </Card>
        )}

        {(selectedSection ? sections.filter((s) => s.id === selectedSection) : sections).map((section) => (
          <Card key={section.id} className="p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                className="h-9 text-base font-semibold max-w-xs"
                placeholder="Nombre de la sección"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Filas:</span>
                <Select
                  value={String(section.rows)}
                  onValueChange={(v) => changeRows(section.id, Number(v))}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROW_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground/60">
                  ({section.rows * 3} tarjetas)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto text-destructive hover:text-destructive"
                onClick={() => removeSection(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {section.cards.map((card) => {
                const isUploading = uploadingId === card.id;
                return (
                  <div key={card.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group">
                    <input
                      ref={(el) => setInputRef(card.id, el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(section.id, card.id, f);
                        e.target.value = "";
                      }}
                    />
                    {card.image_url ? (
                      <>
                        <img src={card.image_url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => clearImage(section.id, card.id)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => inputRefs.current.get(card.id)?.click()}
                          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors"
                          aria-label="Cambiar imagen"
                        />
                      </>
                    ) : (
                      <button
                        onClick={() => inputRefs.current.get(card.id)?.click()}
                        disabled={isUploading}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-7 w-7" />
                            <span className="text-[10px] uppercase tracking-wider font-medium">Galería</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
