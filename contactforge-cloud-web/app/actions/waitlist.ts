'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeEmail, validateEmail } from '@/lib/validation';

export type WaitlistState = {
  status: 'idle' | 'loading' | 'success' | 'duplicate' | 'error';
  message?: string;
};

export async function submitWaitlist(
  prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const emailRaw = formData.get('email') as string;
  const nameRaw = formData.get('name') as string;
  const honeypot = formData.get('website') as string; // hidden anti-spam field

  // Anti-spam check
  if (honeypot) {
    // If honeypot is filled, silently return success to trick bot
    return { status: 'success', message: 'You are on the list.' };
  }

  if (!emailRaw) {
    return { status: 'error', message: 'Email is required.' };
  }

  const email = normalizeEmail(emailRaw);
  if (!validateEmail(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }

  const name = nameRaw ? nameRaw.trim() : null;

  try {
    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email, name, source: 'landing-page' }]);

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return { status: 'duplicate', message: 'You are already on the waitlist.' };
      }
      console.error('Supabase insert error:', error);
      return { status: 'error', message: 'Failed to join waitlist. Please try again.' };
    }

    return { status: 'success', message: 'Success' };
  } catch (err) {
    console.error('Action error:', err);
    return { status: 'error', message: 'An unexpected error occurred.' };
  }
}
