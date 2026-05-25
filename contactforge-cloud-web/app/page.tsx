'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, Smartphone, Code, Zap, History, Database, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0e1a] flex flex-col items-center relative overflow-hidden font-sans selection:bg-teal-500/30 pb-24">
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

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center pt-32">
        
        {/* Security Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-sm font-medium text-slate-300 mb-10 shadow-xl backdrop-blur-md"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          100% Offline & Local-First
        </motion.div>

        {/* Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Your Contacts,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-400 via-emerald-300 to-blue-500 drop-shadow-sm">
            Intelligently Secured.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
        >
          ContactForge V3 is a privacy-first mobile app for cleaning contacts, tracking relationships, and safely managing your real-world network—all on your device.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-24"
        >
          <a
            href="https://github.com/Shivanshmishra7275/Contact-Forge/releases"
            className="plausible-event-name=Download+APK flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-semibold px-8 py-4 rounded-xl transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            <span>Download APK</span>
          </a>
          <a
            href="https://github.com/Shivanshmishra7275/Contact-Forge"
            className="plausible-event-name=View+GitHub flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
          >
            <Code className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </motion.div>

        {/* V3 Highlights Grid */}
        <div className="w-full text-left mb-24">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">What's New in V3</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-teal-500/20 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Flashcard Duplicates</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Review duplicate contacts one pair at a time using a focused flashcard UI. No overwhelming lists, just clear reasons and simple actions: Merge, Not a Match, or Review Later.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-blue-500/20 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Deterministic Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our new heuristic engine uses precise exact-matching and fuzzy rules to detect duplicates. Every suggestion comes with an explainable, human-readable reason.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-purple-500/20 w-12 h-12 flex items-center justify-center rounded-xl mb-6">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smarter Dashboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Instantly see actionable insights. A new call-to-action widget surfaces duplicate candidates directly on your home screen, keeping your network pristine.
              </p>
            </div>
          </div>
        </div>

        {/* Version History */}
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 md:p-12 text-left backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8">
            <History className="w-6 h-6 text-slate-300" />
            <h2 className="text-2xl font-bold text-white">The Journey to V3</h2>
          </div>
          
          <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
            
            {/* V3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-teal-500 text-slate-900 font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(20,184,166,0.4)]">
                V3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 p-5 rounded-2xl border border-teal-500/30">
                <h4 className="text-lg font-bold text-teal-400 mb-1">Relationship Intelligence</h4>
                <p className="text-sm text-slate-300">
                  Introduced the deterministic flashcard duplicate review flow, smart dashboard surfacing, local offline categorization, network health insights, and a premium UX redesign.
                </p>
              </div>
            </div>
            
            {/* V2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-700 text-slate-300 font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/30 p-5 rounded-2xl border border-slate-700">
                <h4 className="text-lg font-bold text-slate-200 mb-1">Data & Sync Foundation</h4>
                <p className="text-sm text-slate-400">
                  Added manual WebDAV sync transport, encrypted local backups, a visual Import Studio, safe undo-engine for merges, and the cleanup command center.
                </p>
              </div>
            </div>

            {/* V1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-400 font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/20 p-5 rounded-2xl border border-slate-700/50">
                <h4 className="text-lg font-bold text-slate-300 mb-1">The Local Mirror</h4>
                <p className="text-sm text-slate-500">
                  The initial release. Established the offline-first SQLite mirror engine tracking the device's native contacts with zero cloud dependency.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 text-slate-500 text-sm flex items-center justify-center gap-2"
        >
          <span>Crafted by Shivansh Mishra</span>
        </motion.div>

      </div>
    </main>
  );
}
