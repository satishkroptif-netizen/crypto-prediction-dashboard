import type { Metadata } from 'next';
import './globals.css';
import './gold.css';
import { AppProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'GnC Signal — Crypto, Gold, Silver & Oil Predictions',
  description: 'AI-powered verdicts with entry, stop and targets on crypto, metals and crude. One free verdict — sign up free to unlock all timeframes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AppProvider>{children}</AppProvider></body>
    </html>
  );
}
