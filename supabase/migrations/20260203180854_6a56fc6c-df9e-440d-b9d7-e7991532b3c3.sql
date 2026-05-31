-- Add year and semester to university_subjects
ALTER TABLE university_subjects 
ADD COLUMN IF NOT EXISTS year integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS semester integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS professor text,
ADD COLUMN IF NOT EXISTS schedule text,
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 3;

-- Create table for subject topics (temas de la asignatura)
CREATE TABLE IF NOT EXISTS subject_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid REFERENCES university_subjects(id) ON DELETE CASCADE,
  user_id uuid,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  is_for_final boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on subject_topics
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;

-- Create policy for subject_topics
CREATE POLICY "Allow all access to subject_topics" ON subject_topics FOR ALL USING (true) WITH CHECK (true);

-- Create table for partial exams (exámenes parciales)
CREATE TABLE IF NOT EXISTS partial_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid REFERENCES university_subjects(id) ON DELETE CASCADE,
  user_id uuid,
  title text NOT NULL,
  exam_date date,
  weight_percentage integer DEFAULT 20,
  grade numeric,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on partial_exams
ALTER TABLE partial_exams ENABLE ROW LEVEL SECURITY;

-- Create policy for partial_exams
CREATE POLICY "Allow all access to partial_exams" ON partial_exams FOR ALL USING (true) WITH CHECK (true);

-- Create table to link topics to partial exams
CREATE TABLE IF NOT EXISTS partial_exam_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partial_exam_id uuid REFERENCES partial_exams(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES subject_topics(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on partial_exam_topics
ALTER TABLE partial_exam_topics ENABLE ROW LEVEL SECURITY;

-- Create policy for partial_exam_topics
CREATE POLICY "Allow all access to partial_exam_topics" ON partial_exam_topics FOR ALL USING (true) WITH CHECK (true);

-- Add task_type to tasks table to differentiate delivery vs study tasks
-- (delivery = tarea a entregar, study = tiempo de estudio del tema)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS estimated_minutes integer,
ADD COLUMN IF NOT EXISTS topic_id uuid;

-- Create table for university settings (year/semester global config)
CREATE TABLE IF NOT EXISTS university_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  current_year integer DEFAULT 1,
  current_semester integer DEFAULT 1,
  academic_schedule jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on university_settings
ALTER TABLE university_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for university_settings
CREATE POLICY "Allow all access to university_settings" ON university_settings FOR ALL USING (true) WITH CHECK (true);