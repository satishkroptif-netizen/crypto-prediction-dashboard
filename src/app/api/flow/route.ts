import { NextRequest, NextResponse } from 'next/server';

const FAPI = 'https://fapi.binance.com';
const SAPI = 'https://api.binance.com';

// No Binance futures market for these — return unsupported so UI shows N/A
const NO_FUTURES = new Set(['XAUUSDT', 'XAGUSDT', 'WTIUSDT', 'PAXGUSDT']);
const WHALE_USD = 50000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase();
  try {
    if (NO_FUTURES.has(symbol)) {
      return NextResponse.json({ symbol, supported: false, live: false });
    }
    const [oiR, lsR, takerR, premR, aggR, oiHistR, whaleR] = await Promise.all([
      fetch(`${FAPI}/fapi/v1/openInterest?symbol=${symbol}`, { next: { revalidate: 60 } }),
      fetch(`${FAPI}/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=1h&limit=30`, { next: { revalidate: 60 } }),
      fetch(`${FAPI}/futures/data/takerlongshortRatio?symbol=${symbol}&period=1h&limit=30`, { next: { revalidate: 60 } }),
      fetch(`${FAPI}/fapi/v1/premiumIndex?symbol=${symbol}`, { next: { revalidate: 30 } }),
      fetch(`${FAPI}/fapi/v1/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=30`, { next: { revalidate: 60 } }),
      fetch(`${FAPI}/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=30`, { next: { revalidate: 120 } }),
      fetch(`${SAPI}/api/v3/aggTrades?symbol=${symbol}&limit=1000`, { next: { revalidate: 60 } }),
    ]);
    const oi = oiR.ok ? await oiR.json() : null;
    const ls = lsR.ok ? await lsR.json() : [];
    const taker = takerR.ok ? await takerR.json() : [];
    const prem = premR.ok ? await premR.json() : null;
    const agg = aggR.ok ? await aggR.json() : [];
    const oiHist = oiHistR.ok ? await oiHistR.json() : [];

    let whales: { price: number; qty: number; notional: number; side: string; time: number }[] = [];
    if (whaleR.ok) {
      const trades = await whaleR.json();
      if (Array.isArray(trades)) {
        whales = trades
          .map((t: { p: string; q: string; m: boolean; T: number }) => {
            const price = parseFloat(t.p), qty = parseFloat(t.q);
            return { price, qty, notional: price * qty, side: t.m ? 'SELL' : 'BUY', time: t.T };
          })
          .filter(w => Number.isFinite(w.notional) && w.notional >= WHALE_USD)
          .sort((a, b) => b.notional - a.notional)
          .slice(0, 10);
      }
    }

    return NextResponse.json({
      symbol,
      supported: true,
      openInterest: oi ? parseFloat(oi.openInterest) : 0,
      openInterestTime: oi?.time || Date.now(),
      fundingRate: prem ? parseFloat(prem.lastFundingRate) : 0,
      markPrice: prem ? parseFloat(prem.markPrice) : 0,
      longShortHistory: Array.isArray(ls) ? ls.map((x: { timestamp: number; longShortRatio: string }) => ({ t: x.timestamp, v: parseFloat(x.longShortRatio) })) : [],
      takerHistory: Array.isArray(taker) ? taker.map((x: { timestamp: number; buySellRatio: string }) => ({ t: x.timestamp, v: parseFloat(x.buySellRatio) })) : [],
      globalHistory: Array.isArray(agg) ? agg.map((x: { timestamp: number; longShortRatio: string }) => ({ t: x.timestamp, v: parseFloat(x.longShortRatio) })) : [],
      oiHistory: Array.isArray(oiHist) ? oiHist.map((x: { timestamp: number; sumOpenInterestValue: string }) => ({ t: x.timestamp, v: parseFloat(x.sumOpenInterestValue) })) : [],
      whales,
      whaleThreshold: WHALE_USD,
      live: oiR.ok,
    });
  } catch (e) {
    return NextResponse.json({ error: 'flow fetch failed', details: String(e) }, { status: 500 });
  }
}
