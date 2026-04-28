# PLAN.md — KelliWorks Content Calendar Tool
**Project owner:** Ola Fakomi  
**Assigned by:** Charity Moses  
**End users:** Charity Moses (content upload + scheduling) · Kelli Lewis (mobile review + approval)  
**Last updated:** April 28, 2026  

---

## 0. What We're Building and Why

Charity currently builds 7 weekly content calendars in Google Docs. Problems:
- Kelli can't review smoothly (one-by-one Docs, not mobile-friendly)
- A previous Claude artifact attempt failed because it had no persistence — Kelli's approvals weren't visible to Charity
- The artifact also couldn't be shared as a live URL

**The fix:** A single-page web app backed by Supabase (real database, real auth, realtime sync) hosted on Vercel (permanent live URL). Design is taken verbatim from Charity's existing reference HTML — no redesign.

---

## 1. Architecture Decision (Final — Do Not Revisit)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Single-page HTML + vanilla JS | Charity's reference HTML is already built in this format. No rebuild needed. |
| Database + Auth | Supabase | Free tier, built-in auth, Postgres, Realtime subscriptions in one line |
| Hosting | Vercel | Free tier, auto-deploys from GitHub, supports serverless `/api` functions |
| Notifications | Vercel serverless (`/api/notify.js`) + Slack webhook | Already scaffolded. Wire after MVP. |
| Lovable | ❌ Not used | Auth + persistence would still require a custom backend. No advantage over HTML + Supabase for a 2-user internal tool. |

**Tell Charity:** "Lovable couldn't give us the persistence guarantees you need without a custom backend anyway, so I went with HTML + Supabase, hosted on Vercel. You get a permanent URL, real data saving, and Kelli's approvals visible to you in real time."

---

## 2. Data Model

### Table: `weeks`
```sql
create table weeks (
  id            uuid primary key default gen_random_uuid(),
  week_start    date not null,
  label         text,                        -- e.g. "April 27 – May 1, 2025"
  created_by    uuid references auth.users,
  status        text default 'draft',        -- draft | active | archived
  created_at    timestamptz default now()
);
```

### Table: `posts`
```sql
create table posts (
  id              uuid primary key default gen_random_uuid(),
  week_id         uuid references weeks(id) on delete cascade,
  platform        text not null,             -- kw | kwa | kwt | ea | kl | gw | web
  day_label       text not null,             -- "MONDAY · APRIL 27"
  day_order       int not null,              -- 1–7 for sort
  post_time       text,                      -- "8:00 AM"
  format          text,                      -- Static Post | Reel | Carousel | Quote | etc.
  priority        text,                      -- HIGH | TREND | (blank)
  caption         text,
  visual_text     text,                      -- placeholder description
  image_url       text,                      -- Supabase Storage (v1.1)
  approval_status text default 'pending',    -- pending | approved | needs_edits | do_not_post | scheduled
  kelli_note      text,
  scheduled_at    timestamptz,
  updated_by      uuid references auth.users,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### Platform key → display name map
```
kw   → KelliWorks IG+FB
kwa  → KW Accounting
kwt  → KW Taxes
ea   → Entrepreneurs Anonymous
kl   → Kelli LinkedIn
gw   → Global Woman
web  → Website + GMB + Yelp
```

### Status enum values
`pending` | `approved` | `needs_edits` | `do_not_post` | `scheduled`

---

## 3. Auth Model

Two hardcoded users. No self-registration — Ola creates accounts in Supabase dashboard.

| User | Email | Role |
|---|---|---|
| Charity Moses | [charity's real email] | Can INSERT weeks/posts, UPDATE captions, mark scheduled |
| Kelli Lewis | [kelli's real email] | Can UPDATE approval_status + kelli_note only |

Role detection in the app: after login, check `supabase.auth.getUser()` email and set a `currentRole` variable (`'charity'` or `'kelli'`). The UI renders conditionally from that variable.

---

## 4. Row Level Security (RLS) Policies

**Must be applied before going live. The anon key is visible in page source.**

```sql
-- Enable RLS
alter table weeks enable row level security;
alter table posts enable row level security;

-- Both users can read everything
create policy "auth users read weeks"
  on weeks for select using (auth.role() = 'authenticated');

create policy "auth users read posts"
  on posts for select using (auth.role() = 'authenticated');

-- Only Charity can insert new weeks
create policy "charity insert weeks"
  on weeks for insert
  with check (auth.email() = 'CHARITY_EMAIL_HERE');

-- Only Charity can insert new posts
create policy "charity insert posts"
  on posts for insert
  with check (auth.email() = 'CHARITY_EMAIL_HERE');

-- Both users can update posts (field-level restriction is handled in app logic)
create policy "auth users update posts"
  on posts for update using (auth.role() = 'authenticated');
```

> **Note:** Supabase doesn't support column-level RLS natively. Kelli's update button in the app only sends `approval_status` and `kelli_note` — the app enforces what each user can change.

---

## 5. File Structure

```
calendar-site/
├── PLAN.md                         ← this file
├── PRD.md                          ← write after PLAN is approved
├── README.md                       ← setup notes (Supabase + Vercel)
├── vercel.json                     ← Vercel config
├── .env.example                    ← SUPABASE_URL, SUPABASE_ANON_KEY (never commit real keys)
├── .gitignore                      ← include .env
├── api/
│   └── notify.js                   ← Slack notifier (wire in v1.1)
├── src/
│   ├── index.html                  ← single-page app (main deliverable)
│   ├── config/
│   │   └── supabase-config.js      ← reads from env vars, exports supabase client
│   └── assets/
│       └── (logo, favicon)
└── tests/
    └── calendar.spec.js            ← Playwright tests
```

---

## 6. UI State Machine

The app has three screens, controlled by auth state:

```
[Not logged in]  →  Login Screen
                          ↓ supabase.auth.signInWithPassword()
[Logged in as Charity]  →  Charity View
[Logged in as Kelli]    →  Kelli View
```

### Login Screen
- Email + password fields
- "Sign In" button
- No sign-up link (accounts are pre-created)
- On success: detect role from email, render correct view

### Charity View
- Full header with "New Week" button
- Week selector dropdown (fetch from `weeks` table)
- All 7 platform tabs (same as reference HTML)
- Each post card has: editable caption, editable visual placeholder, approval status badge (read-only display of Kelli's input), Kelli's note (read-only display)
- "Mark as Scheduled" toggle per post
- "Upload New Week" flow (see Section 8)

### Kelli View
- Simplified header: "Review & Approve — Week of [date]"
- Same 7 platform tabs
- Same post cards — but approval select + notes input are the primary interaction
- No edit controls for caption or visual placeholder
- Autosave on `blur` (no submit button — matches reference HTML behavior)
- Optimized for 375px viewport

---

## 7. MVP Scope (Build This First)

### ✅ In MVP
- Login (email + password, 2 users)
- Charity can paste/upload a week's posts (JSON format, see Section 8)
- All 7 platform tabs render correctly
- Post cards match reference HTML design exactly
- Kelli can set approval status + leave note, autosaves on blur
- Both users see each other's changes in realtime (Supabase Realtime)
- Data persists across browser close and reopen
- Mobile-friendly at 375px (Kelli's review screen)

### ❌ Not in MVP (v1.1)
- Image upload (use visual text placeholder for now)
- Slack/email notifications (api/notify.js is scaffolded, wire later)
- Multi-week history browser
- Charity editing posts after initial upload
- "Mark as scheduled" toggle

---

## 8. Charity's Weekly Upload Flow (MVP)

Charity pastes a JSON object into a textarea. The app parses it and inserts into Supabase.

### JSON format Charity uses each Monday:
```json
{
  "week_start": "2025-04-27",
  "label": "April 27 – May 1, 2025",
  "posts": [
    {
      "platform": "kw",
      "day_label": "MONDAY · APRIL 27",
      "day_order": 1,
      "post_time": "8:00 AM",
      "format": "Static Post",
      "priority": "HIGH",
      "caption": "The firm your business deserves...",
      "visual_text": "Headline: The Firm Your Business Deserves. Navy background. Gold accent."
    }
  ]
}
```

**Provide Charity with a blank template she fills in each Monday.** One textarea → "Load Week" button → inserts all posts → redirects to the calendar view.

---

## 9. Realtime Sync

Both users see each other's changes live. One line of code:

```javascript
supabase.channel('posts-realtime')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'posts'
  }, payload => {
    updateCardInDOM(payload.new);
  })
  .subscribe();
```

`updateCardInDOM(post)` finds the card by `post.id` in the DOM and updates the approval badge and note display without a full page reload.

---

## 10. Design Rules (Non-Negotiable)

The reference HTML (`Asana_Calendar_May_27.html`) is the design bible. These rules cannot change:

| Element | Value |
|---|---|
| Font | Arial, sans-serif |
| Background | `#f5f5f5` |
| Header background | `#1a1a2e` (navy) |
| Tab bar border | `#c9a84c` (gold) |
| Active tab | navy bg, white text |
| Day label | gold bg `#c9a84c`, navy text, `border-radius: 4px 4px 0 0` |
| Post card | white bg, `border: 1px solid #e8e8e8` |
| Caption block | `border-left: 3px solid #c9a84c`, `background: #fafafa` |
| Visual box | `background: #fff8e1`, dashed gold border |
| Approve select — approved | green border + bg |
| Approve select — needs edits | gold border + bg |
| Approve select — do not post | red border + bg |
| Tab bar | sticky, `top: 0`, `z-index: 100` |

**Do not add new components, colors, or fonts.** Only add what is necessary to wire the Supabase data underneath the existing design.

---

## 11. Testing Checklist

### Automated (Playwright)
```
tests/calendar.spec.js:

✓ Tab switching — clicking each platform tab shows correct platform div
✓ Approval persists — set status to "Approved", reload page, status is still "Approved"
✓ Note saves on blur — type a note, click elsewhere, reload, note is still there
✓ Mobile viewport — at 375×667, approve-row is visible with no horizontal scroll
✓ Realtime — open two browser windows, approve in one, badge updates in the other
✓ Auth guard — unauthenticated user cannot access calendar, redirected to login
```

### Manual smoke test (do before sending URL to Charity)
1. Log in as Charity → upload a sample week via JSON → posts appear on all tabs
2. Log out → log in as Kelli → see the same posts → approve one → leave a note
3. Log out → log in as Charity → Kelli's approval badge and note are visible
4. Open on a real phone → verify no horizontal scroll, all taps register

---

## 12. Security Checklist (Run Before Going Live)

- [ ] RLS is enabled on `weeks` and `posts` tables
- [ ] Test with unauthenticated curl: `curl https://[project].supabase.co/rest/v1/posts -H "apikey: ANON_KEY"` → should return empty array or 403
- [ ] Supabase URL and anon key are in Vercel environment variables, not hardcoded in HTML
- [ ] `.gitignore` includes `.env`
- [ ] No passwords are committed to git

---

## 13. Deployment Steps

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "initial scaffold"
git remote add origin https://github.com/[your-org]/kelliworks-calendar
git push -u origin main

# 2. Connect to Vercel
# Go to vercel.com → New Project → Import from GitHub
# Add env vars: SUPABASE_URL, SUPABASE_ANON_KEY

# 3. Every subsequent deploy
git add .
git commit -m "your message"
git push  # Vercel auto-deploys on push to main
```

**URL format:** `kelliworks-calendar.vercel.app` (custom domain optional, not needed for internal tool)

---

## 14. Handoff Sequence

1. Deploy to production
2. Send Charity: URL + her login credentials + blank JSON template for Monday upload
3. Charity tests: uploads a week, checks all tabs render, checks mobile
4. Charity confirms → send Kelli: URL + her login credentials + one-sentence instruction:
   > "Open the link, sign in, and tap the platform tabs to review and approve posts."
5. Watch: Charity logs in, sees Kelli's approvals appear live

---

## 15. v1.1 Features (After MVP Is Stable)

| Feature | Effort | Notes |
|---|---|---|
| Slack notification when Kelli approves/flags | Low | `api/notify.js` already scaffolded. Add webhook URL to Vercel env. |
| Image upload | Medium | Supabase Storage bucket. Replace visual_text with actual image. |
| "Mark as scheduled" toggle | Low | Update `scheduled_at` timestamp on the post |
| Multi-week history | Medium | Week selector dropdown already in Charity's view |
| Charity edits posts after upload | Low | Unlock caption/visual_text fields for Charity's role |

---

## 16. Open Questions (Resolve Before Writing Code)

| # | Question | Default if not answered |
|---|---|---|
| 1 | What are Charity and Kelli's actual email addresses? | Must be resolved — used for role detection and RLS policy |
| 2 | Does Kelli want email notifications when Charity uploads a new week? | No, skip for MVP |
| 3 | Should Charity be able to edit a post's caption after upload? | No for MVP — v1.1 |
| 4 | Is the JSON upload format acceptable to Charity, or does she need a form UI? | JSON + template is MVP; form UI is v1.1 |
| 5 | Custom domain or vercel.app URL? | vercel.app is fine for an internal tool |

---

## 17. Execution Order

```
Day 1 — Morning
  ├── [ ] Create Supabase project
  ├── [ ] Run schema SQL (weeks + posts tables)
  ├── [ ] Enable RLS + write policies
  ├── [ ] Create Charity and Kelli user accounts in Supabase Auth
  ├── [ ] Create GitHub repo, push scaffold
  └── [ ] Connect Vercel, add env vars, confirm empty deploy works

Day 1 — Afternoon / Evening
  ├── [ ] Build login screen in index.html
  ├── [ ] Build Charity view (week selector, upload JSON flow, tab rendering)
  └── [ ] Build Kelli view (same tabs, approval select + note, autosave on blur)

Day 2 — Morning
  ├── [ ] Wire Supabase Realtime
  ├── [ ] Write Playwright tests
  └── [ ] Fix any failing tests

Day 2 — Afternoon
  ├── [ ] Security checklist
  ├── [ ] Manual smoke test (Charity login → upload → Kelli login → approve)
  ├── [ ] Mobile test at 375px
  └── [ ] Push to production, send preview URL to Charity

Day 3
  └── [ ] Charity confirms → send to Kelli → watch first live approval cycle

Week 2
  └── [ ] Wire Slack notify, image upload, mark-as-scheduled (v1.1)
```

---

*This PLAN.md is the source of truth. Do not write any code until Section 16 (Open Questions) is resolved and this plan has been reviewed.*
