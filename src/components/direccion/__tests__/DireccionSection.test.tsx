import { describe, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

type Row = Record<string, unknown>;

function buildRows() {
  const today = new Date();
  const areaStats: Row[] = [];
  const tracking: Row[] = [];
  const ids = ['lectura', 'musica', 'universidad', 'gym', 'finanzas', 'familia', 'ingles'];
  for (let i = 0; i < 130; i++) {
    const key = format(subDays(today, i), 'yyyy-MM-dd');
    const id = ids[i % ids.length];
    const minutes = 20 + ((i * 7) % 60);
    areaStats.push({
      area_id: id,
      stat_date: key,
      time_spent_minutes: minutes,
      time_goal_minutes: 30,
      completed: minutes >= 30,
    });
    tracking.push({
      tracking_date: key,
      completions: { [id]: minutes >= 30 },
      time_data: { [id]: minutes },
      workout_duration: id === 'gym' ? minutes : 0,
      skipped: {},
    });
  }
  return { areaStats, tracking };
}

vi.mock('@/integrations/supabase/client', () => {
  const { areaStats, tracking } = buildRows();
  const rows: Record<string, Row[]> = {
    daily_area_stats: areaStats,
    daily_systems_tracking: tracking,
  };
  // Builder encadenable tipo supabase: cualquier metodo devuelve el mismo proxy
  // y el await final resuelve con las filas de la tabla.
  const makeBuilder = (table: string): Row => {
    const proxy = new Proxy({} as Row, {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (value: { data: Row[]; error: null }) => void) =>
            resolve({ data: rows[table] ?? [], error: null });
        }
        return () => proxy;
      },
    });
    return proxy;
  };
  const supabase = {
    from: (table: string) => makeBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'x' }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x/${path}` } }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
  return { supabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { DireccionSection } from '@/components/direccion/DireccionSection';

// jsdom no implementa ResizeObserver y la gráfica global de trends lo necesita:
// sin este stub el test revienta con "ResizeObserver is not defined".
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DireccionSection crash repro', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the vision board with data without crashing', async () => {
    render(<DireccionSection />, { wrapper: Wrapper });
    await screen.findByText(/Tendencia de esfuerzo y pron/i, {}, { timeout: 8000 });
  });

  it('despliega las áreas centrales en sub-áreas', async () => {
    render(<DireccionSection />, { wrapper: Wrapper });
    await screen.findByText(/Tendencia de esfuerzo y pron/i, {}, { timeout: 8000 });

    // Cabecera del área, dentro de la sección.
    expect(screen.getByText('Desarrollo Personal')).toBeTruthy();
    expect(screen.getByText('Profesional / Académico')).toBeTruthy();

    // Las sub-áreas son las tarjetas que se pintan debajo.
    expect(screen.getByText('Lectura')).toBeTruthy();
    expect(screen.getByText('Ajedrez')).toBeTruthy();
    expect(screen.getByText('Universidad')).toBeTruthy();
  });

  it('deja el resto de áreas como iconos, sin desplegar sus sub-áreas', async () => {
    render(<DireccionSection />, { wrapper: Wrapper });
    await screen.findByText(/Tendencia de esfuerzo y pron/i, {}, { timeout: 8000 });

    expect(screen.getByText('Salud y Bienestar')).toBeTruthy();
    expect(screen.getByText('Familia y Amistad')).toBeTruthy();

    // Finanzas se queda como icono: sus sub-áreas no tienen tracking todavía.
    expect(screen.queryByText('Control de gastos')).toBeNull();
    expect(screen.queryByText('Educación financiera')).toBeNull();
  });
});