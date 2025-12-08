-- SAFE SQL: Add user_id column without destroying existing schema
-- This will ONLY add the user_id column, nothing else will be changed

-- Step 1: Check and add user_id column (safe - won't break if it exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tasks' 
    AND column_name = 'user_id'
  ) THEN
    -- Add column as nullable first (safe for existing data)
    ALTER TABLE tasks ADD COLUMN user_id uuid;
    
    RAISE NOTICE '✅ Added user_id column successfully';
  ELSE
    RAISE NOTICE 'ℹ️ user_id column already exists - skipping';
  END IF;
END $$;

-- Step 2: Add foreign key constraint (safe - won't break if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
    AND constraint_name = 'tasks_user_id_fkey' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added foreign key constraint successfully';
  ELSE
    RAISE NOTICE 'ℹ️ Foreign key constraint already exists - skipping';
  END IF;
END $$;

-- Step 3: Create index (safe - won't break if exists)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 4: Verify what we have (just to check, doesn't change anything)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;


