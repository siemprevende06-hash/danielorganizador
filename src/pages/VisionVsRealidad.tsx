import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { cn } from "@/lib/utils";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, Maximize2 } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
import { toast } from "sonner";

interface VrCard {
  id: string;
  position: number;
  image_url: string | null;
}

interface VrSection {
  id: string;
  name: string;
  vision: VrCard[];
  reality: VrCard[];
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function makeTriple(): { vision: VrCard[]; reality: VrCard[] } {
  return {
    vision: Array.from({ length: 3 }, (_, i) => ({
      id: uid(),
      position: i,
      image_url: null,
    })),
    reality: Array.from({ length: 3 }, (_, i) => ({
      id: uid(),
      position: i,
      image_url: null,
    })),
  };
}

export default function VisionVsRealidad() {
  const { data: sections, setData: setSections, loading, saving, saveNow } = useTextSection<VrSection[]>(
    "vision-vs-realidad-data",
    []
  );
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { uploadImage } = useImageUpload();

  useEffect(() => {
    const urls = sections.flatMap((s) => [...s.vision, ...s.reality].map((c) => c.image_url));
    precacheImages(urls);
  }, [sections]);

  useEffect(() => {
    const urls = sections.flatMap((s) => [...s.vision, ...s.reality].map((c) => c.image_url));
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

  const persist = useCallback((next: VrSection[]) => {
    setSections(next);
  }, [setSections]);

  const addSection = () => {
    persist([
      ...sections,
      {
        id: uid(),
        name: `Sección ${sections.length + 1}`,
        ...makeTriple(),
      },
    ]);
  };

  const updateSection = (id: string, patch: Partial<VrSection>) => {
    persist(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    persist(sections.filter((s) => s.id !== id));
    toast.success("Sección eliminada");
  };

  const handleFile = async (sectionId: string, cardId: string, side: "vision" | "reality", file: File) => {
    setUploadingId(cardId);
    const folder = side === "vision" ? "vision" : "realidad";
    const url = await uploadImage(file, folder);
    if (url) {
      cacheImageNow(url);
      storeImageFromFile(url, file);
      persist(
        sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                [side]: s[side].map((c) =>
                  c.id === cardId ? { ...c, image_url: url } : c
                ),
              }
            : s
        )
      );
    }
    setUploadingId(null);
  };

  const clearImage = (sectionId: string, cardId: string, side: "vision" | "reality") => {
    const card = sections.find(s => s.id === sectionId)?.[side].find(c => c.id === cardId);
    if (card?.image_url) {
      removeImageBlob(card.image_url);
    }
    persist(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              [side]: s[side].map((c) =>
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

  const renderCardGrid = (section: VrSection, side: "vision" | "reality") => {
    const cards = section[side];
    const label = side === "vision" ? "Visión" : "Realidad Actual";
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-3 w-3 rounded-full shrink-0",
            side === "vision" ? "bg-blue-500" : "bg-amber-500"
          )} />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {cards.map((card) => {
            const isUploading = uploadingId === card.id;
            return (
              <div key={card.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group">
                <input
                  ref={(el) => setInputRef(card.id, el)}
                  type="file"
                  
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(section.id, card.id, side, f);
                    e.target.value = "";
                  }}
                />

                {card.image_url ? (
                  <>
                    <CachedImage
                      src={card.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => clearImage(section.id, card.id, side)}
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
                    disabled={isUploading}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-7 w-7" />
                        <span className="text-[10px] uppercase tracking-wider font-medium">
                          {side === "vision" ? "Visión" : "Realidad"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
            <h1 className="text-3xl font-bold">Visión vs Realidad</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Confronta tu visión con tu realidad actual hasta que sean la misma
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

        {sections.length === 0 && (
          <Card className="p-12 text-center">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No hay secciones aún. Crea una para empezar a confrontar tu visión con tu realidad.
            </p>
            <Button onClick={addSection} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear Primera Sección
            </Button>
          </Card>
        )}

        {sections.map((section) => (
          <Card key={section.id} className="p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                className="h-9 text-base font-semibold max-w-xs"
                placeholder="Nombre de la sección"
              />

              <span className="text-xs text-muted-foreground/60 ml-auto">
                3 tarjetas por columna
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeSection(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                {renderCardGrid(section, "vision")}
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                {renderCardGrid(section, "reality")}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
