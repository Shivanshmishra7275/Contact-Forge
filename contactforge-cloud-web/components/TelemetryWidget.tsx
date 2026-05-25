'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { Activity, Users, Download } from 'lucide-react';

// Odometer animation component
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (isInView) {
      const animation = animate(count, value, { duration: 2.5, ease: [0.16, 1, 0.3, 1] });
      return animation.stop;
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function TelemetryWidget() {
  const [data, setData] = useState<{ visitors: number; downloads: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' });
        const json = await res.json();
        
        if (!res.ok || json.error) {
          throw new Error(json.error || `HTTP error! status: ${res.status}`);
        }
        
        setData(json);
      } catch (err) {
        console.error('Telemetry Fetch Failed:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  if (loading || error) {
    return (
      <div className="w-full max-w-sm mx-auto mb-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[140px]">
        {/* Subtle scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
        
        <motion.div 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          className="font-mono text-sm text-teal-500/80 tracking-widest flex items-center gap-3"
        >
          <Activity className="w-4 h-4" />
          {loading ? '[ FETCHING TELEMETRY... ]' : '[ TELEMETRY OFFLINE ]'}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-sm mx-auto mb-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group"
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-700" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-slate-800/50 pb-3">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          Live Traction
        </h3>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-6 relative z-10">
        
        {/* Visitors */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Total Visitors</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
            <AnimatedNumber value={data?.visitors || 0} />
          </div>
        </div>

        {/* Downloads */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Download className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">APK Downloads</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <AnimatedNumber value={data?.downloads || 0} />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
