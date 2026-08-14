import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
export function PillarCard({ pillar, compact = false, onCoverChange }) {
    const [cover, setCover] = useState(pillar.coverUrl || null);
    const fileRef = useRef(null);
    const colorFor = (n) => n >= 80 ? "text-green-500" : n >= 50 ? "text-yellow-500" : n > 0 ? "text-orange-500" : "text-muted-foreground";
    const barFor = (n) => n >= 80 ? "bg-green-500" : n >= 50 ? "bg-yellow-500" : n > 0 ? "bg-orange-500" : "bg-muted";
    const uploadCover = async (file) => {
        const ext = file.name.split(".").pop();
        const path = `pillars/${pillar.id}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("user-images").upload(path, file, { upsert: true });
        if (error) {
            console.error(error);
            return;
        }
        const { data } = supabase.storage.from("user-images").getPublicUrl(path);
        const url = data.publicUrl;
        await supabase.from("pillar_covers").upsert({ pillar_id: pillar.id, cover_url: url, updated_at: new Date().toISOString() });
        setCover(url);
        onCoverChange?.();
    };
    if (compact) {
        return (_jsxs(Link, { to: pillar.route, className: "flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted", children: [_jsx("span", { className: "text-lg", children: pillar.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-medium truncate", children: pillar.name }), _jsxs("span", { className: cn("text-xs font-bold", colorFor(pillar.percentage)), children: [pillar.percentage, "%"] })] }), _jsx("div", { className: "h-1 mt-1 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full", barFor(pillar.percentage)), style: { width: `${pillar.percentage}%` } }) })] })] }));
    }
    return (_jsxs("div", { className: cn("relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md group", pillar.status === "completed" && "border-green-500/50"), children: [_jsxs(Link, { to: pillar.route, className: "block relative h-24 bg-gradient-to-br from-primary/20 to-primary/5", children: [cover ? (_jsx("img", { src: cover, alt: pillar.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-4xl opacity-40", children: pillar.icon })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" }), _jsx("span", { className: "absolute top-2 left-2 text-2xl drop-shadow", children: pillar.icon }), _jsxs("span", { className: cn("absolute top-2 right-2 text-xl font-bold drop-shadow", colorFor(pillar.percentage)), children: [pillar.percentage, "%"] })] }), _jsx("button", { type: "button", onClick: (e) => { e.stopPropagation(); fileRef.current?.click(); }, className: "absolute top-2 right-1/2 translate-x-1/2 bg-background/80 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background", "aria-label": "Cambiar portada", children: _jsx(ImagePlus, { className: "w-3.5 h-3.5" }) }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => { const f = e.target.files?.[0]; if (f)
                    uploadCover(f); } }), _jsxs(Link, { to: pillar.route, className: "block p-3 space-y-2", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("span", { className: "font-semibold text-sm", children: pillar.name }) }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full transition-all", barFor(pillar.percentage)), style: { width: `${pillar.percentage}%` } }) }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-[11px]", children: [_jsxs("div", { className: "rounded bg-muted/60 px-2 py-1", children: [_jsx("div", { className: "text-muted-foreground", children: "Esfuerzo" }), _jsxs("div", { className: cn("font-bold", colorFor(pillar.effort)), children: [pillar.effort, "%"] })] }), _jsxs("div", { className: "rounded bg-muted/60 px-2 py-1", children: [_jsx("div", { className: "text-muted-foreground", children: "Resultados" }), _jsxs("div", { className: cn("font-bold", colorFor(pillar.results)), children: [pillar.results, "%"] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-[11px] text-muted-foreground pt-1", children: [_jsxs("span", { children: ["Tareas ", pillar.tasksCompleted, "/", pillar.tasksTotal] }), pillar.hoursToday > 0 && _jsxs("span", { children: [pillar.hoursToday.toFixed(1), "h"] }), pillar.streak > 0 && _jsxs("span", { children: ["\uD83D\uDD25 ", pillar.streak] })] })] })] }));
}
