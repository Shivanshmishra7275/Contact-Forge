'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Users, Zap } from 'lucide-react';

const benefits = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
    title: "Privacy-first community",
    desc: "Join a group of users who believe their contact graph belongs to them, not the platform."
  },
  {
    icon: <Zap className="w-6 h-6 text-teal-400" />,
    title: "Early beta access",
    desc: "Waitlist members will be the first to test our end-to-end encrypted sync protocol before public launch."
  },
  {
    icon: <Users className="w-6 h-6 text-teal-400" />,
    title: "Shape the product",
    desc: "Your feedback will directly influence the development of the cloud layer and its features."
  }
];

export default function WhyJoin() {
  return (
    <section className="w-full max-w-5xl px-6 py-24 mx-auto border-t border-slate-800/50">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-50 mb-4">Why join the waitlist?</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {benefits.map((benefit, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-8"
          >
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6">
              {benefit.icon}
            </div>
            <h4 className="text-lg font-semibold text-slate-100 mb-3">{benefit.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
