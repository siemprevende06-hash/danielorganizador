import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Gauge, CheckSquare, Calendar, DollarSign, Target, ListTodo, Eye, CalendarDays, CalendarRange, Goal, BookOpen, Briefcase, GraduationCap, Wrench, Bell, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/control-room', label: 'Control', icon: Gauge },
  { path: '/habits', label: 'Hábitos', icon: CheckSquare },
  { path: '/tasks', label: 'Tareas', icon: ListTodo },
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
];

export const Navigation = () => {
  const location = useLocation();
  const isRoutineActive = location.pathname.includes('routine');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 overflow-x-auto">
          <h1 className="text-xl font-headline font-bold mr-4 flex-shrink-0">Sistema de Vida</h1>
          <div className="flex items-center gap-1 flex-nowrap">
            {navItems.map((item) => {
              if ('submenu' in item) {
                const Icon = item.icon;
                return (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 h-auto",
                          isRoutineActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="hidden sm:inline">{item.label}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background z-50">
                      {item.submenu.map((subItem) => (
                        <DropdownMenuItem key={subItem.path} asChild>
                          <Link
                            to={subItem.path}
                            className={cn(
                              "cursor-pointer",
                              location.pathname === subItem.path && "bg-muted"
                            )}
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
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
