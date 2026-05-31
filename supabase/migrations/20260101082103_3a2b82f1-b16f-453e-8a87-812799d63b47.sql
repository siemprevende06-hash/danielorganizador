-- 1. Habit History Table
CREATE TABLE public.habit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  habit_id TEXT NOT NULL,
  completed_dates JSONB DEFAULT '[]'::jsonb,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(habit_id)
);

ALTER TABLE public.habit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to habit_history" ON public.habit_history FOR ALL USING (true) WITH CHECK (true);

-- 2. Custom Routine Blocks Table
CREATE TABLE public.routine_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  block_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(block_id)
);

ALTER TABLE public.routine_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to routine_blocks" ON public.routine_blocks FOR ALL USING (true) WITH CHECK (true);

-- 3. Journal Entries Table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);

-- 4. Reminders Table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  reminder_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reminders" ON public.reminders FOR ALL USING (true) WITH CHECK (true);

-- 5. Wallets Table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to wallets" ON public.wallets FOR ALL USING (true) WITH CHECK (true);

-- 6. Transactions Table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transfer_id UUID,
  loan_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- 7. Loans Table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  person TEXT NOT NULL,
  description TEXT,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid')),
  loan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);

-- 8. Vision Boards Table
CREATE TABLE public.vision_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  board_type TEXT NOT NULL DEFAULT 'main',
  cards JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_type)
);

ALTER TABLE public.vision_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to vision_boards" ON public.vision_boards FOR ALL USING (true) WITH CHECK (true);

-- 9. Routine Completions Table (for activation/deactivation routines)
CREATE TABLE public.routine_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('activation', 'deactivation')),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(routine_type, completion_date)
);

ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to routine_completions" ON public.routine_completions FOR ALL USING (true) WITH CHECK (true);

-- 10. Add exchange_rate column to user_settings (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.user_settings ADD COLUMN exchange_rate DECIMAL(10,2) DEFAULT 360;
  END IF;
END $$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_habit_history_updated_at BEFORE UPDATE ON public.habit_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routine_blocks_updated_at BEFORE UPDATE ON public.routine_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vision_boards_updated_at BEFORE UPDATE ON public.vision_boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();