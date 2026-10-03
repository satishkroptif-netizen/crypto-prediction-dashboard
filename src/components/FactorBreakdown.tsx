'use client';

import { Prediction } from '@/lib/types';

interface FactorBreakdownProps {
  prediction: Prediction;
}

export default function FactorBreakdown({ prediction, compact = false }: FactorBreakdownProps & { compact?: boolean }) {
  if (compact) {
    return (
      <div className="factor-compact">
        <div className="card-head"><h3>Factor Breakdown</h3><span className="muted-sm">{prediction.factors.length} factors · weighted score {prediction.verdictScore > 0 ? '+' : ''}{prediction.verdictScore.toFixed(3)}</span></div>
        <div className="fcompact-grid">
          {prediction.factors.map((factor, i) => {
            const isBull = factor.score > 0.05;
            const isBear = factor.score < -0.05;
            return (
              <div key={i} className="fcompact" title={factor.description}>
                <div className="fcompact-top"><span>{factor.name}</span><b className={isBull ? 'positive' : isBear ? 'negative' : ''}>{factor.score > 0 ? '+' : ''}{factor.score.toFixed(2)}</b></div>
                <div className="fcompact-bar"><div className={isBull ? 'fill-bull' : isBear ? 'fill-bear' : 'fill-flat'} style={{ width: `${Math.abs(factor.score) * 100}%` }} /></div>
                <small>{(factor.weight * 100).toFixed(0)}% wt</small>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="factor-breakdown">
      <h3 className="section-title">Factor Breakdown</h3>
      <div className="factors-list">
        {prediction.factors.map((factor, i) => {
          const absScore = Math.abs(factor.score);
          const barWidth = absScore * 100;
          const isBull = factor.score > 0.05;
          const isBear = factor.score < -0.05;

          return (
            <div key={i} className="factor-item">
              <div className="factor-header">
                <div className="factor-info">
                  <span className="factor-label">{factor.name}</span>
                  <span className="factor-desc">{factor.description}</span>
                </div>
                <div className="factor-values">
                  <span className="factor-weight">{(factor.weight * 100).toFixed(0)}% weight</span>
                  <span className={`factor-score-large ${isBull ? 'positive' : isBear ? 'negative' : ''}`}>
                    {factor.score > 0 ? '+' : ''}{factor.score.toFixed(3)}
                  </span>
                </div>
              </div>
              <div className="factor-bar-container">
                <div className="factor-bar-center" />
                {isBull && (
                  <div
                    className="factor-bar factor-bar-bull"
                    style={{ width: `${barWidth}%`, left: '50%' }}
                  />
                )}
                {isBear && (
                  <div
                    className="factor-bar factor-bar-bear"
                    style={{ width: `${barWidth}%`, right: '50%' }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="weighted-verdict-box">
        <div className="weighted-row">
          <span>Weighted Verdict Score</span>
          <span className={`weighted-score ${prediction.verdictScore > 0 ? 'positive' : prediction.verdictScore < 0 ? 'negative' : ''}`}>
            {prediction.verdictScore > 0 ? '+' : ''}{prediction.verdictScore.toFixed(4)}
          </span>
        </div>
        <div className="weighted-row">
          <span>Confidence</span>
          <span className="weighted-confidence">{prediction.confidence}%</span>
        </div>
      </div>
    </div>
  );
}
