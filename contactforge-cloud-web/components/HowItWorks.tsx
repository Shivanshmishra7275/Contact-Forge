'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    num: "01",
    title: "Contacts stay local-first",
    desc: "Your device is the source of truth. The core app remains fully offline."
  },
  {
    num: "02",
    title: "Prepared on device",
    desc: "Data is encrypted locally using keys that never leave your hardware."
  },
  {
    num: "03",
    title: "Secure cloud payload",
    desc: "The sync layer stores unreadable payloads. We cannot see your contacts."
  },
  {
    num: "04",
    title: "Sync everywhere",
    desc: "Access your own data securely across all your authorized devices."
  }
];

export default function HowItWorks() {
  return (
    <section className="w-full max-w-5xl px-6 py-24 mx-auto border-t border-slate-800/50">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-50 mb-4">Planned Architecture</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          We are designing ContactForge Cloud to eliminate the need for blind trust. Here is how encrypted sync will work.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col"
          >
            <span className="text-teal-500/50 font-mono text-xl font-bold mb-4">{step.num}</span>
            <h4 className="text-lg font-semibold text-slate-100 mb-2">{step.title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
