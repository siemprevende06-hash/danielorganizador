import { useState, useEffect, useRef } from "react";
import { getImageDataURL } from "@/lib/imageStore";
import { isVideoUrl } from "@/lib/utils";

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

const CACHE_NAME = "supabase-storage";

async function getFromCache(url: string): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  return null;
}

export function CachedImage({ src, alt, className, onLoad }: CachedImageProps) {
  const [dataSrc, setDataSrc] = useState<string | null>(null);
  const [useUrl, setUseUrl] = useState(true);
  const loadedRef = useRef(false);
  const objectUrlRef = useRef<string | null>(null);
  const isVideo = isVideoUrl(src);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setDataSrc(null);
    setUseUrl(true);
    loadedRef.current = false;
  }, [src]);

  const handleError = async () => {
    if (loadedRef.current) return;
    setUseUrl(false);

    const cacheUrl = await getFromCache(src);
    if (cacheUrl) {
      objectUrlRef.current = cacheUrl;
      setDataSrc(cacheUrl);
      return;
    }

    const dataUrl = await getImageDataURL(src);
    if (dataUrl) {
      setDataSrc(dataUrl);
    }
  };

  const handleLoad = () => {
    loadedRef.current = true;
    onLoad?.();
  };

  if (isVideo) {
    return (
      <video
        src={useUrl ? src : dataSrc ?? undefined}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={useUrl ? handleError : undefined}
        onLoadedData={handleLoad}
      />
    );
  }

  if (useUrl) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        crossOrigin="anonymous"
      />
    );
  }

  if (dataSrc) {
    return (
      <img
        src={dataSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
      />
    );
  }

  return null;
}
