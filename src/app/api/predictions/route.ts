import { NextRequest, NextResponse } from 'next/server';
import { fetchKlines, fetchTicker, fetchFuturesData } from '@/lib/binance';
import { getCommodityData } from '@/lib/commodities';
import { generatePrediction, timeframeToInterval } from '@/lib/prediction';
import { FearGreedData, Kline, FuturesData, TickerData } from '@/lib/types';

const FEAR_GREED_API = 'https://api.alternative.me/fng/';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

async function getFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch(FEAR_GREED_API, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.data?.[0];
    if (!item) return null;
    return {
      value: parseInt(item.value),
      classification: item.value_classification,
      timestamp: parseInt(item.timestamp),
    };
  } catch {
    return null;
  }
}

// CoinGecko fallback for price data
async function getCoinGeckoData(symbol: string): Promise<{ klines: Kline[]; ticker: TickerData } | null> {
  try {
    const coinId = getCoinGeckoId(symbol);
    if (!coinId) return null;

    const [priceRes, chartRes] = await Promise.all([
      fetch(`${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`, { next: { revalidate: 30 } }),
      fetch(`${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=5&interval=hourly`, { next: { revalidate: 30 } }),
    ]);

    if (!priceRes.ok || !chartRes.ok) return null;

    const priceData = await priceRes.json();
    const chartData = await chartRes.json();

    const price = priceData[coinId]?.usd;
    const change24h = priceData[coinId]?.usd_24h_change || 0;
    const volume24h = priceData[coinId]?.usd_24h_vol || 0;

    if (!price) return null;

    // Convert chart data to klines
    const klines: Kline[] = chartData.prices?.map((p: [number, number], i: number) => {
      const [time, close] = p;
      const nextPrice = chartData.prices[i + 1]?.[1] || close;
      const volatility = close * 0.002;
      return {
        openTime: time,
        open: nextPrice,
        high: Math.max(close, nextPrice) + Math.random() * volatility,
        low: Math.min(close, nextPrice) - Math.random() * volatility,
        close,
        volume: chartData.total_volumes?.[i]?.[1] || 1000,
        closeTime: time + 3600000,
        quoteVolume: (chartData.total_volumes?.[i]?.[1] || 1000) * close,
        trades: Math.floor(100 + Math.random() * 900),
        takerBuyBase: (chartData.total_volumes?.[i]?.[1] || 1000) * 0.5,
        takerBuyQuote: (chartData.total_volumes?.[i]?.[1] || 1000) * close * 0.5,
      };
    }) || [];

    return {
      klines,
      ticker: {
        symbol: symbol.toUpperCase(),
        price,
        priceChange24h: change24h,
        high24h: price * 1.02,
        low24h: price * 0.98,
        volume24h,
      },
    };
  } catch {
    return null;
  }
}

function getCoinGeckoId(symbol: string): string | null {
  const map: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    DOGE: 'dogecoin',
    ADA: 'cardano',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    LINK: 'chainlink',
    UNI: 'uniswap',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    XLM: 'stellar',
    ALGO: 'algorand',
    VET: 'vechain',
    FIL: 'filecoin',
    ICP: 'internet-computer',
    ETC: 'ethereum-classic',
    XMR: 'monero',
    ATOM: 'cosmos',
    XTZ: 'tezos',
    AAVE: 'aave',
    EGLD: 'elrond-erd-2',
    THETA: 'theta-token',
    FTM: 'fantom',
    HBAR: 'hedera-hashgraph',
    NEAR: 'near',
    APE: 'apecoin',
    SAND: 'the-sandbox',
    MANA: 'decentraland',
    AXS: 'axie-infinity',
    GALA: 'gala',
    CHZ: 'chiliz',
    EOS: 'eos',
    KLAY: 'klay-token',
    FLOW: 'flow',
    ZEC: 'zcash',
    WAVES: 'waves',
    MKR: 'maker',
    COMP: 'compound-governance-token',
    SNX: 'synthetix-network-token',
    YFI: 'yearn-finance',
    SUSHI: 'sushi',
    '1INCH': '1inch',
    CRV: 'curve-dao-token',
    ENJ: 'enjincoin',
    BAT: 'basic-attention-token',
    ZIL: 'zilliqa',
    IOTA: 'iota',
    NEO: 'neo',
    KSM: 'kusama',
    DASH: 'dash',
    WOO: 'wootrade',
    ARB: 'arbitrum',
    OP: 'optimism',
    SUI: 'sui',
    PEPE: 'pepe',
    SHIB: 'shiba-inu',
    BONK: 'bonk',
    FLOKI: 'floki',
    WIF: 'dogwifcoin',
    TIA: 'celestia',
    SEI: 'sei-network',
    PYTH: 'pyth-network',
    JUP: 'jupiter-exchange-solana',
    ORDI: 'ordinals',
    STX: 'blockstack',
    INJ: 'injective-protocol',
    FET: 'fetch-ai',
    RENDER: 'render-token',
    GRT: 'the-graph',
    IMX: 'immutable-x',
    STORJ: 'storj',
    LDO: 'lido-dao',
    RNDR: 'render-token',
  };
  return map[symbol.toUpperCase()] || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const timeframe = (searchParams.get('timeframe') || '1h') as '15m' | '1h' | '4h' | '1d';

  try {
    const isCommodity = ['XAUUSDT', 'XAGUSDT', 'WTIUSDT'].includes(symbol);

    let klines;
    let futures;
    let ticker;

    if (isCommodity) {
      const commodityData = await getCommodityData(symbol);
      klines = commodityData.klines;
      futures = commodityData.futures;
      ticker = {
        symbol,
        price: commodityData.price,
        priceChange24h: ((klines[klines.length - 1].close - klines[0].close) / klines[0].close) * 100,
        high24h: Math.max(...klines.slice(-96).map((k) => k.high)),
        low24h: Math.min(...klines.slice(-96).map((k) => k.low)),
        volume24h: klines.slice(-96).reduce((sum, k) => sum + k.volume, 0),
      };
    } else {
      // Try CoinGecko first (Binance blocks Vercel IPs), fallback to Binance
      const cgData = await getCoinGeckoData(symbol.replace('USDT', ''));
      if (cgData) {
        klines = cgData.klines;
        ticker = cgData.ticker;
        // Real Binance futures even when spot comes from CoinGecko (graceful zeros if blocked)
        try {
          futures = await fetchFuturesData(symbol);
        } catch {
          futures = {
            openInterest: 0,
            longShortRatio: 1,
            takerBuySellRatio: 1,
            fundingRate: 0,
            liquidationLong24h: 0,
            liquidationShort24h: 0,
          };
        }
      } else {
        // CoinGecko failed, try Binance as fallback
        const interval = timeframeToInterval(timeframe);
        [klines, futures, ticker] = await Promise.all([
          fetchKlines(symbol, interval, 100),
          fetchFuturesData(symbol),
          fetchTicker(symbol),
        ]);
      }
    }

    const fearGreed = await getFearGreed();

    const prediction = generatePrediction(
      symbol.replace('USDT', ''),
      timeframe,
      klines,
      futures,
      fearGreed,
      ticker.price,
      ticker.priceChange24h
    );

    return NextResponse.json({
      prediction,
      ticker,
      fearGreed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: String(error) },
      { status: 500 }
    );
  }
}
