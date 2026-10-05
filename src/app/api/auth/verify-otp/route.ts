import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { checkOtp, otpConfigured } from '@/lib/otp';

const otpStore = (global as unknown as { __pc_otp?: Map<string, { code: string; exp: number }> }).__pc_otp
  || ((global as unknown as { __pc_otp: Map<string, { code: string; exp: number }> }).__pc_otp = new Map());

// Store a verified signup lead in two optional places (both skipped if unconfigured):
// 1) Google Sheet via Apps Script webhook  -> set SHEET_WEBHOOK_URL (works on Vercel)
// 2) Local CSV file on the server disk     -> set LEADS_CSV_PATH (self-hosted ONLY;
//    Vercel's filesystem is ephemeral, so files written there disappear)
async function logLead(lead: { name: string; email: string; phone: string; at: string }) {
  const hook = process.env.SHEET_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch { /* sheet logging must never break verification */ }
  }
  const csv = process.env.LEADS_CSV_PATH;
  if (csv) {
    try {
      const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      await mkdir(dirname(csv), { recursive: true });
      await appendFile(csv, [lead.at, lead.name, lead.email, lead.phone].map(q).join(',') + '\n', 'utf8');
    } catch { /* disk logging must never break verification */ }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp, name, phone } = await req.json();
    const key = String(email || '').toLowerCase();
    if (otpConfigured()) {
      // Stateless check — works across isolated serverless functions
      if (!checkOtp(key, otp)) {
        return NextResponse.json({ error: 'Invalid or expired code. Request a new code.' }, { status: 400 });
      }
    } else {
      const rec = otpStore.get(key);
      if (!rec) return NextResponse.json({ error: 'No OTP found. Request a new code.' }, { status: 400 });
      if (Date.now() > rec.exp) { otpStore.delete(key); return NextResponse.json({ error: 'OTP expired. Request a new code.' }, { status: 400 }); }
      if (String(otp).trim() !== rec.code) return NextResponse.json({ error: 'Invalid OTP. Check the 6-digit code.' }, { status: 400 });
      otpStore.delete(key);
    }
    // Log only verified signups (fake emails never reach the sheet/file)
    if (name && phone) {
      await logLead({ name: String(name), email: key, phone: String(phone), at: new Date().toISOString() });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
