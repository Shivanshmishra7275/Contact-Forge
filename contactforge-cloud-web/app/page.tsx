'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── Direct APK download URL ────────────────────────────────────────────────────
// This points directly to the APK asset on the v3.0.0-beta.1 GitHub release.
// When a new APK is uploaded to the release, update this constant.
const APK_DOWNLOAD_URL =
  'https://github.com/Shivanshmishra7275/Contact-Forge/releases/download/v3.0.0-beta.1/contactforge-v3.0.0-beta1.apk';
const RELEASE_PAGE_URL =
  'https://github.com/Shivanshmishra7275/Contact-Forge/releases/tag/v3.0.0-beta.1';
const GITHUB_URL = 'https://github.com/Shivanshmishra7275/Contact-Forge';
const GITHUB_PROFILE_URL = 'https://github.com/Shivanshmishra7275';

// ─── Stat counters ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '1,800+', label: 'Contacts Handled' },
  { value: '115', label: 'Tests Passing' },
  { value: '100%', label: 'Offline & Private' },
  { value: 'v3.0.0', label: 'Current Version' },
];

// ─── Founder skills/interests ───────────────────────────────────────────────────
const SKILLS = [
  'React Native', 'TypeScript', 'SQLite', 'Privacy Engineering',
  'Expo', 'Local-First Apps', 'Reanimated', 'Offline UX',
];

export default function Home() {
  const [apkError, setApkError] = useState(false);

  const handleDirectDownload = (source: 'hero' | 'footer') => {
    trackEvent('Download APK Direct', { source, version: 'v3.0.0-beta.1' });
  };

  const handleReleasePageClick = () => {
    trackEvent('Open Release Page', { source: 'hero' });
  };

  const handleGitHubClick = () => {
    trackEvent('View GitHub', { source: 'hero' });
  };

  return (
    <main className="min-h-screen bg-[#060813] flex flex-col items-center relative overflow-hidden font-sans selection:bg-teal-500/30 pb-24">
      {/* ── Background Glows ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-teal-500/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-purple-600/8 blur-[150px] rounded-full pointer-events-none" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center pt-32">

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
            <span>Download APK</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
              v3.0.0-beta.1
            </span>
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

        {/* ── Stats Row ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-32"
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

        {/* ── Why ContactForge ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1 }}
          className="w-full text-center mb-20"
        >
          <h2 className="text-sm font-bold tracking-widest text-teal-400 uppercase mb-4">Why It Matters</h2>
          <p className="text-3xl md:text-4xl font-semibold text-slate-200 max-w-4xl mx-auto leading-tight">
            Built for privacy-first contact cleanup. No silent uploads, no cloud mining, no opaque algorithms.
          </p>
        </motion.div>

        {/* ── V3 Highlights Grid ──────────────────────────────────────────────── */}
        <div className="w-full mb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-teal-500/20 group-hover:border-teal-500/40 transition-colors">
                <Users className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gesture Flashcard Review</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Swipe right to merge, left to dismiss, down to snooze. Review every duplicate pair with clear explanations—never guessing why two contacts were flagged.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Exact phone, email, and name matching with SQL-optimised fuzzy fallback. Every result is explainable—no black-box scoring, no phantom suggestions.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors">
                <Lock className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero-Upload Privacy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Everything runs in SQLite on your device. Your contacts never leave your phone. No analytics on contact data, no background sync to our servers—because we don't have any.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-orange-500/20 group-hover:border-orange-500/40 transition-colors">
                <Database className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Merge Preview</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Field-by-field conflict resolution before any data is touched. Only real conflicts are shown—empty fields are hidden automatically to cut through the noise.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-green-500/20 to-teal-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                <GitBranch className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Resilient Undo Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every merge, delete, and bulk fix is fully reversible. Snapshots are captured to SQLite before any destructive action so you can recover with one tap.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-md hover:bg-slate-800/40 transition-colors duration-500 group">
              <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/10 w-14 h-14 flex items-center justify-center rounded-2xl mb-6 border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                <Star className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Premium Dashboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Actionable metrics surface instantly: duplicate count, contact health score, and items needing attention—all rendering progressively so the app never feels slow.
              </p>
            </div>
          </div>
        </div>

        {/* ── Version History ─────────────────────────────────────────────────── */}
        <div className="w-full max-w-4xl bg-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-14 text-left backdrop-blur-xl relative overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full" />
          <div className="flex items-center gap-4 mb-12 relative z-10">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">The Journey to V3</h2>
          </div>
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-teal-500/50 before:via-slate-700/50 before:to-transparent z-10">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-teal-500 text-slate-900 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                V3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/40 p-6 rounded-3xl border border-teal-500/20 hover:border-teal-500/40 transition-colors">
                <h4 className="text-xl font-bold text-white mb-2">Contact Intelligence</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Gesture-driven flashcard review, cinematic splash, SQL-optimised duplicate engine, smart merge preview, and actionable dashboard metrics. Beta APK available now.
                </p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-700 text-slate-300 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/20 p-6 rounded-3xl border border-slate-700/50">
                <h4 className="text-xl font-bold text-slate-200 mb-2">Data &amp; Sync Foundation</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Manual WebDAV sync transport, encrypted local backups, Import Studio with CSV/VCF ingestion, and a safe undo-engine for all merges.
                </p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#060813] bg-slate-800 text-slate-400 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                V1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-slate-800/10 p-6 rounded-3xl border border-slate-800/50">
                <h4 className="text-xl font-bold text-slate-400 mb-2">The Local Mirror</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Established the offline-first SQLite mirror engine tracking native device contacts with zero cloud dependency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Founder Section (Redesigned) ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mb-32"
        >
          {/* Section label */}
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase text-center mb-10">
            Built by a solo developer, for power users
          </p>

          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/30 border border-slate-800/60 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start gap-10">
              {/* Avatar + social links */}
              <div className="shrink-0 flex flex-col items-center gap-4">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-slate-800 border-2 border-slate-700/60 shadow-2xl overflow-hidden">
                  <Image
                    src="/founder.jpg"
                    alt="Shivansh Mishra"
                    width={144}
                    height={144}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Social row */}
                <div className="flex gap-3">
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('View Founder GitHub')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    <Code className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                  <a
                    href={`${GITHUB_URL}/issues/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('Open Feedback Issue')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Feedback
                  </a>
                </div>
              </div>

              {/* Bio content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1 gap-4 flex-wrap">
                  <div>
                    <h2 className="text-3xl font-bold text-white">Shivansh Mishra</h2>
                    <p className="text-teal-400 font-medium text-sm mt-0.5">
                      Creator, Architect &amp; Lead Developer
                    </p>
                  </div>
                  {/* Open to work badge */}
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Building in public
                  </span>
                </div>

                {/* Story */}
                <p className="text-slate-300 leading-relaxed mt-4 mb-4">
                  I built ContactForge because I was frustrated with how my contact list had silently
                  turned into a mess—hundreds of duplicates, missing names, phantom numbers from
                  forgotten events. Every "solution" I found wanted to upload my private data to a cloud
                  server, lock features behind a paywall, or call it "AI" when it was just a fuzzy match.
                </p>
                <p className="text-slate-400 leading-relaxed mb-6">
                  So I engineered it myself. ContactForge is what I actually wanted: a fast, offline-first,
                  fully explainable contact manager that treats your data as yours—no telemetry on
                  contact records, no subscriptions, no dark patterns. Every feature is backed by deterministic
                  logic you can read in the open-source code.
                </p>

                {/* Skills/interests */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {SKILLS.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/40 px-2.5 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CTA links */}
                <div className="flex flex-wrap gap-4">
                  <a
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('View Founder GitHub')}
                    className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors group font-medium"
                  >
                    <span>View GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                  <a
                    href={`${GITHUB_URL}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('View Issues')}
                    className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors group font-medium"
                  >
                    <span>Report a bug or request a feature</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
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
            <span>Download APK v3.0.0-beta.1 for Android</span>
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
