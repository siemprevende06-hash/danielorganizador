
ALTER TABLE public.music_repertoire 
  ADD COLUMN practice_minutes integer DEFAULT 0,
  ADD COLUMN last_practiced date;

CREATE TABLE public.music_practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  song_id uuid REFERENCES public.music_repertoire(id) ON DELETE CASCADE,
  instrument text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  practice_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.music_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to music_practice_sessions" ON public.music_practice_sessions FOR ALL USING (true) WITH CHECK (true);
