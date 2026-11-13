import { useCallback, useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
  removeEventListener: (type: 'release', listener: () => void) => void;
}

interface WakeLockCapableNavigator {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

function getWakeLock(): WakeLockCapableNavigator['wakeLock'] {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as unknown as WakeLockCapableNavigator).wakeLock;
}

/**
 * Mantiene la pantalla encendida mientras `active` sea true.
 * Si el navegador no soporta la API, devuelve `supported: false` sin romper.
 */
export function useWakeLock(active: boolean) {
  const [supported] = useState(() => !!getWakeLock());
  const [engaged, setEngaged] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    setEngaged(false);
    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release();
      } catch {
        // El navegador ya lo liberó.
      }
    }
  }, []);

  const request = useCallback(async () => {
    const wakeLock = getWakeLock();
    if (!wakeLock || !activeRef.current) return;
    if (document.visibilityState !== 'visible') return;
    if (sentinelRef.current && !sentinelRef.current.released) return;

    setFailed(false);
    try {
      const sentinel = await wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setEngaged(true);
      setFailed(false);
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setEngaged(false);
        }
      });
    } catch (error) {
      console.warn('No se pudo mantener la pantalla encendida:', error);
      setEngaged(false);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (active) {
      void request();
    } else {
      void release();
    }
    return () => {
      void release();
    };
  }, [active, request, release]);

  useEffect(() => {
    if (!active) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, request]);

  return { supported, engaged, failed, request, release };
}
