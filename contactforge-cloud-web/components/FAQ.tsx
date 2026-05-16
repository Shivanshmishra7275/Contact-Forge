'use client';

import { motion } from 'framer-motion';

const faqs = [
  {
    q: "Is the current app still offline-first?",
    a: "Yes. ContactForge Local is fundamentally offline. The core contact management experience will never require an internet connection or an account."
  },
  {
    q: "Is cloud mandatory?",
    a: "Absolutely not. Cloud is an opt-in premium feature for users who explicitly want multi-device synchronization."
  },
  {
    q: "Can the platform read my contacts?",
    a: "No. The architecture is designed around client-side encryption. We will only store encrypted payloads that require your local device keys to read."
  },
  {
    q: "When is it launching?",
    a: "We are currently finalizing Step 1 (the offline mobile app). Cloud infrastructure will follow. Join the waitlist to get early access."
  },
  {
    q: "Why join the waitlist?",
    a: "Early waitlist members will help shape the encrypted sync protocol and receive priority access when the private beta opens."
  },
  {
    q: "Who is building this?",
    a: "ContactForge is being built by Shivansh Mishra, focused on returning data ownership and privacy to contact management."
  }
];

export default function FAQ() {
  return (
    <section className="w-full max-w-3xl px-6 py-24 mx-auto border-t border-slate-800/50">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-50 mb-4">Frequently Asked Questions</h2>
      </div>
      
      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-b border-slate-800 pb-8"
          >
            <h4 className="text-lg font-medium text-slate-100 mb-3">{faq.q}</h4>
            <p className="text-slate-400 leading-relaxed">{faq.a}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
