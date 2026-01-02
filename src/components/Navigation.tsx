import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Gauge, CheckSquare, Calendar, DollarSign, Target, ListTodo, Eye, CalendarDays, CalendarRange, Goal, BookOpen, Briefcase, GraduationCap, Wrench, Bell, ChevronDown, CalendarCheck, Menu, Focus, LayoutList, BarChart3, ClipboardCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/focus', label: 'Focus', icon: Focus },
  { path: '/routine-day', label: 'Rutina del Día', icon: LayoutList },
  { path: '/control-room', label: 'Control', icon: Gauge },
  { path: '/habits', label: 'Hábitos', icon: CheckSquare },
  { path: '/tasks', label: 'Tareas', icon: ListTodo },
  { path: '/day-planner', label: 'Planificar', icon: CalendarCheck },
  { 
    label: 'Planificación Anual', 
    icon: Target,
    submenu: [
      { path: '/12-week-year', label: 'Año de 12 Semanas' },
      { path: '/weeks', label: 'Semanas' },
    ]
  },
  { path: '/daily', label: 'Hoy', icon: Eye },
  { path: '/weekly', label: 'Semana', icon: CalendarDays },
  { path: '/monthly', label: 'Mes', icon: CalendarRange },
  { path: '/goals', label: 'Metas', icon: Goal },
  { path: '/projects', label: 'Proyectos', icon: Target },
  { path: '/entrepreneurship', label: 'Emprendimiento', icon: Briefcase },
  { path: '/university', label: 'Universidad', icon: GraduationCap },
  { path: '/journaling', label: 'Diario', icon: BookOpen },
  { path: '/tools', label: 'Herramientas', icon: Wrench },
  { path: '/reminders', label: 'Recordatorios', icon: Bell },
  { 
    label: 'Rutina', 
    icon: Calendar,
    submenu: [
      { path: '/daily-routine', label: 'Rutina Diaria' },
      { path: '/activation-routine', label: 'Activación' },
      { path: '/deactivation-routine', label: 'Desactivación' },
    ]
  },
  { path: '/finance', label: 'Finanzas', icon: DollarSign },
  { path: '/vida-daniel', label: 'Vida Daniel', icon: BarChart3 },
  { path: '/self-review', label: 'Autocrítica', icon: ClipboardCheck },
];

export const Navigation = () => {
  const location = useLocation();
  const isRoutineActive = location.pathname.includes('routine');
  const [isOpen, setIsOpen] = useState(false);

  const visibleItemsCount = 8;
  const visibleItems = navItems.slice(0, visibleItemsCount);
  const hiddenItems = navItems.slice(visibleItemsCount);

  const renderNavItem = (item: typeof navItems[0], isMobile = false) => {
    if ('submenu' in item) {
      const Icon = item.icon;
      return (
        <DropdownMenu key={item.label}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap w-full justify-start",
                isRoutineActive && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              <ChevronDown className="h-3 w-3 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background">
            {item.submenu.map((subItem) => (
              <DropdownMenuItem key={subItem.path} asChild>
                <Link
                  to={subItem.path}
                  className={cn(
                    "cursor-pointer",
                    location.pathname === subItem.path && "bg-muted"
                  )}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  {subItem.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => isMobile && setIsOpen(false)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
          isMobile && "w-full justify-start",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{isMobile ? item.label : ''}<span className="hidden sm:inline">{!isMobile && item.label}</span></span>
      </Link>
    );
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        background: 'hsl(var(--background))'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 justify-between">
          <h1 className="text-xl font-headline font-bold mr-4 flex-shrink-0">Organizador</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-nowrap">
            {visibleItems.map((item) => renderNavItem(item))}
            
            {hiddenItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  {hiddenItems.map((item) => {
                    if ('submenu' in item) {
                      return (
                        <DropdownMenu key={item.label}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                              <item.icon className="h-4 w-4 mr-2" />
                              {item.label}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right">
                            {item.submenu.map((subItem) => (
                              <DropdownMenuItem key={subItem.path} asChild>
                                <Link to={subItem.path}>{subItem.label}</Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }
                    return (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center">
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex flex-col gap-1 p-4 pt-10">
                {navItems.map((item) => renderNavItem(item, true))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
