# KelliWorks Calendar Site

A calendar tool for KelliWorks Accounting Firm.

## Project Structure

```
calendar-site/
├── src/
│   ├── index.html              # Main calendar page
│   └── config/
│       └── supabase-config.js  # Supabase settings (edit this file)
├── api/
│   └── notify.js               # Vercel serverless function for Slack notifications
├── html_Updates/               # Drop HTML snippet updates here
├── vercel.json                 # Vercel deployment config
└── README.md                   # You are here
```

## Setup

### 1. Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create or open your project
3. **Project Settings → API** — copy the `Project URL` and `anon public` key
4. Paste values into `src/config/supabase-config.js`

### 2. Deploy

**Option A: Vercel** (Recommended — supports the `/api/notify` function)
```bash
npm i -g vercel
vercel --prod
```

**Option B: cPanel (kelliworks.com)**
```bash
# Upload src/index.html to public_html/ via FileZilla or cPanel File Manager
# Note: /api/notify will not work on static hosting
```

**Option C: Netlify**
```bash
# Drag src/index.html to netlify.com/drop
```

## Adding HTML Updates

Drop snippet files into `html_Updates/` and paste the relevant sections into `src/index.html`.
