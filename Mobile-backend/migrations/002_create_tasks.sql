-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_time time NOT NULL,
  goal text,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Create index on task_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);

-- Create index on completed status
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Create composite index for user and date queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tasks
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own tasks
CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own tasks
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own tasks
CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

