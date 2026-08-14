import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Gauge, CheckSquare, Calendar, DollarSign, Target, ListTodo, ListChecks, Eye, CalendarDays, CalendarRange, Goal, BookOpen, Briefcase, GraduationCap, Wrench, Bell, ChevronDown, CalendarCheck, Menu, Focus, LayoutList, BarChart3, ClipboardCheck, Compass, Settings, Brain, Utensils, Dumbbell, Crown, ShoppingCart, Wifi, WifiOff, CloudOff, Activity, PanelLeftClose, PanelLeft, Sparkles, Zap, Moon, Shirt, Heart, Sun, Flame, LayoutDashboard, FileText, Star, Package, RefreshCw, MapPin, Network } from 'lucide-react';
import { Sheet, SheetContent, } from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { useOffline } from '@/providers/OfflineProvider';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { InstallPrompt } from '@/components/InstallPrompt';
const sidebarGroups = [
    {
        label: 'RUEDA DE LA VIDA',
        items: [
            { path: '/areas-de-vida', label: 'Áreas de Vida', icon: LayoutDashboard },
            { path: '/mapa-de-vida', label: 'Mapa de Vida', icon: Network },
            { path: '/recompensas', label: 'Recompensas', icon: Sparkles },
        ]
    },
    {
        label: null,
        items: [
            { path: '/', label: 'Inicio', icon: Home },
            { path: '/inicio-2', label: 'Inicio 2.0', icon: LayoutDashboard },
            { path: '/control-room', label: 'Control Room', icon: Gauge },
            { path: '/focus', label: 'Focus', icon: Focus },
            { path: '/routine-day', label: 'Rutina del Día', icon: LayoutList },
        ]
    },
    {
        label: 'NECESIDADES',
        items: [
            { path: '/mis-necesidades', label: 'Mis Necesidades', icon: Flame },
            { path: '/vida-social', label: 'Vida Social', icon: Heart },
            { path: '/boxeo', label: 'Boxeo', icon: Target },
            { path: '/habilidades-valiosas', label: 'Habilidades', icon: Star },
        ]
    },
    {
        label: 'LÍNEA DE TIEMPO',
        items: [
            { path: '/daily', label: 'Hoy', icon: CalendarDays },
            { path: '/plan-manana', label: 'Mañana', icon: CalendarDays },
            { path: '/weekly', label: 'Semana', icon: CalendarRange },
            { path: '/monthly', label: 'Mes', icon: Calendar },
            { path: '/12-week-year', label: '3 Meses', icon: CalendarRange },
            { path: '/anual', label: 'Año', icon: CalendarDays },
            { path: '/weeks', label: 'Semanas', icon: CalendarDays },
            { path: '/goals', label: 'Metas', icon: Goal },
            { path: '/destino-a-llegar', label: 'Destino a Llegar', icon: MapPin },
        ]
    },
    {
        label: 'ÁREAS',
        items: [
            { path: '/entrepreneurship', label: 'Emprendimiento', icon: Briefcase },
            { path: '/university', label: 'Universidad', icon: GraduationCap },
            { path: '/projects', label: 'Proyectos', icon: Target },
            { path: '/finance', label: 'Finanzas', icon: DollarSign },
        ]
    },
    {
        label: 'SEGUIMIENTO',
        items: [
            { path: '/habits', label: 'Hábitos', icon: CheckSquare },
            { path: '/tasks', label: 'Tareas', icon: ListTodo },
            { path: '/day-planner', label: 'Planificar', icon: CalendarCheck },
            { path: '/self-review', label: 'Autocrítica', icon: ClipboardCheck },
            { path: '/journaling', label: 'Diario', icon: BookOpen },
        ]
    },
    {
        label: 'RUTINAS',
        items: [
            { path: '/daily-routine', label: 'Rutina Diaria', icon: Calendar },
            { path: '/activation-routine', label: 'Activación', icon: Zap },
            { path: '/morning-prep', label: 'Alistamiento', icon: Shirt },
            { path: '/deactivation-routine', label: 'Desactivación', icon: Moon },
            { path: '/weekend-routine', label: 'Fin de Semana', icon: Sun },
        ]
    },
    {
        label: 'PÁGINAS',
        items: [
            { path: '/paginas', label: 'Todas las Páginas', icon: FileText },
        ]
    },
    {
        label: 'PLANES',
        items: [
            { path: '/trimestral-planning', label: 'Plan Trimestral', icon: CalendarRange },
            { path: '/weekly-planning', label: 'Plan Semanal', icon: ListChecks },
            { path: '/monthly-planning', label: 'Plan Mensual', icon: Target },
        ]
    },
    {
        label: 'HOBBIES',
        items: [
            { path: '/languages-dashboard', label: 'Idiomas', icon: BookOpen },
            { path: '/reading-library', label: 'Biblioteca', icon: BookOpen },
            { path: '/music-dashboard', label: 'Música', icon: BookOpen },
            { path: '/chess', label: 'Ajedrez', icon: Crown },
        ]
    },
    {
        label: 'CUERPO Y MENTE',
        items: [
            { path: '/alimentacion', label: 'Alimentación', icon: Utensils },
            { path: '/gym', label: 'Gimnasio', icon: Dumbbell },
            { path: '/grocery', label: 'Despensa', icon: Package },
            { path: '/shopping-list', label: 'Lista Compra', icon: ShoppingCart },
        ]
    },
    {
        label: 'HERRAMIENTAS',
        items: [
            { path: '/systems', label: 'Sistemas', icon: Brain },
            { path: '/vision', label: 'Point B', icon: Eye },
            { path: '/antivision', label: 'Anti-Point B', icon: Flame },
            { path: '/identidad', label: 'Identidad', icon: ListTodo },
            { path: '/plan-identidad', label: 'Plan Identidad', icon: Compass },
            { label: 'Motivos', icon: Heart, submenu: [
                    { path: '/motivos', label: 'Motivos' },
                    { path: '/motivos/realidad', label: 'Realidad' },
                    { path: '/objetivo-vision-1-ano', label: 'Visión 1 Año' },
                    { path: '/vision-vs-realidad', label: 'Visión vs Realidad' },
                ] },
            { path: '/punto-partida', label: 'Punto Partida', icon: Activity },
            { path: '/goal-alignment', label: 'Conexión Total', icon: Compass },
            { path: '/life-alignment', label: 'Alineación', icon: Heart },
            { path: '/confidence-steps', label: 'Escalones', icon: Target },
            { path: '/sprint', label: 'Sprint', icon: Target },
            { path: '/vida-daniel', label: 'Estadísticas', icon: BarChart3 },
            { path: '/estadisticas-esfuerzo', label: 'Esfuerzo', icon: Activity },
            { path: '/periodic-review', label: 'Revisión Periódica', icon: Sparkles },
            { path: '/performance-modes', label: 'Modos', icon: Zap },
            { path: '/novia', label: 'Novia', icon: Heart },
            { path: '/tools', label: 'Herramientas', icon: Wrench },
            { path: '/reminders', label: 'Recordatorios', icon: Bell },
        ]
    },
    {
        label: null,
        items: [
            { path: '/settings', label: 'Configuración', icon: Settings },
        ]
    },
];
const allNavItems = sidebarGroups.flatMap(g => g.items);
function getPageTitle(pathname) {
    if (pathname.startsWith('/paginas')) {
        return 'Páginas';
    }
    for (const item of allNavItems) {
        if (item.path === pathname)
            return item.label;
        if (item.submenu) {
            const sub = item.submenu.find(s => s.path === pathname);
            if (sub)
                return sub.label;
        }
    }
    return 'Organizador';
}
function ThemeToggle({ collapsed }) {
    const { toggleTheme, isDark } = useAutoTheme();
    return (_jsx("button", { onClick: toggleTheme, className: cn("p-1.5 rounded-md transition-colors hover:bg-accent", isDark ? "text-amber-400" : "text-muted-foreground hover:text-foreground", collapsed && "mx-auto"), title: isDark ? 'Modo claro' : 'Modo oscuro', children: isDark ? _jsx(Sun, { className: "h-4 w-4" }) : _jsx(Moon, { className: "h-4 w-4" }) }));
}
export const Navigation = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const { collapsed, toggleCollapse: sidebarToggle } = useSidebar();
    const { isOnline, pendingMutations } = useOffline();
    const { toggleTheme, isDark } = useAutoTheme();
    const [favoritePages, setFavoritePages] = useState([]);
    useEffect(() => {
        const load = () => {
            try {
                const raw = localStorage.getItem('pages_meta');
                if (raw) {
                    const all = JSON.parse(raw);
                    setFavoritePages(all.filter((p) => p.is_favorite).map((p) => ({ id: p.id, title: p.title, icon: p.icon || '📄' })));
                }
                else {
                    setFavoritePages([]);
                }
            }
            catch {
                setFavoritePages([]);
            }
        };
        load();
        window.addEventListener('storage', load);
        const interval = setInterval(load, 2000);
        return () => { window.removeEventListener('storage', load); clearInterval(interval); };
    }, []);
    const renderSidebarItem = (item) => {
        if (item.submenu) {
            const Icon = item.icon;
            const isActive = item.submenu.some(s => location.pathname === s.path);
            return (_jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: cn("flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:text-foreground hover:bg-accent/50", collapsed && "justify-center px-2"), children: [_jsx(Icon, { className: "h-4 w-4 shrink-0" }), !collapsed && (_jsxs(_Fragment, { children: [_jsx("span", { children: item.label }), _jsx(ChevronDown, { className: "h-3 w-3 ml-auto opacity-50" })] }))] }), !collapsed && item.submenu.map(sub => {
                        const isSubActive = location.pathname === sub.path;
                        return (_jsxs(Link, { to: sub.path, className: cn("flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors ml-6", isSubActive
                                ? "text-foreground font-medium bg-accent"
                                : "text-foreground/70 hover:text-foreground hover:bg-accent/50"), children: [_jsx("span", { className: "w-1 h-1 rounded-full bg-current shrink-0" }), sub.label] }, sub.path));
                    })] }, item.label));
        }
        const Icon = item.icon;
        const isActive = item.path ? location.pathname === item.path : false;
        return (_jsxs(Link, { to: item.path, className: cn("flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", collapsed && "justify-center px-2", isActive
                ? "bg-accent text-accent-foreground"
                : "text-foreground/80 hover:text-foreground hover:bg-accent/50"), children: [_jsx(Icon, { className: "h-4 w-4 shrink-0" }), !collapsed && _jsx("span", { children: item.label })] }, item.path));
    };
    const currentPage = getPageTitle(location.pathname);
    return (_jsxs(_Fragment, { children: [_jsxs("header", { className: "fixed top-0 left-0 right-0 z-40 h-12 border-b bg-background flex items-center justify-between px-4 lg:hidden", style: { paddingTop: 'env(safe-area-inset-top)' }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setIsOpen(true), className: "p-1 -ml-1 rounded-md hover:bg-accent", children: _jsx(Menu, { className: "h-5 w-5" }) }), _jsx("span", { className: "font-medium text-sm", children: currentPage })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => window.__pwaCheckForUpdates?.(), className: "p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors", title: "Buscar actualizaciones", children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), _jsx(ThemeToggle, {}), _jsx(OfflineBadge, { isOnline: isOnline, pendingMutations: pendingMutations })] })] }), _jsx(Sheet, { open: isOpen, onOpenChange: setIsOpen, children: _jsxs(SheetContent, { side: "left", className: "w-64 p-0 flex flex-col h-full max-h-screen bg-secondary", children: [_jsx("div", { className: "h-12 flex items-center justify-between px-4 border-b shrink-0", style: { paddingTop: 'env(safe-area-inset-top)', marginTop: 0 }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-sm font-semibold", children: "Organizador" }), _jsx(OfflineBadge, { isOnline: isOnline, pendingMutations: pendingMutations })] }) }), _jsxs("nav", { className: "flex-1 overflow-y-auto py-2 px-2 space-y-4", children: [sidebarGroups.map((group, gi) => (_jsxs("div", { children: [group.label && (_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1", children: group.label })), _jsx("div", { className: "space-y-0.5", children: group.items.map(item => renderSidebarItem(item)) })] }, gi))), favoritePages.length > 0 && (_jsxs("div", { className: "pt-2", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1", children: "\u2B50 Favoritos" }), _jsx("div", { className: "space-y-0.5", children: favoritePages.map(p => (_jsxs(Link, { to: `/paginas/${p.id}`, className: cn("flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors", location.pathname === `/paginas/${p.id}`
                                                    ? "text-foreground font-medium bg-accent"
                                                    : "text-foreground/70 hover:text-foreground hover:bg-accent/50"), children: [_jsx("span", { className: "text-sm", children: p.icon }), _jsx("span", { className: "truncate", children: p.title })] }, p.id))) })] })), _jsx("div", { className: "pb-2" })] }), _jsx("div", { className: "shrink-0 border-t", children: _jsx(InstallPrompt, {}) })] }) }), _jsxs("aside", { className: cn("fixed top-0 left-0 z-30 h-full border-r bg-secondary hidden lg:flex flex-col transition-all duration-200", collapsed ? "w-14" : "w-56"), style: { paddingTop: 'env(safe-area-inset-top)' }, children: [_jsxs("div", { className: cn("h-12 flex items-center border-b shrink-0", collapsed ? "justify-center px-2 gap-2 flex-col h-auto py-2" : "justify-between px-4"), children: [!collapsed && (_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("h1", { className: "text-sm font-semibold truncate", children: "Organizador" }), _jsx(OfflineBadge, { isOnline: isOnline, pendingMutations: pendingMutations })] })), _jsxs("div", { className: cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1"), children: [_jsx("button", { onClick: () => window.__pwaCheckForUpdates?.(), className: "p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0 transition-colors", title: "Buscar actualizaciones", children: _jsx(RefreshCw, { className: "h-4 w-4" }) }), _jsx(ThemeToggle, { collapsed: collapsed }), _jsx("button", { onClick: sidebarToggle, className: "p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0", children: collapsed ? _jsx(PanelLeft, { className: "h-4 w-4" }) : _jsx(PanelLeftClose, { className: "h-4 w-4" }) })] })] }), _jsxs("nav", { className: "flex-1 overflow-y-auto py-2 px-2 space-y-4", children: [sidebarGroups.map((group, gi) => (_jsxs("div", { children: [group.label && !collapsed && (_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1", children: group.label })), _jsx("div", { className: "space-y-0.5", children: group.items.map(item => renderSidebarItem(item)) })] }, gi))), favoritePages.length > 0 && !collapsed && (_jsxs("div", { className: "pt-2", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1", children: "\u2B50 Favoritos" }), _jsx("div", { className: "space-y-0.5", children: favoritePages.map(p => (_jsxs(Link, { to: `/paginas/${p.id}`, className: cn("flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors", location.pathname === `/paginas/${p.id}`
                                                ? "text-foreground font-medium bg-accent"
                                                : "text-foreground/70 hover:text-foreground hover:bg-accent/50"), children: [_jsx("span", { className: "text-sm", children: p.icon }), _jsx("span", { className: "truncate", children: p.title })] }, p.id))) })] })), _jsx("div", { className: "pb-2" })] }), _jsx("div", { className: "shrink-0 border-t", children: _jsx(InstallPrompt, {}) })] })] }));
};
function OfflineBadge({ isOnline, pendingMutations }) {
    if (!isOnline) {
        return (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-amber-500 font-medium", children: [_jsx(WifiOff, { className: "h-3 w-3" }), pendingMutations > 0 && _jsx("span", { children: pendingMutations })] }));
    }
    if (pendingMutations > 0) {
        return (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-foreground/50 font-medium", children: [_jsx(CloudOff, { className: "h-3 w-3 animate-pulse" }), pendingMutations] }));
    }
    return (_jsx("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: _jsx(Wifi, { className: "h-3 w-3" }) }));
}
