import { NextResponse } from 'next/server';

// Realtime-ish commodity prices from multiple free sources.
// GOLD: Binance PAXG (live crypto proxy) → gold-api → stooq
// SILVER: gold-api → stooq
// WTI: stooq (cl.f) → Yahoo (CL=F)

async function binancePaxg(): Promise<{ price: number; change: number } | null> {
  try {
    const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT', { next: { revalidate: 15 } });
    if (!r.ok) return null;
    const j = await r.json();
    return { price: parseFloat(j.lastPrice), change: parseFloat(j.priceChangePercent) };
  } catch { return null; }
}

async function goldApi(sym: 'XAU' | 'XAG'): Promise<number | null> {
  try {
    const r = await fetch(`https://api.gold-api.com/price/${sym}`, { next: { revalidate: 30 } });
    if (!r.ok) return null;
    const j = await r.json();
    const p = parseFloat(j.price);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch { return null; }
}

async function stooq(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch('https://stooq.com/q/l/?s=xauusd,xagusd,cl.f&f=sd2t2ohlcv&h&e=csv', { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const t = await r.text();
    const out: Record<string, number> = {};
    for (const line of t.trim().split('\n').slice(1)) {
      const parts = line.split(',');
      const sym = parts[0]?.toLowerCase();
      const close = parseFloat(parts[6]);
      if (sym && Number.isFinite(close) && close > 0) out[sym] = close;
    }
    return out;
  } catch { return null; }
}

async function yahooWTI(): Promise<number | null> {
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1m&range=1d', { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const j = await r.json();
    const p = j.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof p === 'number' ? p : null;
  } catch { return null; }
}

export async function GET() {
  const [paxg, xau, xag, st, wti] = await Promise.all([binancePaxg(), goldApi('XAU'), goldApi('XAG'), stooq(), yahooWTI()]);
  const gold = paxg?.price ?? xau ?? st?.['xauusd'] ?? 2650;
  const silver = xag ?? st?.['xagusd'] ?? 31.5;
  const oil = st?.['cl.f'] ?? wti ?? 72;
  return NextResponse.json({
    GOLD: { price: gold, change24h: paxg?.change ?? 0, source: paxg ? 'binance:PAXG' : xau ? 'gold-api' : 'stooq' },
    SILVER: { price: silver, change24h: 0, source: xag ? 'gold-api' : 'stooq' },
    WTI: { price: oil, change24h: 0, source: st?.['cl.f'] ? 'stooq:CL.F' : 'yahoo:CL=F' },
    updatedAt: Date.now(),
  });
}
