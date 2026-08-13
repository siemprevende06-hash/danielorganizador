import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { useImageUpload } from "@/hooks/useImageUpload"
import { cacheImageNow, precacheImages } from "@/lib/imageCache"
import { storeImageFromFile, removeImageBlob, getImageBlob, storeImageBlob } from "@/lib/imageStore"
import { useTextSection } from "@/hooks/useTextSection"
import { ImagePlus, X, Loader2, Maximize2, Images } from "lucide-react"
import { ImageLightbox } from "@/components/ImageLightbox"
import { CachedImage } from "@/components/CachedImage"

interface GaleriaCard {
  id: string
  image_url: string | null
}

interface GaleriaData {
  tarjetas: GaleriaCard[]
}

const CARD_COUNT = 9

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

function makeCards(): GaleriaCard[] {
  return Array.from({ length: CARD_COUNT }, () => ({ id: uid(), image_url: null }))
}

export function NecesidadGaleria({ necesidadId }: { necesidadId: string }) {
  const { data, setData, loading } = useTextSection<GaleriaData>(`mapa-galeria-${necesidadId}`, {
    tarjetas: makeCards(),
  })
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const { uploadImage } = useImageUpload()

  const tarjetas = useMemo(() => {
    const actual = data.tarjetas
    if (actual.length === CARD_COUNT) return actual
    const padded = actual.slice(0, CARD_COUNT)
    while (padded.length < CARD_COUNT) padded.push({ id: uid(), image_url: null })
    return padded
  }, [data.tarjetas])

  useEffect(() => {
    if (data.tarjetas.length !== CARD_COUNT) {
      setData({ tarjetas })
    }
  }, [tarjetas, data.tarjetas, setData])

  useEffect(() => {
    const urls = tarjetas.map((c) => c.image_url).filter(Boolean) as string[]
    if (urls.length === 0) return

    precacheImages(urls)

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRECACHE_PHOTOS",
        urls,
      })
    }

    urls.forEach((url) => {
      getImageBlob(url).then((existing) => {
        if (existing) return
        fetch(url, { mode: "cors" })
          .then((res) => {
            if (res.ok) res.blob().then((blob) => storeImageBlob(url, blob))
          })
          .catch(() => {})
      })
    })
  }, [tarjetas])

  const handleFile = async (cardId: string, file: File) => {
    setUploadingId(cardId)
    const url = await uploadImage(file, "mapa")
    if (url) {
      cacheImageNow(url)
      storeImageFromFile(url, file)
      setData({ tarjetas: tarjetas.map((c) => (c.id === cardId ? { ...c, image_url: url } : c)) })
    }
    setUploadingId(null)
  }

  const clearImage = (cardId: string) => {
    const card = tarjetas.find((c) => c.id === cardId)
    if (card?.image_url) removeImageBlob(card.image_url)
    setData({ tarjetas: tarjetas.map((c) => (c.id === cardId ? { ...c, image_url: null } : c)) })
  }

  const setInputRef = (cardId: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(cardId, el)
    else inputRefs.current.delete(cardId)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Images className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Fotos de este deseo</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">Toca para subir desde tu galería</span>
      </div>
      {loading && (
        <div className="h-24 animate-pulse bg-muted/40 rounded-xl mb-2" />
      )}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {tarjetas.map((card) => {
          const isUploading = uploadingId === card.id
          return (
            <div key={card.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group">
              <input
                ref={(el) => setInputRef(card.id, el)}
                type="file"
                accept="image/*,.gif,.mp4,.webm,.mov"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(card.id, f)
                  e.target.value = ""
                }}
              />

              {card.image_url ? (
                <>
                  <CachedImage src={card.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => clearImage(card.id)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setLightboxSrc(card.image_url)}
                    className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    aria-label="Ampliar imagen"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => inputRefs.current.get(card.id)?.click()}
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10"
                    aria-label="Cambiar imagen"
                  />
                </>
              ) : (
                <button
                  onClick={() => inputRefs.current.get(card.id)?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-[9px] uppercase tracking-wider font-medium">Galería</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </Card>
  )
}