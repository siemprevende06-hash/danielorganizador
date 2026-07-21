import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, Maximize2 } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
import { toast } from "sonner";

interface MotivoCard {
  id: string;
  position: number;
  image_url: string | null;
}

interface MotivoSection {
  id: string;
  name: string;
  rows: number;
  cards: MotivoCard[];
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function makeCards(rows: number): MotivoCard[] {
  return Array.from({ length: rows * 3 }, (_, i) => ({
    id: uid(),
    position: i,
    image_url: null,
  }));
}

const ROW_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

export default function Motivos() {
  const { data: sections, setData: setSections, loading, saving, saveNow } = useTextSection<MotivoSection[]>(
    "motivos-data",
    []
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { uploadImageWithProgress } = useImageUpload();

  useEffect(() => {
    const urls = sections.flatMap((s) => s.cards.map((c) => c.image_url));
    precacheImages(urls);
  }, [sections]);

  useEffect(() => {
    const urls = sections.flatMap((s) => s.cards.map((c) => c.image_url));
    const valid = urls.filter(Boolean) as string[];
    if (valid.length === 0) return;
    Promise.allSettled(
      valid.map(async (url) => {
        const { getImageBlob } = await import("@/lib/imageStore");
        const existing = await getImageBlob(url);
        if (existing) return;
        try {
          const response = await fetch(url, { mode: "cors" });
          if (response.ok) {
            const blob = await response.blob();
            const { storeImageBlob } = await import("@/lib/imageStore");
            await storeImageBlob(url, blob);
          }
        } catch {}
      })
    );
  }, [sections]);

  const persist = useCallback((next: MotivoSection[]) => {
    setSections(next);
  }, [setSections]);

  const addSection = () => {
    const rows = 3;
    persist([
      ...sections,
      {
        id: uid(),
        name: `Sección ${sections.length + 1}`,
        rows,
        cards: makeCards(rows),
      },
    ]);
  };

  const updateSection = (id: string, patch: Partial<MotivoSection>) => {
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
    setUploadProgress(prev => ({ ...prev, [cardId]: 0 }));
    setUploadError(prev => { const n = { ...prev }; delete n[cardId]; return n; });
    const url = await uploadImageWithProgress(
      file,
      "motivos",
      (percent) => setUploadProgress(prev => ({ ...prev, [cardId]: percent })),
      (msg) => setUploadError(prev => ({ ...prev, [cardId]: msg }))
    );
    if (url) {
      cacheImageNow(url);
      storeImageFromFile(url, file);
      persist(
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, cards: s.cards.map((c) => c.id === cardId ? { ...c, image_url: url } : c) }
            : s
        )
      );
    }
    setUploadProgress(prev => { const n = { ...prev }; delete n[cardId]; return n; });
    setUploadingId(null);
  };

  const clearImage = (sectionId: string, cardId: string) => {
    const card = sections.find(s => s.id === sectionId)?.cards.find(c => c.id === cardId);
    if (card?.image_url) {
      removeImageBlob(card.image_url);
    }
    persist(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              cards: s.cards.map((c) =>
                c.id === cardId ? { ...c, image_url: null } : c
              ),
            }
          : s
      )
    );
  };

  const setInputRef = (cardId: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(cardId, el);
    else inputRefs.current.delete(cardId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Motivos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea secciones con cuadrículas de imágenes desde tu galería
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={saveNow} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4 mr-1.5" />
              )}
              Guardar
            </Button>
            <Button onClick={addSection}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Sección
            </Button>
          </div>
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
              No hay secciones aún. Crea una para empezar a añadir imágenes.
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
                const progress = uploadProgress[card.id];
                const error = uploadError[card.id];
                const showProgress = progress !== undefined;
                return (
                  <div key={card.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group">
                    <input
                      ref={(el) => setInputRef(card.id, el)}
                      type="file"
                      accept="image/*,.gif,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(section.id, card.id, f);
                        e.target.value = "";
                      }}
                    />

                    {error ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 bg-background/90 z-30">
                        <span className="text-[10px] text-destructive text-center leading-tight">{error}</span>
                        <button
                          onClick={() => {
                            setUploadError(prev => { const n = { ...prev }; delete n[card.id]; return n; });
                            inputRefs.current.get(card.id)?.click();
                          }}
                          className="text-[10px] text-muted-foreground underline hover:text-foreground"
                        >
                          Intentar de nuevo
                        </button>
                      </div>
                    ) : showProgress ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-30">
                        <span className="text-lg font-bold tabular-nums text-primary">{progress}%</span>
                        <div className="w-3/4 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Subiendo...</span>
                      </div>
                    ) : card.image_url ? (
                      <>
                        <CachedImage
                          src={card.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => clearImage(section.id, card.id)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setLightboxSrc(card.image_url)}
                          className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Ampliar imagen"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => inputRefs.current.get(card.id)?.click()}
                          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10"
                          aria-label="Cambiar imagen"
                        />
                      </>
                    ) : (
                      <button
                        onClick={() => inputRefs.current.get(card.id)?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ImagePlus className="h-7 w-7" />
                        <span className="text-[10px] uppercase tracking-wider font-medium">Galería</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
