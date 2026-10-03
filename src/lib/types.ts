// ─── Core Types ───────────────────────────────────────────────

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export type VerdictLabel =
  | 'Strong Sell'
  | 'Sell'
  | 'Neutral'
  | 'Buy'
  | 'Strong Buy';

export interface FactorScore {
  name: string;
  score: number;       // -1 (bearish) to +1 (bullish)
  weight: number;      // 0–1, importance for this timeframe
  weightedScore: number; // score * weight
  description: string;
}

export interface TradeTarget { label: string; price: number; rr: number; }

export interface TradePlan {
  side: 'long' | 'short';
  entryLow: number;
  entryHigh: number;
  stop: number;
  targets: TradeTarget[];
  riskPct: number;
  note: string;
}

export interface Prediction {
  symbol: string;
  timeframe: Timeframe;
  verdict: VerdictLabel;
  verdictScore: number;    // -1 to +1
  confidence: number;      // 0–100%
  factors: FactorScore[];
  topFactors: FactorScore[];
  currentPrice: number;
  priceChange24h: number;
  timestamp: number;
  tradePlan: TradePlan | null;
}

export interface AssetInfo {
  symbol: string;        // e.g. "BTC"
  pair: string;          // e.g. "BTCUSDT"
  name: string;
  category: 'crypto' | 'commodity' | 'index';
  icon: string;          // emoji or icon key
}

export interface TickerData {
  symbol: string;
  price: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
  takerBuyBase: number;
  takerBuyQuote: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

export interface FuturesData {
  openInterest: number;
  longShortRatio: number;
  takerBuySellRatio: number;
  fundingRate: number;
  liquidationLong24h: number;
  liquidationShort24h: number;
}

export interface SearchResult {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}
