import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ImagePlus, MoreHorizontal, SmilePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageCovers } from '@/contexts/PageCoversContext';
import { usePageIcons } from '@/contexts/PageIconsContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { emojiList } from '@/lib/pages';

export function PageCoverMenu({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const { covers, setCover, removeCover } = usePageCovers();
  const { icons, setIcon, removeIcon } = usePageIcons();
  const { uploadImage } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCover = !!covers?.[pathname];
  const hasIcon = !!icons?.[pathname];

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

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SmilePlus className="h-4 w-4 mr-2" />
              {hasIcon ? 'Cambiar icono' : 'Agregar icono de página'}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-2 w-[15.5rem]">
              <DropdownMenuLabel className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Elige un icono
              </DropdownMenuLabel>
              <div className="grid grid-cols-6 gap-1">
                {emojiList().map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setIcon(pathname, emoji);
                      toast.success('Icono actualizado');
                    }}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent',
                      icons?.[pathname] === emoji && 'bg-accent ring-1 ring-primary'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {(hasCover || hasIcon) && (
            <>
              <DropdownMenuSeparator />
              {hasIcon && (
                <DropdownMenuItem
                  onClick={() => {
                    removeIcon(pathname);
                    toast.success('Icono eliminado');
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Quitar icono
                </DropdownMenuItem>
              )}
              {hasCover && (
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
              )}
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