# ContactForge Cloud — Waitlist Landing Page

This is **Step 2** of the ContactForge Cloud strategy. A standalone **Next.js 16** application that serves as the landing page and waitlist capture system for the upcoming encrypted sync feature.

## Purpose & Scope

| Surface | Status |
|---------|--------|
| **ContactForge Local** (mobile app) | ✅ Available now. Offline-first. On-device. |
| **ContactForge Cloud** (sync) | 🚧 Upcoming. Optional. Encrypted. |

**Note:** Cloud sync is **NOT** live yet. This page collects emails for the early-access waitlist.

---

## Architecture

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v3 + Framer Motion
- **Backend:** Supabase (PostgreSQL) via Server Actions
- **Anti-spam:** Honeypot field (`name="website"`) — hidden from real users, detects bots
- **Security model:** `SUPABASE_SERVICE_ROLE_KEY` lives only on the server side inside `app/actions/waitlist.ts`. Client components never touch the Supabase client or keys.

### Server Action Architecture

```
page.tsx (client component)
  └─ form action → app/actions/waitlist.ts (server action, 'use server')
       └─ validates email + honeypot
       └─ calls lib/supabase-admin.ts (service role key, server-only)
       └─ inserts into Supabase 'waitlist' table
```

**Important:** `app/actions/waitlist.ts` is the **single authoritative action**. Do not create duplicate action files in `app/actions.ts`.

---

## Required Environment Variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-only, never expose to client) |

---

## Local Development Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Turbopack / Monorepo Note

This project lives inside the ContactForge monorepo which has a root-level `package-lock.json`. The `next.config.ts` sets `turbopack.root` (Next.js 15+ / 16 API) to this subdirectory to prevent the "multiple lockfiles" detection warning from Turbopack.

---

## Supabase Setup

Run the SQL in `supabase/waitlist.sql` in your Supabase project's SQL editor.

This creates:
- The `waitlist` table with `email`, `name`, `source`, `created_at` columns
- A unique constraint on `email` (duplicate submissions return `status: 'duplicate'`)
- RLS policies that block ALL public reads/writes (only service role can insert)

---

## Component Structure

```
app/
  layout.tsx         → Root layout (Inter font, dark mode, metadata)
  page.tsx           → Landing page with inline waitlist form
  globals.css        → Tailwind base + body styles
  actions/
    waitlist.ts      → Server action: validates email, inserts to Supabase

components/
  Hero.tsx           → Alternative hero section (uses WaitlistForm)
  WaitlistForm.tsx   → Standalone waitlist form (used by Hero.tsx)
  ProductSplit.tsx   → Feature split section

lib/
  supabase-admin.ts  → Supabase admin client (server-only)
  validation.ts      → validateEmail + normalizeEmail utilities
  utils.ts           → cn() class merging helper
```

---

## Deployment

This project is **Vercel-ready**. Import the `contactforge-cloud-web` subdirectory into Vercel (or set the root directory in Vercel project settings), add environment variables, and deploy.

The Server Action compiles to a secure Serverless Function — the service role key never reaches the browser.

---

## Known Limitations

- The waitlist `name` field is optional and currently not shown in the `page.tsx` inline form (it is collected by `WaitlistForm.tsx` if used separately).
- `Hero.tsx` and `WaitlistForm.tsx` are available as alternative/modular components but not used by the main `page.tsx`. They exist for potential multi-section landing page layouts.
