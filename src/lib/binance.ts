import { TickerData, Kline, FuturesData, SearchResult } from './types';

const BINANCE_API = 'https://api.binance.com';
const BINANCE_FUTURES_API = 'https://fapi.binance.com';

// ─── Spot Ticker ──────────────────────────────────────────────

export async function fetchTicker(symbol: string): Promise<TickerData> {
  const res = await fetch(
    `${BINANCE_API}/api/v3/ticker/24hr?symbol=${symbol}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Binance ticker error: ${res.status}`);
  const data = await res.json();
  return {
    symbol: data.symbol,
    price: parseFloat(data.lastPrice),
    priceChange24h: parseFloat(data.priceChangePercent),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
    volume24h: parseFloat(data.volume),
  };
}

// ─── Klines (Candlestick Data) ────────────────────────────────

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<Kline[]> {
  const res = await fetch(
    `${BINANCE_API}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Binance klines error: ${res.status}`);
  const data = await res.json();
  return data.map((k: any[]) => ({
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: k[6],
    quoteVolume: parseFloat(k[7]),
    trades: k[8],
    takerBuyBase: parseFloat(k[9]),
    takerBuyQuote: parseFloat(k[10]),
  }));
}

// ─── Futures Data ─────────────────────────────────────────────

export async function fetchFuturesData(symbol: string): Promise<FuturesData> {
  try {
    const [oiRes, lsRes, takerRes, fundingRes] = await Promise.all([
      fetch(`${BINANCE_FUTURES_API}/fapi/v1/openInterest?symbol=${symbol}`, { next: { revalidate: 30 } }),
      fetch(`${BINANCE_FUTURES_API}/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=1d&limit=1`, { next: { revalidate: 30 } }),
      fetch(`${BINANCE_FUTURES_API}/futures/data/takerlongshortRatio?symbol=${symbol}&period=1d&limit=1`, { next: { revalidate: 30 } }),
      fetch(`${BINANCE_FUTURES_API}/fapi/v1/premiumIndex?symbol=${symbol}`, { next: { revalidate: 30 } }),
    ]);

    const oi = oiRes.ok ? await oiRes.json() : { openInterest: '0' };
    const ls = lsRes.ok ? await lsRes.json() : [{ longShortRatio: '1' }];
    const taker = takerRes.ok ? await takerRes.json() : [{ buySellRatio: '1' }];
    const funding = fundingRes.ok ? await fundingRes.json() : { lastFundingRate: '0' };

    return {
      openInterest: parseFloat(oi.openInterest || '0'),
      longShortRatio: parseFloat(ls[0]?.longShortRatio || '1'),
      takerBuySellRatio: parseFloat(taker[0]?.buySellRatio || '1'),
      fundingRate: parseFloat(funding.lastFundingRate || '0'),
      liquidationLong24h: 0,
      liquidationShort24h: 0,
    };
  } catch {
    return {
      openInterest: 0,
      longShortRatio: 1,
      takerBuySellRatio: 1,
      fundingRate: 0,
      liquidationLong24h: 0,
      liquidationShort24h: 0,
    };
  }
}

// ─── Search (Curated Popular Pairs) ───────────────────────────

const POPULAR_SYMBOLS: SearchResult[] = [
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
  { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT' },
  { symbol: 'RNDRUSDT', baseAsset: 'RNDR', quoteAsset: 'USDT' },
];

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.toUpperCase();
  return POPULAR_SYMBOLS
    .filter(
      (s) =>
        s.symbol.includes(q) ||
        s.baseAsset.includes(q)
    )
    .slice(0, 20);
}

export async function fetchAllSymbols(): Promise<SearchResult[]> {
  return POPULAR_SYMBOLS;
}
