'use client';

import { useActionState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { submitWaitlist } from '@/app/actions/waitlist';

export default function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(submitWaitlist, { status: 'idle' });

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <AnimatePresence mode="wait">
        {state.status === 'success' || state.status === 'duplicate' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-teal-50 mb-2">
              {state.status === 'duplicate' ? "You're already on the list" : "You're on the list"}
            </h3>
            <p className="text-teal-200/70 text-sm">
              We'll notify you the moment ContactForge Cloud is ready for early access.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            action={formAction}
            className="flex flex-col gap-4"
          >
            {/* Honeypot field for anti-spam */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute opacity-0 -z-10 w-0 h-0"
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="name"
                placeholder="First name (optional)"
                disabled={isPending}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                disabled={isPending}
                className="flex-[2] bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-slate-100 hover:bg-white text-slate-900 font-medium rounded-lg px-6 py-3 text-sm flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,184,166,0.15)] hover:shadow-[0_0_25px_rgba(20,184,166,0.25)]"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reserve Spot'}
              </button>
            </div>
            {state.status === 'error' && state.message && (
              <p className="text-red-400 text-sm text-center mt-2">{state.message}</p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
