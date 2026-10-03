import { NextRequest, NextResponse } from 'next/server';

const otpStore = (global as unknown as { __pc_otp?: Map<string, { code: string; exp: number }> }).__pc_otp
  || ((global as unknown as { __pc_otp: Map<string, { code: string; exp: number }> }).__pc_otp = new Map());

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    const key = String(email || '').toLowerCase();
    const rec = otpStore.get(key);
    if (!rec) return NextResponse.json({ error: 'No OTP found. Request a new code.' }, { status: 400 });
    if (Date.now() > rec.exp) { otpStore.delete(key); return NextResponse.json({ error: 'OTP expired. Request a new code.' }, { status: 400 }); }
    if (String(otp).trim() !== rec.code) return NextResponse.json({ error: 'Invalid OTP. Check the 6-digit code.' }, { status: 400 });
    otpStore.delete(key);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
