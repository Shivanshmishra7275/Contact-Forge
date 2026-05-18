'use client';

import React, { useActionState } from 'react';
import { motion } from 'framer-motion';
import { submitWaitlist, type WaitlistState } from './actions/waitlist';
import { ShieldCheck, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const initialState: WaitlistState = { status: 'idle' };

export default function Home() {
  const [state, formAction, isPending] = useActionState(submitWaitlist, initialState);

  return (
    <main className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Cinematic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-teal-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="z-10 w-full max-w-3xl px-6 flex flex-col items-center text-center">
        
        {/* Security Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-sm font-medium text-slate-300 mb-10 shadow-xl backdrop-blur-md"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          End-to-End Encrypted Architecture
        </motion.div>

        {/* Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
        >
          The Zero-Knowledge<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-400 via-emerald-300 to-blue-500 drop-shadow-sm">
            Contact Vault
          </span><br />
          for Professionals.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed font-light"
        >
          Google mines your contacts. We encrypt them. Join the waitlist for ContactForge Cloud.
        </motion.p>

        {/* Waitlist Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-md relative"
        >
          {state.status === 'success' || state.status === 'duplicate' ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-teal-500/30 rounded-2xl backdrop-blur-xl shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-teal-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
              <p className="text-slate-400 text-center">
                {state.status === 'duplicate' 
                  ? "We already have your email safely stored." 
                  : "We'll notify you the moment early access opens."}
              </p>
            </div>
          ) : (
            <form action={formAction} className="relative group">
              {/* Anti-spam honeypot — hidden from users, triggers bot detection */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute opacity-0 -z-10 w-0 h-0"
              />

              <div className="absolute inset-0 bg-teal-500/20 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-teal-500/30 group-focus-within:bg-teal-500/40 pointer-events-none" />
              
              <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-teal-500/50 transition-colors duration-300 overflow-hidden">
                <div className="pl-4 pr-2 text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                
                <input 
                  type="email" 
                  name="email"
                  id="waitlist-email"
                  placeholder="Enter your email address"
                  required
                  disabled={isPending}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-base py-3 disabled:opacity-50"
                />

                <button 
                  type="submit"
                  id="waitlist-submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>Join</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              {state.status === 'error' && (
                <p className="absolute -bottom-8 left-0 right-0 text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                  {state.message}
                </p>
              )}
            </form>
          )}
        </motion.div>

        {/* Footer/Trust markers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 text-slate-500 text-sm flex items-center justify-center gap-4"
        >
          <span>Offline-first mobile app</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Zero-knowledge cloud sync</span>
        </motion.div>

      </div>
    </main>
  );
}
