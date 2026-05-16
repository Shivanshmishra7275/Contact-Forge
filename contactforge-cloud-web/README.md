# ContactForge Cloud (Waitlist Landing Page)

This is **Step 2** of the ContactForge Cloud strategy. This project is a separate Next.js application designed specifically to serve as the landing page and waitlist capture system for the upcoming encrypted sync feature.

## Purpose & Scope
This page acts as a hype and validation surface.
- **ContactForge Local:** Available now. Offline-first. On-device.
- **ContactForge Cloud:** Upcoming. Optional. Encrypted sync layer.

**Note:** The cloud sync feature is NOT live yet. This page strictly collects emails for the waitlist.

## Architecture
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + Framer Motion
- **Backend:** Supabase (PostgreSQL)
- **Security:** We use React Server Actions to handle waitlist submissions. The `SUPABASE_SERVICE_ROLE_KEY` is kept strictly on the server, avoiding any exposure to the client. This allows us to securely insert data while completely blocking public database access via Row Level Security (RLS).

## Setup & Local Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Add your Supabase keys to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup
Run the SQL found in `supabase/waitlist.sql` in your Supabase project's SQL editor. This creates the table and locks it down so no public client can read or write to it directly.

## Deployment
This project is Vercel-ready. Simply import the repository in Vercel, set your environment variables, and deploy. The Server Action will natively compile to a secure Serverless/Edge Function.
