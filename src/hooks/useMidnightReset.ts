import { useEffect } from "react";

/**
 * Ejecuta el callback exactamente a las 00:00 del día siguiente.
 * Útil para resetear contadores diarios sin recargar la página.
 */
export const useMidnightReset = (callback: () => void) => {
  useEffect(() => {
    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 1, 0); // 00:00:01 del día siguiente
      const ms = next.getTime() - now.getTime();
      return setTimeout(() => {
        callback();
        // Re-agendar para el día siguiente
        schedule();
      }, ms);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [callback]);
};
