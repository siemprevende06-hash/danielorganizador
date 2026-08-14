import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { generateId } from '@/lib/pages';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Type, Heading1, Heading2, Heading3, CheckSquare, List, ListOrdered, Quote, Minus, Code, } from 'lucide-react';
const commands = [
    { type: 'paragraph', label: 'Texto', icon: _jsx(Type, { className: "h-4 w-4" }), description: 'Párrafo simple' },
    { type: 'heading1', label: 'Título 1', icon: _jsx(Heading1, { className: "h-4 w-4" }), description: 'Encabezado grande' },
    { type: 'heading2', label: 'Título 2', icon: _jsx(Heading2, { className: "h-4 w-4" }), description: 'Encabezado mediano' },
    { type: 'heading3', label: 'Título 3', icon: _jsx(Heading3, { className: "h-4 w-4" }), description: 'Encabezado pequeño' },
    { type: 'todo', label: 'Tarea', icon: _jsx(CheckSquare, { className: "h-4 w-4" }), description: 'Lista de tareas' },
    { type: 'bullet_list', label: 'Lista viñetas', icon: _jsx(List, { className: "h-4 w-4" }), description: 'Lista con bullets' },
    { type: 'numbered_list', label: 'Lista numerada', icon: _jsx(ListOrdered, { className: "h-4 w-4" }), description: 'Lista numerada' },
    { type: 'quote', label: 'Cita', icon: _jsx(Quote, { className: "h-4 w-4" }), description: 'Cita en bloque' },
    { type: 'divider', label: 'Divisor', icon: _jsx(Minus, { className: "h-4 w-4" }), description: 'Línea divisoria' },
    { type: 'code', label: 'Código', icon: _jsx(Code, { className: "h-4 w-4" }), description: 'Bloque de código' },
];
function placeholder(type) {
    switch (type) {
        case 'heading1': return 'Título 1';
        case 'heading2': return 'Título 2';
        case 'heading3': return 'Título 3';
        case 'todo': return 'Tarea pendiente...';
        case 'bullet_list': return 'Lista';
        case 'numbered_list': return 'Lista numerada';
        case 'quote': return 'Cita...';
        case 'code': return 'Escribe código...';
        default: return 'Escribe aquí...';
    }
}
function BlockRow({ block, onUpdate, onDelete, onSplit, onArrow, autoFocus, onSlashOpen, slashOpen, }) {
    const ref = useRef(null);
    const [slashQuery, setSlashQuery] = useState('');
    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
            moveCursorToEnd(ref.current);
        }
    }, []);
    useEffect(() => {
        if (!ref.current || document.activeElement === ref.current)
            return;
        ref.current.innerText = block.content || '';
    }, [block.id]);
    const handleInput = () => {
        const text = ref.current?.innerText || '';
        onUpdate({ content: text });
        if (text.startsWith('/')) {
            onSlashOpen(true);
            setSlashQuery(text.slice(1));
        }
        else {
            onSlashOpen(false);
        }
    };
    const handleKey = (e) => {
        const el = ref.current;
        if (!el)
            return;
        if (slashOpen) {
            if (e.key === 'Escape') {
                onSlashOpen(false);
                if (ref.current)
                    ref.current.innerText = '';
            }
            if (e.key === 'Enter')
                e.preventDefault();
            return;
        }
        const text = el.innerText || '';
        const caret = caretOffset(el);
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const before = text.slice(0, caret);
            const after = text.slice(caret);
            onSplit(before, after);
            return;
        }
        if (e.key === 'Backspace' && text === '') {
            e.preventDefault();
            onDelete();
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onArrow('up');
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            onArrow('down');
        }
    };
    const handleSlashSelect = (type) => {
        onSlashOpen(false);
        if (type === 'divider') {
            onUpdate({ type: 'divider', content: '—————————————————' });
        }
        else {
            onUpdate({ type, content: '' });
        }
        setTimeout(() => { if (ref.current) {
            ref.current.innerText = '';
            ref.current.focus();
        } }, 0);
    };
    if (block.type === 'divider') {
        return _jsx("div", { className: "py-2", children: _jsx("div", { className: "border-t border-border" }) });
    }
    const filtered = commands.filter(c => c.label.toLowerCase().includes(slashQuery.toLowerCase()));
    return (_jsxs("div", { className: "relative group flex items-start gap-2 py-0.5", children: [_jsx("div", { className: "absolute -left-6 top-1 opacity-0 group-hover:opacity-40 text-muted-foreground cursor-grab text-xs", children: "\u22EE\u22EE" }), block.type === 'todo' && (_jsx(Checkbox, { checked: block.checked || false, onCheckedChange: (v) => onUpdate({ checked: !!v }), className: "mt-1.5" })), block.type === 'bullet_list' && (_jsx("span", { className: "mt-1.5 text-muted-foreground select-none shrink-0 text-sm", children: "\u2022" })), block.type === 'numbered_list' && (_jsx("span", { className: "mt-1.5 text-muted-foreground select-none shrink-0 text-xs w-4 text-right", children: "1." })), block.type === 'quote' && (_jsx("div", { className: "absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20 rounded-full" })), _jsx("div", { ref: ref, contentEditable: true, suppressContentEditableWarning: true, "data-placeholder": placeholder(block.type), className: cn('outline-none w-full whitespace-pre-wrap break-words min-h-[1.5em] leading-relaxed', 'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40', block.type === 'heading1' && 'text-3xl font-bold', block.type === 'heading2' && 'text-2xl font-semibold', block.type === 'heading3' && 'text-xl font-medium', block.type === 'quote' && 'pl-4 italic text-muted-foreground', block.type === 'code' && 'font-mono text-sm bg-muted rounded-md p-2', block.checked && block.type === 'todo' && 'line-through text-muted-foreground/60'), onInput: handleInput, onKeyDown: handleKey }), slashOpen && (_jsxs("div", { className: "absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover shadow-lg p-1", children: [_jsx("p", { className: "px-2 py-1 text-xs text-muted-foreground", children: "Comandos" }), _jsx("div", { className: "max-h-48 overflow-y-auto space-y-0.5", children: filtered.map(cmd => (_jsxs("button", { className: "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent text-left", onClick: () => handleSlashSelect(cmd.type), children: [_jsx("span", { className: "text-muted-foreground", children: cmd.icon }), _jsx("span", { className: "font-medium", children: cmd.label }), _jsx("span", { className: "text-xs text-muted-foreground ml-auto", children: cmd.description })] }, cmd.type))) })] }))] }));
}
export function BlockEditor({ blocks, onChange }) {
    const [slashIdx, setSlashIdx] = useState(null);
    const updateBlock = useCallback((idx, updates) => {
        const next = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b);
        onChange(next);
    }, [blocks, onChange]);
    const deleteBlock = useCallback((idx) => {
        if (blocks.length <= 1) {
            onChange([{ id: generateId(), type: 'paragraph', content: '' }]);
            return;
        }
        const next = blocks.filter((_, i) => i !== idx);
        onChange(next);
    }, [blocks, onChange]);
    const splitBlock = useCallback((idx, before, after) => {
        updateBlock(idx, { content: before });
        const newBlock = { id: generateId(), type: 'paragraph', content: after };
        const next = [...blocks];
        next.splice(idx + 1, 0, newBlock);
        onChange(next);
    }, [blocks, onChange, updateBlock]);
    const moveArrow = useCallback((idx, dir) => {
        const target = dir === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= blocks.length)
            return;
        const el = document.querySelector(`[data-block-row="${target}"]`)?.querySelector('[contenteditable]');
        if (el)
            el.focus();
    }, [blocks.length]);
    if (blocks.length === 0) {
        const first = { id: generateId(), type: 'paragraph', content: '' };
        onChange([first]);
        return null;
    }
    return (_jsx("div", { className: "space-y-1", children: blocks.map((block, idx) => (_jsx("div", { "data-block-row": idx, children: _jsx(BlockRow, { block: block, onUpdate: (u) => updateBlock(idx, u), onDelete: () => deleteBlock(idx), onSplit: (before, after) => splitBlock(idx, before, after), onArrow: (dir) => moveArrow(idx, dir), autoFocus: false, slashOpen: slashIdx === idx, onSlashOpen: (open) => setSlashIdx(open ? idx : null) }) }, block.id))) }));
}
function caretOffset(el) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount)
        return 0;
    const range = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
}
function moveCursorToEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
}
