'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';

function VerifyInner() {
  const sp = useSearchParams();
  const email = sp.get('email') || '';
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState<string | null>(null);
  const { verifyOtp, resendOtp, lastOtp } = useApp();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try { await verifyOtp(email, code); router.push('/workspace'); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Invalid code'); }
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Link href="/" className="ws-logo center"><span className="logo-icon">◆</span><span>GnC Signal</span></Link>
        <h1>Verify email</h1>
        <p className="muted-sm">Enter the 6-digit code sent to <b>{email || 'your email'}</b> (valid 10 min, check spam).</p>
        {(demo || lastOtp) && <p className="auth-demo">Dev mode (no email configured) — code: <b>{demo || lastOtp}</b></p>}
        <label>OTP<input value={code} onChange={e => setCode(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} required /></label>
        {err && <p className="auth-err">{err}</p>}
        <button className="btn-primary full" disabled={busy}>{busy ? 'Verifying…' : 'Verify & login'}</button>
        <button type="button" className="btn-ghost full" onClick={async () => { try { const r = await resendOtp(email); setDemo(r.otp); } catch (e) { setErr(e instanceof Error ? e.message : 'Resend failed'); } }}>Resend OTP</button>
        <p className="muted-sm center"><Link href="/signup">Back to signup</Link></p>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyInner /></Suspense>;
}
