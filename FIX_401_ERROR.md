# Fix 401 Unauthorized Error

## The Problem
You're getting a 401 error because your Supabase anon key is still set to `YOUR_ANON_KEY_HERE` in the `.env` file.

## Quick Fix

1. **Get your Supabase anon key:**
   - Go to: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu/settings/api
   - Find the **"anon"** or **"public"** key
   - Copy the entire key (it's a long JWT token starting with `eyJ...`)

2. **Update your `.env` file:**
   - Open `FinAI/.env` file
   - Find this line:
     ```
     VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
     ```
   - Replace `YOUR_ANON_KEY_HERE` with your actual anon key
   - It should look like:
     ```
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVo...
     ```

3. **Restart your dev server:**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

4. **Test again:**
   - Try signing up or signing in
   - The 401 error should be gone
   - After successful sign-in, you should be redirected to the dashboard

## About the Redirect Issue

The redirect should work automatically once the authentication succeeds. The app checks:
- If `isAuthenticated` is `true` → Shows dashboard
- If `isAuthenticated` is `false` → Shows sign-in/sign-up pages

After successful sign-in, the state updates and you'll see the dashboard automatically.

## Still Having Issues?

If you still see errors after updating the anon key:
1. Make sure the `.env` file is in the `FinAI` directory (same folder as `package.json`)
2. Make sure variable names start with `VITE_` (required for Vite)
3. Restart your dev server completely
4. Clear your browser cache and try again

