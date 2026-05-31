-- Create exams table for university exam preparation tracking
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.university_subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Basic exam info
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  
  -- Preparation phase - target metrics
  preparation_days INTEGER DEFAULT 14,
  target_study_hours NUMERIC DEFAULT 20,
  target_exercises INTEGER DEFAULT 50,
  
  -- Current progress
  current_study_hours NUMERIC DEFAULT 0,
  current_exercises INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending',
  grade NUMERIC,
  
  -- Additional notes
  topics TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own exams"
ON public.exams FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exams"
ON public.exams FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
ON public.exams FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
ON public.exams FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();