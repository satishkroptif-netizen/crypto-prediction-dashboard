'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<string | null>(null);
  const { signup } = useApp();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const r = await signup(name, email, phone, pw);
      setOtp(r.otp);
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Signup failed'); }
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Link href="/" className="ws-logo center"><span className="logo-icon">◆</span><span>GnC Signal</span></Link>
        <h1>Create account</h1>
        <p className="muted-sm">Name, email, phone + 6-digit email code verification.</p>
        <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Satoshi Nakamoto" required /></label>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@mail.com" type="email" required /></label>
        <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required /></label>
        <label>Password<input value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="Min 6 characters" required /></label>
        {err && <p className="auth-err">{err}</p>}
        {otp && <p className="auth-demo">Dev mode (no email configured) — your code: <b>{otp}</b></p>}
        <button className="btn-primary full" disabled={busy}>{busy ? 'Sending OTP…' : 'Sign up & send OTP'}</button>
        <p className="muted-sm center">Have an account? <Link href="/login">Login</Link></p>
      </form>
    </div>
  );
}
