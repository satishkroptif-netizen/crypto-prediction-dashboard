'use client';

import { Prediction } from '@/lib/types';
import VerdictBadge from './VerdictBadge';
import ConfidenceMeter from './ConfidenceMeter';
import Link from 'next/link';

interface PredictionCardProps {
  prediction: Prediction;
  assetName?: string;
  assetIcon?: string;
}

export default function PredictionCard({ prediction, assetName, assetIcon }: PredictionCardProps) {
  const isPositive = prediction.verdictScore > 0.1;
  const isNegative = prediction.verdictScore < -0.1;

  return (
    <Link href={`/asset/${prediction.symbol}?timeframe=${prediction.timeframe}`} className="prediction-card-link">
      <div className={`prediction-card ${isPositive ? 'card-positive' : isNegative ? 'card-negative' : 'card-neutral'}`}>
        <div className="card-header">
          <div className="card-asset">
            {assetIcon && <span className="card-icon">{assetIcon}</span>}
            <span className="card-symbol">{prediction.symbol}</span>
            {assetName && <span className="card-name">{assetName}</span>}
          </div>
          <span className="card-timeframe">{prediction.timeframe}</span>
        </div>

        <div className="card-price">
          <span className="price-value">${prediction.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className={`price-change ${prediction.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
            {prediction.priceChange24h >= 0 ? '+' : ''}{prediction.priceChange24h.toFixed(2)}%
          </span>
        </div>

        <div className="card-verdict">
          <VerdictBadge verdict={prediction.verdict} />
        </div>

        <ConfidenceMeter confidence={prediction.confidence} />

        <div className="card-top-factors">
          <div className="factors-title">Top Factors</div>
          {prediction.topFactors.map((factor, i) => (
            <div key={i} className="factor-row">
              <span className="factor-name">{factor.name}</span>
              <span className={`factor-score ${factor.score > 0 ? 'positive' : factor.score < 0 ? 'negative' : ''}`}>
                {factor.score > 0 ? '+' : ''}{factor.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
