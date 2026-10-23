// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, Maximize2, Settings, Type, ArrowUp, ArrowDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BoardCard {
  id: string;
  position: number;
  image_url: string | null;
  name?: string;
  system?: string;
  textColor?: 'white' | 'black';
  textBold?: boolean;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

export interface BoardSection {
  id: string;
  name: string;
  rows: number;
  cards: BoardCard[];
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function makeCards(rows: number): BoardCard[] {
  return Array.from({ length: rows * 3 }, (_, i) => ({
    id: uid(),
    position: i,
    image_url: null,
  }));
}

const ROW_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SYSTEM_COLOR_MAP: Record<string, string> = {
  lectura: 'border-green-500',
  ajedrez: 'border-amber-500',
  game: 'border-gray-400',
  idiomas: 'border-blue-500',
  musica: 'border-gray-400',
  gym: 'border-green-500',
  universidad: 'border-blue-500',
  emprendimiento: 'border-amber-500',
  proyectos: 'border-amber-500',
  salud: 'border-green-500',
  'fuerza mental': 'border-blue-500',
  apariencia: 'border-gray-400',
};

function getCardBorderClass(system?: string) {
  if (!system) return 'border-dashed border-border/60';
  return SYSTEM_COLOR_MAP[system.toLowerCase()] || 'border-gray-400';
}

interface Props {
  sections: BoardSection[];
  setSections: (next: BoardSection[]) => void;
  uploadFolder: string;
  emptyTitle: string;
  emptyAction: string;
  accent?: "vision" | "anti";
}

export function BoardSectionEditor({
  sections,
  setSections,
  uploadFolder,
  emptyTitle,
  emptyAction,
  accent = "vision",
}: Props) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [configCard, setConfigCard] = useState<{ sectionId: string; cardId: string } | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { uploadImage } = useImageUpload();

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
        } catch {
          // ignore fetch errors for offline cache
        }
      })
    );
  }, [sections]);

  const addSection = () => {
    const rows = 3;
    setSections([
      ...sections,
      { id: uid(), name: `Sección ${sections.length + 1}`, rows, cards: makeCards(rows) },
    ]);
  };

  const updateSection = (id: string, patch: Partial<BoardSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
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
    const url = await uploadImage(file, uploadFolder);
    if (url) {
      cacheImageNow(url);
      storeImageFromFile(url, file);
      setSections(
        sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                cards: s.cards.map((c) =>
                  c.id === cardId ? { ...c, image_url: url } : c
                ),
              }
            : s
        )
      );
    }
    setUploadingId(null);
  };

  const clearImage = (sectionId: string, cardId: string) => {
    const card = sections
      .find((s) => s.id === sectionId)
      ?.cards.find((c) => c.id === cardId);
    if (card?.image_url) {
      removeImageBlob(card.image_url);
    }
    setSections(
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

  const updateCard = (sectionId: string, cardId: string, patch: Partial<BoardCard>) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
            }
          : s
      )
    );
  };

  const setInputRef = (cardId: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(cardId, el);
    else inputRefs.current.delete(cardId);
  };

  return (
    <div className="space-y-4">


      {sections.length === 0 && (
        <Card className="p-12 text-center">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">{emptyTitle}</p>
          <Button onClick={addSection} variant="outline">
            <Plus className="h-4 w-4 mr-1.5" />
            {emptyAction}
          </Button>
        </Card>
      )}

      {sections.length > 0 && (
        <Button onClick={addSection} variant="outline" size="sm" className="w-fit">
          <Plus className="h-4 w-4 mr-1.5" />
          Agregar sección
        </Button>
      )}

      {sections.map(
        (section) => (
          <Card
            key={section.id}
            className={cn(
              "p-4 md:p-5 space-y-4",
              accent === "anti" && "border-destructive/20"
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                className="h-9 text-base font-semibold max-w-[160px] sm:max-w-xs"
                placeholder="Nombre de la sección"
              />
              <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={sections.findIndex((s) => s.id === section.id) === 0}
                  title="Subir sección"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={sections.findIndex((s) => s.id === section.id) === sections.length - 1}
                  title="Bajar sección"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
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
                title="Eliminar sección"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {section.cards.map((card) => {
                const isUploading = uploadingId === card.id;
                return (
                  <div
                    key={card.id}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 bg-muted/30 group",
                      getCardBorderClass(card.system)
                    )}
                  >
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
                        <CachedImage
                          src={card.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => clearImage(section.id, card.id)}
                          className="absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          title="Quitar foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setLightboxSrc(card.image_url)}
                          className="absolute top-1.5 right-8 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Ampliar imagen"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => inputRefs.current.get(card.id)?.click()}
                          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10"
                          aria-label="Cambiar imagen"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfigCard({ sectionId: section.id, cardId: card.id });
                          }}
                          className="absolute bottom-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Configurar tarjeta"
                          title="Configurar tarjeta"
                        >
                          <Settings className="h-3 w-3" />
                        </button>
                        {(card.name) && (
                          <div className="absolute inset-0 flex items-center justify-center px-1 z-10 pointer-events-none">
                            <p className={cn(
                              "text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] break-words",
                              card.textColor === 'black' ? 'text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white',
                              card.textBold !== false ? 'font-bold' : '',
                              card.fontSize === 'xs' ? 'text-[8px]' :
                              card.fontSize === 'sm' ? 'text-[10px]' :
                              card.fontSize === 'base' ? 'text-xs' :
                              card.fontSize === 'lg' ? 'text-sm' :
                              card.fontSize === 'xl' ? 'text-base' :
                              card.fontSize === '2xl' ? 'text-lg' :
                              'text-xs'
                            )}>
                              {card.name}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfigCard({ sectionId: section.id, cardId: card.id });
                          }}
                          className="absolute bottom-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          aria-label="Configurar tarjeta"
                          title="Configurar tarjeta"
                        >
                          <Settings className="h-3 w-3" />
                        </button>
                        {(card.name) && (
                          <div className="absolute inset-0 flex items-center justify-center px-1 z-10 pointer-events-none">
                            <p className={cn(
                              "text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] break-words",
                              card.textColor === 'black' ? 'text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]' : 'text-white',
                              card.textBold !== false ? 'font-bold' : '',
                              card.fontSize === 'xs' ? 'text-[8px]' :
                              card.fontSize === 'sm' ? 'text-[9px]' :
                              card.fontSize === 'base' ? 'text-[10px]' :
                              card.fontSize === 'lg' ? 'text-xs' :
                              card.fontSize === 'xl' ? 'text-sm' :
                              card.fontSize === '2xl' ? 'text-base' :
                              'text-[10px]'
                            )}>
                              {card.name}
                            </p>
                          </div>
                        )}
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
                              Galería
                            </span>
                          </>
                        )}
                      </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    
      <Sheet open={!!configCard} onOpenChange={(open) => !open && setConfigCard(null)}>
        <SheetContent side="right" className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Configurar tarjeta</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="card-name">Nombre</Label>
              <Input
                id="card-name"
                placeholder="Nombre de la tarjeta"
                value={
                  configCard
                    ? sections
                        .find((s) => s.id === configCard.sectionId)
                        ?.cards.find((c) => c.id === configCard.cardId)?.name || ''
                    : ''
                }
                onChange={(e) => {
                  if (configCard) {
                    updateCard(configCard.sectionId, configCard.cardId, { name: e.target.value });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-system">Sistema</Label>
              <Select
                value={
                  configCard
                    ? sections
                        .find((s) => s.id === configCard.sectionId)
                        ?.cards.find((c) => c.id === configCard.cardId)?.system || 'none'
                    : 'none'
                }
                onValueChange={(v) => {
                  if (configCard) {
                    updateCard(configCard.sectionId, configCard.cardId, { system: v === 'none' ? undefined : v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sistema</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Principales</SelectLabel>
                    <SelectItem value="lectura">Lectura</SelectItem>
                    <SelectItem value="ajedrez">Ajedrez</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="idiomas">Idiomas</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="universidad">Universidad</SelectItem>
                    <SelectItem value="emprendimiento">Emprendimiento</SelectItem>
                    <SelectItem value="proyectos">Proyectos</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Áreas centrales</SelectLabel>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="fuerza mental">Fuerza mental</SelectItem>
                    <SelectItem value="apariencia">Apariencia</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-text-color">Color del texto</Label>
              <Select
                value={
                  configCard
                    ? sections
                        .find((s) => s.id === configCard.sectionId)
                        ?.cards.find((c) => c.id === configCard.cardId)?.textColor || 'white'
                    : 'white'
                }
                onValueChange={(v) => {
                  if (configCard) {
                    updateCard(configCard.sectionId, configCard.cardId, { textColor: v as 'white' | 'black' });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">Blanco</SelectItem>
                  <SelectItem value="black">Negro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-font-size">Tamaño de letra</Label>
              <Select
                value={
                  configCard
                    ? sections
                        .find((s) => s.id === configCard.sectionId)
                        ?.cards.find((c) => c.id === configCard.cardId)?.fontSize || 'xs'
                    : 'xs'
                }
                onValueChange={(v) => {
                  if (configCard) {
                    updateCard(configCard.sectionId, configCard.cardId, { fontSize: v as any });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Muy pequeño (XS)</SelectItem>
                  <SelectItem value="sm">Pequeño (S)</SelectItem>
                  <SelectItem value="base">Mediano (M)</SelectItem>
                  <SelectItem value="lg">Grande (L)</SelectItem>
                  <SelectItem value="xl">Muy grande (XL)</SelectItem>
                  <SelectItem value="2xl">Enorme (XXL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="card-text-bold">Texto en negrita</Label>
              <Switch
                id="card-text-bold"
                checked={
                  configCard
                    ? sections
                        .find((s) => s.id === configCard.sectionId)
                        ?.cards.find((c) => c.id === configCard.cardId)?.textBold !== false
                    : true
                }
                onCheckedChange={(checked) => {
                  if (configCard) {
                    updateCard(configCard.sectionId, configCard.cardId, { textBold: checked });
                  }
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
