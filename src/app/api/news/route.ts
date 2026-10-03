import { NextResponse } from 'next/server';

// Curated live-ish macro/crypto news feed. In production swap with
// CryptoPanic / GNews / NewsAPI. Sentiment scored deterministically.
const ITEMS = [
  { title: 'Fed officials signal data-dependent path as yields steady', source: 'Macro Wire', impact: 'high', asset: 'GOLD', sentiment: 0.15, minutesAgo: 12 },
  { title: 'Bitcoin ETF inflows resume as whale wallets accumulate', source: 'OnChain Desk', impact: 'high', asset: 'BTC', sentiment: 0.62, minutesAgo: 28 },
  { title: 'DXY slips from highs, metals bid on real-yield retreat', source: 'FX Brief', impact: 'medium', asset: 'GOLD', sentiment: 0.4, minutesAgo: 47 },
  { title: 'Ethereum gas fees drop as L2 activity hits record', source: 'Chain Metrics', impact: 'medium', asset: 'ETH', sentiment: 0.35, minutesAgo: 63 },
  { title: 'Crude slips on inventory build, OPEC+ in focus', source: 'Energy Desk', impact: 'high', asset: 'WTI', sentiment: -0.3, minutesAgo: 85 },
  { title: 'Funding rates normalize after leveraged long flush', source: 'Derivatives', impact: 'medium', asset: 'BTC', sentiment: 0.1, minutesAgo: 110 },
  { title: 'Fear & Greed rebounds as dip buyers step in', source: 'Sentiment', impact: 'low', asset: 'CRYPTO', sentiment: 0.45, minutesAgo: 140 },
  { title: 'Silver outperforms on industrial demand hopes', source: 'Metals', impact: 'medium', asset: 'SILVER', sentiment: 0.5, minutesAgo: 175 },
  { title: 'Large BTC transfer to exchange sparks short-term caution', source: 'Whale Alert', impact: 'medium', asset: 'BTC', sentiment: -0.45, minutesAgo: 210 },
  { title: 'CPI preview: traders brace for volatility across risk assets', source: 'Macro Wire', impact: 'high', asset: 'ALL', sentiment: 0.0, minutesAgo: 260 },
];

export async function GET() {
  const now = Date.now();
  const news = ITEMS.map((n, i) => ({
    id: `n${i}`,
    ...n,
    ts: now - n.minutesAgo * 60 * 1000,
    label: n.sentiment > 0.2 ? 'Bullish' : n.sentiment < -0.2 ? 'Bearish' : 'Neutral',
  }));
  return NextResponse.json({ news, updatedAt: now });
}
