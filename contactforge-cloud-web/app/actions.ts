'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export type WaitlistState = {
  status: 'idle' | 'loading' | 'success' | 'duplicate' | 'error';
  message?: string;
};

export async function submitWaitlist(
  prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const emailRaw = formData.get('email') as string;

  if (!emailRaw) {
    return { status: 'error', message: 'Email is required.' };
  }

  const email = emailRaw.toLowerCase().trim();

  try {
    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email, source: 'landing-page' }]);

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return { status: 'duplicate', message: 'You are already on the waitlist.' };
      }
      console.error('Supabase insert error:', error);
      return { status: 'error', message: 'Failed to join waitlist. Please try again.' };
    }

    return { status: 'success', message: "You're on the list!" };
  } catch (err) {
    console.error('Action error:', err);
    return { status: 'error', message: 'An unexpected error occurred.' };
  }
}
