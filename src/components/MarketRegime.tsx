'use client';

import { useEffect, useState } from 'react';

export default function MarketRegime() {
  const [fng, setFng] = useState<{ value: number; classification: string } | null>(null);
  const [btc, setBtc] = useState<{ price: number; change: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/fear-greed');
        if (r.ok) { const j = await r.json(); if (j.data?.[0]) setFng({ value: parseInt(j.data[0].value), classification: j.data[0].value_classification }); }
        const p = await fetch('/api/predictions?symbol=BTCUSDT&timeframe=4h');
        if (p.ok) { const j = await p.json(); setBtc({ price: j.ticker.price, change: j.ticker.priceChange24h }); }
      } catch { /* noop */ }
    })();
  }, []);

  const v = fng?.value ?? 50;
  const risk = v < 25 ? { label: 'Extreme Fear — Contrarian bid zone', color: '#22c55e', pct: 18 } : v < 45 ? { label: 'Risk-off — Defensive', color: '#eab308', pct: 38 } : v <= 65 ? { label: 'Neutral — Balanced regime', color: '#d4af37', pct: 58 } : v <= 80 ? { label: 'Risk-on — Greed regime', color: '#4ade80', pct: 78 } : { label: 'Euphoria — Reduce risk', color: '#ef4444', pct: 92 };

  return (
    <div className="ws-page">
      <div className="page-head"><div><h1>Market Regime</h1><p>Risk-on / risk-off compass from sentiment, momentum & macro</p></div></div>
      <div className="regime-grid">
        <div className="card gauge-card">
          <h3>Regime Gauge</h3>
          <div className="gauge"><div className="gauge-fill" style={{ width: `${risk.pct}%`, background: risk.color }} /></div>
          <p className="regime-label" style={{ color: risk.color }}>{risk.label}</p>
          <div className="krow"><span>Fear & Greed</span><b>{fng ? `${fng.value} (${fng.classification})` : '…'}</b></div>
          <div className="krow"><span>BTC 24h</span><b className={(btc?.change || 0) >= 0 ? 'up' : 'down'}>{btc ? `${btc.change >= 0 ? '+' : ''}${btc.change.toFixed(2)}%` : '…'}</b></div>
        </div>
        <div className="card">
          <h3>Playbook</h3>
          <ul className="playbook">
            <li><b>Risk-on:</b> favour Buy verdicts on 4h/1D, wider stops on alts, long Gold dips.</li>
            <li><b>Neutral:</b> trade 1h verdicts only, keep size 0.5×, demand 65%+ confidence.</li>
            <li><b>Risk-off:</b> favour Sell/Neutral, tighten alerts, hedge with Gold/WTI shorts.</li>
            <li><b>Extreme prints (&lt;20 / &gt;80):</b> fade the crowd — contrarian entries win.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Macro dials</h3>
          <div className="krow"><span>DXY (proxy)</span><b>Neutral 102.4</b></div>
          <div className="krow"><span>Real yields</span><b className="down">Elevated — headwind</b></div>
          <div className="krow"><span>Fed stance</span><b>Data-dependent</b></div>
          <div className="krow"><span>Oil / inflation</span><b>Watch $75 WTI</b></div>
          <p className="muted-sm">Wire DXY/yield feeds for fully live dials — structure ready in <code>/api/flow</code>.</p>
        </div>
      </div>
    </div>
  );
}
