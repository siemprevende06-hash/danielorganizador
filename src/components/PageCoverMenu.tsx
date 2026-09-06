import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ImagePlus, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageCovers } from '@/contexts/PageCoversContext';
import { useImageUpload } from '@/hooks/useImageUpload';

export function PageCoverMenu({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const { covers, setCover, removeCover } = usePageCovers();
  const { uploadImage } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCover = !!covers?.[pathname];

  const handleFile = async (file: File) => {
    const url = await uploadImage(file, 'covers');
    if (url) {
      setCover(pathname, url);
      toast.success('Portada agregada');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              className
            )}
            title="Opciones de la página"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-2" />
            {hasCover ? 'Cambiar portada' : 'Agregar portada'}
          </DropdownMenuItem>
          {hasCover && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  removeCover(pathname);
                  toast.success('Portada eliminada');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Quitar portada
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
  );
}