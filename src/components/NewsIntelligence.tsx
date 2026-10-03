'use client';

import { useEffect, useState } from 'react';

interface N { id: string; title: string; source: string; impact: string; asset: string; sentiment: number; label: string; ts: number; }

export default function NewsIntelligence() {
  const [news, setNews] = useState<N[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/news'); if (r.ok) { const j = await r.json(); setNews(j.news); } } catch { /* noop */ }
    })();
    const id = setInterval(async () => {
      try { const r = await fetch('/api/news'); if (r.ok) { const j = await r.json(); setNews(j.news); } } catch { /* noop */ }
    }, 120000);
    return () => clearInterval(id);
  }, []);

  const avg = news.length ? news.reduce((s, n) => s + n.sentiment, 0) / news.length : 0;
  const rows = news.filter(n => filter === 'all' || n.asset === filter || (filter === 'bull' && n.sentiment > 0.2) || (filter === 'bear' && n.sentiment < -0.2));

  return (
    <div className="ws-page">
      <div className="page-head">
        <div><h1>News Intelligence</h1><p>Auto-refreshing sentiment feed → feeds the News Sentiment factor</p></div>
        <div className="sent-pill" style={{ borderColor: avg > 0.15 ? '#22c55e' : avg < -0.15 ? '#ef4444' : '#eab308' }}>
          Avg sentiment <b style={{ color: avg > 0.15 ? '#22c55e' : avg < -0.15 ? '#ef4444' : '#eab308' }}>{avg > 0 ? '+' : ''}{avg.toFixed(2)}</b>
        </div>
      </div>
      <div className="filter-row">
        {[['all', 'All'], ['BTC', 'BTC'], ['ETH', 'ETH'], ['GOLD', 'Gold'], ['WTI', 'Oil'], ['bull', 'Bullish'], ['bear', 'Bearish']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`filter-btn ${filter === k ? 'active' : ''}`}>{l}</button>
        ))}
      </div>
      <div className="news-grid">
        {rows.map(n => (
          <article key={n.id} className="news-card">
            <div className="news-top">
              <span className={`tag ${n.label.toLowerCase()}`}>{n.label} {n.sentiment > 0 ? '+' : ''}{n.sentiment.toFixed(2)}</span>
              <span className={`tag impact-${n.impact}`}>{n.impact} impact</span>
            </div>
            <h4>{n.title}</h4>
            <div className="news-meta"><span>{n.source}</span><span>·</span><span>{n.asset}</span><span>·</span><span>{new Date(n.ts).toLocaleTimeString()}</span></div>
            <div className="sent-bar"><div style={{ width: `${((n.sentiment + 1) / 2) * 100}%`, background: n.sentiment > 0.2 ? '#22c55e' : n.sentiment < -0.2 ? '#ef4444' : '#eab308' }} /></div>
          </article>
        ))}
      </div>
    </div>
  );
}
