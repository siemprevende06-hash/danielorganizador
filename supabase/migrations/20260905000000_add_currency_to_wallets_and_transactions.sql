-- Add currency field to wallets (wallet balance is stored in its own currency)
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS currency TEXT;

-- Existing wallets: infer currency from their names (Efectivo USD -> USD, rest CUP)
UPDATE public.wallets SET currency = 'USD' WHERE currency IS NULL AND name ILIKE '%usd%';
UPDATE public.wallets SET currency = 'CUP' WHERE currency IS NULL;

ALTER TABLE public.wallets ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.wallets ALTER COLUMN currency SET DEFAULT 'CUP';

-- Add currency field to transactions (each transaction remembers the currency the user entered)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT;

-- Existing transactions stored amounts as USD equivalents, so default them to USD
UPDATE public.transactions SET currency = 'USD' WHERE currency IS NULL;

ALTER TABLE public.transactions ALTER COLUMN currency SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN currency SET DEFAULT 'USD';