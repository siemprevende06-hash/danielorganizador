-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en-progreso', 'completada', 'cancelada')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  area_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'general' CHECK (source IN ('general', 'project', 'university', 'entrepreneurship')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create university subjects table
CREATE TABLE public.university_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily plans table
CREATE TABLE public.daily_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('alto-rendimiento', 'normal', 'minimo-energia', 'minimo-emergencia')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, plan_date)
);

-- Create daily plan tasks junction table
CREATE TABLE public.daily_plan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_plan_id UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(daily_plan_id, task_id)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for university_subjects
CREATE POLICY "Users can view their own subjects"
  ON public.university_subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subjects"
  ON public.university_subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON public.university_subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON public.university_subjects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_plans
CREATE POLICY "Users can view their own daily plans"
  ON public.daily_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily plans"
  ON public.daily_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily plans"
  ON public.daily_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily plans"
  ON public.daily_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_plan_tasks
CREATE POLICY "Users can view their own daily plan tasks"
  ON public.daily_plan_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.daily_plans
    WHERE daily_plans.id = daily_plan_tasks.daily_plan_id
    AND daily_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own daily plan tasks"
  ON public.daily_plan_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.daily_plans
    WHERE daily_plans.id = daily_plan_tasks.daily_plan_id
    AND daily_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own daily plan tasks"
  ON public.daily_plan_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.daily_plans
    WHERE daily_plans.id = daily_plan_tasks.daily_plan_id
    AND daily_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own daily plan tasks"
  ON public.daily_plan_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.daily_plans
    WHERE daily_plans.id = daily_plan_tasks.daily_plan_id
    AND daily_plans.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_university_subjects_user_id ON public.university_subjects(user_id);
CREATE INDEX idx_daily_plans_user_id ON public.daily_plans(user_id);
CREATE INDEX idx_daily_plans_plan_date ON public.daily_plans(plan_date);
CREATE INDEX idx_daily_plan_tasks_daily_plan_id ON public.daily_plan_tasks(daily_plan_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_subjects_updated_at
  BEFORE UPDATE ON public.university_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_plans_updated_at
  BEFORE UPDATE ON public.daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();