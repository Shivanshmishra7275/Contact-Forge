'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Code,
  Zap,
  History,
  Database,
  Users,
  ChevronRight,
  Smartphone,
  Lock,
  GitBranch,
  Star,
  Coffee,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { TelemetryWidget } from '../components/TelemetryWidget';

// ─── Direct APK download URL ────────────────────────────────────────────────────
// Direct download API route (dynamically fetches the latest APK)
const APK_DOWNLOAD_URL = '/api/download';
const RELEASE_PAGE_URL =
  'https://github.com/Shivanshmishra7275/Contact-Forge/releases/tag/v3.2.0';
const GITHUB_URL = 'https://github.com/Shivanshmishra7275/Contact-Forge';
const GITHUB_PROFILE_URL = 'https://github.com/Shivanshmishra7275';

// ─── Stat counters ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '1,800+', label: 'Contacts Handled' },
  { value: '115', label: 'Tests Passing' },
  { value: '100%', label: 'Offline & Private' },
  { value: 'v3.2.0', label: 'Current Version' },
];

// ─── Founder skills/interests ───────────────────────────────────────────────────
const SKILLS = [
  'Python', 'SQL', 'C', 'ML Engineer',
  'Vibe Coding', 'Excellent Thinking'
];

export default function Home() {
  const [apkError, setApkError] = useState(false);

  const handleDirectDownload = (source: 'hero' | 'footer') => {
    trackEvent('Download APK Direct', { source, version: 'v3.2.0' });
  };

  const handleReleasePageClick = () => {
    trackEvent('Open Release Page', { source: 'hero' });
  };

  const handleGitHubClick = () => {
    trackEvent('View GitHub', { source: 'hero' });
  };

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Parallax values
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <main ref={containerRef} className="min-h-screen bg-[#040914] flex flex-col items-center relative overflow-hidden font-sans selection:bg-teal-500/30 pb-24">
      {/* ── God-Level Fluid Obsidian Mesh Background ──────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-30">
          <div className="absolute top-[20%] left-[20%] w-[900px] h-[900px] bg-teal-600/20 rounded-full blur-[150px] animate-aurora mix-blend-screen" />
          <div className="absolute top-[30%] right-[10%] w-[800px] h-[800px] bg-emerald-700/20 rounded-full blur-[160px] animate-aurora-reverse mix-blend-screen" />
          <div className="absolute bottom-[20%] left-[30%] w-[1000px] h-[1000px] bg-blue-900/30 rounded-full blur-[140px] animate-aurora mix-blend-screen" style={{ animationDelay: '-5s' }} />
          <div className="absolute bottom-[10%] right-[20%] w-[700px] h-[700px] bg-slate-700/30 rounded-full blur-[120px] animate-aurora-reverse mix-blend-screen" style={{ animationDelay: '-10s' }} />
        </div>
      </div>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center pt-32">
        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="flex flex-col items-center w-full">

        {/* ── Security Badge ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/40 border border-slate-800/60 text-sm font-medium text-slate-300 mb-10 backdrop-blur-xl shadow-2xl"
        >
          <ShieldCheck className="w-4 h-4 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
          <span className="tracking-wide">100% Offline &amp; Local-First · Android Beta Out Now</span>
        </motion.div>

        {/* ── Hero Headlines ──────────────────────────────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-6 leading-[1.05] text-center"
        >
          Your Contacts,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-blue-400 drop-shadow-sm pb-2">
            Intelligently Secured.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light text-center"
        >
          ContactForge V3 is a privacy-first Android app that cleans duplicates, tracks relationships,
          and organises your entire contact library—fully offline, zero cloud, zero tracking.
        </motion.p>

        {/* ── CTA Buttons ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6 w-full sm:w-auto"
        >
          {/* Primary: direct APK download */}
          <a
            href={APK_DOWNLOAD_URL}
            onClick={() => handleDirectDownload('hero')}
            className="group flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 font-semibold px-8 py-4 rounded-xl transition-all duration-300 w-full sm:w-auto hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            <span>Download latest APK from GitHub</span>
          </a>

          {/* Secondary: view source */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGitHubClick}
            className="group flex items-center justify-center gap-3 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700/50 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 w-full sm:w-auto backdrop-blur-md hover:border-slate-600 hover:-translate-y-0.5"
          >
            <Code className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </motion.div>

        {/* Install instruction hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center gap-2 text-xs text-slate-500 mb-32 text-center"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>
            Android only · Enable <strong className="text-slate-400 font-medium">"Install from unknown sources"</strong> in Settings before installing ·{' '}
            <a
              href={RELEASE_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleReleasePageClick}
              className="text-teal-500 hover:text-teal-300 underline underline-offset-2 transition-colors"
            >
              View release notes
            </a>
          </span>
        </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-center backdrop-blur-md"
            >
              <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 tracking-wide uppercase">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Telemetry Widget ─────────────────────────────────────────────────── */}
        <TelemetryWidget />

        {/* ── Why ContactForge ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-center mb-20 relative z-10"
        >
          <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-4 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">The Local-First Engine</h2>
          <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 max-w-4xl mx-auto leading-tight">
            Organize your contacts easily and safely. No internet uploads, no data selling, and no confusing algorithms.
          </p>
        </motion.div>

        {/* ── V3 Highlights Grid (Bento Box) ──────────────────────────────────── */}
        <div className="w-full mb-32 relative max-w-6xl mx-auto">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
            {/* Feature 1 (Large) */}
            <motion.div 
              initial={{ opacity: 0, rotateX: 15, y: 40 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-4 relative rounded-[2rem] p-[1px] group overflow-hidden"
            >
              <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(45,212,191,0.5)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] overflow-hidden z-10 shadow-2xl transition-colors duration-500 group-hover:bg-[#020617]/90">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors relative z-10">
                  <Users className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Tinder for Duplicates</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg relative z-10">
                  Just swipe right to merge matching contacts, or left to keep them separate. It's fast, fun, and clearly explains exactly why it thinks two contacts are the same person.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 (Medium) */}
            <motion.div 
              initial={{ opacity: 0, rotateX: 15, y: 40 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-2 relative rounded-[2rem] p-[1px] group overflow-hidden"
            >
              <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(59,130,246,0.5)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] overflow-hidden z-10 shadow-2xl transition-colors duration-500 group-hover:bg-[#020617]/90">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors relative z-10">
                  <Zap className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Smart &amp; Reliable Matching</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                  We use clear, reliable rules to find duplicates—like matching identical phone numbers or emails. No unpredictable AI, just straightforward logic you can trust.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 (Medium) */}
            <motion.div 
              initial={{ opacity: 0, rotateX: 15, y: 40 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-2 relative rounded-[2rem] p-[1px] group overflow-hidden"
            >
              <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(168,85,247,0.5)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] overflow-hidden z-10 shadow-2xl transition-colors duration-500 group-hover:bg-[#020617]/90">
                <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
                <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors relative z-10">
                  <Lock className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">100% Private &amp; Secure</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                  Everything happens directly on your phone. Your private contact list is never uploaded to the internet or stored on our servers.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 (Medium) */}
            <motion.div 
              initial={{ opacity: 0, rotateX: 15, y: 40 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-2 relative rounded-[2rem] p-[1px] group overflow-hidden"
            >
              <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(249,115,22,0.5)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] overflow-hidden z-10 shadow-2xl transition-colors duration-500 group-hover:bg-[#020617]/90">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
                <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-orange-500/20 group-hover:border-orange-500/40 transition-colors relative z-10">
                  <Database className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Clear Merge Previews</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                  Before combining contacts, we show you exactly what the final result will look like. We hide empty fields so it's clean and easy to read.
                </p>
              </div>
            </motion.div>

            {/* Feature 5 (Medium) */}
            <motion.div 
              initial={{ opacity: 0, rotateX: 15, y: 40 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-2 relative rounded-[2rem] p-[1px] group overflow-hidden"
            >
              <div className="absolute inset-[-150%] animate-border-spin bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(34,197,94,0.5)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full w-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] overflow-hidden z-10 shadow-2xl transition-colors duration-500 group-hover:bg-[#020617]/90">
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
                <div className="bg-gradient-to-br from-green-500/20 to-teal-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-green-500/20 group-hover:border-green-500/40 transition-colors relative z-10">
                  <GitBranch className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Safe Undo Button</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                  Made a mistake? No problem. The app takes a safe backup right before merging, so you can easily undo any action with a single tap.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Version History (Interactive Redesign) ───────────────────────────── */}
        <div className="w-full max-w-4xl bg-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-14 text-left backdrop-blur-xl relative overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-12 relative z-10">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">The Journey to V3</h2>
          </div>
          
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-teal-500/50 before:via-slate-700/50 before:to-transparent z-10">
            
            {/* V3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group cursor-pointer">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-teal-500 text-slate-900 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-transform group-hover:scale-110">
                V3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] relative overflow-hidden rounded-3xl border border-teal-500/20 group-hover:border-teal-400/50 transition-all duration-500 bg-slate-800/40 p-6 shadow-lg group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]">
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h4 className="text-xl font-bold text-white mb-2 relative z-10">Contact Intelligence</h4>
                
                <div className="relative z-10 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
                  <div className="overflow-hidden">
                    <div className="pt-4 pb-2 space-y-4">
                      <div>
                        <span className="text-xs font-bold tracking-widest text-rose-400 uppercase drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">The Problem</span>
                        <p className="text-sm text-slate-400 leading-relaxed mt-1">Dealing with massive contact duplicates manually is tedious, opaque, and error-prone.</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold tracking-widest text-teal-400 uppercase drop-shadow-[0_0_5px_rgba(45,212,191,0.4)]">The Solution</span>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1">Gesture-driven flashcard review, SQL-optimised duplicate engine, smart merge preview, and actionable dashboard metrics. Beta APK available now.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Default visible text that fades out on hover */}
                <p className="text-sm text-slate-500 leading-relaxed block group-hover:hidden absolute bottom-6 left-6 right-6 transition-opacity">
                  Hover to reveal the architecture shift...
                </p>
                <div className="h-6 block group-hover:hidden" /> {/* Spacer for default text */}
              </div>
            </div>

            {/* V2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group cursor-pointer">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-700 text-slate-300 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform group-hover:scale-110">
                V2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] relative overflow-hidden rounded-3xl border border-slate-700/50 group-hover:border-teal-500/30 transition-all duration-500 bg-slate-800/20 p-6 hover:bg-slate-800/40">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h4 className="text-xl font-bold text-slate-200 mb-2 relative z-10 group-hover:text-white transition-colors">Data &amp; Sync Foundation</h4>
                
                <div className="relative z-10 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
                  <div className="overflow-hidden">
                    <div className="pt-4 pb-2 space-y-4">
                      <div>
                        <span className="text-xs font-bold tracking-widest text-orange-400 uppercase drop-shadow-[0_0_5px_rgba(251,146,60,0.4)]">The Problem</span>
                        <p className="text-sm text-slate-400 leading-relaxed mt-1">Syncing contacts to the cloud quietly uploads private data to third parties, risking data harvesting.</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold tracking-widest text-teal-400 uppercase drop-shadow-[0_0_5px_rgba(45,212,191,0.4)]">The Solution</span>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1">Manual WebDAV sync transport, encrypted local backups, Import Studio with CSV/VCF ingestion, and a safe undo-engine for all merges.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed block group-hover:hidden absolute bottom-6 left-6 right-6 transition-opacity">
                  Hover to reveal the architecture shift...
                </p>
                <div className="h-6 block group-hover:hidden" />
              </div>
            </div>

            {/* V1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group cursor-pointer">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-800 text-slate-400 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-transform group-hover:scale-110">
                V1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] relative overflow-hidden rounded-3xl border border-slate-800/50 group-hover:border-teal-500/30 transition-all duration-500 bg-slate-800/10 p-6 hover:bg-slate-800/30">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <h4 className="text-xl font-bold text-slate-400 mb-2 relative z-10 group-hover:text-white transition-colors">The Local Mirror</h4>
                
                <div className="relative z-10 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
                  <div className="overflow-hidden">
                    <div className="pt-4 pb-2 space-y-4">
                      <div>
                        <span className="text-xs font-bold tracking-widest text-orange-400 uppercase drop-shadow-[0_0_5px_rgba(251,146,60,0.4)]">The Problem</span>
                        <p className="text-sm text-slate-400 leading-relaxed mt-1">Default contact apps lack privacy controls and act as impenetrable black boxes.</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold tracking-widest text-teal-400 uppercase drop-shadow-[0_0_5px_rgba(45,212,191,0.4)]">The Solution</span>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1">Established the offline-first SQLite mirror engine tracking native device contacts with zero cloud dependency.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed block group-hover:hidden absolute bottom-6 left-6 right-6 transition-opacity">
                  Hover to reveal the architecture shift...
                </p>
                <div className="h-6 block group-hover:hidden" />
              </div>
            </div>

          </div>
        </div>

        {/* ── Founder Section (Cinematic Redesign) ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1 }}
          className="w-full relative mt-32 mb-40 overflow-visible flex flex-col items-center"
        >
          {/* Spotlight Effect */}
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.15),transparent_70%)] pointer-events-none" />
          
          {/* Giant Background Typography */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none z-0 overflow-hidden">
            <h2 className="text-[12vw] font-black text-slate-800/30 whitespace-nowrap tracking-tighter mix-blend-overlay select-none">
              THE ARCHITECT
            </h2>
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-6">
            
            {/* Portrait with Glowing Aura */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative w-48 h-48 md:w-64 md:h-64 rounded-full mb-12 group"
            >
              {/* Intense Aura */}
              <div className="absolute inset-[-20%] rounded-full bg-teal-500/20 blur-[60px] group-hover:bg-teal-400/30 group-hover:blur-[80px] transition-all duration-1000 animate-pulse" />
              <div className="absolute inset-[-10%] rounded-full bg-indigo-500/20 blur-[40px] animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Image Container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#020617] shadow-[0_0_50px_rgba(45,212,191,0.4)]">
                <Image
                  src="/founder.jpg"
                  alt="Shivansh Mishra"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
              </div>

              {/* Floating Badges */}
              {SKILLS.map((skill, index) => {
                const positions = [
                  '-left-16 top-4',       // Top left
                  '-right-20 top-8',      // Top right
                  '-left-24 top-1/2',     // Mid left
                  '-right-24 top-1/2',    // Mid right
                  '-left-12 bottom-6',    // Bottom left
                  '-right-12 bottom-2',   // Bottom right
                ];
                return (
                  <motion.div
                    key={skill}
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: index * 0.7, ease: "easeInOut" }}
                    className={`absolute backdrop-blur-md bg-slate-900/80 border border-teal-500/40 text-teal-300 text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.3)] whitespace-nowrap z-20
                      ${positions[index]}
                    `}
                  >
                    {skill}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Mission Statement */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-center max-w-3xl"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                Shivansh Mishra
              </h3>
              <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed mb-10 text-balance">
                <span className="text-teal-400 font-semibold drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">Aspiring ML Engineer. Forged by Vibe Coding.</span><br />
                I built ContactForge through excellent thinking and pure intuition. A solo developer engineering the local-first revolution, driven by a passion for Python, C, and SQL.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6">
                <a
                  href={GITHUB_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('View Founder GitHub Cinematic')}
                  className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-xl border border-teal-500/50 hover:border-teal-400 transition-colors"
                >
                  <div className="absolute inset-0 bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors" />
                  <span className="relative flex items-center gap-2 text-white font-bold tracking-wide">
                    <Code className="w-5 h-5 text-teal-400" />
                    INSPECT THE ARCHITECT
                  </span>
                </a>
                <a
                  href={`${GITHUB_URL}/issues/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('Open Feedback Issue Cinematic')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Request a Feature
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="w-full border-t border-slate-800/50 pt-10 pb-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-600" />
            <span className="text-slate-400 font-semibold text-lg">ContactForge</span>
          </div>
          <p className="text-slate-600 text-sm">Offline-first · Zero Telemetry · No Cloud · Open Source</p>

          {/* Footer download CTA */}
          <a
            href={APK_DOWNLOAD_URL}
            onClick={() => handleDirectDownload('footer')}
            className="inline-flex items-center gap-2 text-sm text-teal-500 hover:text-teal-300 transition-colors font-medium group"
          >
            <Download className="w-4 h-4 group-hover:animate-bounce" />
            <span>Download latest APK from GitHub</span>
          </a>

          <div className="text-slate-600 text-xs flex flex-wrap justify-center gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('Footer GitHub')}
              className="hover:text-slate-400 transition-colors"
            >
              GitHub Repository
            </a>
            <span>•</span>
            <a
              href={RELEASE_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleReleasePageClick}
              className="hover:text-slate-400 transition-colors"
            >
              Release Notes
            </a>
            <span>•</span>
            <span className="text-slate-500">Crafted with <Coffee className="w-3 h-3 inline" /> by Shivansh Mishra</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
