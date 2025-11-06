import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
// These should be set in your .env file or provided by Supabase CLI
// 
// For local Supabase CLI development:
// 1. Run `supabase status` to get your local project URL and anon key
// 2. Or check your .env file in the supabase directory
//
// For production, use your Supabase project's API URL and anon key from the dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY_HERE' || supabaseAnonKey === 'dummy-key') {
  console.error(
    '⚠️ Supabase URL and Anon Key are required!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'Get your credentials from: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu/settings/api\n' +
    'For local development with Supabase CLI, run: supabase status'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', 
  supabaseAnonKey || 'dummy-key', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

