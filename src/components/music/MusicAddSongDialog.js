import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
export function MusicAddSongDialog({ open, onOpenChange, instrument, onInstrumentChange, onAdd, }) {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [notes, setNotes] = useState('');
    const reset = () => {
        setTitle('');
        setArtist('');
        setDifficulty('beginner');
        setYoutubeUrl('');
        setNotes('');
    };
    const handleAdd = async () => {
        if (!title.trim())
            return;
        await onAdd({
            title: title.trim(),
            artist: artist.trim() ? artist.trim() : null,
            difficulty,
            youtube_url: youtubeUrl.trim() ? youtubeUrl.trim() : null,
            notes: notes.trim() ? notes.trim() : null,
        });
        reset();
        onOpenChange(false);
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: (v) => { onOpenChange(v); if (!v)
            reset(); }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "w-full sm:w-auto", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Nueva Canci\u00F3n"] }) }), _jsxs(DialogContent, { className: "max-w-[95vw] sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Agregar Canci\u00F3n" }) }), _jsxs("div", { className: "space-y-3 pt-2", children: [_jsxs(Select, { value: instrument, onValueChange: (v) => onInstrumentChange(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "piano", children: "\uD83C\uDFB9 Piano" }), _jsx(SelectItem, { value: "guitar", children: "\uD83C\uDFB8 Guitarra" })] })] }), _jsx(Input, { placeholder: "Nombre de la canci\u00F3n", value: title, onChange: (e) => setTitle(e.target.value) }), _jsx(Input, { placeholder: "Artista", value: artist, onChange: (e) => setArtist(e.target.value) }), _jsxs(Select, { value: difficulty, onValueChange: (v) => setDifficulty(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "beginner", children: "Principiante" }), _jsx(SelectItem, { value: "intermediate", children: "Intermedio" }), _jsx(SelectItem, { value: "advanced", children: "Avanzado" })] })] }), _jsx(Input, { placeholder: "Link YouTube (opcional)", value: youtubeUrl, onChange: (e) => setYoutubeUrl(e.target.value) }), _jsx(Textarea, { placeholder: "Notas...", value: notes, onChange: (e) => setNotes(e.target.value), rows: 2 }), _jsx(Button, { onClick: handleAdd, className: "w-full", children: "Agregar" })] })] })] }));
}
