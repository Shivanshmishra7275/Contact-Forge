-- Create waitlist table
CREATE TABLE waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  interested_in text,
  source text DEFAULT 'landing-page',
  status text DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text
);

-- Enable Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Explicitly block all public access. 
-- Since we use the Service Role Key in a secure Next.js Server Action, 
-- we bypass RLS completely. This guarantees that client-side bots cannot 
-- query, insert, or manipulate the table directly via the Anon key.
CREATE POLICY "Block public access" ON waitlist FOR ALL USING (false);
