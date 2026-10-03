'use client';

import { useEffect, useState } from 'react';
import { useForceOrders } from '@/lib/useForceOrders';

interface FlowData {
  supported: boolean; live: boolean;
  openInterest: number; fundingRate: number; markPrice: number;
  longShortHistory: { t: number; v: number }[];
  takerHistory: { t: number; v: number }[];
  oiHistory: { t: number; v: number }[];
  whales: { price: number; qty: number; notional: number; side: string; time: number }[];
  whaleThreshold: number;
}

function Spark({ data, color, fmt }: { data: number[]; color: string; fmt?: (v: number) => string }) {
  if (data.length < 2) return <div className="chart-placeholder">Waiting for history…</div>;
  const w = 260, h = 64;
  const mn = Math.min(...data), mx = Math.max(...data);
  const last = data[data.length - 1];
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / Math.max(mx - mn, 1e-9)) * (h - 10) - 5}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="spark"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>
      {fmt && <small className="muted-sm">Now: {fmt(last)}</small>}
    </div>
  );
}

const usd = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n).toLocaleString()}`;

export default function DerivativesPanel({ pair, symbol }: { pair: string; symbol: string }) {
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const liq = useForceOrders(flow?.supported ? pair : null);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/flow?symbol=${pair}`);
        if (r.ok && !dead) setFlow(await r.json());
      } catch { /* noop */ }
      if (!dead) setLoading(false);
    })();
    const id = setInterval(async () => {
      try { const r = await fetch(`/api/flow?symbol=${pair}`); if (r.ok && !dead) setFlow(await r.json()); } catch { /* noop */ }
    }, 120000);
    return () => { dead = true; clearInterval(id); };
  }, [pair]);

  if (loading) return <div className="card"><h3>Flow & Derivatives</h3><div className="loading-state"><div className="spinner" /><p>Loading OI · L/S · taker · liquidations · whales…</p></div></div>;
  if (!flow || !flow.supported) {
    return (
      <div className="card">
        <div className="card-head"><h3>Flow & Derivatives — {symbol}</h3><span className="tag neutral">Spot only</span></div>
        <p className="muted-sm">No Binance futures market for {symbol} — open interest, long/short, taker flow, liquidations and whale prints apply to crypto perps. Taker flow and whale activity still feed the prediction factors from spot order flow.</p>
      </div>
    );
  }

  const ls = flow.longShortHistory.map(x => x.v);
  const tk = flow.takerHistory.map(x => x.v);
  const oih = flow.oiHistory.map(x => x.v);
  const liqTotal = liq.longUsd + liq.shortUsd;
  const longPct = liqTotal > 0 ? (liq.longUsd / liqTotal) * 100 : 50;

  return (
    <div className="card deriv-card">
      <div className="card-head">
        <h3>Flow & Derivatives — {symbol} {flow.live ? '● live' : '○ cached'}</h3>
        <span className="muted-sm">Binance Futures + spot tape</span>
      </div>
      <div className="deriv-grid">
        <div className="deriv-cell">
          <span>Open Interest</span>
          <b>{usd(oih[oih.length - 1] || 0)}</b>
          <Spark data={oih} color="#818cf8" fmt={usd} />
        </div>
        <div className="deriv-cell">
          <span>Long / Short Ratio</span>
          <b style={{ color: (ls[ls.length - 1] || 1) > 1 ? '#4ade80' : '#f87171' }}>{(ls[ls.length - 1] || 1).toFixed(2)}</b>
          <Spark data={ls} color="#4ade80" fmt={v => v.toFixed(2)} />
        </div>
        <div className="deriv-cell">
          <span>Taker Buy / Sell Flow</span>
          <b style={{ color: (tk[tk.length - 1] || 1) > 1 ? '#4ade80' : '#f87171' }}>{(tk[tk.length - 1] || 1).toFixed(2)}</b>
          <Spark data={tk} color="#eab308" fmt={v => v.toFixed(2)} />
        </div>
        <div className="deriv-cell">
          <span>Funding Rate</span>
          <b style={{ color: flow.fundingRate > 0 ? '#4ade80' : '#f87171' }}>{(flow.fundingRate * 100).toFixed(4)}%</b>
          <small className="muted-sm">{flow.fundingRate > 0.0005 ? 'Longs pay shorts — crowded longs' : flow.fundingRate < -0.0005 ? 'Shorts pay longs' : 'Neutral positioning'}</small>
        </div>
        <div className="deriv-cell">
          <span>Liquidations (live session {liq.connected ? '●' : '○'})</span>
          <b>{liq.count === 0 ? 'No liqs yet' : usd(liqTotal)}</b>
          <div className="liq-bar">
            <div className="liq-long" style={{ width: `${longPct}%` }} />
            <div className="liq-short" style={{ width: `${100 - longPct}%` }} />
          </div>
          <small className="muted-sm">Long liq {usd(liq.longUsd)} · Short liq {usd(liq.shortUsd)}</small>
        </div>
        <div className="deriv-cell">
          <span>Whale prints (≥ {usd(flow.whaleThreshold)})</span>
          {flow.whales.length === 0 ? <small className="muted-sm">No ≥{usd(flow.whaleThreshold)} prints in last 1000 trades.</small> : (
            <div className="whale-list">
              {flow.whales.slice(0, 5).map((w, i) => (
                <div key={i} className="whale-row">
                  <b className={w.side === 'BUY' ? 'up' : 'down'}>{w.side}</b>
                  <span>{usd(w.notional)}</span>
                  <small className="muted-sm">@ ${w.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {liq.recent.length > 0 && (
        <div className="liq-recent">
          <span className="muted-sm">Latest liquidations:</span>
          <div className="whale-list">
            {liq.recent.slice(0, 5).map((l, i) => (
              <div key={i} className="whale-row">
                <b className={l.side === 'LONG' ? 'down' : 'up'}>{l.side} liq</b>
                <span>{usd(l.notional)}</span>
                <small className="muted-sm">@ ${l.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
