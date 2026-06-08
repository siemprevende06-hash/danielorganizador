import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cell {
  id?: string;
  position: number;
  image_url: string | null;
  caption: string | null;
}

interface Props {
  boardType: "porque" | "recompensas";
  title: string;
  subtitle?: string;
  accent?: string;
}

export function VisionBoardGrid3x3({ boardType, title, subtitle, accent = "from-primary/30 to-primary/5" }: Props) {
  const [cells, setCells] = useState<Cell[]>(
    Array.from({ length: 9 }, (_, i) => ({ position: i, image_url: null, caption: null }))
  );
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { uploadImage } = useImageUpload();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vision_board_cells" as any)
        .select("*")
        .eq("board_type", boardType);
      if (data && data.length > 0) {
        const next: Cell[] = Array.from({ length: 9 }, (_, i) => {
          const found = (data as any[]).find(d => d.position === i);
          return found
            ? { id: found.id, position: i, image_url: found.image_url, caption: found.caption }
            : { position: i, image_url: null, caption: null };
        });
        setCells(next);
      }
    })();
  }, [boardType]);

  const persist = async (position: number, patch: Partial<Cell>) => {
    const current = cells.find(c => c.position === position);
    const payload = {
      board_type: boardType,
      position,
      image_url: patch.image_url ?? current?.image_url ?? null,
      caption: patch.caption ?? current?.caption ?? null,
    };
    const { data } = await supabase
      .from("vision_board_cells" as any)
      .upsert(payload, { onConflict: "board_type,position" })
      .select("*")
      .single();
    if (data) {
      setCells(prev => prev.map(c => c.position === position
        ? { ...c, id: (data as any).id, image_url: (data as any).image_url, caption: (data as any).caption }
        : c));
    }
  };

  const handleFile = async (position: number, file: File) => {
    setUploadingIdx(position);
    const url = await uploadImage(file, `vision-${boardType}`);
    if (url) await persist(position, { image_url: url });
    setUploadingIdx(null);
  };

  const clearImage = async (position: number) => {
    await persist(position, { image_url: null });
  };

  return (
    <Card className="p-4 md:p-5 space-y-3">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {cells.map((cell, i) => {
          const isUploading = uploadingIdx === i;
          return (
            <div key={i} className="space-y-1">
              <div
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-gradient-to-br group",
                  accent,
                  cell.image_url && "border-solid"
                )}
              >
                <input
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(i, f);
                    e.target.value = "";
                  }}
                />
                {cell.image_url ? (
                  <>
                    <img src={cell.image_url} alt={cell.caption || ""} className="w-full h-full object-cover" />
                    <button
                      onClick={() => clearImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => inputRefs.current[i]?.click()}
                      className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors"
                      aria-label="Cambiar imagen"
                    />
                  </>
                ) : (
                  <button
                    onClick={() => inputRefs.current[i]?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-7 w-7" />}
                    <span className="text-[10px] uppercase tracking-wider">Subir foto</span>
                  </button>
                )}
              </div>
              <Input
                value={cell.caption || ""}
                placeholder="Descripción..."
                className="h-7 text-[11px] text-center"
                onChange={(e) =>
                  setCells(prev => prev.map(c => c.position === i ? { ...c, caption: e.target.value } : c))
                }
                onBlur={(e) => persist(i, { caption: e.target.value })}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
