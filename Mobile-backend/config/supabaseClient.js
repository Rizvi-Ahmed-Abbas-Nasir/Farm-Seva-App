import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL is missing in .env");
  throw new Error("SUPABASE_URL is missing in .env");
}
if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing in .env");
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in .env");
}

console.log("✅ Supabase client initialized");
console.log("📍 Supabase URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "NOT SET");

// Create abort controller for timeout
const createTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, timeoutId };
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options = {}) => {
      const { signal, timeoutId } = createTimeoutSignal(10000); // 10 second timeout
      return fetch(url, {
        ...options,
        signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});
