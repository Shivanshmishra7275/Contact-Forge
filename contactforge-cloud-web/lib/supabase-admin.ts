import { createClient } from '@supabase/supabase-js';

// This file must NEVER be imported into a client component.
// It uses the service role key to bypass RLS safely from the server.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables. Waitlist will fail to submit.');
}

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);
