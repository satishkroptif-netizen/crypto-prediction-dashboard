'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Prediction, FearGreedData, Timeframe } from '@/lib/types';
import { DEFAULT_ASSETS } from '@/lib/prediction';
import { ALL_TIMEFRAMES, TIMEFRAME_LABELS } from '@/lib/weights';
import WorkspaceShell from '@/components/WorkspaceShell';
import TradingViewChart from '@/components/TradingViewChart';
import FactorBreakdown from '@/components/FactorBreakdown';
import TradePlan from '@/components/TradePlan';
import DerivativesPanel from '@/components/DerivativesPanel';
import VerdictGate from '@/components/VerdictGate';
import { useApp } from '@/lib/store';

function Content() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = ((params.symbol as string) || 'BTC').toUpperCase();
  const { livePrices, toggleWatch, isWatched, addAlert, pushToast } = useApp();
  const [data, setData] = useState<{ prediction: Prediction; ticker: { price: number; priceChange24h: number }; fearGreed: FearGreedData | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Timeframe>((searchParams.get('timeframe') as Timeframe) || '1h');
  const [aPrice, setAPrice] = useState('');
  const [aCond, setACond] = useState<'above' | 'below'>('above');

  const apiPair = symbol === 'GOLD' || symbol === 'XAU' ? 'XAUUSDT' : symbol === 'SILVER' || symbol === 'XAG' ? 'XAGUSDT' : symbol === 'WTI' ? 'WTIUSDT' : `${symbol}USDT`;
  const asset = DEFAULT_ASSETS.find(a => a.symbol === symbol);
  const live = livePrices[symbol]?.price;

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/predictions?symbol=${apiPair}&timeframe=${tab}`);
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch { setError('Failed to load asset data.'); }
    setLoading(false);
  }, [apiPair, tab]);

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60000); return () => clearInterval(id); }, [fetchData]);

  const vc = (v: string) => v.includes('Strong Buy') ? '#22c55e' : v.includes('Buy') ? '#4ade80' : v.includes('Strong Sell') ? '#ef4444' : v.includes('Sell') ? '#f87171' : '#eab308';

  return (
    <WorkspaceShell active="dashboard">
      <div className="ws-page asset-page">
        <Link href="/workspace" className="back-link">← Workspace</Link>
        <div className="page-head">
          <div className="asset-title-row">
            <span className="big-ico">{asset?.icon || '●'}</span>
            <div><h1>{asset?.name || symbol} <small>{symbol}/USDT {live ? `· $${live.toLocaleString(undefined, { maximumFractionDigits: 2 })} live` : ''}</small></h1>
              <p>Chart first · trade plan per timeframe · compact factors</p></div>
            <button className={`star lg ${isWatched(symbol) ? 'on' : ''}`} onClick={() => toggleWatch(symbol)}>★ {isWatched(symbol) ? 'Watching' : 'Watch'}</button>
          </div>
          <div className="sym-tabs">{ALL_TIMEFRAMES.map(tf => <button key={tf} onClick={() => { setTab(tf); router.push(`/asset/${symbol}?timeframe=${tf}`, { scroll: false }); }} className={tab === tf ? 'active' : ''}>{TIMEFRAME_LABELS[tf]}</button>)}</div>
        </div>

        {loading ? <div className="loading-state"><div className="spinner" /><p>Analyzing {symbol}…</p></div>
          : error ? <div className="error-state"><p>{error}</p><button className="retry-btn" onClick={fetchData}>Retry</button></div>
          : data && (
            <>
              {/* 1 — Chart: full width, tall, first */}
              <div className="card chart-hero">
                <div className="card-head">
                  <h3>TradingView — {symbol} · {TIMEFRAME_LABELS[tab]} (realtime)</h3>
                  <VerdictGate k={`${symbol}-${tab}`} compact><span className="verdict-chip" style={{ color: vc(data.prediction.verdict), borderColor: vc(data.prediction.verdict) }}>{data.prediction.verdict} · {data.prediction.confidence}%</span></VerdictGate>
                </div>
                <TradingViewChart symbol={symbol} height={560} />
              </div>

              {/* 2 — KPI strip */}
              <div className="kpi-row kpi-4">
                <div className="card"><span className="k-label">Verdict ({TIMEFRAME_LABELS[tab]})</span><VerdictGate k={`${symbol}-${tab}`}><><b className="k-big" style={{ color: vc(data.prediction.verdict) }}>{data.prediction.verdict}</b><small>Score {data.prediction.verdictScore.toFixed(3)}</small></></VerdictGate></div>
                <div className="card"><span className="k-label">Confidence</span><b className="k-big">{data.prediction.confidence}%</b><small>{data.prediction.confidence >= 70 ? 'High conviction' : data.prediction.confidence >= 50 ? 'Moderate' : 'Low conviction'}</small></div>
                <div className="card"><span className="k-label">Price (live)</span><b className="k-big">${(live ?? data.prediction.currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</b><small className={data.prediction.priceChange24h >= 0 ? 'up' : 'down'}>{data.prediction.priceChange24h >= 0 ? '+' : ''}{data.prediction.priceChange24h.toFixed(2)}% 24h</small></div>
                <div className="card alert-mini">
                  <span className="k-label">🔔 Alert me</span>
                  <div className="alert-form"><select value={aCond} onChange={e => setACond(e.target.value as 'above' | 'below')}><option value="above">Above</option><option value="below">Below</option></select>
                    <input value={aPrice} onChange={e => setAPrice(e.target.value)} placeholder="Price" inputMode="decimal" />
                    <button className="btn-primary" onClick={() => { const p = parseFloat(aPrice); if (!p) return; addAlert({ symbol, pair: apiPair, condition: aCond, price: p }); setAPrice(''); pushToast({ title: 'Alert armed', body: `${symbol} ${aCond} $${p}`, kind: 'success' }); }}>Set</button></div>
                </div>
              </div>

              {/* 3 — Trade plan + compact factors side by side */}
              <div className="asset-grid">
                <VerdictGate k={`${symbol}-${tab}`}><TradePlan prediction={data.prediction} livePrice={live} /></VerdictGate>
                <div className="card"><FactorBreakdown prediction={data.prediction} compact /></div>
              </div>

              {/* 4 — Flow & derivatives: OI, L/S, taker, funding, liquidations, whales */}
              <div style={{ marginTop: '1rem' }}>
                <DerivativesPanel pair={apiPair} symbol={symbol} />
              </div>
            </>
          )}
      </div>
    </WorkspaceShell>
  );
}

export const dynamic = 'force-dynamic';
export default function Page() { return <Suspense><Content /></Suspense>; }
