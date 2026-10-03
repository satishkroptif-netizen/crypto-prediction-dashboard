'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Prediction, Timeframe } from '@/lib/types';
import { DEFAULT_ASSETS } from '@/lib/prediction';
import { ALL_TIMEFRAMES } from '@/lib/weights';
import { useApp } from '@/lib/store';
import VerdictGate from './VerdictGate';

const EXTRA = [
  { symbol: 'SOL', pair: 'SOLUSDT', name: 'Solana', icon: '◎' },
  { symbol: 'BNB', pair: 'BNBUSDT', name: 'BNB', icon: '⬡' },
  { symbol: 'XRP', pair: 'XRPUSDT', name: 'XRP', icon: '✕' },
  { symbol: 'DOGE', pair: 'DOGEUSDT', name: 'Dogecoin', icon: 'Ð' },
];

export default function VerdictScanner() {
  const [data, setData] = useState<Record<string, Record<string, Prediction>>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toggleWatch, isWatched, livePrices } = useApp();
  const assets = [...DEFAULT_ASSETS, ...EXTRA];

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      const out: Record<string, Record<string, Prediction>> = {};
      await Promise.all(assets.map(async (a) => {
        out[a.symbol] = {};
        await Promise.all(ALL_TIMEFRAMES.map(async (tf: Timeframe) => {
          try {
            const r = await fetch(`/api/predictions?symbol=${a.pair}&timeframe=${tf}`);
            if (r.ok) { const j = await r.json(); out[a.symbol][tf] = j.prediction; }
          } catch { /* noop */ }
        }));
      }));
      if (!dead) { setData(out); setLoading(false); }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vColor = (v?: string) => !v ? '#64748b' : v.includes('Strong Buy') ? '#22c55e' : v.includes('Buy') ? '#4ade80' : v.includes('Strong Sell') ? '#ef4444' : v.includes('Sell') ? '#f87171' : '#eab308';
  const bullCount = (s: string) => ALL_TIMEFRAMES.filter(tf => (data[s]?.[tf]?.verdictScore || 0) > 0.2).length;

  const rows = assets.filter(a => {
    if (filter === 'bullish') return bullCount(a.symbol) >= 3;
    if (filter === 'bearish') return ALL_TIMEFRAMES.filter(tf => (data[a.symbol]?.[tf]?.verdictScore || 0) < -0.2).length >= 3;
    if (filter === 'watch') return isWatched(a.symbol);
    return true;
  }).sort((a, b) => bullCount(b.symbol) - bullCount(a.symbol));

  return (
    <div className="ws-page">
      <div className="page-head">
        <div><h1>Verdict Scanner</h1><p>Every asset × 15m · 1h · 4h · 1D — Macro, sentiment, whale, taker flow, F&G, liquidation, L/S, OI, TA</p></div>
        <div className="filter-row">
          {[['all', 'All'], ['bullish', 'Bullish ≥3'], ['bearish', 'Bearish ≥3'], ['watch', '★ Watchlist']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`filter-btn ${filter === k ? 'active' : ''}`}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="loading-state"><div className="spinner" /><p>Scanning 9 assets × 4 timeframes…</p></div> : (
        <div className="scan-table">
          <div className="scan-head scan-grid"><span>Asset</span><span>Price (live)</span><span>15m</span><span>1h</span><span>4h</span><span>1D</span><span>Signal</span><span /></div>
          {rows.map(a => (
            <div key={a.symbol} className="scan-row scan-grid">
              <Link href={`/asset/${a.symbol}`} className="scan-asset"><span>{a.icon}</span><b>{a.symbol}</b><small>{a.name}</small></Link>
              <span className="scan-price">${(livePrices[a.symbol]?.price || data[a.symbol]?.['1h']?.currentPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              {ALL_TIMEFRAMES.map(tf => {
                const p = data[a.symbol]?.[tf];
                return (
                  <Link key={tf} href={`/asset/${a.symbol}?timeframe=${tf}`} className="scan-cell" style={{ borderColor: vColor(p?.verdict) }}>
                    <VerdictGate k={`${a.symbol}-${tf}`} compact>
                      <><b style={{ color: vColor(p?.verdict) }}>{p ? p.verdict.replace('Strong ', 'S.') : '…'}</b>
                      <small>{p ? `${p.confidence}%` : ''}</small></>
                    </VerdictGate>
                  </Link>
                );
              })}
              <span className="scan-signal"><VerdictGate k={`${a.symbol}-signal`} compact><>{bullCount(a.symbol) >= 3 ? '🟢 Aligned bull' : bullCount(a.symbol) <= 1 ? '🔴 Aligned bear' : '🟡 Mixed'}</></VerdictGate></span>
              <button className={`star ${isWatched(a.symbol) ? 'on' : ''}`} onClick={() => toggleWatch(a.symbol)}>★</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
