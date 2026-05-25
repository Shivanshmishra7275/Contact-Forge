import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContactForge Cloud | Private by design. Optional by choice.',
  description: 'Encrypted sync for people who want control over their contacts. Built on a local-first foundation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script defer data-domain="contactforge.local" src="https://plausible.io/js/script.tagged-events.js"></script>
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50 selection:bg-teal-500/30`}>
        {children}
      </body>
    </html>
  );
}
