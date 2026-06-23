-- Add distributed column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS distributed BOOLEAN DEFAULT false;

-- Update existing wallets to have proper icon names
UPDATE public.wallets SET icon = 'Banknote' WHERE name LIKE 'Efectivo%' AND icon = 'wallet';
UPDATE public.wallets SET icon = 'CreditCard' WHERE name = 'Banco' AND icon = 'wallet';
UPDATE public.wallets SET icon = 'PiggyBank' WHERE name = 'Ahorros' AND icon = 'wallet';
UPDATE public.wallets SET icon = 'Target' WHERE name = 'Inversión' AND icon = 'wallet';
