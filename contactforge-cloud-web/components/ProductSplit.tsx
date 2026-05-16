'use client';

import { motion } from 'framer-motion';
import { Smartphone, Cloud } from 'lucide-react';

export default function ProductSplit() {
  return (
    <section className="w-full max-w-5xl px-6 py-20 mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Local Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 border border-slate-700">
            <Smartphone className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-50 mb-3">ContactForge Local</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            The foundation. A privacy-first utility that processes everything on-device. No backend required. Works entirely offline.
          </p>
          <div className="inline-flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Available Now
          </div>
        </motion.div>

        {/* Cloud Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-teal-900/20 to-slate-900/50 border border-teal-500/20 rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 border border-teal-500/20">
            <Cloud className="w-6 h-6 text-teal-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-50 mb-3">ContactForge Cloud</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            The premium layer. Optional encrypted sync across your devices. Designed so your raw contacts are never readable by the platform.
          </p>
          <div className="inline-flex items-center text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Upcoming • Waitlist Open
          </div>
        </motion.div>

      </div>
    </section>
  );
}
