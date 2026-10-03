import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'GnC Signal Workspace — Crypto, Gold, Silver & Oil Predictions',
  description: 'Realtime 15m/1h/4h/1D predictions on Crypto, Metals & Crude with TradingView charts, Verdict Scanner, Market Regime, News Intelligence, Flow & Derivatives and Economic Calendar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AppProvider>{children}</AppProvider></body>
    </html>
  );
}
