import { useEffect } from 'react';
import { getActivePomodoro, getRemainingSeconds } from '@/lib/activePomodoro';
import {
  POMODORO_NOTIFICATION_TAG,
  ROUTINE_NOTIFICATION_TAG,
  updateNotification,
  closeNotification,
  formatRemaining,
  areNotificationsEnabled,
} from '@/lib/notifications';
import { getCurrentRoutineBlockInfo, formatTimeDisplay } from '@/hooks/useRoutineBlocks';

export function useActiveNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (!areNotificationsEnabled()) return;

    let lastPomodoroBody = '';
    let lastRoutineBody = '';
    const ROOT_URL = window.location.origin;

    const updatePomodoro = async (force = false) => {
      if (Notification.permission !== 'granted') return;
      const pomodoro = getActivePomodoro();
      if (!pomodoro) {
        if (lastPomodoroBody !== '') {
          lastPomodoroBody = '';
          await closeNotification(POMODORO_NOTIFICATION_TAG);
        }
        return;
      }

      const remaining = getRemainingSeconds(pomodoro);
      const body = pomodoro.running
        ? `${pomodoro.title} · ${formatRemaining(remaining)} restantes`
        : `${pomodoro.title} · en pausa (${formatRemaining(remaining)})`;
      if (!force && body === lastPomodoroBody) return;
      lastPomodoroBody = body;

      await updateNotification(
        {
          title: pomodoro.phase === 'break' ? 'Pomodoro · Descanso' : 'Pomodoro activo',
          body,
          tag: POMODORO_NOTIFICATION_TAG,
        },
        { data: { url: `${ROOT_URL}#/focus` } }
      );
    };

    const updateRoutine = async (force = false) => {
      if (Notification.permission !== 'granted') return;
      const current = getCurrentRoutineBlockInfo();
      if (!current) {
        if (lastRoutineBody !== '') {
          lastRoutineBody = '';
          await closeNotification(ROUTINE_NOTIFICATION_TAG);
        }
        return;
      }

      const body = `Bloque ${current.index} de ${current.total} · ${current.block.title} (${formatTimeDisplay(current.block.startTime)} – ${formatTimeDisplay(current.block.endTime)})`;
      if (!force && body === lastRoutineBody) return;
      lastRoutineBody = body;

      await updateNotification(
        {
          title: `Rutina · ${current.routineLabel}`,
          body,
          tag: ROUTINE_NOTIFICATION_TAG,
        },
        { data: { url: `${ROOT_URL}#/routine-day` } }
      );
    };

    updatePomodoro(true);
    updateRoutine(true);

    const pomodoroInterval = setInterval(updatePomodoro, 1000);
    const routineInterval = setInterval(updateRoutine, 30000);

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        updatePomodoro(true);
        updateRoutine(true);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      clearInterval(pomodoroInterval);
      clearInterval(routineInterval);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);
}