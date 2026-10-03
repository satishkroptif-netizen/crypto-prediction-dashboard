'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Prediction, FearGreedData, Timeframe } from '@/lib/types';
import { DEFAULT_ASSETS } from '@/lib/prediction';
import { useApp } from '@/lib/store';
import TradingViewChart from './TradingViewChart';
import TimeframeTabs from './TimeframeTabs';
import VerdictGate from './VerdictGate';

export default function DashboardView() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1h');
  const [focus, setFocus] = useState('BTC');
  const { livePrices, toggleWatch, isWatched } = useApp();

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const fngRes = await fetch('/api/fear-greed');
      if (fngRes.ok) {
        const fng = await fngRes.json();
        if (fng.data?.[0]) setFearGreed({ value: parseInt(fng.data[0].value), classification: fng.data[0].value_classification, timestamp: parseInt(fng.data[0].timestamp) });
      }
      const out: Prediction[] = [];
      await Promise.all(DEFAULT_ASSETS.map(async (a) => {
        try {
          const r = await fetch(`/api/predictions?symbol=${a.pair}&timeframe=${activeTimeframe}`);
          if (r.ok) { const j = await r.json(); out.push(j.prediction); }
        } catch { /* noop */ }
      }));
      setPredictions(out);
      setLastUpdated(new Date());
    } catch { setError('Failed to load dashboard data'); }
    setLoading(false);
  }, [activeTimeframe]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  const priceOf = (sym: string, fallback: number) => livePrices[sym]?.price ?? fallback;
  const vColor = (v: string) => v.includes('Strong Buy') ? '#22c55e' : v.includes('Buy') ? '#4ade80' : v.includes('Strong Sell') ? '#ef4444' : v.includes('Sell') ? '#f87171' : '#eab308';

  const focusPred = predictions.find(p => p.symbol === focus) || predictions[0];

  return (
    <div className="ws-page">
      <div className="page-head">
        <div><h1>Dashboard</h1><p>Realtime predictions · Crypto, Metals & Crude · 9-factor engine</p></div>
        <TimeframeTabs active={activeTimeframe} onChange={setActiveTimeframe} />
      </div>

      {fearGreed && (
        <div className="strip">
          <span>Fear & Greed <b style={{ color: fearGreed.value < 30 ? '#ef4444' : fearGreed.value > 70 ? '#22c55e' : '#eab308' }}>{fearGreed.value}</b> ({fearGreed.classification})</span>
          <span className="dot" />
          <span>BTC <b>${(livePrices['BTC']?.price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></span>
          <span className="dot" />
          <span>Gold <b>${(livePrices['GOLD']?.price || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</b></span>
          <span className="dot" />
          <span className="muted">Updated {lastUpdated?.toLocaleTimeString() || '…'}</span>
        </div>
      )}

      {loading && predictions.length === 0 ? (
        <div className="loading-state"><div className="spinner" /><p>Analyzing market data…</p></div>
      ) : error ? (
        <div className="error-state"><p>{error}</p><button onClick={fetchData} className="retry-btn">Retry</button></div>
      ) : (
        <>
          <div className="dash-grid">
            <div className="card chart-card">
              <div className="card-head">
                <div className="sym-tabs">
                  {DEFAULT_ASSETS.map(a => (
                    <button key={a.symbol} onClick={() => setFocus(a.symbol)} className={focus === a.symbol ? 'active' : ''}>{a.icon} {a.symbol}</button>
                  ))}
                </div>
                <Link href={`/asset/${focus}`} className="btn-ghost sm">Full analysis →</Link>
              </div>
              <TradingViewChart symbol={focus} height={380} />
              {focusPred && (
                <div className="focus-bar">
                  <span className="verdict" style={{ color: vColor(focusPred.verdict) }}>{focusPred.verdict}</span>
                  <span>Score {focusPred.verdictScore > 0 ? '+' : ''}{focusPred.verdictScore.toFixed(3)}</span>
                  <span>Confidence <b>{focusPred.confidence}%</b></span>
                  <span className="muted">{focusPred.topFactors[0]?.name}: {focusPred.topFactors[0]?.score.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pred-col">
              {predictions.map(p => {
                const asset = DEFAULT_ASSETS.find(a => a.symbol === p.symbol);
                const live = priceOf(p.symbol, p.currentPrice);
                return (
                  <div key={p.symbol} className="pred-row">
                    <Link href={`/asset/${p.symbol}?timeframe=${activeTimeframe}`} className="pred-main">
                      <span className="p-ico">{asset?.icon}</span>
                      <span className="p-sym">{p.symbol}<small>{asset?.name}</small></span>
                      <span className="p-price">${live.toLocaleString(undefined, { maximumFractionDigits: live < 100 ? 3 : 2 })}<small className={p.priceChange24h >= 0 ? 'up' : 'down'}>{p.priceChange24h >= 0 ? '+' : ''}{p.priceChange24h.toFixed(2)}%</small></span>
                      <span className="p-verdict" style={{ color: vColor(p.verdict) }}><VerdictGate k={`${p.symbol}-${activeTimeframe}`} compact><>{p.verdict}<small>{p.confidence}% conf</small></></VerdictGate></span>
                    </Link>
                    <button className={`star ${isWatched(p.symbol) ? 'on' : ''}`} onClick={() => toggleWatch(p.symbol)} title="Watchlist">★</button>
                  </div>
                );
              })}
            </div>
          </div>

          <h3 className="sec-title">Factor snapshot ({activeTimeframe})</h3>
          <div className="factor-strip">
            {focusPred?.factors.map(f => (
              <div key={f.name} className="f-chip">
                <span>{f.name}</span>
                <b style={{ color: f.score > 0.1 ? '#22c55e' : f.score < -0.1 ? '#ef4444' : '#eab308' }}>{f.score > 0 ? '+' : ''}{f.score.toFixed(2)}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
