
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  achievement_key text NOT NULL,
  achievement_title text NOT NULL,
  achievement_description text,
  icon text DEFAULT '🏆',
  category text DEFAULT 'general',
  unlocked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(achievement_key)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to achievements" ON public.achievements FOR ALL USING (true) WITH CHECK (true);
