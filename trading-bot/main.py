#!/usr/bin/env python3
"""
PredictChain Trading Bot
A multi-strategy trading bot for Delta Exchange with paper trading.

Usage:
    python main.py                  # Run with default strategy (signal)
    python main.py --strategy grid  # Run with grid strategy
    python main.py --strategy dca   # Run with DCA strategy
    python main.py --strategy arbitrage  # Run with arbitrage strategy
    python main.py --once           # Run single cycle
    python main.py --backtest       # Run backtest on all pairs
    python main.py --dashboard      # Start web dashboard
    python main.py --dashboard --run  # Start bot + dashboard
"""

import logging
import sys
import threading
from datetime import datetime

from bot import TradingBot
from config import (
    LOG_LEVEL, LOG_FILE, PAPER_TRADING, STRATEGY,
    ENABLE_DASHBOARD, DASHBOARD_HOST, DASHBOARD_PORT
)

logger = logging.getLogger(__name__)


def setup_logging():
    """Setup logging configuration."""
    log_format = '%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, LOG_LEVEL))
    console_handler.setFormatter(logging.Formatter(log_format, date_format))

    # File handler
    file_handler = logging.FileHandler(LOG_FILE)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(log_format, date_format))

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)


def print_banner():
    """Print startup banner."""
    banner = """
    ============================================================
                                                              |
         PPPP   RRRR   EEEEE  DDDD   IIIII  TTTTT  CCCC  H   H
         P   P  R   R  E      D   D    I      T    C      H   H
         PPPP   RRRR   EEEE   D   D    I      T    C      HHHHH
         P      R R    E      D   D    I      T    C      H   H
         P      R  R   EEEEE  DDDD   IIIII    T    CCCC  H   H
                                                              |
              C H A I N   T R A D I N G   B O T
                                                              |
    ============================================================
    """
    print(banner)
    print(f"  Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Mode: {'PAPER TRADING' if PAPER_TRADING else 'LIVE TRADING'}")
    print(f"  Strategy: {STRATEGY.upper()}")
    print(f"  Log file: {LOG_FILE}")
    print()


def main():
    """Main entry point."""
    setup_logging()
    print_banner()

    # Parse arguments
    strategy = STRATEGY
    run_once = False
    run_backtest = False
    start_dashboard = False
    run_with_dashboard = False

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == '--strategy' and i + 1 < len(args):
            strategy = args[i + 1]
            i += 2
        elif args[i] == '--once':
            run_once = True
            i += 1
        elif args[i] == '--backtest':
            run_backtest = True
            i += 1
        elif args[i] == '--dashboard':
            start_dashboard = True
            i += 1
        elif args[i] == '--run':
            run_with_dashboard = True
            i += 1
        else:
            i += 1

    from config import TRADING_PAIRS

    bot = TradingBot()
    bot.strategy = strategy

    if run_backtest:
        # Run backtest
        logger.info("Running backtest on all trading pairs...")
        results = {}
        for symbol in TRADING_PAIRS:
            result = bot.run_backtest(symbol)
            if result:
                results[symbol] = result
        bot.backtester.print_report(results)
        return

    if start_dashboard:
        # Start dashboard only
        try:
            from dashboard import start_dashboard
        except ImportError:
            print("Flask not installed. Run: pip install flask")
            return
        from database import Database
        db = Database()
        print(f"Dashboard available at http://{DASHBOARD_HOST}:{DASHBOARD_PORT}")
        start_dashboard(bot, db, DASHBOARD_HOST, DASHBOARD_PORT)
        return

    if run_with_dashboard:
        # Start bot + dashboard
        try:
            from dashboard import start_dashboard
        except ImportError:
            print("Flask not installed. Run: pip install flask")
            return
        from database import Database
        db = Database()
        dashboard_thread = threading.Thread(
            target=start_dashboard,
            args=(bot, db, DASHBOARD_HOST, DASHBOARD_PORT),
            daemon=True
        )
        dashboard_thread.start()
        print(f"Dashboard available at http://{DASHBOARD_HOST}:{DASHBOARD_PORT}")
        bot.start()
        return

    if run_once:
        # Run single cycle
        bot.run_once()
    else:
        # Run continuously
        try:
            bot.start()
        except KeyboardInterrupt:
            print("\nShutting down...")
            bot.stop()


if __name__ == '__main__':
    main()
