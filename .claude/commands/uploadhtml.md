# /uploadhtml — Upload a Day's HTML Snippet into the Training Site

You are uploading new HTML content for a specific training day into `src/index.html`.
The user will specify the day (e.g., `/uploadhtml wednesday`).

---

## Step 0 — Confirm the target day

The user will specify the day as an argument. Map it to:

| What user says | Day key | Snippet file | Panel ID | JS DAYS key | Comment marker |
|---|---|---|---|---|---|
| monday / mon | mon | `html_Updates/monday_section_snippet.html` | `panel-mon` | `mon` | `═══ MONDAY` |
| tuesday / tue | tue | `html_Updates/tuesday_section_snippet.html` | `panel-tue` | `tue` | `═══ TUESDAY` |
| wednesday / wed | wed | `html_Updates/wednesday_section_snippet.html` | `panel-wed` | `wed` | `═══ WEDNESDAY` |
| thursday / thu | thu | `html_Updates/thursday_section_snippet.html` | `panel-thu` | `thu` | `═══ THURSDAY` |
| friday / fri | fri | `html_Updates/friday_section_snippet.html` | `panel-fri` | `fri` | `═══ FRIDAY` |
| week2 | week2 | `html_Updates/week2_section_snippet.html` | `panel-week2` | _(no DAYS entry)_ | `═══ WEEK 2` |

If the user did not specify a day, ask: **"Which day's snippet are you uploading? (monday / tuesday / wednesday / thursday / friday / week2)"**

---

## Step 1 — Read the snippet file

Read the full snippet file for that day. It has up to 3 parts (not all snippets have all parts):

- **`<style>` block** — between `<!-- STEP 3: ADD TO <style> -->` (or `STEP 2: ADD TO <style>`) and the next major comment marker
- **Panel HTML block** — the full `<div class="day-panel" id="panel-{day}">...</div>`. **Important:** locate the `STEP 1: REPLACE PANEL BLOCK` comment first, then find the panel `<div>` *after* that marker. Never match the panel reference inside the top instruction comment box.
- **Script block** — any `setLoomVideo(...)` calls or other JS inside a `<!-- STEP 2: ADD TO SCRIPT -->` comment

Also read `src/index.html` in full so you can make targeted edits.

---

## Step 2 — Inject the `<style>` block (if present)

If the snippet contains a `<style>` block with new CSS classes:

1. Check `src/index.html` — does each CSS class already exist inside the main `<style>` tag?
2. For any class that does **not** already exist, inject it just before the closing `</style>` tag.
3. Do **not** duplicate classes that are already present.
4. Do **not** add the `<style>...</style>` wrapper tags — only insert the inner CSS rules.

---

## Step 3 — Replace the day panel

1. In `src/index.html`, locate the existing panel: `<div class="day-panel" id="panel-{day}">` through its closing `</div>`.
2. Replace the entire block with the new panel HTML from the snippet.
3. Preserve the surrounding comment markers (e.g., `<!-- ═══ WEDNESDAY -->`) if they exist.

---

## Step 4 — Update the DAYS JavaScript object

1. Scan the **new** panel HTML and collect all checkbox `id` attributes: every `<input type="checkbox" id="...">`.
2. Find the `DAYS` object in the `<script>` block of `src/index.html`:
   ```js
   const DAYS = {
     mon: { ids: [...] },
     tue: { ids: [...] },
     ...
   };
   ```
3. Replace the `ids` array for the target day with the exact list of IDs from step 4.1, in document order.
4. **Do not** include disabled checkboxes (e.g., Week 2 items with `disabled` attribute) — these are not tracked.

---

## Step 5 — Standardize all `saveQuestion` buttons (required)

Every question box across the site must use the same CTA wording. After inserting the panel, scan every `<div class="qbox-actions">` in the new panel and enforce:

- Button text: **`Send`** (never "Save Note", "Submit", or anything else)
- Confirmation span text: **`✓ Sent to Slack`** (never "✓ Saved!", "✓ Done", etc.)

Correct pattern:
```html
<button class="btn btn-teal" onclick="saveQuestion('{key}')">Send</button>
<span class="q-saved-msg" id="saved-{key}">✓ Sent to Slack</span>
```

If the snippet uses different wording, fix it in `src/index.html` after insertion — do not accept whatever the snippet says. This is a site-wide standard.

---

## Step 6 — Verify no duplicate IDs

After the edit, confirm:
- No duplicate `id` values exist anywhere in `src/index.html` (e.g., an old `ring-wed` and a new `ring-wed`)
- The progress ring IDs (`ring-{day}`, `ring-{day}-pct`) are present exactly once in the new panel

---

## Step 7 — Run the relevant tests from `test.md`

Run through the following test.md sections manually by reading the updated HTML and checking logic:

- **Section 6** — confirm all new checkbox IDs in `DAYS.{day}.ids` match the actual checkbox elements in the panel
- **Section 7** — confirm every `saveQuestion` button, textarea ID, and confirmation span are correctly paired
- **Section 4** — note which Loom/Fathom videos are active (real URLs) vs. pending (`href="#"`) in the new panel
- **Section 5** — note any new external links (Pipeline, Dropbox, Fathom, Keeper, etc.) and confirm they have `target="_blank"`

Report a summary of findings:
```
✅ Checkbox IDs updated: {N} items in DAYS.{day}.ids
✅ saveQuestion buttons: {N} question boxes wired
✅ Active video links: {N}  |  Pending: {N}
✅ External links: {list any new ones}
⚠️  Issues found: {list any problems}
```

---

## Step 8 — Ask permission to push to GitHub

Present the summary above, then ask:

> **Ready to push to GitHub?**
> This will commit and push the updated `src/index.html` to the `main` branch on Vercel (auto-deploys).
> Reply **yes** to proceed or **no** to review first.

If the user says yes:
1. Stage only `src/index.html` (do not stage snippet files or other untracked files)
2. Create a commit with this message format:
   ```
   Update {Day} panel — replace with new HTML snippet

   - Replaced panel-{day} with new content from html_Updates/{day}_section_snippet.html
   - Updated DAYS.{day}.ids with {N} checkbox IDs
   - Injected {N} new CSS classes into <style> block

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
3. Push to `origin main`
4. Confirm push was successful and remind the user Vercel will auto-deploy

---

## Common things to watch for

- **New CSS component types** (e.g., `.fathom-slot`, `.sop-phase`, `.role-table`) — always check for duplicates before injecting
- **Loom pending placeholders** — some snippets have `href="#"` and `.loom-play.pending` — these are intentional, not bugs
- **Snippet comment block at the top** — the `╔══╗` header comment is instructions only, do not paste it into index.html
- **Script comment blocks** — the `setLoomVideo` calls are often inside `<!-- ... -->` comment wrappers — extract the actual JS calls, strip the comment wrapper
- **The `DAYS` object uses exact day keys** — `mon`, `tue`, `wed`, `thu`, `fri` — never full names
- **Video URLs must never be lost** — snippets often mark videos as `pending` (`href="#"`, `.loom-play.pending`, "📹 Video coming soon") in the panel HTML but include the real Loom URLs in the Step 3 script comment block. **Always read the Step 3 comment**, extract every `setLoomVideo(...)` call, and wire the URLs directly into the panel's `<a>` tags before inserting into `src/index.html`. A video with a real URL should never be left as `href="#"` or show "coming soon". The site does not use a `setLoomVideo()` function — hardcode the URL in the `href` and set the status text to `▶ Click to watch`, removing the `pending` class from both the `<a>` and the `<div class="loom-status">`.
- **Date accuracy** — always verify that any dates shown in panel headers, hero sections, and nav badges follow the correct 2026 calendar. The confirmed date sequence is:
  - **Week 1:** Mon Apr 13 · Tue Apr 14 · Wed Apr 15 · Thu Apr 16 · Fri Apr 17
  - **Week 2:** Mon Apr 20 · Tue Apr 21 · Wed Apr 22 · Thu Apr 23 · Fri Apr 24
  - If a snippet contains a hardcoded date that doesn't match this sequence, correct it before inserting into `src/index.html`.
