# Supabase Setup Instructions

## Your Supabase Project
- **Project Name:** namitha@flowable.me's Project
- **Project Reference ID:** uhvecwmzwcyoskuxlwqu
- **Region:** Southeast Asia (Singapore)

## Quick Setup Steps

### 1. Get Your Supabase Credentials

Go to your Supabase Dashboard:
👉 **https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu/settings/api**

You'll find:
- **Project URL** (API URL) - Copy this for `VITE_SUPABASE_URL`
- **anon/public key** - Copy this for `VITE_SUPABASE_ANON_KEY`

### 2. Update Your `.env` File

Open the `.env` file in the `FinAI` directory and add/update these lines:

```bash
VITE_SUPABASE_URL=https://uhvecwmzwcyoskuxlwqu.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

**Note:** The URL format is usually: `https://[project-ref].supabase.co`

### 3. Verify Your Setup

After adding the credentials, restart your dev server:
```bash
npm run dev
```

The authentication should now work with your Supabase project!

## Troubleshooting

If you see errors about missing Supabase credentials:
1. Make sure the `.env` file is in the `FinAI` directory (not the parent directory)
2. Make sure the variable names start with `VITE_` (required for Vite)
3. Restart your dev server after updating `.env`
4. Check the browser console for any error messages

## Need Help?

- Supabase Dashboard: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu
- Supabase Docs: https://supabase.com/docs



