import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
export function MinutesGoalInput({ value, onApply, label, className, placeholder }) {
    const [draft, setDraft] = useState(String(value || ''));
    useEffect(() => setDraft(String(value || '')), [value]);
    const apply = () => onApply(draft);
    return (_jsxs("div", { className: "flex items-center gap-1.5", children: [label && _jsxs("span", { className: "text-[9px] text-muted-foreground", children: [label, ":"] }), _jsx(Input, { type: "text", inputMode: "numeric", value: draft, onChange: e => setDraft(e.target.value.replace(/\D/g, '')), onBlur: apply, onKeyDown: e => { if (e.key === 'Enter')
                    e.target.blur(); }, className: className || 'h-6 w-20 text-[10px]', placeholder: placeholder || 'min' })] }));
}
