'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchDropdown from '@/components/SearchDropdown';

interface TrackRecordEntry {
  id: string;
  symbol: string;
  timeframe: string;
  verdict: string;
  verdictScore: number;
  confidence: number;
  predictedAt: string;
  priceAtPrediction: number;
  actualOutcome: 'correct' | 'incorrect' | 'pending';
  priceChange7d: number;
  priceChange30d: number;
}

// Simulated track record data
const SIMULATED_RECORDS: TrackRecordEntry[] = [
  {
    id: '1', symbol: 'BTC', timeframe: '1h', verdict: 'Buy', verdictScore: 0.45,
    confidence: 72, predictedAt: '2026-09-20T10:00:00Z', priceAtPrediction: 67250,
    actualOutcome: 'correct', priceChange7d: 3.2, priceChange30d: 8.5,
  },
  {
    id: '2', symbol: 'BTC', timeframe: '4h', verdict: 'Strong Buy', verdictScore: 0.72,
    confidence: 85, predictedAt: '2026-09-15T14:00:00Z', priceAtPrediction: 65800,
    actualOutcome: 'correct', priceChange7d: 5.1, priceChange30d: 12.3,
  },
  {
    id: '3', symbol: 'ETH', timeframe: '1d', verdict: 'Neutral', verdictScore: 0.08,
    confidence: 55, predictedAt: '2026-09-18T08:00:00Z', priceAtPrediction: 3450,
    actualOutcome: 'correct', priceChange7d: -0.5, priceChange30d: 2.1,
  },
  {
    id: '4', symbol: 'ETH', timeframe: '15m', verdict: 'Sell', verdictScore: -0.35,
    confidence: 63, predictedAt: '2026-09-25T16:00:00Z', priceAtPrediction: 3520,
    actualOutcome: 'incorrect', priceChange7d: 2.8, priceChange30d: -1.2,
  },
  {
    id: '5', symbol: 'BTC', timeframe: '1d', verdict: 'Strong Sell', verdictScore: -0.68,
    confidence: 81, predictedAt: '2026-09-10T12:00:00Z', priceAtPrediction: 68500,
    actualOutcome: 'correct', priceChange7d: -4.2, priceChange30d: -6.8,
  },
  {
    id: '6', symbol: 'GOLD', timeframe: '4h', verdict: 'Buy', verdictScore: 0.38,
    confidence: 67, predictedAt: '2026-09-22T09:00:00Z', priceAtPrediction: 2620,
    actualOutcome: 'correct', priceChange7d: 1.5, priceChange30d: 4.2,
  },
  {
    id: '7', symbol: 'SILVER', timeframe: '1h', verdict: 'Neutral', verdictScore: -0.05,
    confidence: 48, predictedAt: '2026-09-24T11:00:00Z', priceAtPrediction: 31.2,
    actualOutcome: 'pending', priceChange7d: 0.3, priceChange30d: 0,
  },
  {
    id: '8', symbol: 'WTI', timeframe: '1d', verdict: 'Sell', verdictScore: -0.42,
    confidence: 70, predictedAt: '2026-09-12T15:00:00Z', priceAtPrediction: 74.5,
    actualOutcome: 'correct', priceChange7d: -3.1, priceChange30d: -5.5,
  },
  {
    id: '9', symbol: 'BTC', timeframe: '15m', verdict: 'Buy', verdictScore: 0.55,
    confidence: 78, predictedAt: '2026-09-26T18:00:00Z', priceAtPrediction: 67100,
    actualOutcome: 'pending', priceChange7d: 0, priceChange30d: 0,
  },
  {
    id: '10', symbol: 'ETH', timeframe: '4h', verdict: 'Buy', verdictScore: 0.32,
    confidence: 64, predictedAt: '2026-09-21T13:00:00Z', priceAtPrediction: 3480,
    actualOutcome: 'correct', priceChange7d: 2.1, priceChange30d: 5.8,
  },
];

export const dynamic = 'force-dynamic';

export default function TrackRecordPage() {
  const router = useRouter();
  const [records] = useState<TrackRecordEntry[]>(SIMULATED_RECORDS);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');

  const filtered = filter === 'all' ? records : records.filter((r) => r.actualOutcome === filter);

  const correctCount = records.filter((r) => r.actualOutcome === 'correct').length;
  const totalResolved = records.filter((r) => r.actualOutcome !== 'pending').length;
  const accuracy = totalResolved > 0 ? Math.round((correctCount / totalResolved) * 100) : 0;

  return (
    <div className="track-record-page">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">◆</span>
            <span className="logo-text">GnC Signal</span>
          </div>
          <SearchDropdown />
          <nav className="main-nav">
            <a href="/" className="nav-link">Dashboard</a>
            <a href="/track-record" className="nav-link active">Track Record</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
        </div>
      </header>

      <main className="track-record-main">
        <h1 className="page-title">Track Record</h1>
        <p className="page-subtitle">Past predictions vs. actual market outcomes</p>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{correctCount}/{totalResolved}</span>
            <span className="stat-label">Correct / Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{records.filter((r) => r.actualOutcome === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="filter-row">
          {(['all', 'correct', 'incorrect', 'pending'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="records-table">
          <div className="table-header">
            <span>Asset</span>
            <span>Timeframe</span>
            <span>Verdict</span>
            <span>Confidence</span>
            <span>Price @ Pred</span>
            <span>7d Change</span>
            <span>30d Change</span>
            <span>Outcome</span>
          </div>
          {filtered.map((r) => (
            <div key={r.id} className="table-row">
              <span className="cell-symbol">{r.symbol}</span>
              <span className="cell-timeframe">{r.timeframe}</span>
              <span className={`cell-verdict ${r.verdictScore > 0 ? 'positive' : r.verdictScore < 0 ? 'negative' : ''}`}>
                {r.verdict}
              </span>
              <span className="cell-confidence">{r.confidence}%</span>
              <span className="cell-price">${r.priceAtPrediction.toLocaleString()}</span>
              <span className={`cell-change ${r.priceChange7d >= 0 ? 'positive' : 'negative'}`}>
                {r.priceChange7d >= 0 ? '+' : ''}{r.priceChange7d.toFixed(1)}%
              </span>
              <span className={`cell-change ${r.priceChange30d >= 0 ? 'positive' : 'negative'}`}>
                {r.priceChange30d >= 0 ? '+' : ''}{r.priceChange30d.toFixed(1)}%
              </span>
              <span className={`cell-outcome outcome-${r.actualOutcome}`}>
                {r.actualOutcome === 'correct' ? '✓' : r.actualOutcome === 'incorrect' ? '✗' : '…'}
              </span>
            </div>
          ))}
        </div>

        <div className="track-record-note">
          <p>
            <strong>Note:</strong> This is a demonstration with simulated track record data.
            In a production system, predictions would be stored in a database and automatically
            evaluated against actual price movements at predefined intervals.
          </p>
        </div>
      </main>
    </div>
  );
}
