'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { useForceOrders } from '@/lib/useForceOrders';

const SYMS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return <div className="chart-placeholder">No data</div>;
  const w = 260, h = 70;
  const mn = Math.min(...data), mx = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / Math.max(mx - mn, 1e-9)) * (h - 8) - 4}`).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="spark"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export default function FlowDerivatives() {
  const [sym, setSym] = useState('BTCUSDT');
  const [flow, setFlow] = useState<{ openInterest: number; fundingRate: number; longShortHistory: { v: number }[]; takerHistory: { v: number }[]; oiHistory: { v: number }[]; live: boolean } | null>(null);
  const liq = useForceOrders(sym);
  const [loading, setLoading] = useState(true);
  const { addAlert, alerts, removeAlert, livePrices } = useApp();
  const [aPrice, setAPrice] = useState('');
  const [aCond, setACond] = useState<'above' | 'below'>('above');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await fetch(`/api/flow?symbol=${sym}`); if (r.ok) setFlow(await r.json()); } catch { /* noop */ }
      setLoading(false);
    })();
  }, [sym]);

  const ls = flow?.longShortHistory.map(x => x.v) || [];
  const tk = flow?.takerHistory.map(x => x.v) || [];
  const oih = flow?.oiHistory.map(x => x.v) || [];
  const cur = ls[ls.length - 1] || 1;
  const liqTotal = liq.longUsd + liq.shortUsd;

  return (
    <div className="ws-page">
      <div className="page-head">
        <div><h1>Flow & Derivatives</h1><p>Open interest · long/short · taker flow · funding — live from Binance Futures</p></div>
        <div className="sym-tabs">{SYMS.map(s => <button key={s} onClick={() => setSym(s)} className={sym === s ? 'active' : ''}>{s.replace('USDT', '')}</button>)}</div>
      </div>
      {loading ? <div className="loading-state"><div className="spinner" /><p>Loading derivatives flow…</p></div> : flow && (
        <div className="flow-grid">
          <div className="card"><h3>Open Interest</h3><p className="big">{flow.openInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><Spark data={oih} color="#818cf8" /><p className="muted-sm">{flow.live ? '● live' : '○ cached'} · contracts · 30h history</p></div>
          <div className="card"><h3>Funding Rate</h3><p className="big" style={{ color: flow.fundingRate > 0 ? '#4ade80' : '#f87171' }}>{(flow.fundingRate * 100).toFixed(4)}%</p><p className="muted-sm">{flow.fundingRate > 0.0005 ? 'Longs pay shorts — crowded' : flow.fundingRate < -0.0005 ? 'Shorts pay longs' : 'Neutral'}</p></div>
          <div className="card"><h3>Long/Short Ratio</h3><p className="big">{cur.toFixed(2)}</p><Spark data={ls} color={cur > 1 ? '#22c55e' : '#ef4444'} /></div>
          <div className="card"><h3>Taker Buy/Sell</h3><p className="big">{(tk[tk.length - 1] || 1).toFixed(2)}</p><Spark data={tk} color="#818cf8" /><p className="muted-sm">{(tk[tk.length - 1] || 1) > 1 ? 'Taker buying dominates' : 'Taker selling dominates'}</p></div>
          <div className="card">
            <h3>Liquidations (live {liq.connected ? '●' : '○'})</h3>
            <p className="big">{liq.count === 0 ? '—' : `$${Math.round(liqTotal).toLocaleString()}`}</p>
            <p className="muted-sm">Long liq ${Math.round(liq.longUsd).toLocaleString()} · Short liq ${Math.round(liq.shortUsd).toLocaleString()} · {liq.count} events this session</p>
          </div>
          <div className="card alert-maker">
            <h3>🔔 Create price alert</h3>
            <p className="muted-sm">{sym.replace('USDT', '')} now ${((livePrices[sym.replace('USDT', '')]?.price) || 0).toLocaleString()}</p>
            <div className="alert-form">
              <select value={aCond} onChange={e => setACond(e.target.value as 'above' | 'below')}><option value="above">Above</option><option value="below">Below</option></select>
              <input value={aPrice} onChange={e => setAPrice(e.target.value)} placeholder="Price, e.g. 70000" inputMode="decimal" />
              <button className="btn-primary" onClick={() => { const p = parseFloat(aPrice); if (!p) return; addAlert({ symbol: sym, pair: sym, condition: aCond, price: p }); setAPrice(''); }}>Add</button>
            </div>
            <div className="alert-list">
              {alerts.filter(a => !a.triggered).map(a => (
                <div key={a.id} className="alert-row"><span>{a.symbol} {a.condition} ${a.price.toLocaleString()}</span><button className="icon-btn" onClick={() => removeAlert(a.id)}>✕</button></div>
              ))}
              {alerts.filter(a => !a.triggered).length === 0 && <p className="muted-sm">No live alerts.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
