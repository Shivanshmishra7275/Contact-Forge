'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, Code, Zap, History, Database, Users, ChevronRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

export default function Home() {
  const handleDownloadClick = () => {
    trackEvent('Download APK', { source: 'hero' });
  };

  const handleGitHubClick = () => {
    trackEvent('View GitHub', { source: 'hero' });
  };

  return (
    <main className="min-h-screen bg-[#060813] flex flex-col items-center relative overflow-hidden font-sans selection:bg-teal-500/30 pb-24">
      {/* Premium Dark Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-teal-500/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center pt-32">
        
        {/* Security Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/40 border border-slate-800/60 text-sm font-medium text-slate-300 mb-10 backdrop-blur-xl shadow-2xl"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
          <span className="tracking-wide">100% Offline & Local-First</span>
        </motion.div>

        {/* Hero Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-6 leading-[1.05] text-center"
        >
          Your Contacts,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-blue-500 drop-shadow-sm pb-2">
            Intelligently Secured.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light text-center"
        >
          ContactForge V3 is a privacy-first mobile app for cleaning contacts, tracking relationships, and safely managing your real-world network—all locally on your device.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-32 w-full sm:w-auto"
        >
          <a
            href="https://github.com/Shivanshmishra7275/Contact-Forge/releases"
            onClick={handleDownloadClick}
            className="group flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 font-semibold px-8 py-4 rounded-xl transition-all duration-300 w-full sm:w-auto hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            <span>Download APK</span>
          </a>
          <a
            href="https://github.com/Shivanshmishra7275/Contact-Forge"
            onClick={handleGitHubClick}
            className="group flex items-center justify-center gap-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/50 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 w-full sm:w-auto backdrop-blur-md hover:border-slate-600 hover:-translate-y-0.5"
          >
            <Code className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </motion.div>

        {/* Why ContactForge */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="w-full text-center mb-32"
        >
          <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-4">Why It Matters</h2>
          <p className="text-3xl md:text-4xl font-semibold text-slate-200 max-w-4xl mx-auto leading-tight">
            Built for privacy-first contact cleanup. No silent uploads, no cloud mining, and no opaque AI algorithms.
          </p>
        </motion.div>

        {/* V3 Highlights Grid */}
        <div className="w-full mb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                <Users className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Flashcard Duplicates</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Review duplicate contacts one pair at a time using a focused flashcard UI. No overwhelming lists, just clear reasons and simple actions: Merge, Not a Match, or Review Later.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our new heuristic engine uses precise exact-matching and fuzzy rules to detect duplicates. Every suggestion comes with an explainable, human-readable reason.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                <Database className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smarter Dashboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Instantly see actionable insights. A new call-to-action widget surfaces duplicate candidates directly on your home screen, keeping your network pristine.
              </p>
            </div>
          </div>
        </div>

        {/* Version History */}
        <div className="w-full max-w-4xl bg-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-14 text-left backdrop-blur-xl relative overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full" />
          
          <div className="flex items-center gap-4 mb-12 relative z-10">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">The Journey to V3</h2>
          </div>
          
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-teal-500/50 before:via-slate-700/50 before:to-transparent z-10">
            
            {/* V3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-teal-500 text-slate-900 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                V3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/40 p-6 rounded-3xl border border-teal-500/20 hover:border-teal-500/40 transition-colors">
                <h4 className="text-xl font-bold text-white mb-2">Relationship Intelligence</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Introduced deterministic flashcard review, dashboard surfacing, offline categorization, and a premium UX redesign.
                </p>
              </div>
            </div>
            
            {/* V2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-700 text-slate-300 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/20 p-6 rounded-3xl border border-slate-700/50">
                <h4 className="text-xl font-bold text-slate-200 mb-2">Data & Sync Foundation</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Added manual WebDAV sync transport, encrypted local backups, Import Studio, and safe undo-engine for merges.
                </p>
              </div>
            </div>

            {/* V1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-800 text-slate-400 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/10 p-6 rounded-3xl border border-slate-800/50">
                <h4 className="text-xl font-bold text-slate-400 mb-2">The Local Mirror</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Established the offline-first SQLite mirror engine tracking the device's native contacts with zero cloud dependency.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Founder Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-12 text-left backdrop-blur-md mb-32 flex flex-col md:flex-row items-center gap-10"
        >
          <div className="shrink-0">
            {/* 
              TODO: Insert actual founder image here. 
              If the image exists at /public/founder.jpg, replace the inner div with an <img src="/founder.jpg" />.
            */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-800 border-4 border-slate-700/50 flex items-center justify-center shadow-xl overflow-hidden">
              <span className="text-slate-500 text-sm font-medium">Image</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Shivansh Mishra</h2>
            <p className="text-teal-400 font-medium mb-4">Creator & Lead Developer</p>
            <p className="text-slate-300 leading-relaxed mb-6">
              I built ContactForge because I was tired of CRMs that silently upload data to the cloud and lock relationships behind subscriptions. I wanted a professional, powerful, local-first tool to clean and manage my network on my own terms.
            </p>
            <a 
              href="https://github.com/Shivanshmishra7275"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('View Founder GitHub')}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <span>View GitHub Profile</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="w-full border-t border-slate-800/50 pt-10 pb-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-slate-600" />
            <span className="text-slate-400 font-medium">ContactForge</span>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Offline-first • Zero Telemetry • No Cloud
          </p>
          <div className="text-slate-600 text-xs flex gap-4">
            <a href="https://github.com/Shivanshmishra7275/Contact-Forge" onClick={() => trackEvent('Footer GitHub')} className="hover:text-slate-400 transition-colors">GitHub Repository</a>
            <span>•</span>
            <span className="text-slate-500">Crafted by Shivansh Mishra</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
