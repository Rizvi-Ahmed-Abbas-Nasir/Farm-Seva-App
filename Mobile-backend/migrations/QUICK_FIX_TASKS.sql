-- QUICK FIX: Add user_id to tasks table
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Add user_id column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid;

-- Delete any existing tasks without user_id (optional - comment out if you want to keep them)
DELETE FROM tasks WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

