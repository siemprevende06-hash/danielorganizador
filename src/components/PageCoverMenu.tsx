import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ImagePlus, MoreHorizontal, Pencil, SmilePlus, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePageCovers } from '@/contexts/PageCoversContext';
import { usePageIcons } from '@/contexts/PageIconsContext';
import { usePageNames } from '@/contexts/PageNamesContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { emojiList } from '@/lib/pages';

export function PageCoverMenu({ className, currentName }: { className?: string; currentName?: string }) {
  const { pathname } = useLocation();
  const { covers, setCover, removeCover } = usePageCovers();
  const { icons, setIcon, removeIcon } = usePageIcons();
  const { setPageName, removePageName, getPageName } = usePageNames();
  const { uploadImage } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCover = !!covers?.[pathname];
  const hasIcon = !!icons?.[pathname];
  const customName = getPageName(pathname);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const openRename = () => {
    setRenameValue(customName || currentName || '');
    setRenameOpen(true);
  };

  const saveRename = () => {
    const value = renameValue.trim();
    if (value) {
      setPageName(pathname, value);
      toast.success('Nombre actualizado');
    } else if (customName) {
      removePageName(pathname);
      toast.success('Nombre restaurado');
    }
    setRenameOpen(false);
  };

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
          <DropdownMenuItem onClick={openRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar nombre
          </DropdownMenuItem>

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
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar nombre de la página</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nombre de la página"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
            }}
          />
          {customName && (
            <p className="text-[10px] text-muted-foreground -mt-1">
              Deja vacío para restaurar el nombre original
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancelar</Button>
            <Button onClick={saveRename}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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