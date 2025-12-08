-- Query to check the actual column names in your profiles table
-- Run this in Supabase SQL Editor to see your schema

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
