'use client';

import { useRouter } from 'next/navigation';
import SearchDropdown from '@/components/SearchDropdown';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="about-page">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">◆</span>
            <span className="logo-text">GnC Signal</span>
          </div>
          <SearchDropdown />
          <nav className="main-nav">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/track-record" className="nav-link">Track Record</a>
            <a href="/about" className="nav-link active">About</a>
          </nav>
        </div>
      </header>

      <main className="about-main">
        <h1 className="page-title">About GnC Signal</h1>

        <div className="about-content">
          <section className="about-section">
            <h2>How It Works</h2>
            <p>
              GnC Signal uses a multi-factor scoring model to generate price predictions
              across multiple timeframes. Each factor is scored from <strong>-1 (bearish)</strong> to{' '}
              <strong>+1 (bullish)</strong>, then weighted differently depending on the timeframe.
            </p>
          </section>

          <section className="about-section">
            <h2>Factors Analyzed</h2>
            <div className="factors-grid">
              <div className="factor-card">
                <h4>Technical Trend</h4>
                <p>SMA, EMA, RSI, MACD analysis of price action</p>
              </div>
              <div className="factor-card">
                <h4>Taker Buy/Sell Flow</h4>
                <p>Real-time buyer vs. seller aggression from market orders</p>
              </div>
              <div className="factor-card">
                <h4>Liquidations</h4>
                <p>Forced liquidation data — short squeezes & long cascades</p>
              </div>
              <div className="factor-card">
                <h4>Long/Short Ratio</h4>
                <p>Account-level long vs. short positioning</p>
              </div>
              <div className="factor-card">
                <h4>Open Interest</h4>
                <p>Total outstanding derivatives contracts</p>
              </div>
              <div className="factor-card">
                <h4>Fear & Greed Index</h4>
                <p>Market sentiment from alternative.me</p>
              </div>
              <div className="factor-card">
                <h4>News Sentiment</h4>
                <p>Automated analysis of crypto news flow</p>
              </div>
              <div className="factor-card">
                <h4>Whale Activity</h4>
                <p>Large transaction detection and volume spikes</p>
              </div>
              <div className="factor-card">
                <h4>Macro (DXY, Yields, Fed)</h4>
                <p>Dollar strength, real yields, and Fed policy impact</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Timeframe Weighting</h2>
            <p>Different factors matter more at different time horizons:</p>
            <div className="weights-table">
              <div className="weights-row weights-header">
                <span>Factor</span><span>15m</span><span>1h</span><span>4h</span><span>1d+</span>
              </div>
              <div className="weights-row">
                <span>Taker Flow</span><span>30%</span><span>25%</span><span>10%</span><span>—</span>
              </div>
              <div className="weights-row">
                <span>Technical</span><span>25%</span><span>25%</span><span>25%</span><span>20%</span>
              </div>
              <div className="weights-row">
                <span>Liquidations</span><span>15%</span><span>15%</span><span>—</span><span>—</span>
              </div>
              <div className="weights-row">
                <span>Long/Short Ratio</span><span>10%</span><span>10%</span><span>10%</span><span>5%</span>
              </div>
              <div className="weights-row">
                <span>Open Interest</span><span>10%</span><span>10%</span><span>15%</span><span>15%</span>
              </div>
              <div className="weights-row">
                <span>Fear & Greed</span><span>5%</span><span>10%</span><span>15%</span><span>15%</span>
              </div>
              <div className="weights-row">
                <span>News Sentiment</span><span>5%</span><span>5%</span><span>10%</span><span>10%</span>
              </div>
              <div className="weights-row">
                <span>Whale Activity</span><span>—</span><span>—</span><span>—</span><span>10%</span>
              </div>
              <div className="weights-row">
                <span>Macro</span><span>—</span><span>—</span><span>15%</span><span>25%</span>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Data Sources</h2>
            <ul>
              <li><strong>Binance Public API</strong> — Real-time price, volume, klines, and futures data</li>
              <li><strong>alternative.me</strong> — Crypto Fear & Greed Index</li>
            </ul>
          </section>

          <section className="about-section disclaimer">
            <h2>Disclaimer</h2>
            <div className="disclaimer-box">
              <p>
                <strong>GnC Signal is for informational and educational purposes only.</strong>
                Nothing on this website constitutes financial advice, investment advice, trading advice,
                or any other form of professional advice.
              </p>
                           <p>
                Cryptocurrency and commodity trading involve substantial risk of loss and are not
                suitable for every investor. Past performance is not indicative of future results.
                Always do your own research and consult a licensed financial advisor before making
                investment decisions.
              </p>
              <p>
                The predictions generated by this system are based on technical analysis and
                market data models. They do not guarantee any specific outcome. You should never
                invest money you cannot afford to lose.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
