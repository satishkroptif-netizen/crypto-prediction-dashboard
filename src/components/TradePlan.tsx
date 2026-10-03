'use client';

import { Prediction } from '@/lib/types';
import { decimalsFor } from '@/lib/levels';

export default function TradePlan({ prediction, livePrice }: { prediction: Prediction; livePrice?: number }) {
  const plan = prediction.tradePlan;
  const d = decimalsFor(prediction.currentPrice);
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: Math.min(d, 2) })}`;

  if (!plan) {
    return (
      <div className="card trade-card neutral">
        <div className="card-head"><h3>Trade Plan — {prediction.timeframe}</h3><span className="tag neutral">Neutral · No trade</span></div>
        <p className="muted-sm">Verdict is <b>Neutral</b> on this timeframe — no entry, no stop, no targets. Wait for a Buy/Sell verdict or drop to a lower timeframe. Alerts on range break still work.</p>
        <div className="krow"><span>Signal price</span><b>{fmt(livePrice ?? prediction.currentPrice)}</b></div>
        <div className="krow"><span>Confidence</span><b>{prediction.confidence}%</b></div>
      </div>
    );
  }

  const long = plan.side === 'long';
  return (
    <div className={`card trade-card ${long ? 'is-long' : 'is-short'}`}>
      <div className="card-head">
        <h3>Trade Plan — {prediction.timeframe}</h3>
        <span className={`tag ${long ? 'bullish' : 'bearish'}`}>{long ? '▲ LONG' : '▼ SHORT'} · {prediction.verdict}</span>
      </div>
      <div className="trade-grid">
        <div className="trade-cell entry"><span>Buy range</span><b>{fmt(plan.entryLow)} – {fmt(plan.entryHigh)}</b><small>{long ? 'Bid the zone' : 'Offer the zone'}</small></div>
        <div className="trade-cell stop"><span>Stop-loss</span><b>{fmt(plan.stop)}</b><small>Risk {plan.riskPct.toFixed(2)}% · invalidation</small></div>
        {plan.targets.map(t => (
          <div key={t.label} className="trade-cell tgt"><span>{t.label} · {t.rr}R</span><b>{fmt(t.price)}</b><small>Take profit</small></div>
        ))}
      </div>
      <p className="muted-sm trade-note">{plan.note}</p>
      <p className="muted-sm disclaimer">Levels from {prediction.timeframe} ATR + swing structure at signal price {fmt(prediction.currentPrice)}. Not financial advice — size by risk, confirm with candle close.</p>
    </div>
  );
}
