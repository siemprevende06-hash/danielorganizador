import { useEffect, useRef, useState } from "react";
import { getImageBlob, storeImageBlob } from "@/lib/imageStore";
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

async function resolveCachedSource(url: string): Promise<string | null> {
  const stored = await getImageBlob(url);
  if (stored && stored.size > 0) return URL.createObjectURL(stored);
  return getFromCacheObject(url);
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

    resolveCachedSource(src)
      .then((local) => {
        if (!active || !local) return;
        objectUrlsRef.current.push(local);
        setLocalSrc(local);
      })
      .catch(() => {});

    return () => {
      active = false;
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, [src]);

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
    resolveCachedSource(src)
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