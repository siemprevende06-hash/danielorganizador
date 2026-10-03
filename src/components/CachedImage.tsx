import { useEffect, useRef, useState } from "react";
import { getImageBlob, removeImageBlob, storeImageBlob } from "@/lib/imageStore";
import { cacheImageNow } from "@/lib/imageCache";
import { isVideoUrl } from "@/lib/utils";

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

const CACHE_NAME = "supabase-storage";

async function getFromCacheObject(url: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      const blob = await cached.blob();
      if (blob && blob.size > 0) return URL.createObjectURL(blob);
    }
  } catch {}
  return null;
}

// Chrome no inspecciona el contenido de un blob: sin MIME válido la <img> queda en blanco.
function canDecode(objectUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = objectUrl;
  });
}

async function purgeLocalCopies(url: string): Promise<void> {
  await removeImageBlob(url);
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
  } catch {
    // Caché no disponible: la URL original ya está en pantalla.
  }
}

async function localCandidate(url: string): Promise<string | null> {
  const stored = await getImageBlob(url);
  if (stored && stored.size > 0) return URL.createObjectURL(stored);
  return getFromCacheObject(url);
}

// La copia local solo se usa si el navegador logra pintarla; si no, se descarta
// para que la URL original vuelva a mandar en vez de dejar un hueco en blanco.
async function resolveCachedSource(url: string, validate: boolean): Promise<string | null> {
  const local = await localCandidate(url);
  if (!local) return null;
  if (validate && !(await canDecode(local))) {
    URL.revokeObjectURL(local);
    await purgeLocalCopies(url);
    return null;
  }
  return local;
}

export function CachedImage({ src, alt, className, onLoad }: CachedImageProps) {
  const [localSrc, setLocalSrc] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);
  const isVideo = isVideoUrl(src);

  useEffect(() => {
    let active = true;
    loadedRef.current = false;
    setLocalSrc(null);

    resolveCachedSource(src, !isVideo)
      .then((local) => {
        if (!local) return;
        if (!active) {
          URL.revokeObjectURL(local);
          return;
        }
        objectUrlsRef.current.push(local);
        setLocalSrc(local);
      })
      .catch(() => {});

    return () => {
      active = false;
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, [src, isVideo]);

  const persistToCaches = () => {
    try {
      cacheImageNow(src);
    } catch {}
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRECACHE_PHOTOS",
        urls: [src],
      });
    }
    fetch(src, { mode: "cors" })
      .then(async (res) => {
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 0) await storeImageBlob(src, blob);
        }
      })
      .catch(() => {});
  };

  const handleLoad = () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (!localSrc) persistToCaches();
    onLoad?.();
  };

  const handleError = () => {
    // La copia local estaba corrupta: volver a la URL original.
    if (localSrc) {
      setLocalSrc(null);
      return;
    }
    // Sin red o URL bloqueada: reintentar con la copia cacheada.
    resolveCachedSource(src, !isVideo)
      .then((local) => {
        if (!local) return;
        objectUrlsRef.current.push(local);
        setLocalSrc(local);
      })
      .catch(() => {});
  };

  const displaySrc = localSrc ?? src;

  if (isVideo) {
    return (
      <video
        src={displaySrc}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={handleError}
        onLoadedData={handleLoad}
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}