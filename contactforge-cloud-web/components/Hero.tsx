'use client';

import { motion } from 'framer-motion';
import WaitlistForm from './WaitlistForm';

export default function Hero() {
  return (
    <section className="w-full px-6 py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-3xl z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Offline app available. Cloud sync upcoming.
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-50 mb-6 leading-tight">
          Your contacts stay yours.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
            Even in the cloud.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          ContactForge Cloud brings optional encrypted sync to a local-first contact manager. For people who want convenience without giving up control.
        </p>

        <WaitlistForm />
      </motion.div>
    </section>
  );
}
