-- Clean up existing NULL user_id records (assign to a system user or delete)
-- For now, we'll delete records with NULL user_id as they cannot be properly owned
DELETE FROM daily_plan_tasks WHERE daily_plan_id IN (SELECT id FROM daily_plans WHERE user_id IS NULL);
DELETE FROM daily_plans WHERE user_id IS NULL;
DELETE FROM tasks WHERE user_id IS NULL;
DELETE FROM projects WHERE user_id IS NULL;
DELETE FROM university_subjects WHERE user_id IS NULL;

-- Now make user_id columns NOT NULL to enforce ownership
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE daily_plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE university_subjects ALTER COLUMN user_id SET NOT NULL;

-- Add comments to document the security requirement
COMMENT ON COLUMN tasks.user_id IS 'Required: Every task must have an owner for RLS security';
COMMENT ON COLUMN daily_plans.user_id IS 'Required: Every daily plan must have an owner for RLS security';
COMMENT ON COLUMN projects.user_id IS 'Required: Every project must have an owner for RLS security';
COMMENT ON COLUMN university_subjects.user_id IS 'Required: Every subject must have an owner for RLS security';
