-- Deduplica billeteras por (nombre, moneda) conservando la de mayor saldo.
-- Reapunta transacciones y préstamos a la billetera conservada, luego elimina
-- los duplicados (p. ej. un "Efectivo CUP" sembrado automáticamente además del
-- real, con ids distintos). Además evita que vuelvan a crearse duplicados.
-- Idempotente: si no hay duplicados no cambia nada.

BEGIN;

-- 1) Billetera a conservar por grupo (mayor saldo; empate -> updated_at más reciente)
CREATE TEMP TABLE keep_wallet AS
SELECT DISTINCT ON (lower(btrim(name)), currency)
  id,
  lower(btrim(name)) AS nombre,
  currency
FROM public.wallets
ORDER BY lower(btrim(name)), currency, balance DESC NULLS LAST, updated_at DESC;

-- 2) Reapuntar transacciones hacia la conservada
UPDATE public.transactions t
SET wallet_id = k.id
FROM public.wallets w
JOIN keep_wallet k ON lower(btrim(w.name)) = k.nombre AND w.currency = k.currency
WHERE t.wallet_id = w.id AND w.id <> k.id;

-- 3) Reapuntar préstamos hacia la conservada
UPDATE public.loans l
SET wallet_id = k.id
FROM public.wallets w
JOIN keep_wallet k ON lower(btrim(w.name)) = k.nombre AND w.currency = k.currency
WHERE l.wallet_id = w.id AND w.id <> k.id;

-- 4) Eliminar billeteras duplicadas
DELETE FROM public.wallets w
USING keep_wallet k
WHERE lower(btrim(w.name)) = k.nombre AND w.currency = k.currency AND w.id <> k.id;

DROP TABLE keep_wallet;

-- 5) Evitar duplicados futuros (mismo nombre y moneda)
CREATE UNIQUE INDEX IF NOT EXISTS wallets_name_currency_uidx
  ON public.wallets (lower(btrim(name)), currency);

COMMIT;