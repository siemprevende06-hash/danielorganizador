import { useState, useEffect, useRef } from "react";
import { getImageDataURL } from "@/lib/imageStore";
import { isVideoUrl } from "@/lib/utils";

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

export function CachedImage({ src, alt, className, onLoad }: CachedImageProps) {
  const [dataSrc, setDataSrc] = useState<string | null>(null);
  const [useUrl, setUseUrl] = useState(true);
  const loadedRef = useRef(false);
  const isVideo = isVideoUrl(src);

  useEffect(() => {
    setDataSrc(null);
    setUseUrl(true);
    loadedRef.current = false;
  }, [src]);

  const handleError = async () => {
    if (loadedRef.current) return;
    setUseUrl(false);
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
