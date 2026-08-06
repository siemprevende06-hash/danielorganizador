import { useState, useEffect, useRef } from "react";
import { getImageDataURL, getImageBlob, storeImageBlob } from "@/lib/imageStore";
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

async function resolveCachedSource(src: string, isVideo: boolean): Promise<string | null> {
  const stored = await getImageBlob(src);
  if (stored && stored.size > 0) {
    if (isVideo) return URL.createObjectURL(stored);
    const dataUrl = await getImageDataURL(src);
    if (dataUrl) return dataUrl;
  }
  return getFromCacheObject(src);
}

export function CachedImage({ src, alt, className, onLoad }: CachedImageProps) {
  const [localSrc, setLocalSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "local" | "url">("loading");
  const loadedRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);
  const isVideo = isVideoUrl(src);

  useEffect(() => {
    let active = true;
    (async () => {
      loadedRef.current = false;
      objectUrlRef.current = null;
      setLocalSrc(null);
      setStatus("loading");

      const cached = await resolveCachedSource(src, isVideo);
      if (!active) return;

      if (cached) {
        objectUrlRef.current = cached;
        setLocalSrc(cached);
        setStatus("local");
      } else {
        setStatus("url");
      }
    })();
    return () => {
      active = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
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
    if (status === "url") persistToCaches();
    onLoad?.();
  };

  if (isVideo) {
    return (
      <video
        src={status === "local" ? localSrc ?? undefined : src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={handleLoad}
      />
    );
  }

  if (status === "local" && localSrc) {
    return (
      <img src={localSrc} alt={alt} className={className} onLoad={handleLoad} />
    );
  }

  if (status === "url") {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        crossOrigin="anonymous"
      />
    );
  }

  return null;
}