import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePageCovers } from '@/contexts/PageCoversContext';
import { usePageIcons } from '@/contexts/PageIconsContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageIconPicker } from '@/components/notion/PageIconPicker';
import { cn } from '@/lib/utils';

const COVER_HEIGHT = 'h-40 sm:h-52 md:h-56';
const ICON_ROW = 'container mx-auto px-4';

export function PageCoverBanner() {
  const { pathname } = useLocation();
  const { covers, setCover, removeCover } = usePageCovers();
  const { getIcon, setIcon, removeIcon } = usePageIcons();
  const { uploadImage } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [iconOpen, setIconOpen] = useState(false);

  const url = covers?.[pathname];
  const icon = getIcon(pathname);

  if (!url && !icon) return null;

  const handleFile = async (file: File) => {
    const newUrl = await uploadImage(file, 'covers');
    if (newUrl) {
      setCover(pathname, newUrl);
      toast.success('Portada actualizada');
    }
  };

  return (
    <div className={cn('group relative w-full', !url && 'pt-6')}>
      {url && (
        <img
          src={url}
          alt="Portada"
          className={cn('w-full object-cover', COVER_HEIGHT)}
        />
      )}

      {url && (
        <>
          <div
            className={cn(
              'absolute inset-x-0 top-0 hidden items-start justify-end gap-2 bg-black/10 p-3 group-hover:flex',
              COVER_HEIGHT
            )}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/60"
            >
              <Pencil className="h-3.5 w-3.5" /> Cambiar
            </button>
            <button
              type="button"
              onClick={() => {
                removeCover(pathname);
                toast.success('Portada eliminada');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/60"
            >
              <Trash2 className="h-3.5 w-3.5" /> Quitar
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
        </>
      )}

      {icon && (
        <div className={ICON_ROW}>
          <div className={cn(url ? '-mt-9' : 'pt-0')}>
            <Popover open={iconOpen} onOpenChange={setIconOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Cambiar icono de la página"
                  className="select-none text-4xl leading-none drop-shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                >
                  {icon}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <PageIconPicker
                  currentIcon={icon}
                  onSelect={(next) => {
                    if (next) setIcon(pathname, next);
                    else removeIcon(pathname);
                    setIconOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}