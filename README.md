# GnC Signal — Market Prediction Dashboard

AI-powered price prediction dashboard for BTC, ETH, Gold, Silver, and WTI across 4 timeframes (15m, 1h, 4h, 1d+).

## Features

- **Multi-factor prediction engine** — 9 factors scored from -1 (bearish) to +1 (bullish)
- **Timeframe-weighted analysis** — Different factors weighted differently per timeframe
- **Confidence scoring** — Based on factor agreement
- **Search any Binance coin** — Dropdown search with instant predictions
- **Track record page** — Past predictions vs. actual outcomes
- **Real-time data** — Binance public API + alternative.me Fear & Greed
- **Auto-refresh** — Updates every 60 seconds

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Vercel** deployment-ready
- No database required (API routes fetch live data)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A GitHub account
- A Vercel account (free)

### Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

### Option 1: Git Integration (Recommended)

1. **Push this project to your GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

3. Click **"Add New Project"** → select your repository

4. Vercel auto-detects Next.js — just click **"Deploy"**

5. Your site is live at `https://YOUR_PROJECT.vercel.app`

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to deploy.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home dashboard
│   ├── globals.css             # Global styles (dark theme)
│   ├── asset/[symbol]/page.tsx # Per-asset detail page
│   ├── track-record/page.tsx   # Track record page
│   ├── about/page.tsx          # About & disclaimer
│   └── api/
│       ├── predictions/route.ts    # Main prediction API
│       ├── fear-greed/route.ts     # Fear & Greed index
│       └── binance/search/route.ts # Coin search
├── components/
│   ├── Dashboard.tsx           # Main dashboard
│   ├── PredictionCard.tsx      # Prediction card
│   ├── FactorBreakdown.tsx     # Factor scores detail
│   ├── SearchDropdown.tsx      # Binance coin search
│   ├── VerdictBadge.tsx        # Verdict display
│   ├── ConfidenceMeter.tsx     # Confidence bar
│   ├── TimeframeTabs.tsx       # Timeframe selector
│   └── PriceChart.tsx          # SVG price chart
└── lib/
    ├── types.ts                # TypeScript types
    ├── factors.ts              # Factor scoring functions
    ├── weights.ts              # Timeframe weight config
    ├── binance.ts              # Binance API client
    ├── prediction.ts           # Prediction engine
    └── commodities.ts          # Commodity data (Gold/Silver/WTI)
```

## How Predictions Work

1. **Data Collection** — Fetches klines, futures data, and Fear & Greed from APIs
2. **Factor Scoring** — Each of 9 factors scored from -1 to +1
3. **Weighting** — Factors weighted differently per timeframe (e.g., taker flow = 30% for 15m, macro = 25% for 1d+)
4. **Verdict** — Weighted average → Strong Sell / Sell / Neutral / Buy / Strong Buy
5. **Confidence** — Based on how many factors agree with the verdict direction

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/predictions?symbol=BTCUSDT&timeframe=1h` | Get prediction for a symbol |
| `GET /api/fear-greed` | Get Fear & Greed index |
| `GET /api/binance/search?q=bit` | Search Binance trading pairs |

## Disclaimer

This project is for **educational and informational purposes only**. It does not constitute financial advice. Cryptocurrency trading involves substantial risk. Always do your own research.
