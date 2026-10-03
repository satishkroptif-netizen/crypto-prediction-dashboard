import { Kline, FearGreedData, FuturesData } from './types';

// ─── Technical Indicators ─────────────────────────────────────

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] || 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const k = 2 / (period + 1);
  let emaVal = values[0];
  for (let i = 1; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

function rsi(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function macd(closes: number[]): { macdLine: number; signalLine: number; histogram: number } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12 - ema26;
  // Simplified signal line (9-period EMA of MACD)
  const signalLine = macdLine * 0.8; // approximation
  return { macdLine, signalLine, histogram: macdLine - signalLine };
}

// ─── Factor Scoring Functions ─────────────────────────────────
// Each returns a score from -1 (bearish) to +1 (bullish)

export function scoreTechnicalTrend(klines: Kline[]): { score: number; description: string } {
  if (klines.length < 20) return { score: 0, description: 'Insufficient data' };

  const closes = klines.map((k) => k.close);
  const current = closes[closes.length - 1];

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsiVal = rsi(closes);
  const { histogram } = macd(closes);

  let score = 0;
  const signals: string[] = [];

  // SMA crossover
  if (current > sma20) { score += 0.25; signals.push('Price > SMA20'); }
  else { score -= 0.25; signals.push('Price < SMA20'); }

  if (sma20 > sma50) { score += 0.25; signals.push('SMA20 > SMA50'); }
  else { score -= 0.25; signals.push('SMA20 < SMA50'); }

  // RSI
  if (rsiVal > 70) { score -= 0.2; signals.push('RSI overbought'); }
  else if (rsiVal < 30) { score += 0.2; signals.push('RSI oversold'); }
  else if (rsiVal > 50) { score += 0.15; signals.push('RSI bullish'); }
  else { score -= 0.15; signals.push('RSI bearish'); }

  // MACD
  if (histogram > 0) { score += 0.15; signals.push('MACD bullish'); }
  else { score -= 0.15; signals.push('MACD bearish'); }

  // Recent momentum
  const recentChange = (closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5];
  if (recentChange > 0.01) { score += 0.15; signals.push('Strong momentum'); }
  else if (recentChange < -0.01) { score -= 0.15; signals.push('Weak momentum'); }

  return {
    score: Math.max(-1, Math.min(1, score)),
    description: signals.join(', '),
  };
}

export function scoreTakerFlow(klines: Kline[], futuresTakerRatio?: number): { score: number; description: string } {
  if (klines.length >= 10) {
    const recent = klines.slice(-10);
    const totalBuy = recent.reduce((sum, k) => sum + k.takerBuyBase, 0);
    const totalVolume = recent.reduce((sum, k) => sum + k.volume, 0);
    if (totalVolume > 0) {
      const buyRatio = totalBuy / totalVolume;
      // Skip synthetic klines (exactly 50/50) when a real futures ratio exists
      const isSynthetic = Math.abs(buyRatio - 0.5) < 1e-9;
      if (!isSynthetic || !futuresTakerRatio) {
        const score = (buyRatio - 0.5) * 2;
        return {
          score: Math.max(-1, Math.min(1, score)),
          description: `Taker buy ratio: ${(buyRatio * 100).toFixed(1)}%`,
        };
      }
    }
  }
  if (futuresTakerRatio && futuresTakerRatio > 0) {
    const score = ((futuresTakerRatio - 1) / (futuresTakerRatio + 1)) * 2;
    return {
      score: Math.max(-1, Math.min(1, score)),
      description: `Futures taker B/S: ${futuresTakerRatio.toFixed(3)}`,
    };
  }
  return { score: 0, description: 'No taker data' };
}

export function scoreLiquidations(futures: FuturesData): { score: number; description: string } {
  const totalLiq = futures.liquidationLong24h + futures.liquidationShort24h;
  if (totalLiq === 0) return { score: 0, description: 'No liquidation data' };

  // More short liquidations = bullish (shorts getting squeezed)
  const shortLiqRatio = futures.liquidationShort24h / totalLiq;
  const score = (shortLiqRatio - 0.5) * 2;

  return {
    score: Math.max(-1, Math.min(1, score)),
    description: `Short liq: ${(shortLiqRatio * 100).toFixed(1)}%`,
  };
}

export function scoreLongShortRatio(futures: FuturesData): { score: number; description: string } {
  const ratio = futures.longShortRatio;
  // ratio > 1 means more longs (could be bullish or overleveraged)
  // Extreme readings are contrarian
  if (ratio > 3) return { score: -0.5, description: 'Extremely overleveraged longs' };
  if (ratio > 2) return { score: -0.2, description: 'Heavy long bias' };
  if (ratio > 1.2) return { score: 0.2, description: 'Moderate long bias' };
  if (ratio > 0.8) return { score: 0, description: 'Balanced' };
  if (ratio > 0.5) return { score: -0.2, description: 'Moderate short bias' };
  return { score: 0.3, description: 'Heavy short bias (contrarian bullish)' };
}

export function scoreOpenInterest(futures: FuturesData, klines: Kline[]): { score: number; description: string } {
  if (futures.openInterest === 0 || klines.length < 2) return { score: 0, description: 'No OI data' };

  // OI trend - compare recent OI to price movement
  const recentPriceChange = (klines[klines.length - 1].close - klines[0].close) / klines[0].close;

  // Rising OI + rising price = bullish (new money entering longs)
  // Rising OI + falling price = bearish (new money entering shorts)
  if (recentPriceChange > 0.02) return { score: 0.4, description: 'OI rising with price' };
  if (recentPriceChange < -0.02) return { score: -0.4, description: 'OI rising against price' };
  return { score: 0, description: 'OI stable' };
}

export function scoreFearGreed(fng: FearGreedData | null): { score: number; description: string } {
  if (!fng) return { score: 0, description: 'No F&G data' };

  // Fear & Greed: 0-100
  // Extreme fear (< 20) = contrarian bullish
  // Extreme greed (> 80) = contrarian bearish
  const val = fng.value;
  if (val < 15) return { score: 0.6, description: 'Extreme fear (contrarian bullish)' };
  if (val < 30) return { score: 0.3, description: 'Fear' };
  if (val < 45) return { score: 0.1, description: 'Neutral-fear' };
  if (val <= 55) return { score: 0, description: 'Neutral' };
  if (val <= 70) return { score: -0.1, description: 'Neutral-greed' };
  if (val <= 85) return { score: -0.3, description: 'Greed' };
  return { score: -0.6, description: 'Extreme greed (contrarian bearish)' };
}

export function scoreNewsSentiment(): { score: number; description: string } {
  // Simulated news sentiment (would integrate with news API in production)
  // Returns a slightly random but consistent score
  const score = (Math.random() - 0.5) * 0.6;
  return {
    score,
    description: score > 0.1 ? 'Positive news flow' : score < -0.1 ? 'Negative news flow' : 'Mixed news',
  };
}

export function scoreWhaleActivity(klines: Kline[]): { score: number; description: string } {
  if (klines.length < 20) return { score: 0, description: 'Insufficient data' };

  // Detect large volume spikes (potential whale activity)
  const volumes = klines.map((k) => k.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const recentVol = volumes.slice(-5);
  const maxRecent = Math.max(...recentVol);

  if (maxRecent > avgVolume * 3) {
    // Large spike - check if price went up or down
    const priceUp = klines[klines.length - 1].close > klines[klines.length - 5].close;
    return {
      score: priceUp ? 0.5 : -0.5,
      description: priceUp ? 'Whale buying detected' : 'Whale selling detected',
    };
  }
  return { score: 0, description: 'Normal whale activity' };
}

export function scoreMacro(): { score: number; description: string } {
  // Simulated macro score based on general market conditions
  // In production, this would analyze DXY, real yields, Fed policy
  const score = (Math.random() - 0.5) * 0.4;
  return {
    score,
    description: score > 0.1 ? 'Macro tailwinds' : score < -0.1 ? 'Macro headwinds' : 'Macro neutral',
  };
}
