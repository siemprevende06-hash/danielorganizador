import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Gauge, CheckSquare, Calendar, DollarSign, Target } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/control-room', label: 'Sala de Control', icon: Gauge },
  { path: '/habits', label: 'Hábitos', icon: CheckSquare },
  { path: '/routine', label: 'Rutina Diaria', icon: Calendar },
  { path: '/finance', label: 'Finanzas', icon: DollarSign },
  { path: '/projects', label: 'Proyectos', icon: Target },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-headline font-bold">Sistema de Vida</h1>
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
