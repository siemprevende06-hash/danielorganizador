let forcedOffline = false
let verifiedOnline: boolean | null = null
let lastCheck = 0

export const setForcedOffline = (v: boolean) => { forcedOffline = v }

/**
 * Estado "confiable" de conexión.
 * - Si el navegador reporta offline (navigator.onLine === false) NUNCA asumimos
 *   que hay internet, salvo que un verificación real contra Supabase lo confirme
 *   (el navegador suele dar falsos negativos, p. ej. modo ahorro de batería).
 * - Si el navegador dice online, confiamos en él de forma inmediata para no
 *   bloquear la UX; las mutaciones fallidas se encolan y se reintentan luego.
 */
export const isOnline = () => {
  if (forcedOffline) return false
  if (typeof navigator === "undefined") return true
  if (navigator.onLine === false) {
    // Posible falso negativo: usa el último veredicto real (si es reciente).
    if (verifiedOnline === true && Date.now() - lastCheck < 60000) return true
    return false
  }
  return true
}

/**
 * Verifica la conectividad REAL haciendo una petición ligera a Supabase con
 * timeout. No basta con navigator.onLine, que solo refleja si el navegador cree
 * estar conectado a una red y da falsos negativos.
 */
export const verifyOnline = async (): Promise<boolean> => {
  if (forcedOffline) return false
  if (typeof navigator === "undefined") return true

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const url = (import.meta.env.VITE_SUPABASE_URL ||
      "https://fuqmrtenzlslkeqgdjwy.supabase.co")
      .replace(/\/$/, "");
    const res = await fetch(`${url}/auth/v1/health`, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    verifiedOnline = res.ok;
  } catch {
    verifiedOnline = false;
  } finally {
    clearTimeout(timer);
    lastCheck = Date.now();
  }

  return verifiedOnline;
}
