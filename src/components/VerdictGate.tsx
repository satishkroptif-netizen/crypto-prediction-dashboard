'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';

// Wraps a verdict display. Logged-in users always see it.
// Guests get exactly ONE free verdict view — revealing it consumes the budget,
// everything else forces signup.
export default function VerdictGate({ k, children, compact = false }: { k: string; children: React.ReactNode; compact?: boolean }) {
  const { user, isVerdictOpen, consumeFreeView, freeVerdictKey } = useApp();
  const [, bump] = useState(0);
  const open = user !== null || isVerdictOpen(k);

  if (open) return <>{children}</>;

  const budgetLeft = !freeVerdictKey;

  const useFree = () => {
    if (consumeFreeView(k)) bump(x => x + 1);
  };

  return (
    <span className={`verdict-lock ${compact ? 'mini' : ''}`}>
      {budgetLeft ? (
        <>
          <span className="lock-line">🔒 Verdict hidden</span>
          <button className="btn-primary sm" onClick={useFree}>Reveal my 1 free verdict</button>
        </>
      ) : (
        <>
          <span className="lock-line">🔒 Free verdict used — sign up to unlock all</span>
          <span className="lock-cta">
            <Link href="/signup" className="btn-primary sm">Sign up free</Link>
            <Link href="/login" className="btn-ghost sm">Login</Link>
          </span>
        </>
      )}
    </span>
  );
}
