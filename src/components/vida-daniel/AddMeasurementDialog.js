import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Scale, Camera } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
export const AddMeasurementDialog = ({ onSave }) => {
    const [open, setOpen] = useState(false);
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [notes, setNotes] = useState('');
    const [frontPhotoUrl, setFrontPhotoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { uploadImage, uploading } = useImageUpload();
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await uploadImage(file);
            if (url)
                setFrontPhotoUrl(url);
        }
    };
    const handleSubmit = async () => {
        if (!weight)
            return;
        setIsLoading(true);
        await onSave({
            weight: parseFloat(weight),
            body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
            front_photo_url: frontPhotoUrl || undefined,
            notes: notes || undefined
        });
        setWeight('');
        setBodyFat('');
        setNotes('');
        setFrontPhotoUrl('');
        setIsLoading(false);
        setOpen(false);
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Actualizar Peso"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Scale, { className: "h-5 w-5" }), "Registrar Medici\u00F3n"] }) }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "weight", children: "Peso actual (kg) *" }), _jsx(Input, { id: "weight", type: "number", step: "0.1", placeholder: "67.5", value: weight, onChange: (e) => setWeight(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "bodyFat", children: "% Grasa corporal (opcional)" }), _jsx(Input, { id: "bodyFat", type: "number", step: "0.1", placeholder: "15.0", value: bodyFat, onChange: (e) => setBodyFat(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Foto de progreso (opcional)" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors", children: [_jsx(Camera, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: uploading ? 'Subiendo...' : 'Subir foto' }), _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: handlePhotoUpload, disabled: uploading })] }), frontPhotoUrl && (_jsx("img", { src: frontPhotoUrl, alt: "Preview", className: "h-12 w-12 object-cover rounded" }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "notes", children: "Notas (opcional)" }), _jsx(Textarea, { id: "notes", placeholder: "\u00BFC\u00F3mo te sientes hoy?", value: notes, onChange: (e) => setNotes(e.target.value) })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSubmit, disabled: !weight || isLoading, children: isLoading ? 'Guardando...' : 'Guardar' })] })] })] }));
};
