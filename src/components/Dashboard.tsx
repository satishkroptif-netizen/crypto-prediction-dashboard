'use client';

import { useState, useEffect, useCallback } from 'react';
import { Prediction, FearGreedData } from '@/lib/types';
import { DEFAULT_ASSETS } from '@/lib/prediction';
import { Timeframe } from '@/lib/types';
import PredictionCard from './PredictionCard';
import SearchDropdown from './SearchDropdown';
import TimeframeTabs from './TimeframeTabs';

interface TickerInfo {
  symbol: string;
  price: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tickers, setTickers] = useState<Record<string, TickerInfo>>({});
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1h');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allPredictions: Prediction[] = [];
      const allTickers: Record<string, TickerInfo> = {};

      // Fetch Fear & Greed once
      const fngRes = await fetch('/api/fear-greed');
      if (fngRes.ok) {
        const fngData = await fngRes.json();
        if (fngData.data?.[0]) {
          setFearGreed({
            value: parseInt(fngData.data[0].value),
            classification: fngData.data[0].value_classification,
            timestamp: parseInt(fngData.data[0].timestamp),
          });
        }
      }

      // Fetch predictions for all default assets
      await Promise.all(
        DEFAULT_ASSETS.map(async (asset) => {
          try {
            const res = await fetch(
              `/api/predictions?symbol=${asset.pair}&timeframe=${activeTimeframe}`
            );
            if (res.ok) {
              const data = await res.json();
              allPredictions.push(data.prediction);
              allTickers[asset.symbol] = data.ticker;
            }
          } catch (e) {
            console.error(`Failed to fetch ${asset.symbol}:`, e);
          }
        })
      );

      setPredictions(allPredictions);
      setTickers(allTickers);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Failed to load dashboard data');
    }
    setLoading(false);
  }, [activeTimeframe]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const getPrice = (symbol: string) => tickers[symbol]?.price;
  const getChange = (symbol: string) => tickers[symbol]?.priceChange24h;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo">
            <span className="logo-icon">◆</span>
            <span className="logo-text">GnC Signal</span>
          </div>
          <SearchDropdown />
          <nav className="main-nav">
            <a href="/" className="nav-link active">Dashboard</a>
            <a href="/track-record" className="nav-link">Track Record</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
        </div>

        {fearGreed && (
          <div className="fng-banner">
            <span className="fng-label">Fear & Greed Index:</span>
            <span className="fng-value" style={{
              color: fearGreed.value < 30 ? '#ef4444' : fearGreed.value > 70 ? '#22c55e' : '#eab308'
            }}>
              {fearGreed.value}
            </span>
            <span className="fng-classification">({fearGreed.classification})</span>
          </div>
        )}
      </header>

      <main className="dashboard-main">
        <div className="dashboard-controls">
          <h2 className="section-heading">Market Predictions</h2>
          <TimeframeTabs active={activeTimeframe} onChange={setActiveTimeframe} />
        </div>

        {loading && predictions.length === 0 ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Analyzing market data...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchData} className="retry-btn">Retry</button>
          </div>
        ) : (
          <>
            <div className="predictions-grid">
              {predictions.map((pred) => {
                const asset = DEFAULT_ASSETS.find((a) => a.symbol === pred.symbol);
                return (
                  <PredictionCard
                    key={`${pred.symbol}-${pred.timeframe}`}
                    prediction={pred}
                    assetName={asset?.name}
                    assetIcon={asset?.icon}
                  />
                );
              })}
            </div>

            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
                <span className="update-dot" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
