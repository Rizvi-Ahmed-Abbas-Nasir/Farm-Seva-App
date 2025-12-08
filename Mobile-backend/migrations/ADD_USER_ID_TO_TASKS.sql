-- Fix: Add user_id column to existing tasks table
-- Run this in your Supabase SQL Editor

-- Step 1: Check if column exists and add it if missing
DO $$ 
BEGIN
  -- Check if user_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tasks' 
    AND column_name = 'user_id'
  ) THEN
    -- Add the column (nullable first to handle existing data)
    ALTER TABLE tasks ADD COLUMN user_id uuid;
    
    -- If you have existing tasks, you may want to delete them or assign to a user
    -- For now, we'll delete any existing tasks without user_id
    DELETE FROM tasks WHERE user_id IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
    
    RAISE NOTICE 'Added user_id column to tasks table';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

-- Step 2: Add foreign key constraint if it doesn't exist
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
    
    RAISE NOTICE 'Added foreign key constraint';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Step 3: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 4: Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'user_id';

