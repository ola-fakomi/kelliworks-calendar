// Supabase Configuration
// Replace these values with your Supabase project settings
// Found at: Supabase Dashboard > Project Settings > API

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// User ID for this calendar (change per user if needed)
const USER_ID = 'calendar-user';

// Slack notifications are handled server-side via /api/notify (Vercel function)
// Set SLACK_WEBHOOK_URL in Vercel environment variables — never put it here
