# How to Get Your Supabase Credentials

Your Supabase project is already set up! Here's how to get your API credentials:

## Quick Steps:

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu/settings/api

2. **Copy the following values:**
   - **Project URL** (API URL) - This is your `VITE_SUPABASE_URL`
   - **anon/public key** - This is your `VITE_SUPABASE_ANON_KEY`

3. **Create a `.env` file in the `FinAI` directory** with:
   ```bash
   VITE_SUPABASE_URL=https://uhvecwmzwcyoskuxlwqu.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Alternative: Using Supabase CLI

If you want to link your project and get credentials automatically, you can:

1. Get your database password from: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu/settings/database
2. Run: `supabase link --project-ref uhvecwmzwcyoskuxlwqu`
3. Then run: `supabase status` to see your credentials

But the easiest way is to just copy them from the dashboard!



