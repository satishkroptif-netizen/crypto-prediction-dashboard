"""
Trading Bot Configuration
Edit these settings to customize your bot's behavior.
"""

import os

# ─── Exchange Settings ──────────────────────────────────────────
EXCHANGE = "delta"  # Delta Exchange
API_KEY = os.getenv("DELTA_API_KEY", "")
API_SECRET = os.getenv("DELTA_API_SECRET", "")

# ─── Trading Mode ───────────────────────────────────────────────
PAPER_TRADING = True  # Set to False for live trading
PAPER_BALANCE = 10000  # Starting paper balance in USDT

# ─── Strategy Settings ──────────────────────────────────────────
STRATEGY = "signal"  # Options: 'signal', 'grid', 'dca', 'arbitrage'

# ─── Assets to Trade ────────────────────────────────────────────
TRADING_PAIRS = [
    "BTC_USDT",
    "ETH_USDT",
    "SOL_USDT",
    "XRP_USDT",
    "DOGE_USDT",
]

# ─── Timeframe ──────────────────────────────────────────────────
TIMEFRAME = "1h"  # 1m, 5m, 15m, 1h, 4h, 1d

# ─── Risk Management ────────────────────────────────────────────
MAX_POSITION_SIZE_PCT = 10  # Max % of balance per position
STOP_LOSS_PCT = 2.0  # Stop loss percentage
TAKE_PROFIT_PCT = 4.0  # Take profit percentage
MAX_OPEN_POSITIONS = 3  # Max simultaneous open positions
TRAILING_STOP_PCT = 1.5  # Trailing stop percentage

# ─── Signal Settings ────────────────────────────────────────────
RSI_PERIOD = 14
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
BOLLINGER_PERIOD = 20
BOLLINGER_STD = 2
VOLUME_MA_PERIOD = 20

# ─── Grid Strategy Settings ─────────────────────────────────────
GRID_COUNT = 5  # Number of grid levels
GRID_SPACING_PCT = 1.0  # Grid spacing in percentage

# ─── DCA Strategy Settings ──────────────────────────────────────
DCA_TARGET_AMOUNT = 1000  # Total USDT to invest
DCA_PURCHASE_AMOUNT = 100  # USDT per purchase
DCA_INTERVAL_HOURS = 24  # Hours between purchases

# ─── Arbitrage Strategy Settings ────────────────────────────────
ARBITRAGE_MIN_SPREAD = 0.5  # Minimum spread percentage
ARBITRAGE_MAX_TRADE = 1000  # Max USDT per arbitrage trade

# ─── Order Settings ─────────────────────────────────────────────
ORDER_TYPE = "market"  # market or limit
LIMIT_ORDER_OFFSET = 0.1  # % away from current price for limit orders

# ─── Logging ────────────────────────────────────────────────────
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR
LOG_FILE = "trading_bot.log"

# ─── Notifications (Optional) ──────────────────────────────────
ENABLE_NOTIFICATIONS = False
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# ─── Database ───────────────────────────────────────────────────
DATABASE_URL = "sqlite:///trading_bot.db"

# ─── Dashboard ──────────────────────────────────────────────────
ENABLE_DASHBOARD = False
DASHBOARD_HOST = "0.0.0.0"
DASHBOARD_PORT = 5000
