/*
  # Create students table and security policies

  1. New Tables
    - `students`
      - `id` (uuid, primary key) - matches auth.users id
      - `full_name` (text) - student's full name
      - `email` (text) - student's email
      - `score` (integer) - student's score
      - `created_at` (timestamp) - when the record was created

  2. Security
    - Enable RLS on students table
    - Add policies for:
      - Students can read all records (for leaderboard)
      - Students can only update their own records
      - Students can only delete their own records
*/

CREATE TABLE students (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow students to read all records (for leaderboard)
CREATE POLICY "Students can view all profiles"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow students to update only their own records
CREATE POLICY "Students can update own profile"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow students to delete only their own records
CREATE POLICY "Students can delete own profile"
  ON students
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Allow students to insert their own records only
CREATE POLICY "Students can insert own profile"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);