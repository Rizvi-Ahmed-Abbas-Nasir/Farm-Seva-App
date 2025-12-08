-- Add user_id column to existing tasks table
-- The table already has 'id' column, we just need to add 'user_id'

-- Step 1: Add user_id column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 2: If you have existing tasks, you need to either:
-- Option A: Delete them (uncomment the line below)
-- DELETE FROM tasks WHERE user_id IS NULL;

-- Option B: Assign them to a specific user (replace USER_UUID with actual user ID)
-- UPDATE tasks SET user_id = 'USER_UUID_HERE' WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL (only after handling existing data)
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Step 6: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

