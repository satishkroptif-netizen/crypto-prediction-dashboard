import { Prediction, Timeframe, FactorScore, VerdictLabel, AssetInfo } from './types';
import { TIMEFRAME_WEIGHTS } from './weights';
import {
  scoreTechnicalTrend,
  scoreTakerFlow,
  scoreLiquidations,
  scoreLongShortRatio,
  scoreOpenInterest,
  scoreFearGreed,
  scoreNewsSentiment,
  scoreWhaleActivity,
  scoreMacro,
} from './factors';
import { Kline, FearGreedData, FuturesData } from './types';
import { computeTradePlan } from './levels';

// ─── Verdict Calculation ───────────────────────────────────────

function getVerdict(score: number): VerdictLabel {
  if (score <= -0.6) return 'Strong Sell';
  if (score <= -0.2) return 'Sell';
  if (score < 0.2) return 'Neutral';
  if (score < 0.6) return 'Buy';
  return 'Strong Buy';
}

function calculateConfidence(factors: FactorScore[], verdictScore: number): number {
  if (factors.length === 0) return 50;

  // Count how many factors agree with the verdict direction
  let agreeingWeight = 0;
  let totalWeight = 0;

  for (const factor of factors) {
    totalWeight += factor.weight;
    const factorDirection = factor.score > 0.1 ? 1 : factor.score < -0.1 ? -1 : 0;
    const verdictDirection = verdictScore > 0.1 ? 1 : verdictScore < -0.1 ? -1 : 0;

    if (factorDirection === verdictDirection && factorDirection !== 0) {
      agreeingWeight += factor.weight;
    }
  }

  if (totalWeight === 0) return 50;

  // Base confidence on agreement ratio
  const agreementRatio = agreeingWeight / totalWeight;

  // Also factor in the magnitude of the verdict
  const magnitudeBonus = Math.abs(verdictScore) * 10;

  // Confidence ranges from ~30% to ~95%
  const confidence = Math.round(30 + agreementRatio * 55 + magnitudeBonus);
  return Math.min(95, Math.max(30, confidence));
}

// ─── Main Prediction Engine ───────────────────────────────────

export function generatePrediction(
  symbol: string,
  timeframe: Timeframe,
  klines: Kline[],
  futures: FuturesData,
  fearGreed: FearGreedData | null,
  currentPrice: number,
  priceChange24h: number
): Prediction {
  const weights = TIMEFRAME_WEIGHTS[timeframe];

  // Calculate all factor scores
  const technical = scoreTechnicalTrend(klines);
  const takerFlow = scoreTakerFlow(klines, futures.takerBuySellRatio);
  const liquidations = scoreLiquidations(futures);
  const longShort = scoreLongShortRatio(futures);
  const openInterest = scoreOpenInterest(futures, klines);
  const fearGreedScore = scoreFearGreed(fearGreed);
  const newsSentiment = scoreNewsSentiment();
  const whaleActivity = scoreWhaleActivity(klines);
  const macro = scoreMacro();

  // Build factor array with weights
  const factors: FactorScore[] = [
    {
      name: 'Technical Trend',
      score: technical.score,
      weight: weights.technical || 0,
      weightedScore: technical.score * (weights.technical || 0),
      description: technical.description,
    },
    {
      name: 'Taker Buy/Sell Flow',
      score: takerFlow.score,
      weight: weights.takerFlow || 0,
      weightedScore: takerFlow.score * (weights.takerFlow || 0),
      description: takerFlow.description,
    },
    {
      name: 'Liquidations',
      score: liquidations.score,
      weight: weights.liquidations || 0,
      weightedScore: liquidations.score * (weights.liquidations || 0),
      description: liquidations.description,
    },
    {
      name: 'Long/Short Ratio',
      score: longShort.score,
      weight: weights.longShortRatio || 0,
      weightedScore: longShort.score * (weights.longShortRatio || 0),
      description: longShort.description,
    },
    {
      name: 'Open Interest',
      score: openInterest.score,
      weight: weights.openInterest || 0,
      weightedScore: openInterest.score * (weights.openInterest || 0),
      description: openInterest.description,
    },
    {
      name: 'Fear & Greed',
      score: fearGreedScore.score,
      weight: weights.fearGreed || 0,
      weightedScore: fearGreedScore.score * (weights.fearGreed || 0),
      description: fearGreedScore.description,
    },
    {
      name: 'News Sentiment',
      score: newsSentiment.score,
      weight: weights.newsSentiment || 0,
      weightedScore: newsSentiment.score * (weights.newsSentiment || 0),
      description: newsSentiment.description,
    },
    {
      name: 'Whale Activity',
      score: whaleActivity.score,
      weight: weights.whaleActivity || 0,
      weightedScore: whaleActivity.score * (weights.whaleActivity || 0),
      description: whaleActivity.description,
    },
    {
      name: 'Macro (DXY, Yields, Fed)',
      score: macro.score,
      weight: weights.macro || 0,
      weightedScore: macro.score * (weights.macro || 0),
      description: macro.description,
    },
  ];

  // Calculate weighted verdict score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  const verdictScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  const verdict = getVerdict(verdictScore);
  const confidence = calculateConfidence(factors, verdictScore);
  const tradePlan = computeTradePlan(klines, currentPrice, verdict, timeframe);

  // Top 3 factors by absolute weighted score
  const topFactors = [...factors]
    .sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore))
    .slice(0, 3);

  return {
    symbol,
    timeframe,
    verdict,
    verdictScore,
    confidence,
    factors,
    topFactors,
    currentPrice,
    priceChange24h,
    timestamp: Date.now(),
    tradePlan,
  };
}

// ─── Asset Definitions ────────────────────────────────────────

export const DEFAULT_ASSETS: AssetInfo[] = [
  { symbol: 'BTC', pair: 'BTCUSDT', name: 'Bitcoin', category: 'crypto', icon: '₿' },
  { symbol: 'ETH', pair: 'ETHUSDT', name: 'Ethereum', category: 'crypto', icon: 'Ξ' },
  { symbol: 'GOLD', pair: 'XAUUSDT', name: 'Gold', category: 'commodity', icon: '🥇' },
  { symbol: 'SILVER', pair: 'XAGUSDT', name: 'Silver', category: 'commodity', icon: '🥈' },
  { symbol: 'WTI', pair: 'WTIUSDT', name: 'WTI Crude Oil', category: 'commodity', icon: '🛢️' },
];

// Map timeframe to Binance kline interval
export function timeframeToInterval(timeframe: Timeframe): string {
  switch (timeframe) {
    case '15m': return '15m';
    case '1h': return '1h';
    case '4h': return '4h';
    case '1d': return '1d';
  }
}
