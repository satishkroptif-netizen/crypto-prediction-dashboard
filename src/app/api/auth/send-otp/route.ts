import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Email OTP via Resend (https://resend.com).
// Setup: 1) create API key at resend.com/api-keys
//        2) set RESEND_API_KEY env var (locally in .env.local, on Vercel in project settings)
//        3) verify your sending domain at resend.com/domains, then set OTP_FROM="GnC Signal <noreply@yourdomain.com>"
// Without RESEND_API_KEY the route falls back to demo mode (code returned, dev only).

const otpStore = (global as unknown as { __pc_otp?: Map<string, { code: string; exp: number }> }).__pc_otp
  || ((global as unknown as { __pc_otp: Map<string, { code: string; exp: number }> }).__pc_otp = new Map());

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const to = String(email || '').toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(to, { code, exp: Date.now() + 10 * 60 * 1000 });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.OTP_FROM || 'GnC Signal <onboarding@resend.dev>',
        to,
        subject: 'Your GnC Signal verification code',
        html: `<div style="font-family:sans-serif;max-width:480px"><h2>GnC Signal</h2><p>Your email verification code is:</p><p style="font-size:32px;font-weight:800;letter-spacing:4px">${code}</p><p style="color:#666">Valid for 10 minutes. If you didn't request this, ignore this email.</p></div>`,
      });
      if (error) {
        otpStore.delete(to);
        return NextResponse.json({ error: 'Failed to send email. Check RESEND_API_KEY / sender domain.' }, { status: 502 });
      }
      return NextResponse.json({ ok: true, via: 'email' });
    }

    // Demo fallback (no API key): return code so local dev still works
    return NextResponse.json({ ok: true, via: 'demo', demoOtp: code });
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
