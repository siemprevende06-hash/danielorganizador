import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { isVideoUrl } from "@/lib/utils";
export function ImageLightbox({ src, onClose, alt = "" }) {
    useEffect(() => {
        if (!src)
            return;
        const handler = (e) => e.key === "Escape" && onClose();
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handler);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handler);
        };
    }, [src, onClose]);
    if (!src)
        return null;
    const isVideo = isVideoUrl(src);
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in", onClick: onClose, children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center", "aria-label": "Cerrar", children: _jsx(X, { className: "h-5 w-5" }) }), isVideo ? (_jsx("video", { src: src, className: "max-w-full max-h-full object-contain", controls: true, autoPlay: true, onClick: (e) => e.stopPropagation() })) : (_jsx("img", { src: src, alt: alt, className: "max-w-full max-h-full object-contain", onClick: (e) => e.stopPropagation() }))] }), document.body);
}
