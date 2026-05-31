-- FASE 1: Arreglar RLS para permitir acceso sin autenticación

-- 1. Cambiar RLS de tasks a "Allow all"
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- 2. Hacer lo mismo para projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- 3. goals
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true) WITH CHECK (true);

-- 4. goal_tasks
DROP POLICY IF EXISTS "Users can view their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can create their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can update their own goal tasks" ON goal_tasks;
DROP POLICY IF EXISTS "Users can delete their own goal tasks" ON goal_tasks;
CREATE POLICY "Allow all access to goal_tasks" ON goal_tasks FOR ALL USING (true) WITH CHECK (true);

-- 5. goal_block_connections
DROP POLICY IF EXISTS "Users can view their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can create their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can update their own goal block connections" ON goal_block_connections;
DROP POLICY IF EXISTS "Users can delete their own goal block connections" ON goal_block_connections;
CREATE POLICY "Allow all access to goal_block_connections" ON goal_block_connections FOR ALL USING (true) WITH CHECK (true);

-- 6. exams
DROP POLICY IF EXISTS "Users can view their own exams" ON exams;
DROP POLICY IF EXISTS "Users can create their own exams" ON exams;
DROP POLICY IF EXISTS "Users can update their own exams" ON exams;
DROP POLICY IF EXISTS "Users can delete their own exams" ON exams;
CREATE POLICY "Allow all access to exams" ON exams FOR ALL USING (true) WITH CHECK (true);

-- 7. university_subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can create their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON university_subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON university_subjects;
CREATE POLICY "Allow all access to university_subjects" ON university_subjects FOR ALL USING (true) WITH CHECK (true);

-- 8. user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);

-- 9. Hacer user_id nullable en tablas que lo requieran
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goal_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE goal_block_connections ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE exams ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE university_subjects ALTER COLUMN user_id DROP NOT NULL;