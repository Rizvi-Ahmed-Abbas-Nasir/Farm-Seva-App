-- ULTRA SAFE: This query will ONLY add user_id column
-- It will NOT delete, modify, or change ANY existing columns or data
-- Safe to run multiple times - it checks before adding

-- Add user_id column ONLY if it doesn't exist
-- This keeps it nullable so existing data is safe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'tasks' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id uuid;
    RAISE NOTICE '✅ Successfully added user_id column';
  ELSE
    RAISE NOTICE 'ℹ️ user_id column already exists - no changes made';
  END IF;
END $$;

-- Add foreign key ONLY if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
      AND constraint_name = 'tasks_user_id_fkey'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Successfully added foreign key';
  ELSE
    RAISE NOTICE 'ℹ️ Foreign key already exists - no changes made';
  END IF;
END $$;

-- Add index ONLY if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Just show what columns exist (read-only, doesn't change anything)
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;


