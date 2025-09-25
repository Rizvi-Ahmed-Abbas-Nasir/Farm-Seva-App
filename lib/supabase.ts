import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl =  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error(" ERROR: Supabase URL is missing. Check your app.json or environment configuration.");
  throw new Error("Supabase URL is not defined.");
}

if (!supabaseAnonKey) {
  console.error("ERROR: Supabase Anon Key is missing. Check your app.json or environment configuration.");
  throw new Error("Supabase Anon Key is not defined.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

