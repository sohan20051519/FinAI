<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12Gz91sJ5Sp11TnrcDMdzMaKYjNicQI3J

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your Gemini API key and Supabase credentials:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Get your Gemini API key from:** https://aistudio.google.com/apikey
   
   **Note:** You can also use `API_KEY` instead of `GEMINI_API_KEY` if you prefer.
   
   **For Supabase setup:**
   - If using Supabase CLI locally, run `supabase status` to get your local project URL and anon key
   - For production, get these values from your Supabase project dashboard (Settings > API)
   - The Supabase CLI should already be configured in your project

3. Run the app:
   ```bash
   npm run dev
   ```
