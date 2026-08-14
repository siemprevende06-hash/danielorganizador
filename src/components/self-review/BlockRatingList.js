import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
export function BlockRatingList({ blockRatings, onRatingChange }) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadBlocks();
    }, []);
    const loadBlocks = async () => {
        const { data } = await supabase
            .from('routine_blocks')
            .select('id, block_id, title, start_time, end_time')
            .order('start_time', { ascending: true });
        setBlocks(data || []);
        setLoading(false);
    };
    const formatTime = (time) => {
        const [h, m] = time.split(':').map(Number);
        const hour = h % 12 || 12;
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const getBlockRating = (blockId) => {
        return blockRatings.find(br => br.blockId === blockId);
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return _jsx(CheckCircle2, { className: "w-5 h-5 text-success" });
            case 'partial':
                return _jsx(AlertCircle, { className: "w-5 h-5 text-warning" });
            case 'skipped':
                return _jsx(XCircle, { className: "w-5 h-5 text-destructive" });
            default:
                return null;
        }
    };
    const handleStatusClick = (blockId, currentStatus) => {
        const statuses = ['completed', 'partial', 'skipped'];
        const currentIndex = statuses.indexOf(currentStatus);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        const currentRating = getBlockRating(blockId);
        onRatingChange(blockId, currentRating?.rating || 0, currentRating?.notes, nextStatus);
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => (_jsx("div", { className: "animate-pulse h-16 bg-muted rounded" }, i))) }));
    }
    return (_jsxs("div", { className: "bg-card rounded-lg border border-border p-6", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4", children: "Calificaci\u00F3n por Bloque" }), _jsx("div", { className: "space-y-3", children: blocks.map((block) => {
                    const rating = getBlockRating(block.block_id);
                    return (_jsxs("div", { className: "flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors", children: [_jsx("button", { onClick: () => handleStatusClick(block.block_id, rating?.status), className: "flex-shrink-0 p-1 hover:bg-muted rounded transition-colors", title: "Click para cambiar estado", children: getStatusIcon(rating?.status) || (_jsx("div", { className: "w-5 h-5 rounded-full border-2 border-muted-foreground" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-foreground truncate", children: block.title }), _jsxs("p", { className: "text-xs text-muted-foreground font-mono", children: [formatTime(block.start_time), " - ", formatTime(block.end_time)] })] }), _jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4, 5].map((star) => (_jsx("button", { onClick: () => onRatingChange(block.block_id, star, rating?.notes, rating?.status), className: "p-0.5 hover:scale-110 transition-transform", children: _jsx(Star, { className: `w-5 h-5 ${(rating?.rating || 0) >= star
                                            ? 'fill-foreground text-foreground'
                                            : 'text-muted-foreground'}` }) }, star))) })] }, block.id));
                }) })] }));
}
