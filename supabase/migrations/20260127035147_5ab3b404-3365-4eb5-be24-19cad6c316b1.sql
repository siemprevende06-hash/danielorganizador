-- Enable RLS on block_completions table
ALTER TABLE block_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to block_completions" 
  ON block_completions FOR ALL 
  USING (true) WITH CHECK (true);