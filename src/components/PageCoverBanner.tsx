import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePageCovers } from '@/contexts/PageCoversContext';
import { useImageUpload } from '@/hooks/useImageUpload';

export function PageCoverBanner() {
  const { pathname } = useLocation();
  const { covers, setCover, removeCover } = usePageCovers();
  const { uploadImage } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const url = covers?.[pathname];

  if (!url) return null;

  const handleFile = async (file: File) => {
    const newUrl = await uploadImage(file, 'covers');
    if (newUrl) {
      setCover(pathname, newUrl);
      toast.success('Portada actualizada');
    }
  };

  return (
    <div className="group relative w-full overflow-hidden">
      <img
        src={url}
        alt="Portada"
        className="h-40 w-full object-cover sm:h-52 md:h-56"
      />
      <div className="absolute inset-0 hidden items-start justify-end gap-2 bg-black/10 p-3 group-hover:flex">
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
    </div>
  );
}