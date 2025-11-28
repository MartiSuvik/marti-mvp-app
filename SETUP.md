# Setup Guide

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Go to [supabase.com](https://supabase.com) and create a new project
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script to create tables and policies

3. **Get Supabase Credentials**

   - In Supabase dashboard, go to Settings > API
   - Copy your Project URL and anon/public key

4. **Configure Environment**

   - Create a `.env` file in the root directory:

   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Database Setup

The schema includes:

- **user_profiles**: Stores user onboarding data
- **agencies**: Directory of verified agencies
- **deals**: Matches between users and agencies

Sample agencies are automatically inserted when you run the schema.

## Testing the Flow

1. Visit `http://localhost:3000`
2. Click "Grow Now" → Sign up
3. Complete the 5-step onboarding
4. View your 3 agency matches on the Deals page
5. Move deals to "Ongoing" to track active partnerships
6. Browse all agencies in the Agencies directory
7. Update your profile in "My Brand" to regenerate matches

## Troubleshooting

### "Supabase credentials not found"

- Make sure your `.env` file exists and has the correct variable names
- Restart the dev server after creating/updating `.env`

### "Error loading deals"

- Check that you've run the SQL schema in Supabase
- Verify RLS policies are enabled
- Check browser console for specific error messages

### Authentication not working

- Ensure Supabase Auth is enabled in your project settings
- Check that email auth is enabled (Settings > Authentication > Providers)

## Next Steps

- Add more agencies to the database
- Customize matching algorithm weights in `lib/matchingEngine.ts`
- Add agency detail pages
- Implement booking calendar integration
- Add email notifications
