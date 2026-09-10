export const todayISO = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
};

export const isoOf = (d: Date) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

export const DAYN = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
export const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
export const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
export const MONTHS_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const esLocale = () => "es-ES";

export function fmtDate(iso: string, long?: boolean) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(
    esLocale(),
    long
      ? { weekday: "short", day: "numeric", month: "short" }
      : { day: "numeric", month: "short" }
  );
}

export function fmtDur(ms: number) {
  const m = Math.floor(ms / 60000);
  return m >= 60
    ? Math.floor(m / 60) + "h " + (m % 60) + "m"
    : m + " min";
}

export const durPart = (ms: number) => (ms >= 60000 ? [fmtDur(ms)] : []);

export const fmtNum = (n: number | undefined) =>
  (Math.round((n || 0) * 10) / 10).toLocaleString(esLocale());

export const fmtVol = (v: number | undefined, unit: string) =>
  fmtNum(v || 0) + " " + unit;

export const exCount = (n: number | undefined) =>
  n === 1 ? "1 ejercicio" : (n || 0) + " ejercicios";

export function weekKey(d: string) {
  const dt = new Date(d + "T12:00:00");
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day + 3);
  const jan4 = new Date(dt.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((dt.getTime() - jan4.getTime()) / 86400000 -
        3 +
        ((jan4.getDay() + 6) % 7)) /
        7
    );
  return dt.getFullYear() + "-" + week;
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const ACCENTS = {
  lime: "#30d158",
  sky: "#0a84ff",
  orange: "#ff9f0a",
  violet: "#bf5af2",
  pink: "#ff375f",
  red: "#ff453a",
  teal: "#40c8e0",
  gold: "#ffd60a",
};