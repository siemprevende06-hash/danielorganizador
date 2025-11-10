-- Create entrepreneurships table
CREATE TABLE IF NOT EXISTS public.entrepreneurships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create entrepreneurship_tasks table
CREATE TABLE IF NOT EXISTS public.entrepreneurship_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('normal', 'improvement')),
  completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.entrepreneurship_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default entrepreneurships
INSERT INTO public.entrepreneurships (name, description) VALUES
  ('DeepManager', 'Plataforma de gestión de proyectos con IA'),
  ('EduTech Pro', 'Sistema educativo digital'),
  ('HealthHub', 'Aplicación de salud y bienestar')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entrepreneurship_tasks_entrepreneurship_id ON public.entrepreneurship_tasks(entrepreneurship_id);
CREATE INDEX IF NOT EXISTS idx_entrepreneurship_tasks_task_type ON public.entrepreneurship_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entrepreneurships_updated_at
  BEFORE UPDATE ON public.entrepreneurships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entrepreneurship_tasks_updated_at
  BEFORE UPDATE ON public.entrepreneurship_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();