ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS task_ids TEXT[] DEFAULT '{}';
