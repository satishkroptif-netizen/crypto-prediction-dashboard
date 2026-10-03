const API_BASE = 'https://crypto-prediction-dashboard.vercel.app/api';

export interface Prediction {
  symbol: string;
  timeframe: string;
  verdict: string;
  verdictScore: number;
  confidence: number;
  factors: FactorScore[];
  topFactors: FactorScore[];
  currentPrice: number;
  priceChange24h: number;
  timestamp: number;
}

export interface FactorScore {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  description: string;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

export interface AssetData {
  prediction: Prediction;
  ticker: any;
  fearGreed: FearGreedData | null;
}

export interface SearchResult {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export const DEFAULT_ASSETS = [
  { symbol: 'BTC', pair: 'BTCUSDT', name: 'Bitcoin', category: 'crypto', icon: '₿' },
  { symbol: 'ETH', pair: 'ETHUSDT', name: 'Ethereum', category: 'crypto', icon: 'Ξ' },
  { symbol: 'GOLD', pair: 'XAUUSDT', name: 'Gold', category: 'commodity', icon: '🥇' },
  { symbol: 'SILVER', pair: 'XAGUSDT', name: 'Silver', category: 'commodity', icon: '🥈' },
  { symbol: 'WTI', pair: 'WTIUSDT', name: 'WTI Crude Oil', category: 'commodity', icon: '🛢️' },
];

// Map display symbols to API pairs
export function getApiPair(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper === 'GOLD' || upper === 'XAU') return 'XAUUSDT';
  if (upper === 'SILVER' || upper === 'XAG') return 'XAGUSDT';
  if (upper === 'WTI' || upper === 'CRUDEOIL') return 'WTIUSDT';
  return `${upper}USDT`;
}

// Popular symbols for search (curated list)
export const POPULAR_SYMBOLS: SearchResult[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
  { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT' },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT' },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT' },
  { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT' },
  { symbol: 'XLMUSDT', baseAsset: 'XLM', quoteAsset: 'USDT' },
  { symbol: 'ALGOUSDT', baseAsset: 'ALGO', quoteAsset: 'USDT' },
  { symbol: 'VETUSDT', baseAsset: 'VET', quoteAsset: 'USDT' },
  { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT' },
  { symbol: 'ICPUSDT', baseAsset: 'ICP', quoteAsset: 'USDT' },
  { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT' },
  { symbol: 'XMRUSDT', baseAsset: 'XMR', quoteAsset: 'USDT' },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT' },
  { symbol: 'XTZUSDT', baseAsset: 'XTZ', quoteAsset: 'USDT' },
  { symbol: 'AAVEUSDT', baseAsset: 'AAVE', quoteAsset: 'USDT' },
  { symbol: 'EGLDUSDT', baseAsset: 'EGLD', quoteAsset: 'USDT' },
  { symbol: 'THETAUSDT', baseAsset: 'THETA', quoteAsset: 'USDT' },
  { symbol: 'FTMUSDT', baseAsset: 'FTM', quoteAsset: 'USDT' },
  { symbol: 'HBARUSDT', baseAsset: 'HBAR', quoteAsset: 'USDT' },
  { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT' },
  { symbol: 'APEUSDT', baseAsset: 'APE', quoteAsset: 'USDT' },
  { symbol: 'SANDUSDT', baseAsset: 'SAND', quoteAsset: 'USDT' },
  { symbol: 'MANAUSDT', baseAsset: 'MANA', quoteAsset: 'USDT' },
  { symbol: 'AXSUSDT', baseAsset: 'AXS', quoteAsset: 'USDT' },
  { symbol: 'GALAUSDT', baseAsset: 'GALA', quoteAsset: 'USDT' },
  { symbol: 'CHZUSDT', baseAsset: 'CHZ', quoteAsset: 'USDT' },
  { symbol: 'EOSUSDT', baseAsset: 'EOS', quoteAsset: 'USDT' },
  { symbol: 'KLAYUSDT', baseAsset: 'KLAY', quoteAsset: 'USDT' },
  { symbol: 'FLOWUSDT', baseAsset: 'FLOW', quoteAsset: 'USDT' },
  { symbol: 'ZECUSDT', baseAsset: 'ZEC', quoteAsset: 'USDT' },
  { symbol: 'WAVESUSDT', baseAsset: 'WAVES', quoteAsset: 'USDT' },
  { symbol: 'MKRUSDT', baseAsset: 'MKR', quoteAsset: 'USDT' },
  { symbol: 'COMPUSDT', baseAsset: 'COMP', quoteAsset: 'USDT' },
  { symbol: 'SNXUSDT', baseAsset: 'SNX', quoteAsset: 'USDT' },
  { symbol: 'YFIUSDT', baseAsset: 'YFI', quoteAsset: 'USDT' },
  { symbol: 'SUSHIUSDT', baseAsset: 'SUSHI', quoteAsset: 'USDT' },
  { symbol: '1INCHUSDT', baseAsset: '1INCH', quoteAsset: 'USDT' },
  { symbol: 'CRVUSDT', baseAsset: 'CRV', quoteAsset: 'USDT' },
  { symbol: 'ENJUSDT', baseAsset: 'ENJ', quoteAsset: 'USDT' },
  { symbol: 'BATUSDT', baseAsset: 'BAT', quoteAsset: 'USDT' },
  { symbol: 'ZILUSDT', baseAsset: 'ZIL', quoteAsset: 'USDT' },
  { symbol: 'IOTAUSDT', baseAsset: 'IOTA', quoteAsset: 'USDT' },
  { symbol: 'NEOUSDT', baseAsset: 'NEO', quoteAsset: 'USDT' },
  { symbol: 'KSMUSDT', baseAsset: 'KSM', quoteAsset: 'USDT' },
  { symbol: 'DASHUSDT', baseAsset: 'DASH', quoteAsset: 'USDT' },
  { symbol: 'WOOUSDT', baseAsset: 'WOO', quoteAsset: 'USDT' },
  { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT' },
  { symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT' },
  { symbol: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT' },
  { symbol: 'PEPEUSDT', baseAsset: 'PEPE', quoteAsset: 'USDT' },
  { symbol: 'SHIBUSDT', baseAsset: 'SHIB', quoteAsset: 'USDT' },
  { symbol: 'BONKUSDT', baseAsset: 'BONK', quoteAsset: 'USDT' },
  { symbol: 'FLOKIUSDT', baseAsset: 'FLOKI', quoteAsset: 'USDT' },
  { symbol: 'WIFUSDT', baseAsset: 'WIF', quoteAsset: 'USDT' },
  { symbol: 'TIAUSDT', baseAsset: 'TIA', quoteAsset: 'USDT' },
  { symbol: 'SEIUSDT', baseAsset: 'SEI', quoteAsset: 'USDT' },
  { symbol: 'PYTHUSDT', baseAsset: 'PYTH', quoteAsset: 'USDT' },
  { symbol: 'JUPUSDT', baseAsset: 'JUP', quoteAsset: 'USDT' },
  { symbol: 'ORDIUSDT', baseAsset: 'ORDI', quoteAsset: 'USDT' },
  { symbol: 'STXUSDT', baseAsset: 'STX', quoteAsset: 'USDT' },
  { symbol: 'INJUSDT', baseAsset: 'INJ', quoteAsset: 'USDT' },
  { symbol: 'FETUSDT', baseAsset: 'FET', quoteAsset: 'USDT' },
  { symbol: 'RENDERUSDT', baseAsset: 'RENDER', quoteAsset: 'USDT' },
  { symbol: 'GRTUSDT', baseAsset: 'GRT', quoteAsset: 'USDT' },
  { symbol: 'IMXUSDT', baseAsset: 'IMX', quoteAsset: 'USDT' },
  { symbol: 'STORJUSDT', baseAsset: 'STORJ', quoteAsset: 'USDT' },
  { symbol: 'LDOUSDT', baseAsset: 'LDO', quoteAsset: 'USDT' },
  { symbol: 'RNDRUSDT', baseAsset: 'RNDR', quoteAsset: 'USDT' },
];

// Local search using curated list (no API call needed)
export function searchSymbolsLocal(query: string): SearchResult[] {
  const q = query.toUpperCase();
  return POPULAR_SYMBOLS
    .filter(s => s.symbol.includes(q) || s.baseAsset.includes(q))
    .slice(0, 20);
}

export async function fetchPrediction(symbol: string, timeframe: string): Promise<AssetData> {
  const res = await fetch(`${API_BASE}/predictions?symbol=${symbol}&timeframe=${timeframe}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to load prediction (${res.status})`);
  }
  return res.json();
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/binance/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.results || [];
}

export async function fetchFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch(`${API_BASE}/fear-greed`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
