import { describe, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => {
  const tracking = [
    { tracking_date: '2026-08-05', time_data: { game: 10, musica: 10, ajedrez: 25, lectura: 30 }, workout_duration: 0, completions: {}, skipped: {}, active_focus_areas: [] },
    { tracking_date: '2026-08-04', time_data: { musica: 20, lectura: 25 }, workout_duration: 40, completions: {}, skipped: {}, active_focus_areas: [] },
  ];
  const dailyAreaStats = [
    { area_id: 'lectura', stat_date: '2026-08-05', time_spent_minutes: 30, pages_done: 20 },
    { area_id: 'universidad', stat_date: '2026-08-05', time_spent_minutes: 120, pages_done: 0 },
  ];
  const mockQuery = {
    select: vi.fn(() => mockQuery),
    gte: vi.fn(() => mockQuery),
    lte: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    then: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'daily_systems_tracking') return Promise.resolve({ data: tracking, error: null });
      if (table === 'daily_area_stats') return Promise.resolve({ data: stats, error: null });
      if (table === 'reading_sessions') return Promise.resolve({ data: [], error: null });
      if (table === 'reading_library') return Promise.resolve({ data: [], error: null });
      if (table === 'chess_sessions') return Promise.resolve({ data: [], error: null });
      if (table === 'music_practice_sessions') return Promise.resolve({ data: [], error: null });
      if (table === 'language_sessions') return Promise.resolve({ data: [], error: null });
      if (table === 'music_repertoire') return Promise.resolve({ data: [], error: null });
      return Promise.resolve({ data: [], error: null });
    }),
  };
  return { supabase };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';

describe('MejoraProcessPanel crash repro', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders overview without crashing', async () => {
    render(<MejoraProcessPanel anchorDate={new Date('2026-08-05')} />);
    await screen.findByText(/Resumen Esfuerzo/i, {}, { timeout: 5000 });
  });

  it('selecting an area renders detail', async () => {
    render(<MejoraProcessPanel anchorDate={new Date('2026-08-05')} />);
    const lectureBtn = await screen.findByText('Lectura');
    lectureBtn.click();
    await screen.findByText(/Cargando datos reales/i, {}, { timeout: 5000 });
  });
});