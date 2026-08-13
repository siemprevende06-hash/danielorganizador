import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob, getImageBlob, storeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { ImagePlus, X, Loader2, Maximize2, Images } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
const CARD_COUNT = 9;
function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function makeCards() {
  return Array.from({ length: CARD_COUNT }, () => ({ id: uid(), image_url: null }));
}
function NecesidadGaleria({ necesidadId }) {
  const { data, setData, loading } = useTextSection(`mapa-galeria-${necesidadId}`, {
    tarjetas: makeCards()
  });
  const [uploadingId, setUploadingId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const inputRefs = useRef(/* @__PURE__ */ new Map());
  const { uploadImage } = useImageUpload();
  const tarjetas = useMemo(() => {
    const actual = data.tarjetas;
    if (actual.length === CARD_COUNT) return actual;
    const padded = actual.slice(0, CARD_COUNT);
    while (padded.length < CARD_COUNT) padded.push({ id: uid(), image_url: null });
    return padded;
  }, [data.tarjetas]);
  useEffect(() => {
    if (data.tarjetas.length !== CARD_COUNT) {
      setData({ tarjetas });
    }
  }, [tarjetas, data.tarjetas, setData]);
  useEffect(() => {
    const urls = tarjetas.map((c) => c.image_url).filter(Boolean);
    if (urls.length === 0) return;
    precacheImages(urls);
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRECACHE_PHOTOS",
        urls
      });
    }
    urls.forEach((url) => {
      getImageBlob(url).then((existing) => {
        if (existing) return;
        fetch(url, { mode: "cors" }).then((res) => {
          if (res.ok) res.blob().then((blob) => storeImageBlob(url, blob));
        }).catch(() => {
        });
      });
    });
  }, [tarjetas]);
  const handleFile = async (cardId, file) => {
    setUploadingId(cardId);
    const url = await uploadImage(file, "mapa");
    if (url) {
      cacheImageNow(url);
      storeImageFromFile(url, file);
      setData({ tarjetas: tarjetas.map((c) => c.id === cardId ? { ...c, image_url: url } : c) });
    }
    setUploadingId(null);
  };
  const clearImage = (cardId) => {
    const card = tarjetas.find((c) => c.id === cardId);
    if (card?.image_url) removeImageBlob(card.image_url);
    setData({ tarjetas: tarjetas.map((c) => c.id === cardId ? { ...c, image_url: null } : c) });
  };
  const setInputRef = (cardId, el) => {
    if (el) inputRefs.current.set(cardId, el);
    else inputRefs.current.delete(cardId);
  };
  return /* @__PURE__ */ _jsxs(Card, { className: "p-4", children: [
    /* @__PURE__ */ _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ _jsx(Images, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ _jsx("h3", { className: "text-sm font-semibold", children: "Fotos de este deseo" }),
      /* @__PURE__ */ _jsx("span", { className: "text-[10px] text-muted-foreground ml-auto", children: "Toca para subir desde tu galer\xEDa" })
    ] }),
    loading && /* @__PURE__ */ _jsx("div", { className: "h-24 animate-pulse bg-muted/40 rounded-xl mb-2" }),
    /* @__PURE__ */ _jsx("div", { className: "grid grid-cols-3 gap-2 md:gap-3", children: tarjetas.map((card) => {
      const isUploading = uploadingId === card.id;
      return /* @__PURE__ */ _jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group", children: [
        /* @__PURE__ */ _jsx(
          "input",
          {
            ref: (el) => setInputRef(card.id, el),
            type: "file",
            accept: "image/*,.gif,.mp4,.webm,.mov",
            className: "hidden",
            onChange: (e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(card.id, f);
              e.target.value = "";
            }
          }
        ),
        card.image_url ? /* @__PURE__ */ _jsxs(_Fragment, { children: [
          /* @__PURE__ */ _jsx(CachedImage, { src: card.image_url, alt: "", className: "w-full h-full object-cover" }),
          /* @__PURE__ */ _jsx(
            "button",
            {
              onClick: () => clearImage(card.id),
              className: "absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20",
              "aria-label": "Quitar imagen",
              children: /* @__PURE__ */ _jsx(X, { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ _jsx(
            "button",
            {
              onClick: () => setLightboxSrc(card.image_url),
              className: "absolute top-1 left-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20",
              "aria-label": "Ampliar imagen",
              children: /* @__PURE__ */ _jsx(Maximize2, { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ _jsx(
            "button",
            {
              onClick: () => inputRefs.current.get(card.id)?.click(),
              className: "absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10",
              "aria-label": "Cambiar imagen"
            }
          )
        ] }) : /* @__PURE__ */ _jsx(
          "button",
          {
            onClick: () => inputRefs.current.get(card.id)?.click(),
            disabled: isUploading,
            className: "absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
            children: isUploading ? /* @__PURE__ */ _jsx(Loader2, { className: "h-5 w-5 animate-spin" }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [
              /* @__PURE__ */ _jsx(ImagePlus, { className: "h-6 w-6" }),
              /* @__PURE__ */ _jsx("span", { className: "text-[9px] uppercase tracking-wider font-medium", children: "Galer\xEDa" })
            ] })
          }
        )
      ] }, card.id);
    }) }),
    /* @__PURE__ */ _jsx(ImageLightbox, { src: lightboxSrc, onClose: () => setLightboxSrc(null) })
  ] });
}
export {
  NecesidadGaleria
};