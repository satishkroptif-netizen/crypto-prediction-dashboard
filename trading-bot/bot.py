"""
Trading Bot Engine
Main bot loop that generates signals and executes trades.
Supports multiple strategies: signal, grid, dca, arbitrage.
"""

import logging
import time
import threading
from typing import Dict, Optional
from datetime import datetime

from config import (
    TRADING_PAIRS, TIMEFRAME, PAPER_TRADING, PAPER_BALANCE,
    ENABLE_NOTIFICATIONS, STRATEGY, GRID_COUNT, GRID_SPACING_PCT,
    DCA_TARGET_AMOUNT, DCA_PURCHASE_AMOUNT, DCA_INTERVAL_HOURS,
    ARBITRAGE_MIN_SPREAD, ARBITRAGE_MAX_TRADE
)
from exchange_connector import ExchangeConnector
from signal_generator import SignalGenerator, SignalType
from risk_manager import RiskManager
from database import Database
from notifications import NotificationManager
from backtester import Backtester
from strategies.grid_strategy import GridStrategy
from strategies.dca_strategy import DCAStrategy
from strategies.arbitrage_strategy import ArbitrageStrategy

logger = logging.getLogger(__name__)


class TradingBot:
    """Main trading bot with multi-strategy support."""

    def __init__(self):
        self.exchange = ExchangeConnector()
        self.signal_generator = SignalGenerator()
        self.risk_manager = RiskManager(initial_balance=PAPER_BALANCE)
        self.database = Database()
        self.notifications = NotificationManager()
        self.backtester = Backtester(initial_balance=PAPER_BALANCE)

        # Strategy instances
        self.strategy = STRATEGY
        self.grid_strategy = GridStrategy(grid_count=GRID_COUNT, grid_spacing_pct=GRID_SPACING_PCT)
        self.dca_strategy = DCAStrategy()
        self.arbitrage_strategy = ArbitrageStrategy(
            min_spread_pct=ARBITRAGE_MIN_SPREAD,
            max_trade_amount=ARBITRAGE_MAX_TRADE
        )

        self.is_running = False
        self.dashboard_thread = None

    def start(self):
        """Start the trading bot."""
        self.is_running = True
        logger.info("=" * 60)
        logger.info("Trading Bot Started")
        logger.info(f"Mode: {'PAPER' if PAPER_TRADING else 'LIVE'}")
        logger.info(f"Strategy: {self.strategy.upper()}")
        logger.info(f"Trading Pairs: {', '.join(TRADING_PAIRS)}")
        logger.info(f"Timeframe: {TIMEFRAME}")
        logger.info("=" * 60)

        self._print_status()

        while self.is_running:
            try:
                self._run_cycle()
                logger.info("Waiting 60 seconds before next cycle...")
                time.sleep(60)
            except KeyboardInterrupt:
                logger.info("Bot stopped by user")
                self.stop()
                break
            except Exception as e:
                logger.error(f"Error in bot cycle: {e}", exc_info=True)
                if ENABLE_NOTIFICATIONS:
                    self.notifications.send_error_alert(str(e))
                time.sleep(10)

    def stop(self):
        """Stop the trading bot."""
        self.is_running = False
        logger.info("Bot stopped")
        self._print_status()

    def _run_cycle(self):
        """Run one trading cycle."""
        logger.info("-" * 40)
        logger.info(f"Cycle started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Update existing positions
        self._update_positions()

        # Run strategy
        if self.strategy == 'signal':
            self._run_signal_strategy()
        elif self.strategy == 'grid':
            self._run_grid_strategy()
        elif self.strategy == 'dca':
            self._run_dca_strategy()
        elif self.strategy == 'arbitrage':
            self._run_arbitrage_strategy()
        else:
            logger.warning(f"Unknown strategy: {self.strategy}")

        # Save metrics
        metrics = self.risk_manager.get_portfolio_summary()
        self.database.save_metrics(metrics)

    def _run_signal_strategy(self):
        """Run signal-based trading strategy."""
        for symbol in TRADING_PAIRS:
            try:
                self._process_symbol_signal(symbol)
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")

    def _run_grid_strategy(self):
        """Run grid trading strategy."""
        for symbol in TRADING_PAIRS:
            try:
                ticker = self.exchange.get_ticker(symbol)
                if not ticker:
                    continue

                current_price = ticker.get('last', 0)

                # Create grid if not exists
                if symbol not in self.grid_strategy.active_grids:
                    balance = self.risk_manager.balance
                    grid_amount = balance * 0.1  # Use 10% of balance per grid
                    self.grid_strategy.create_grid(symbol, current_price, grid_amount)

                # Update grid and get orders
                orders = self.grid_strategy.update_grid(symbol, current_price)
                for order in orders:
                    self.exchange.place_order(
                        symbol=order['symbol'],
                        side=order['side'],
                        order_type='limit',
                        amount=order['amount'],
                        price=order['price']
                    )

            except Exception as e:
                logger.error(f"Error in grid strategy for {symbol}: {e}")

    def _run_dca_strategy(self):
        """Run DCA trading strategy."""
        for symbol in TRADING_PAIRS:
            try:
                ticker = self.exchange.get_ticker(symbol)
                if not ticker:
                    continue

                current_price = ticker.get('last', 0)

                # Start DCA if not exists
                if symbol not in self.dca_strategy.positions:
                    self.dca_strategy.start_dca(
                        symbol=symbol,
                        target_amount=DCA_TARGET_AMOUNT,
                        purchase_amount=DCA_PURCHASE_AMOUNT,
                        interval_hours=DCA_INTERVAL_HOURS
                    )

                # Execute purchase if due
                purchase = self.dca_strategy.execute_purchase(symbol, current_price)
                if purchase:
                    self.exchange.place_order(
                        symbol=symbol,
                        side='buy',
                        order_type='market',
                        amount=purchase.amount
                    )

            except Exception as e:
                logger.error(f"Error in DCA strategy for {symbol}: {e}")

    def _run_arbitrage_strategy(self):
        """Run arbitrage trading strategy."""
        try:
            # Collect prices from multiple sources
            prices = {}
            for symbol in TRADING_PAIRS:
                ticker = self.exchange.get_ticker(symbol)
                if ticker:
                    prices[symbol] = ticker.get('last', 0)

            # Find opportunities
            opportunities = self.arbitrage_strategy.find_opportunities(
                {'delta': prices, 'delta2': prices}  # Simulated multi-exchange
            )

            for opp in opportunities[:3]:  # Top 3 opportunities
                trade = self.arbitrage_strategy.execute_arbitrage(opp)
                if trade and ENABLE_NOTIFICATIONS:
                    self.notifications.send_trade_alert(
                        symbol=opp.symbol,
                        side='arbitrage',
                        amount=opp.max_amount,
                        price=opp.buy_price,
                        pnl=trade.pnl
                    )

        except Exception as e:
            logger.error(f"Error in arbitrage strategy: {e}")

    def _process_symbol_signal(self, symbol: str):
        """Process a single trading pair for signal strategy."""
        ohlcv = self.exchange.get_ohlcv(symbol, TIMEFRAME, limit=100)
        if not ohlcv:
            return

        signal = self.signal_generator.generate_signal(symbol, ohlcv)
        if not signal:
            return

        logger.info(f"Signal for {symbol}: {signal.signal.value.upper()} (strength: {signal.strength:.2f})")

        # Save signal
        self.database.save_signal({
            'symbol': signal.symbol,
            'signal': signal.signal.value,
            'strength': signal.strength,
            'reason': signal.reason,
        })

        # Send notification
        if ENABLE_NOTIFICATIONS and signal.strength >= 0.5:
            self.notifications.send_signal_alert(
                symbol=signal.symbol,
                signal=signal.signal.value,
                strength=signal.strength,
                price=signal.indicators['price'],
                reason=signal.reason
            )

        # Execute trade
        if signal.strength >= 0.5:
            self._execute_signal(signal)

    def _execute_signal(self, signal):
        """Execute a trading signal."""
        symbol = signal.symbol
        current_price = signal.indicators['price']

        # Check for exit
        if symbol in self.risk_manager.positions:
            position = self.risk_manager.positions[symbol]
            if (position.side == 'long' and signal.signal == SignalType.SELL) or \
               (position.side == 'short' and signal.signal == SignalType.BUY):
                self.risk_manager.close_position(symbol, current_price, "signal_exit")
            return

        # Open new position
        if not self.risk_manager.can_open_position(symbol):
            return

        amount = self.risk_manager.calculate_position_size(current_price, signal.strength)
        side = 'long' if signal.signal == SignalType.BUY else 'short'

        position = self.risk_manager.open_position(symbol, side, current_price, amount)
        if position and ENABLE_NOTIFICATIONS:
            self.notifications.send_trade_alert(symbol, side, amount, current_price)

    def _update_positions(self):
        """Update all open positions."""
        for symbol in list(self.risk_manager.positions.keys()):
            ticker = self.exchange.get_ticker(symbol)
            if not ticker:
                continue

            current_price = ticker.get('last', 0)
            if current_price <= 0:
                continue

            result = self.risk_manager.update_position(symbol, current_price)
            if result == "closed":
                trade = self.risk_manager.trade_history[-1]
                self.database.save_trade(trade)
                if ENABLE_NOTIFICATIONS:
                    self.notifications.send_position_closed(
                        symbol=symbol,
                        side=trade['side'],
                        pnl=trade['pnl'],
                        pnl_pct=trade['pnl_pct'],
                        reason=trade['reason']
                    )

    def _print_status(self):
        """Print current bot status."""
        summary = self.risk_manager.get_portfolio_summary()

        logger.info("=" * 60)
        logger.info("BOT STATUS")
        logger.info("=" * 60)
        logger.info(f"Balance: ${summary['balance']:.2f}")
        logger.info(f"Total PnL: ${summary['total_pnl']:.2f} ({summary['total_pnl_pct']:+.2f}%)")
        logger.info(f"Total Trades: {summary['total_trades']}")
        logger.info(f"Win Rate: {summary['win_rate']:.1f}%")
        logger.info(f"Open Positions: {summary['open_positions']}")

        if self.risk_manager.positions:
            logger.info("-" * 40)
            logger.info("OPEN POSITIONS:")
            for symbol, pos in self.risk_manager.positions.items():
                logger.info(f"  {symbol}: {pos.side} @ ${pos.entry_price:.2f} | PnL: ${pos.pnl:.2f}")

        logger.info("=" * 60)

    def run_backtest(self, symbol: str):
        """Run a backtest for a symbol."""
        logger.info(f"Running backtest for {symbol}...")
        ohlcv = self.exchange.get_ohlcv(symbol, TIMEFRAME, limit=500)
        if not ohlcv:
            logger.error(f"No data for backtest: {symbol}")
            return None

        result = self.backtester.run_backtest(symbol, ohlcv)
        self.backtester.print_report({symbol: result})
        return result

    def run_once(self):
        """Run a single trading cycle."""
        logger.info("Running single cycle...")
        self._run_cycle()
        self._print_status()
