import { useState, useRef, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CachedImage } from '@/components/CachedImage';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useTextSection } from '@/hooks/useTextSection';
import { cacheImageNow, precacheImages } from '@/lib/imageCache';
import { storeImageFromFile, removeImageBlob } from '@/lib/imageStore';
import { Grid3x3, ImagePlus, Loader2, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisionCard {
  id: string;
  position: number;
  image_url: string | null;
}

interface DireccionVisionData {
  rows: number;
  cards: VisionCard[];
}

const ROW_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STORAGE_KEY = 'direccion-vision';
const UPLOAD_FOLDER = 'direccion-vision';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function makeCards(rows: number): VisionCard[] {
  return Array.from({ length: Math.max(1, rows) * 3 }, (_, i) => ({
    id: uid(),
    position: i,
    image_url: null,
  }));
}

export function DireccionVisionGrid() {
  const { data, setData, loading } = useTextSection<DireccionVisionData>(STORAGE_KEY, {
    rows: 3,
    cards: makeCards(3),
  });
  const { uploadImage } = useImageUpload();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const persist = useCallback(
    (next: DireccionVisionData) => {
      setData(next);
      const urls = next.cards.map(c => c.image_url).filter(Boolean) as string[];
      if (urls.length > 0) precacheImages(urls);
    },
    [setData],
  );

  const changeRows = (newRows: number) => {
    const oldTotal = Math.max(1, data.rows) * 3;
    const newTotal = newRows * 3;
    let cards = [...data.cards];
    if (newTotal > oldTotal) {
      for (let i = oldTotal; i < newTotal; i++) {
        cards.push({ id: uid(), position: i, image_url: null });
      }
    } else if (newTotal < oldTotal) {
      cards = cards.slice(0, newTotal);
    }
    persist({ rows: newRows, cards });
  };

  const handleFile = async (cardId: string, file: File) => {
    setUploadingId(cardId);
    const url = await uploadImage(file, UPLOAD_FOLDER);
    if (url) {
      cacheImageNow(url);
      storeImageFromFile(url, file);
      persist({
        ...data,
        cards: data.cards.map(c => (c.id === cardId ? { ...c, image_url: url } : c)),
      });
    }
    setUploadingId(null);
  };

  const clearImage = (cardId: string) => {
    const card = data.cards.find(c => c.id === cardId);
    if (card?.image_url) removeImageBlob(card.image_url);
    persist({
      ...data,
      cards: data.cards.map(c => (c.id === cardId ? { ...c, image_url: null } : c)),
    });
  };

  const setInputRef = (cardId: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(cardId, el);
    else inputRefs.current.delete(cardId);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-white/70 dark:bg-zinc-950/70 p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Grid3x3 className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold tracking-tight truncate">Cuadrícula de dirección</h3>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            ({data.rows * 3} casillas)
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Filas</span>
          <Select value={String(data.rows)} onValueChange={v => changeRows(Number(v))}>
            <SelectTrigger className="h-7 w-[68px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_OPTIONS.map(r => (
                <SelectItem key={r} value={String(r)}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Imágenes que sostienen tus decisiones: define el rumbo con referencias visuales por área.
      </p>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {data.cards.map(c => (
            <div key={c.id} className="aspect-square rounded-lg border-2 border-dashed bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {data.cards.map(card => {
            const isUploading = uploadingId === card.id;
            return (
              <div
                key={card.id}
                className="relative aspect-square rounded-lg border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden group"
              >
                <input
                  ref={el => setInputRef(card.id, el)}
                  type="file"
                  accept="image/*,.gif,.mp4,.webm,.mov"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(card.id, f);
                    e.target.value = '';
                  }}
                />
                {card.image_url ? (
                  <>
                    <CachedImage src={card.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setLightboxSrc(card.image_url)}
                        className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                        aria-label="Ampliar"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => clearImage(card.id)}
                        className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                        aria-label="Quitar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => inputRefs.current.get(card.id)?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-[10px] uppercase tracking-wider font-medium">Añadir</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

export default DireccionVisionGrid;
