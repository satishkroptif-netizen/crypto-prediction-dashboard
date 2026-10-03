# PredictChain Trading Bot

A multi-strategy trading bot for Delta Exchange with paper trading, backtesting, web dashboard, and notifications.

## Features

### Trading Strategies
- **Signal-Based**: Uses RSI, MACD, Bollinger Bands, Stochastic, Volume, and Moving Averages
- **Grid Trading**: Places buy/sell orders at regular intervals within a price range
- **DCA (Dollar-Cost Averaging)**: Buys at regular intervals regardless of price
- **Arbitrage**: Exploits price differences between exchanges

### Risk Management
- Stop loss, take profit, and trailing stops
- Position sizing based on account balance
- Maximum open positions limit
- Per-trade risk percentage

### Paper Trading
- Test strategies without risking real money
- Simulated order execution
- Real-time PnL tracking

### Backtesting
- Test strategies on historical data
- Performance metrics (win rate, Sharpe ratio, max drawdown)
- Multi-asset backtesting

### Web Dashboard
- Real-time monitoring of bot performance
- Open positions and trade history
- Auto-refreshing interface
- REST API endpoints

### Notifications
- Telegram bot notifications
- Discord webhook alerts
- Signal alerts, trade execution, position closure
- Error notifications

### Database
- SQLite storage for trades, signals, and metrics
- Performance tracking over time
- Trade history analysis

## Quick Start

### 1. Install Dependencies

```bash
cd trading-bot
pip install -r requirements.txt
```

### 2. Configure

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DELTA_API_KEY=your_api_key_here
DELTA_API_SECRET=your_api_secret_here

# Optional: Notifications
DISCORD_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 3. Run the Bot

**Paper Trading (default):**
```bash
python main.py
```

**Single strategy run:**
```bash
python main.py --strategy signal    # Signal-based strategy
python main.py --strategy grid      # Grid trading strategy
python main.py --strategy dca       # DCA strategy
python main.py --strategy arbitrage # Arbitrage strategy
```

**Run single cycle (testing):**
```bash
python main.py --once
```

**Run backtest:**
```bash
python main.py --backtest
```

**Start web dashboard:**
```bash
python main.py --dashboard
```

**Start bot + dashboard:**
```bash
python main.py --dashboard --run
```

## Configuration

Edit `config.py` to customize:

### General Settings
| Setting | Description | Default |
|---------|-------------|---------|
| `PAPER_TRADING` | Enable/disable paper trading | `True` |
| `STRATEGY` | Trading strategy | `signal` |
| `TRADING_PAIRS` | List of trading pairs | BTC, ETH, SOL, XRP, DOGE |
| `TIMEFRAME` | Candlestick timeframe | `1h` |

### Risk Management
| Setting | Description | Default |
|---------|-------------|---------|
| `MAX_POSITION_SIZE_PCT` | Max % of balance per position | `10` |
| `STOP_LOSS_PCT` | Stop loss percentage | `2.0` |
| `TAKE_PROFIT_PCT` | Take profit percentage | `4.0` |
| `TRAILING_STOP_PCT` | Trailing stop percentage | `1.5` |
| `MAX_OPEN_POSITIONS` | Max simultaneous positions | `3` |

### Grid Strategy
| Setting | Description | Default |
|---------|-------------|---------|
| `GRID_COUNT` | Number of grid levels | `5` |
| `GRID_SPACING_PCT` | Grid spacing percentage | `1.0` |

### DCA Strategy
| Setting | Description | Default |
|---------|-------------|---------|
| `DCA_TARGET_AMOUNT` | Total USDT to invest | `1000` |
| `DCA_PURCHASE_AMOUNT` | USDT per purchase | `100` |
| `DCA_INTERVAL_HOURS` | Hours between purchases | `24` |

### Arbitrage Strategy
| Setting | Description | Default |
|---------|-------------|---------|
| `ARBITRAGE_MIN_SPREAD` | Minimum spread % | `0.5` |
| `ARBITRAGE_MAX_TRADE` | Max USDT per trade | `1000` |

### Notifications
| Setting | Description | Default |
|---------|-------------|---------|
| `ENABLE_NOTIFICATIONS` | Enable notifications | `False` |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | - |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | - |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | - |

### Dashboard
| Setting | Description | Default |
|---------|-------------|---------|
| `ENABLE_DASHBOARD` | Enable web dashboard | `False` |
| `DASHBOARD_HOST` | Dashboard host | `0.0.0.0` |
| `DASHBOARD_PORT` | Dashboard port | `5000` |

## Project Structure

```
trading-bot/
├── config.py                  # Configuration settings
├── main.py                    # Entry point with CLI
├── bot.py                     # Main bot engine
├── exchange_connector.py      # Delta Exchange API
├── signal_generator.py        # Technical analysis & signals
├── risk_manager.py            # Risk management
├── database.py                # SQLite database
├── notifications.py           # Telegram & Discord alerts
├── backtester.py              # Backtesting engine
├── dashboard.py               # Web dashboard (Flask)
├── strategies/
│   ├── __init__.py
│   ├── grid_strategy.py       # Grid trading strategy
│   ├── dca_strategy.py        # DCA strategy
│   └── arbitrage_strategy.py  # Arbitrage strategy
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
├── .gitignore
└── README.md                  # This file
```

## CLI Arguments

| Argument | Description |
|----------|-------------|
| `--strategy <name>` | Select strategy (signal, grid, dca, arbitrage) |
| `--once` | Run single cycle and exit |
| `--backtest` | Run backtest on all trading pairs |
| `--dashboard` | Start web dashboard only |
| `--dashboard --run` | Start bot + dashboard together |

## API Endpoints

When dashboard is running:

| Endpoint | Description |
|----------|-------------|
| `GET /` | Web dashboard |
| `GET /api/status` | Bot status (JSON) |
| `GET /api/positions` | Open positions (JSON) |
| `GET /api/trades` | Trade history (JSON) |

## How It Works

### Signal Strategy
1. Fetches OHLCV data from Delta Exchange
2. Calculates 9 technical indicators
3. Generates buy/sell signals with strength score
4. Executes trades when signal strength >= 0.5
5. Manages risk with stop loss and take profit

### Grid Strategy
1. Creates a grid of buy/sell orders around current price
2. Buy orders below current price, sell orders above
3. Orders execute as price oscillates
4. Profits from market volatility

### DCA Strategy
1. Invests fixed amount at regular intervals
2. Averages out entry price over time
3. Reduces impact of market timing
4. Suitable for long-term accumulation

### Arbitrage Strategy
1. Monitors prices across multiple exchanges
2. Finds price discrepancies
3. Buys low on one exchange, sells high on another
4. Profits from spread (minus fees)

## Disclaimer

This bot is for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. Past performance is not indicative of future results. Always do your own research before making investment decisions.
