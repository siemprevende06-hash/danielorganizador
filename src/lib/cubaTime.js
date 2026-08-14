/**
 * Hora de Cuba (America/Havana). Todas las fechas diarias del sistema
 * usan esta zona para que el reset se haga a la medianoche local.
 */
export function getCubaDate(d = new Date()) {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Havana",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return fmt.format(d); // YYYY-MM-DD
}
export function getCubaNow() {
    // Devuelve un Date equivalente a "ahora" en zona Cuba (heurístico para UI)
    const s = new Date().toLocaleString("en-US", { timeZone: "America/Havana" });
    return new Date(s);
}
/** ms hasta la próxima medianoche hora Cuba */
export function msUntilCubaMidnight() {
    const now = getCubaNow();
    const next = new Date(now);
    next.setHours(24, 0, 1, 0);
    return next.getTime() - now.getTime();
}
