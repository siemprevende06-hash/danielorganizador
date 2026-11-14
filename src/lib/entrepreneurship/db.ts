import { supabase } from '@/integrations/supabase/client';

/**
 * Cliente sin tipado estricto para el dominio de emprendimiento.
 * Las tablas nuevas viven en supabase/migrations/20261113000000_entrepreneurship_dashboard.sql
 * y se tipan en src/lib/entrepreneurship/types.ts. Cuando se regeneren los tipos de
 * Supabase se puede sustituir por el cliente tipado.
 */
export const entDb = supabase as unknown as {
  // Cliente deliberadamente sin tipar: las tablas nuevas aún no están en los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export function isMissingTableError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string; details?: string };
  const msg = `${e.message || ''} ${e.details || ''}`.toLowerCase();
  return (
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

export function isMissingColumnError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: string; message?: string; details?: string };
  const msg = `${e.message || ''} ${e.details || ''}`.toLowerCase();
  return (
    e.code === '42703' ||
    /column .* does not exist/.test(msg) ||
    /could not find the '.*' column/.test(msg)
  );
}

export const VENTURE_OPTIONAL_COLUMNS = [
  'stage',
  'business_model',
  'target_market',
  'currency',
  'accent_color',
  'cash_balance',
  'monthly_goal',
  'north_star_key',
  'north_star_target',
  'started_at',
  'stage_entered_at',
  'archived',
];

export const INCOME_OPTIONAL_COLUMNS = ['currency', 'exchange_rate', 'customer_id'];

export function withoutKeys<T extends Record<string, unknown>>(payload: T, keys: string[]): Partial<T> {
  const copy = { ...payload };
  keys.forEach((key) => {
    delete copy[key];
  });
  return copy;
}

export const DEFAULT_RATE = 360;

export function calculateRate(currency: string, rate?: number | null): number {
  if (currency !== 'CUP') return 1;
  const r = Number(rate);
  return Number.isFinite(r) && r > 0 ? r : DEFAULT_RATE;
}