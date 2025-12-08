-- Quick fix: Add user_id column to existing tasks table
-- Run this if you get "column tasks.user_id does not exist" error

-- Step 1: Add user_id column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    -- First, if table has data, we need to handle it
    -- For now, we'll make it nullable temporarily, then update
    ALTER TABLE tasks ADD COLUMN user_id uuid;
    
    -- If you have existing tasks, you might want to delete them or assign to a user
    -- For safety, we'll just make it NOT NULL after adding
    -- You may need to update existing rows first
    
    -- Make it NOT NULL after adding
    -- ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_user_id_fkey' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Create index
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 4: Update RLS policies (if needed)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

