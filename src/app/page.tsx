'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';

export const dynamic = 'force-dynamic';

const TAPE = [
  { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
  { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
  { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
  { proName: 'OANDA:XAUUSD', title: 'Gold' },
  { proName: 'OANDA:XAGUSD', title: 'Silver' },
  { proName: 'TVC:USOIL', title: 'WTI Crude' },
];

function PulseTape() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    box.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: TAPE,
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'adaptive',
      locale: 'en',
    });
    box.appendChild(script);
    return () => { box.innerHTML = ''; };
  }, []);
  return <div className="lp-tape" ref={ref} />;
}

const FEATURES = [
  { icon: '◎', title: 'Verdict Engine', body: 'Strong Buy → Strong Sell across 15m, 1h, 4h and 1D — fused from macro, sentiment, whale flow, taker data, fear & greed, liquidations, long/short, open interest and technicals.' },
  { icon: '🎯', title: 'Entry · Stop · 3 Targets', body: 'Every directional verdict ships an ATR-based trade plan: buy/sell zone, stop-loss and three R-multiple targets. Neutral stays honest — no forced levels.' },
  { icon: '⇄', title: 'Verdict Scanner', body: 'Nine instruments × four timeframes in one matrix. Spot aligned bull/bear regimes before you open a single chart.' },
  { icon: '🌊', title: 'Flow & Derivatives', body: 'Live open interest with history, long/short ratios, taker buy/sell flow, funding rates, session liquidations and ≥$50k whale prints.' },
  { icon: '✦', title: 'News Intelligence', body: 'A rolling sentiment feed that scores headlines bullish-to-bearish and feeds straight into the News Sentiment factor.' },
  { icon: '▤', title: 'Economic Calendar (IST)', body: 'CPI, FOMC, NFP, OPEC and more — converted to IST (UTC+5:30) with countdowns so you never hold max size into the number.' },
];

const MODULES = [
  { href: '/workspace', icon: '◧', title: 'Workspace Dashboard', body: 'Live predictions + TradingView charts' },
  { href: '/scanner', icon: '◎', title: 'Verdict Scanner', body: 'All assets × all timeframes' },
  { href: '/regime', icon: '◈', title: 'Market Regime', body: 'Risk-on / risk-off compass' },
  { href: '/news', icon: '✦', title: 'News Intelligence', body: 'Sentiment-scored feed' },
  { href: '/flow', icon: '⇄', title: 'Flow & Derivatives', body: 'OI · L/S · funding · liqs · whales' },
  { href: '/calendar', icon: '▤', title: 'Economic Calendar', body: 'Events in IST with countdowns' },
  { href: '/track-record', icon: '✓', title: 'Track Record', body: 'Verdicts vs outcomes' },
  { href: '/about', icon: '?', title: 'Methodology', body: 'Factors, weights, honesty notes' },
];

const FAQS = [
  { q: 'Is this financial advice?', a: 'No. GnC Signal provides data, analytics and educational strategy output — not personalised advice, guaranteed predictions or assured returns. Markets involve substantial risk; do your own research.' },
  { q: 'How do I unlock verdicts?', a: 'Guests get exactly one free verdict view. Sign up free with name, email and phone, verify the 6-digit email code, and every verdict, trade plan and alert unlocks.' },
  { q: 'Which data is actually live?', a: 'Crypto prices stream over Binance WebSocket, gold tracks Binance PAXG, charts are realtime TradingView. Fear & Greed, news, OI history and futures ratios refresh on a timer. Liquidations stream live per session.' },
  { q: 'Does it work on mobile?', a: 'Yes — sidebar becomes a drawer, there is a bottom tab bar for the six workspace modules, and charts, tables and trade plans all collapse to single column.' },
  { q: 'Why only one free verdict?', a: 'Verdicts are the product. One free view lets you verify quality on any asset and timeframe; the free account unlocks the rest.' },
];

export default function LandingPage() {
  const { user } = useApp();
  return (
    <div className="lp-root">
      <header className="lp-top">
        <Link href="/" className="ws-logo"><span className="logo-icon">◆</span><span>GnC Signal</span></Link>
        <nav className="lp-nav">
          <a href="#features">Features</a>
          <a href="#signal">Signals</a>
          <a href="#modules">Modules</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="lp-top-cta">
          {user ? (
            <><span className="muted-sm hide-sm">Hi, {user.name.split(' ')[0]}</span><Link href="/workspace" className="btn-primary">Open workspace</Link></>
          ) : (
            <><Link href="/login" className="btn-ghost">Login</Link><Link href="/signup" className="btn-primary">Sign up free</Link></>
          )}
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-badge">AI-POWERED PREDICTION WORKSPACE</div>
        <h1>Every market has a story.<br />We decode it into a <span className="grad">verdict.</span></h1>
        <p className="lp-sub">GnC Signal fuses macro, sentiment, whale flow, derivatives and technicals into clear Buy / Sell calls on crypto, gold, silver and crude — with entry, stop and targets on every timeframe.</p>
        <div className="lp-cta-row">
          <Link href="/workspace" className="btn-primary big">Open the workspace — free</Link>
          <Link href="/scanner" className="btn-ghost big">Scan live verdicts</Link>
        </div>
        <div className="lp-mini-stats">
          <span><b>9</b> weighted factors</span><i />
          <span><b>4</b> timeframes</span><i />
          <span><b>9</b> instruments</span><i />
          <span><b>Live</b> feeds + charts</span>
        </div>
      </section>

      <PulseTape />

      <section className="lp-band">
        <div><b>9-factor</b><span>confluence engine</span></div>
        <div><b>15m · 1h · 4h · 1D</b><span>predictions</span></div>
        <div><b>Realtime</b><span>Binance WS + TradingView</span></div>
        <div><b>IST-first</b><span>calendar & timezones</span></div>
      </section>

      <section id="features" className="lp-sec">
        <p className="lp-kicker">FEATURES</p>
        <h2>Not another price ticker.<br />An analyst that never sleeps.</h2>
        <div className="lp-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="lp-card">
              <span className="lp-ico">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="signal" className="lp-sec">
        <p className="lp-kicker">SIGNALS WITH REASONS</p>
        <h2>Risk before reward, on every call.</h2>
        <div className="lp-signal-wrap">
          <div className="card trade-card is-long">
            <div className="card-head">
              <h3>BTC · 4 Hours</h3>
              <span className="tag bullish">▲ LONG · Buy</span>
            </div>
            <div className="trade-grid">
              <div className="trade-cell entry"><span>Buy range</span><b>$97,410 – $97,850</b><small>Bid the zone</small></div>
              <div className="trade-cell stop"><span>Stop-loss</span><b>$95,980</b><small>Risk 1.62% · invalidation</small></div>
              <div className="trade-cell tgt"><span>T1 · 1R</span><b>$99,280</b><small>Take profit</small></div>
              <div className="trade-cell tgt"><span>T2 · 1.8R</span><b>$100,420</b><small>Take profit</small></div>
            </div>
            <p className="muted-sm trade-note"><b>Why:</b> taker buying dominates + OI rising with price vs overhanging greed. <b>Invalidation:</b> 4h close below $95,980.</p>
          </div>
          <ul className="lp-checks">
            <li><b>Entry · Stop · 3 Targets · R:R</b> — levels from live price and volatility bands, never a bare "buy now".</li>
            <li><b>Confidence on every verdict</b> — high-conviction only, or stand aside on Neutral.</li>
            <li><b>Alerts that wake you</b> — price alerts checked against the live stream, in-app + browser notifications.</li>
            <li><b>Docked TradingView charts</b> — free real-data charts beside every signal.</li>
          </ul>
        </div>
        <p className="muted-sm center">Illustrative example — live cards are computed in the workspace.</p>
      </section>

      <section id="modules" className="lp-sec">
        <p className="lp-kicker">MODULES</p>
        <h2>Jump straight into any desk.</h2>
        <div className="lp-grid">
          {MODULES.map(m => (
            <Link key={m.href} href={m.href} className="lp-card link">
              <span className="lp-ico">{m.icon}</span>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
              <span className="go">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="how" className="lp-sec">
        <p className="lp-kicker">HOW IT WORKS</p>
        <h2>From curious to confident in three steps.</h2>
        <div className="lp-steps">
          <div className="lp-step"><b>1</b><h3>Reveal one free verdict</h3><p>Open any asset and timeframe — your first verdict, trade plan included, is on the house. No account needed.</p></div>
          <div className="lp-step"><b>2</b><h3>Sign up free</h3><p>Name, email, phone + a 6-digit email code. Verified members unlock every verdict on every timeframe.</p></div>
          <div className="lp-step"><b>3</b><h3>Trade smarter</h3><p>Watchlists, price alerts, scanner regimes and IST calendar — one workspace, live around the clock.</p></div>
        </div>
      </section>

      <section className="lp-sec">
        <p className="lp-kicker">ACCESS</p>
        <h2>Free to explore. Free to join.</h2>
        <div className="lp-plans">
          <div className="lp-plan">
            <h3>Guest</h3>
            <p className="price">₹0 <small>no account</small></p>
            <ul><li>1 free verdict view</li><li>Live prices + TradingView charts</li><li>Economic calendar (IST)</li><li>Methodology + track record</li></ul>
            <Link href="/workspace" className="btn-ghost full">Start exploring</Link>
          </div>
          <div className="lp-plan hot">
            <h3>Member</h3>
            <p className="price">₹0 <small>free account</small></p>
            <ul><li>All verdicts, all timeframes</li><li>Entry · stop · 3 targets</li><li>Watchlist + price alerts</li><li>Scanner, regime, flow, news</li></ul>
            <Link href="/signup" className="btn-primary full">Sign up free</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="lp-sec">
        <p className="lp-kicker">FAQ</p>
        <h2>Questions, answered straight.</h2>
        <div className="lp-faq">
          {FAQS.map(f => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </section>

      <section className="lp-final">
        <h2>The market is telling a story.<br />Start reading it today.</h2>
        <div className="lp-cta-row">
          <Link href="/workspace" className="btn-primary big">Explore the workspace</Link>
          <Link href="/signup" className="btn-ghost big">Unlock all verdicts</Link>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-links">
          <span><b>GnC Signal</b> · AI prediction workspace</span>
          <span><Link href="/workspace">Workspace</Link> · <Link href="/scanner">Scanner</Link> · <Link href="/calendar">Calendar</Link> · <Link href="/about">Methodology</Link></span>
        </div>
        <p><b>Financial Disclaimer.</b> GnC Signal provides data, analytics and educational tools. It does not provide personalised investment advice, guaranteed predictions, buy/sell recommendations, portfolio management or assured returns. Markets involve substantial risk — do your own research and consult a qualified professional.</p>
        <p>© GnC Signal · Charts by TradingView · Live data: Binance, gold-api, CoinGecko</p>
      </footer>
    </div>
  );
}
