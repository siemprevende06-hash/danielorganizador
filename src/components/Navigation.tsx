import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home, Gauge, CheckSquare, Calendar, DollarSign, Target, ListTodo, ListChecks, Eye, CalendarDays, CalendarRange, Goal, BookOpen, Briefcase, GraduationCap, Wrench, Bell, ChevronDown, CalendarCheck, Menu, Focus, LayoutList, BarChart3, ClipboardCheck, Compass, Settings, Brain, Utensils, Dumbbell, Crown, ShoppingCart, Wifi, WifiOff, CloudOff, Activity, PanelLeftClose, PanelLeft, Sparkles, Zap, Moon, Shirt, Heart, Sun, Flame, Users, LayoutDashboard, FileText, Star, Package
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { useOffline } from '@/providers/OfflineProvider';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { InstallPrompt } from '@/components/InstallPrompt';

interface SidebarItem {
  path?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { path: string; label: string }[];
}

const sidebarGroups: { label: string | null; items: SidebarItem[] }[] = [
  {
    label: 'RUEDA DE LA VIDA',
    items: [
      { path: '/areas-de-vida', label: 'Áreas de Vida', icon: LayoutDashboard },
      { path: '/recompensas', label: 'Recompensas', icon: Sparkles },
    ]
  },
  {
    label: null,
    items: [
      { path: '/', label: 'Inicio', icon: Home },
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
    label: 'SEGUIMIENTO',
    items: [
      { path: '/habits', label: 'Hábitos', icon: CheckSquare },
      { path: '/tasks', label: 'Tareas', icon: ListTodo },
      { path: '/day-planner', label: 'Planificar', icon: CalendarCheck },
      { path: '/goals', label: 'Metas', icon: Goal },
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
    label: 'LÍNEA DE TIEMPO',
    items: [
      { path: '/daily', label: 'Hoy', icon: CalendarDays },
      { path: '/weekly', label: 'Semana', icon: CalendarRange },
      { path: '/monthly', label: 'Mes', icon: Calendar },
      { path: '/monthly-planning', label: 'Plan Mensual', icon: Target },
      { path: '/trimestral-planning', label: 'Plan Trimestral', icon: CalendarRange },
      { path: '/weekly-planning', label: 'Plan Semanal', icon: ListChecks },
      { path: '/12-week-year', label: '3 Meses', icon: CalendarRange },
      { path: '/weeks', label: 'Semanas', icon: CalendarDays },
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
    label: 'HOBBIES',
    items: [
      { path: '/languages-dashboard', label: 'Idiomas', icon: BookOpen },
      { path: '/reading-library', label: 'Biblioteca', icon: BookOpen },
      { path: '/music-dashboard', label: 'Música', icon: BookOpen },
    ]
  },
  {
    label: 'CUERPO Y MENTE',
    items: [
      { path: '/alimentacion', label: 'Alimentación', icon: Utensils },
      { path: '/gym', label: 'Gimnasio', icon: Dumbbell },
      { path: '/chess', label: 'Ajedrez', icon: Crown },
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
      { path: '/plan-identidad', label: 'Plan Identidad', icon: Compass },
      { label: 'Motivos', icon: Heart, submenu: [
        { path: '/motivos', label: 'Motivos' },
        { path: '/motivos/realidad', label: 'Realidad' },
      ]},
      { path: '/punto-partida', label: 'Punto Partida', icon: Activity },
      { path: '/goal-alignment', label: 'Conexión Total', icon: Compass },
      { path: '/life-alignment', label: 'Alineación', icon: Heart },
      { path: '/confidence-steps', label: 'Escalones', icon: Target },
      { path: '/sprint', label: 'Sprint', icon: Target },
      { path: '/vida-daniel', label: 'Estadísticas', icon: BarChart3 },
      { path: '/periodic-review', label: 'Revisión Periódica', icon: Sparkles },
      { path: '/performance-modes', label: 'Modos', icon: Zap },
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

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/paginas')) {
    return 'Páginas';
  }
  for (const item of allNavItems) {
    if (item.path === pathname) return item.label;
    if (item.submenu) {
      const sub = item.submenu.find(s => s.path === pathname);
      if (sub) return sub.label;
    }
  }
  return 'Organizador';
}

function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { toggleTheme, isDark } = useAutoTheme();
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-1.5 rounded-md transition-colors hover:bg-accent",
        isDark ? "text-amber-400" : "text-muted-foreground hover:text-foreground",
        collapsed && "mx-auto"
      )}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { collapsed, toggleCollapse: sidebarToggle } = useSidebar();
  const { isOnline, pendingMutations } = useOffline();
  const { toggleTheme, isDark } = useAutoTheme();
  const [favoritePages, setFavoritePages] = useState<{ id: string; title: string; icon: string }[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('pages_meta');
        if (raw) {
          const all = JSON.parse(raw) as any[];
          setFavoritePages(all.filter((p: any) => p.is_favorite).map((p: any) => ({ id: p.id, title: p.title, icon: p.icon || '📄' })));
        } else {
          setFavoritePages([]);
        }
      } catch { setFavoritePages([]); }
    };
    load();
    window.addEventListener('storage', load);
    const interval = setInterval(load, 2000);
    return () => { window.removeEventListener('storage', load); clearInterval(interval); };
  }, []);

  const renderSidebarItem = (item: SidebarItem) => {
    if (item.submenu) {
      const Icon = item.icon;
      const isActive = item.submenu.some(s => location.pathname === s.path);
      return (
        <div key={item.label} className="space-y-0.5">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            isActive ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:text-foreground hover:bg-accent/50",
            collapsed && "justify-center px-2"
          )}>
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span>{item.label}</span>
                <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
              </>
            )}
          </div>
          {!collapsed && item.submenu.map(sub => {
            const isSubActive = location.pathname === sub.path;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors ml-6",
                  isSubActive
                    ? "text-foreground font-medium bg-accent"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                )}
              >
                <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                {sub.label}
              </Link>
            );
          })}
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = item.path ? location.pathname === item.path : false;
    return (
      <Link
        key={item.path}
        to={item.path!}
        className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const currentPage = getPageTitle(location.pathname);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-12 border-b bg-background flex items-center justify-between px-4 lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(true)} className="p-1 -ml-1 rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-medium text-sm">{currentPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <OfflineBadge isOnline={isOnline} pendingMutations={pendingMutations} />
        </div>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col h-full max-h-screen bg-secondary">
          <div className="h-12 flex items-center justify-between px-4 border-b shrink-0"
            style={{ paddingTop: 'env(safe-area-inset-top)', marginTop: 0 }}>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">Organizador</h1>
            <OfflineBadge isOnline={isOnline} pendingMutations={pendingMutations} />
          </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
            {sidebarGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => renderSidebarItem(item))}
                </div>
              </div>
            ))}
            {favoritePages.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1">
                  ⭐ Favoritos
                </p>
                <div className="space-y-0.5">
                  {favoritePages.map(p => (
                    <Link
                      key={p.id}
                      to={`/paginas/${p.id}`}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors",
                        location.pathname === `/paginas/${p.id}`
                          ? "text-foreground font-medium bg-accent"
                          : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <span className="text-sm">{p.icon}</span>
                      <span className="truncate">{p.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="pb-2" />
          </nav>
          <div className="shrink-0 border-t">
            <InstallPrompt />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-30 h-full border-r bg-secondary hidden lg:flex flex-col transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Logo + collapse + theme */}
        <div className={cn(
          "h-12 flex items-center border-b shrink-0",
          collapsed ? "justify-center px-2 gap-2 flex-col h-auto py-2" : "justify-between px-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-semibold truncate">Organizador</h1>
              <OfflineBadge isOnline={isOnline} pendingMutations={pendingMutations} />
            </div>
          )}
          <button
            onClick={sidebarToggle}
            className={cn("p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0", collapsed && "mx-auto")}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {sidebarGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => renderSidebarItem(item))}
              </div>
            </div>
          ))}
          {favoritePages.length > 0 && !collapsed && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1">
                ⭐ Favoritos
              </p>
              <div className="space-y-0.5">
                {favoritePages.map(p => (
                  <Link
                    key={p.id}
                    to={`/paginas/${p.id}`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1 rounded-md text-sm transition-colors",
                      location.pathname === `/paginas/${p.id}`
                        ? "text-foreground font-medium bg-accent"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <span className="text-sm">{p.icon}</span>
                    <span className="truncate">{p.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="pb-2" />
        </nav>
        <div className="shrink-0 border-t">
          <InstallPrompt />
        </div>
      </aside>
    </>
  );
};

function OfflineBadge({ isOnline, pendingMutations }: { isOnline: boolean; pendingMutations: number }) {
  if (!isOnline) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
        <WifiOff className="h-3 w-3" />
        {pendingMutations > 0 && <span>{pendingMutations}</span>}
      </span>
    );
  }
  if (pendingMutations > 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-foreground/50 font-medium">
        <CloudOff className="h-3 w-3 animate-pulse" />
        {pendingMutations}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-green-500">
      <Wifi className="h-3 w-3" />
    </span>
  );
}
