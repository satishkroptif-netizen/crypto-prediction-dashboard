import { createHmac } from 'crypto';

// Stateless email OTPs for serverless deployments.
// Vercel runs each API route in an isolated function, so an in-memory
// Map set by send-otp is invisible to verify-otp. Instead the code is
// derived deterministically: HMAC-SHA256(OTP_SECRET, email|10-min-window).
// Both routes compute the same code independently — nothing to share.

const WINDOW_MS = 10 * 60 * 1000;

export function otpConfigured(): boolean {
  return !!process.env.OTP_SECRET;
}

function codeFor(email: string, window: number): string {
  const h = createHmac('sha256', process.env.OTP_SECRET as string)
    .update(`${email.toLowerCase()}|${window}`)
    .digest('hex');
  return String((parseInt(h.slice(0, 8), 16) % 900000) + 100000);
}

/** Code to email right now (resend returns this same code within the window). */
export function currentOtp(email: string): string {
  return codeFor(email.toLowerCase(), Math.floor(Date.now() / WINDOW_MS));
}

/** Accept current window + previous window (grace for slow typers at the boundary). */
export function checkOtp(email: string, otp: string): boolean {
  const clean = String(otp || '').trim();
  if (!/^\d{6}$/.test(clean)) return false;
  const w = Math.floor(Date.now() / WINDOW_MS);
  const e = email.toLowerCase();
  return clean === codeFor(e, w) || clean === codeFor(e, w - 1);
}
