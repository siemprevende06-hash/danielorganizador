import { useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCoverGradient } from '@/components/areas/AreaCover';

interface SubjectCoverProps {
  subjectId: string;
  label: string;
  cover?: string | null;
  uploading?: boolean;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  className?: string;
}

export function SubjectCover({ subjectId, label, cover, uploading, onUpload, onRemove, className }: SubjectCoverProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const gradient = getCoverGradient(subjectId);

  return (
    <div className={cn('relative bg-gradient-to-br overflow-hidden', gradient, className)}>
      {cover ? (
        <img
          src={cover}
          alt={`Portada de ${label}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      {!cover ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-3xl drop-shadow-sm">🎓</span>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-11 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 flex items-end">
        <span className="text-sm sm:text-base font-bold text-white drop-shadow-sm truncate">{label}</span>
      </div>

      {onUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpload) onUpload(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            aria-label="Cambiar portada"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="absolute top-1.5 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
      {cover && onRemove && (
        <button
          type="button"
          aria-label="Quitar portada"
          onClick={onRemove}
          className="absolute top-9 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-black/50 text-white hover:bg-destructive/80 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}