import { useRef } from "react"
import { Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const COVER_GRADIENTS = [
  "from-blue-600/40 to-cyan-500/40",
  "from-purple-600/40 to-pink-500/40",
  "from-emerald-600/40 to-teal-500/40",
  "from-amber-600/40 to-orange-500/40",
  "from-rose-600/40 to-red-500/40",
  "from-indigo-600/40 to-violet-500/40",
  "from-lime-600/40 to-green-500/40",
  "from-sky-600/40 to-blue-500/40",
]

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
  }
  return Math.abs(hash)
}

export function getCoverGradient(id: string): string {
  return COVER_GRADIENTS[hashId(id) % COVER_GRADIENTS.length]
}

interface AreaCoverProps {
  cover?: string | null
  gradient: string
  label: string
  icon?: string
  showCamera?: boolean
  uploading?: boolean
  onUpload?: (file: File) => void
  className?: string
}

export function AreaCover({
  cover,
  gradient,
  label,
  icon,
  showCamera,
  uploading,
  onUpload,
  className,
}: AreaCoverProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className={cn("relative bg-gradient-to-br overflow-hidden", gradient, className)}>
      {cover ? (
        <img
          src={cover}
          alt={`Portada de ${label}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      {!cover ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl drop-shadow-sm">{icon ?? "🖼️"}</span>
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-1.5 flex items-end">
        <span className="text-xs sm:text-sm font-bold text-white drop-shadow-sm truncate">
          {label}
        </span>
      </div>

      {showCamera && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && onUpload) onUpload(file)
              e.target.value = ""
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
    </div>
  )
}