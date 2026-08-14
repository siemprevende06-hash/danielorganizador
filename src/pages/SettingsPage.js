import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, BookOpen, Save, CloudUpload, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { syncAll } from '@/lib/dataSync';
import { getTimeUnit, setTimeUnit as persistTimeUnit } from '@/lib/timeUnit';
import { getSetting, setSetting } from '@/lib/settings';
import { cn } from '@/lib/utils';
export default function SettingsPage() {
    const { toast } = useToast();
    const [booksPerMonth, setBooksPerMonth] = useState(2);
    const [timeUnit, setTimeUnit] = useState(() => getTimeUnit());
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncReport, setLastSyncReport] = useState(null);
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        try {
            const data = await getSetting('reading_goals');
            if (data) {
                setBooksPerMonth(data.books_per_month || 2);
            }
        }
        catch (error) {
            console.error('Error loading settings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const saveReadingGoals = async () => {
        try {
            const ok = await setSetting('reading_goals', { books_per_month: booksPerMonth });
            if (!ok)
                throw new Error('No se pudo guardar');
            toast({ title: 'Configuración guardada' });
        }
        catch (error) {
            console.error('Error saving settings:', error);
            toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
        }
    };
    if (loading) {
        return _jsx("div", { className: "container mx-auto px-4 py-24", children: _jsx("p", { className: "text-muted-foreground", children: "Cargando..." }) });
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(Settings, { className: "h-8 w-8" }), "Configuraci\u00F3n"] }), _jsx("p", { className: "text-muted-foreground", children: "Ajusta los par\u00E1metros de cada \u00E1rea" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Clock, { className: "h-5 w-5" }), "Unidades de tiempo"] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "time-unit", children: "Indicadores de Semana \u00B7 Mes \u00B7 Trimestre \u00B7 A\u00F1o" }), _jsx("div", { className: "inline-flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/40", children: ['min', 'h'].map(u => (_jsx("button", { onClick: () => { setTimeUnit(u); persistTimeUnit(u); }, className: cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", timeUnit === u ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"), children: u === 'min' ? 'Minutos' : 'Horas' }, u))) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Los anillos del panel de control en las p\u00E1ginas Semana, Mes, Trimestre y A\u00F1o muestran minutaje en la unidad que elijas. Se aplica al instante, sin recargar." })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(BookOpen, { className: "h-5 w-5" }), "Lectura"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "books-per-month", children: "Cantidad de libros al mes" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Input, { id: "books-per-month", type: "number", min: 1, max: 10, value: booksPerMonth, onChange: (e) => setBooksPerMonth(parseInt(e.target.value) || 1), className: "w-24" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "libros/mes" })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Este valor se usar\u00E1 como objetivo en la p\u00E1gina de Lectura" })] }), _jsxs(Button, { onClick: saveReadingGoals, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Guardar"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(CloudUpload, { className: "h-5 w-5" }), "Sincronizaci\u00F3n de Datos"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Tus datos est\u00E1n actualmente en el navegador (localStorage). Sincron\u00EDzalos con la nube (Supabase) para que el Inicio y otras pantallas muestren datos reales." }), _jsxs(Button, { onClick: async () => {
                                    setSyncing(true);
                                    try {
                                        const report = await syncAll();
                                        setLastSyncReport(report);
                                        if (report.totalFailed === 0) {
                                            toast({ title: 'Sincronización completa', description: `${report.totalSuccess} registros sincronizados` });
                                        }
                                        else {
                                            toast({ title: 'Sincronización parcial', description: `${report.totalSuccess} ok, ${report.totalFailed} fallos`, variant: 'destructive' });
                                        }
                                    }
                                    catch (err) {
                                        toast({ title: 'Error', description: 'No se pudo sincronizar', variant: 'destructive' });
                                    }
                                    finally {
                                        setSyncing(false);
                                    }
                                }, disabled: syncing, className: "w-full gap-2", children: [syncing ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(CloudUpload, { className: "h-4 w-4" })), syncing ? 'Sincronizando...' : 'Sincronizar datos locales → Nube'] }), lastSyncReport && (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { className: "font-medium text-foreground", children: ["\u00DAltima sincronizaci\u00F3n: ", new Date(lastSyncReport.timestamp).toLocaleTimeString()] }), _jsx("div", { className: "space-y-1", children: lastSyncReport.results.map(r => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-muted-foreground capitalize", children: r.table }), _jsx("span", { className: r.success ? 'text-green-500' : 'text-red-500', children: r.success ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "h-3 w-3 inline mr-1" }), r.count, " registros"] })) : (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "h-3 w-3 inline mr-1" }), r.error || 'falló'] })) })] }, r.table))) })] })), _jsx("div", { className: "p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20", children: _jsxs("p", { className: "text-xs text-yellow-700", children: [_jsx("strong", { children: "Nota:" }), " La sincronizaci\u00F3n env\u00EDa tus datos de localStorage a Supabase. No elimina datos locales. Despu\u00E9s de sincronizar, recarga la p\u00E1gina para ver los cambios en el Inicio."] }) })] })] })] }));
}
