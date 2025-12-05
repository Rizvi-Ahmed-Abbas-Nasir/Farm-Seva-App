import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is missing in .env");
if (!supabaseKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");

export const supabase = createClient(supabaseUrl, supabaseKey);
