"""
Backtesting Engine
Tests trading strategies on historical data.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

import pandas as pd
import numpy as np

from config import TRADING_PAIRS, TIMEFRAME, STOP_LOSS_PCT, TAKE_PROFIT_PCT, TRAILING_STOP_PCT
from signal_generator import SignalGenerator, SignalType

logger = logging.getLogger(__name__)


@dataclass
class BacktestTrade:
    symbol: str
    side: str
    entry_price: float
    exit_price: float
    entry_time: int
    exit_time: int
    amount: float
    pnl: float
    pnl_pct: float
    reason: str


@dataclass
class BacktestResult:
    symbol: str
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    total_pnl: float
    total_pnl_pct: float
    max_drawdown: float
    sharpe_ratio: float
    trades: List[BacktestTrade] = field(default_factory=list)


class Backtester:
    """Backtests trading strategies on historical data."""

    def __init__(self, initial_balance: float = 10000):
        self.initial_balance = initial_balance
        self.signal_generator = SignalGenerator()

    def run_backtest(
        self,
        symbol: str,
        ohlcv: List,
        start_balance: Optional[float] = None
    ) -> BacktestResult:
        """Run a backtest on historical OHLCV data."""
        balance = start_balance or self.initial_balance
        trades: List[BacktestTrade] = []
        position = None
        peak_balance = balance
        max_drawdown = 0
        returns = []

        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

        for i in range(50, len(df)):
            # Get data up to current point
            data_slice = ohlcv[:i+1]

            # Generate signal
            signal = self.signal_generator.generate_signal(symbol, data_slice)
            if not signal:
                continue

            current_price = df.iloc[i]['close']
            current_time = df.iloc[i]['timestamp']

            # Update position
            if position:
                exit_reason = self._check_exit(position, current_price)
                if exit_reason:
                    pnl = self._calculate_pnl(position, current_price)
                    balance += pnl
                    returns.append(pnl / (position['entry_price'] * position['amount']))

                    trades.append(BacktestTrade(
                        symbol=symbol,
                        side=position['side'],
                        entry_price=position['entry_price'],
                        exit_price=current_price,
                        entry_time=position['entry_time'],
                        exit_time=current_time,
                        amount=position['amount'],
                        pnl=pnl,
                        pnl_pct=(pnl / (position['entry_price'] * position['amount'])) * 100,
                        reason=exit_reason,
                    ))
                    position = None

                    # Update drawdown
                    if balance > peak_balance:
                        peak_balance = balance
                    drawdown = (peak_balance - balance) / peak_balance * 100
                    max_drawdown = max(max_drawdown, drawdown)

            # Open new position
            if not position and signal.signal != SignalType.HOLD and signal.strength >= 0.5:
                side = 'long' if signal.signal == SignalType.BUY else 'short'
                amount = (balance * 0.1) / current_price  # Risk 10% per trade

                position = {
                    'side': side,
                    'entry_price': current_price,
                    'amount': amount,
                    'entry_time': current_time,
                    'stop_loss': current_price * (1 - STOP_LOSS_PCT / 100) if side == 'long' else current_price * (1 + STOP_LOSS_PCT / 100),
                    'take_profit': current_price * (1 + TAKE_PROFIT_PCT / 100) if side == 'long' else current_price * (1 - TAKE_PROFIT_PCT / 100),
                    'highest_price': current_price,
                    'lowest_price': current_price,
                }

        # Close any open position at the end
        if position:
            exit_price = df.iloc[-1]['close']
            pnl = self._calculate_pnl(position, exit_price)
            balance += pnl
            trades.append(BacktestTrade(
                symbol=symbol,
                side=position['side'],
                entry_price=position['entry_price'],
                exit_price=exit_price,
                entry_time=position['entry_time'],
                exit_time=df.iloc[-1]['timestamp'],
                amount=position['amount'],
                pnl=pnl,
                pnl_pct=(pnl / (position['entry_price'] * position['amount'])) * 100,
                reason='end_of_data',
            ))

        # Calculate metrics
        winning = [t for t in trades if t.pnl > 0]
        losing = [t for t in trades if t.pnl <= 0]
        total_pnl = sum(t.pnl for t in trades)
        total_pnl_pct = ((balance - self.initial_balance) / self.initial_balance) * 100

        # Sharpe ratio (simplified)
        sharpe = 0
        if len(returns) > 1:
            returns_arr = np.array(returns)
            if returns_arr.std() > 0:
                sharpe = (returns_arr.mean() / returns_arr.std()) * np.sqrt(252)

        return BacktestResult(
            symbol=symbol,
            total_trades=len(trades),
            winning_trades=len(winning),
            losing_trades=len(losing),
            win_rate=(len(winning) / len(trades) * 100) if trades else 0,
            total_pnl=total_pnl,
            total_pnl_pct=total_pnl_pct,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe,
            trades=trades,
        )

    def _check_exit(self, position: dict, current_price: float) -> Optional[str]:
        """Check if position should be closed."""
        side = position['side']

        # Update highest/lowest
        position['highest_price'] = max(position['highest_price'], current_price)
        position['lowest_price'] = min(position['lowest_price'], current_price)

        # Stop loss
        if side == 'long' and current_price <= position['stop_loss']:
            return 'stop_loss'
        if side == 'short' and current_price >= position['stop_loss']:
            return 'stop_loss'

        # Take profit
        if side == 'long' and current_price >= position['take_profit']:
            return 'take_profit'
        if side == 'short' and current_price <= position['take_profit']:
            return 'take_profit'

        # Trailing stop
        if side == 'long':
            trailing = position['highest_price'] * (1 - TRAILING_STOP_PCT / 100)
            if current_price <= trailing:
                return 'trailing_stop'
        else:
            trailing = position['lowest_price'] * (1 + TRAILING_STOP_PCT / 100)
            if current_price >= trailing:
                return 'trailing_stop'

        return None

    def _calculate_pnl(self, position: dict, exit_price: float) -> float:
        """Calculate PnL for a position."""
        if position['side'] == 'long':
            return (exit_price - position['entry_price']) * position['amount']
        else:
            return (position['entry_price'] - exit_price) * position['amount']

    def run_multi_asset_backtest(self, data: Dict[str, List]) -> Dict[str, BacktestResult]:
        """Run backtest on multiple assets."""
        results = {}
        for symbol, ohlcv in data.items():
            logger.info(f"Backtesting {symbol}...")
            result = self.run_backtest(symbol, ohlcv)
            results[symbol] = result
            logger.info(f"  Trades: {result.total_trades} | Win Rate: {result.win_rate:.1f}% | PnL: ${result.total_pnl:.2f}")
        return results

    def print_report(self, results: Dict[str, BacktestResult]):
        """Print a formatted backtest report."""
        print("\n" + "=" * 80)
        print("BACKTEST REPORT")
        print("=" * 80)

        total_pnl = 0
        total_trades = 0
        total_winning = 0

        for symbol, result in results.items():
            print(f"\n{symbol}:")
            print(f"  Total Trades: {result.total_trades}")
            print(f"  Win Rate: {result.win_rate:.1f}%")
            print(f"  Total PnL: ${result.total_pnl:.2f} ({result.total_pnl_pct:+.2f}%)")
            print(f"  Max Drawdown: {result.max_drawdown:.2f}%")
            print(f"  Sharpe Ratio: {result.sharpe_ratio:.2f}")

            total_pnl += result.total_pnl
            total_trades += result.total_trades
            total_winning += result.winning_trades

        print("\n" + "-" * 80)
        print("OVERALL:")
        print(f"  Total Trades: {total_trades}")
        print(f"  Overall Win Rate: {(total_winning / total_trades * 100) if total_trades else 0:.1f}%")
        print(f"  Total PnL: ${total_pnl:.2f}")
        print("=" * 80)
