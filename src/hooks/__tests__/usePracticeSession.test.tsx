import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIN_PRACTICE_MS, usePracticeSession } from '@/hooks/usePracticeSession';

function setVisibility(value: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePracticeSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('arranca parado y sin tiempo acumulado', () => {
    const { result } = renderHook(() => usePracticeSession());
    expect(result.current.running).toBe(false);
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.autoPaused).toBe(false);
  });

  it('redondea 30 s a 1 minuto y no lo descarta', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.minutes).toBe(1);
    expect(finish.elapsedMs).toBe(30_000);
    expect(finish.discarded).toBe(false);
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.running).toBe(false);
  });

  it('90 s cuentan 2 minutos (redondeo honesto)', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(90_000);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.minutes).toBe(2);
    expect(finish.elapsedMs).toBe(90_000);
  });

  it('el mínimo exacto de 20 s ya cuenta', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(MIN_PRACTICE_MS);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.discarded).toBe(false);
    expect(finish.minutes).toBe(1);
  });

  it('descarta una sesión de 5 s y no inventa minutos', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    let finish = { minutes: 1, elapsedMs: 0, discarded: false };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.discarded).toBe(true);
    expect(finish.minutes).toBe(0);
    expect(finish.elapsedMs).toBe(5_000);
  });

  it('la pausa manual congela el tiempo y finish devuelve solo lo contado', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.elapsedMs).toBe(30_000);
    expect(finish.minutes).toBe(1);
  });

  it('reanuda con start() tras una pausa y suma ambos tramos', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(40_000);
    });
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.elapsedMs).toBe(60_000);
    expect(finish.minutes).toBe(1);
  });

  it('pausa sola al ocultar la pestaña y no cuenta ese tiempo (B5)', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    act(() => setVisibility('hidden'));
    expect(result.current.autoPaused).toBe(true);
    expect(result.current.running).toBe(false);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    let finish = { minutes: 1, elapsedMs: 0, discarded: false };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.elapsedMs).toBe(5_000);
    expect(finish.discarded).toBe(true);
  });

  it('vuelve a arrancar sola al mostrarse si la pausa fue automática', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    act(() => setVisibility('hidden'));
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    act(() => setVisibility('visible'));

    expect(result.current.autoPaused).toBe(false);
    expect(result.current.running).toBe(true);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    let finish = { minutes: 0, elapsedMs: 0, discarded: true };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish.elapsedMs).toBe(60_000);
    expect(finish.minutes).toBe(1);
  });

  it('reset deja el contador a cero sin devolver minutos', () => {
    const { result } = renderHook(() => usePracticeSession());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(45_000);
    });

    act(() => result.current.reset());

    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.running).toBe(false);

    let finish = { minutes: 1, elapsedMs: 1, discarded: false };
    act(() => {
      finish = result.current.finish();
    });

    expect(finish).toMatchObject({ minutes: 0, elapsedMs: 0, discarded: true });
  });

  it('llama al callback de cierre una sola vez', () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => usePracticeSession(onFinish));
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(25_000);
    });

    act(() => {
      result.current.finish();
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toMatchObject({ minutes: 1, discarded: false });
  });
});
