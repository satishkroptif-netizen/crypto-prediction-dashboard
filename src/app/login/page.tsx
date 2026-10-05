'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await login(email, pw);
      router.push('/workspace');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Login failed';
      if (m === 'UNVERIFIED') router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      else setErr(m);
    }
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Link href="/" className="ws-logo center"><span className="logo-icon">◆</span><span>GnC Signal</span></Link>
        <h1>Welcome back</h1>
        <p className="muted-sm">Login with your verified email.</p>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={pw} onChange={e => setPw(e.target.value)} type="password" required /></label>
        {err && <p className="auth-err">{err}</p>}
        <button className="btn-primary full" disabled={busy}>{busy ? 'Checking…' : 'Login'}</button>
        <p className="muted-sm center">New here? <Link href="/signup">Create account</Link></p>
      </form>
    </div>
  );
}
