const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean) {
  const key = `${currency}:${compact}`;
  const cached = currencyFormatters.get(key);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
    minimumFractionDigits: 0,
  });
  currencyFormatters.set(key, formatter);
  return formatter;
}

export function formatCurrency(value: number | null | undefined, currency = 'USD', compact = false): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return compact ? '—' : currencyFormatter(currency, false).format(0);
  return currencyFormatter(currency, compact).format(n);
}

export function formatNumber(value: number | null | undefined, compact = false): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('es-ES', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n);
}

/** ratio 0.12 -> "12,0%" */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n * 100)}%`;
}

export function formatPoints(value: number | null | undefined, digits = 0): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n)}%`;
}

export function formatMonths(months: number | null | undefined): string {
  if (months === null || months === undefined || !Number.isFinite(months)) return 'Sin burn';
  if (months < 0) return '—';
  if (months > 99) return '+99 m';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(months)} m`;
}

export function formatHours(minutes: number | null | undefined): string {
  const m = Math.max(0, Number(minutes) || 0);
  if (m < 60) return `${Math.round(m)} min`;
  const hours = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateShort(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).replace('.', '');
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function weekStartISO(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a.slice(0, 10)}T12:00:00`).getTime();
  const db = new Date(`${b.slice(0, 10)}T12:00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function norm(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = (hex || '').replace('#', '');
  if (clean.length !== 6) return `rgba(139, 92, 246, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}