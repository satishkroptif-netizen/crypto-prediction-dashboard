import { Kline, Timeframe, VerdictLabel } from './types';

export interface TradePlan {
  side: 'long' | 'short';
  entryLow: number;
  entryHigh: number;
  stop: number;
  targets: { label: string; price: number; rr: number }[];
  riskPct: number;
  note: string;
}

function atr(klines: Kline[], period = 14): number {
  const slice = klines.slice(-(period + 1));
  if (slice.length < 2) return klines[klines.length - 1]?.close * 0.002 || 0;
  let sum = 0;
  for (let i = 1; i < slice.length; i++) {
    const h = slice[i].high, l = slice[i].low, pc = slice[i - 1].close;
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  return sum / (slice.length - 1);
}

export function decimalsFor(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 100) return 2;
  if (price >= 10) return 3;
  return 4;
}

export function computeTradePlan(
  klines: Kline[],
  currentPrice: number,
  verdict: VerdictLabel,
  timeframe: Timeframe
): TradePlan | null {
  if (verdict === 'Neutral' || klines.length < 15) return null;
  const isLong = verdict === 'Buy' || verdict === 'Strong Buy';
  const strong = verdict === 'Strong Buy' || verdict === 'Strong Sell';
  const a = atr(klines);
  if (!a || a <= 0) return null;

  const recent = klines.slice(-20);
  const swingLow = Math.min(...recent.map(k => k.low));
  const swingHigh = Math.max(...recent.map(k => k.high));

  // timeframe scales holding distance: scalps tighter stops, swing wider targets
  const tfStopMult = timeframe === '15m' ? 0.8 : timeframe === '1h' ? 1.0 : timeframe === '4h' ? 1.4 : 1.8;
  const tfTargetMult = timeframe === '15m' ? 0.7 : timeframe === '1h' ? 1.0 : timeframe === '4h' ? 1.3 : 1.6;

  let entryLow: number, entryHigh: number, stop: number;
  if (isLong) {
    entryHigh = currentPrice;
    entryLow = currentPrice - 0.25 * a;
    stop = Math.min(swingLow, entryLow - tfStopMult * a);
    if (stop >= entryLow) stop = entryLow - tfStopMult * a;
  } else {
    entryLow = currentPrice;
    entryHigh = currentPrice + 0.25 * a;
    stop = Math.max(swingHigh, entryHigh + tfStopMult * a);
    if (stop <= entryHigh) stop = entryHigh + tfStopMult * a;
  }

  const entryMid = (entryLow + entryHigh) / 2;
  const risk = Math.abs(entryMid - stop);
  if (risk <= 0) return null;
  const rMults = strong ? [1.0, 1.8, 2.8] : [0.8, 1.5, 2.2];
  const dir = isLong ? 1 : -1;
  const targets = rMults.map((m, i) => ({
    label: `T${i + 1}`,
    price: entryMid + dir * risk * m * tfTargetMult,
    rr: +(m * tfTargetMult).toFixed(2),
  }));

  const riskPct = (risk / entryMid) * 100;
  const note = isLong
    ? `Buy the zone on ${timeframe} holds; invalidation below stop. ${strong ? 'Strong conviction — size up to plan.' : 'Standard conviction — half size into T1.'}`
    : `Sell the zone on ${timeframe} rallies; invalidation above stop. ${strong ? 'Strong conviction — size up to plan.' : 'Standard conviction — half size into T1.'}`;

  return { side: isLong ? 'long' : 'short', entryLow, entryHigh, stop, targets, riskPct, note };
}
