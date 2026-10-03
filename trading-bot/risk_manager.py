"""
Risk Manager
Handles position sizing, stop loss, take profit, and trailing stops.
"""

import logging
from typing import Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime

from config import (
    MAX_POSITION_SIZE_PCT,
    STOP_LOSS_PCT,
    TAKE_PROFIT_PCT,
    MAX_OPEN_POSITIONS,
    TRAILING_STOP_PCT,
    PAPER_BALANCE
)

logger = logging.getLogger(__name__)


@dataclass
class Position:
    symbol: str
    side: str  # 'long' or 'short'
    entry_price: float
    amount: float
    stop_loss: float
    take_profit: float
    trailing_stop: Optional[float] = None
    highest_price: float = 0
    lowest_price: float = float('inf')
    opened_at: str = field(default_factory=lambda: datetime.now().isoformat())
    pnl: float = 0
    pnl_pct: float = 0


class RiskManager:
    """Manages trading risk and position sizing."""

    def __init__(self, initial_balance: float = PAPER_BALANCE):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.positions: Dict[str, Position] = {}
        self.trade_history: list = []

    def can_open_position(self, symbol: str) -> bool:
        """Check if a new position can be opened."""
        if len(self.positions) >= MAX_OPEN_POSITIONS:
            logger.warning(f"Max open positions ({MAX_OPEN_POSITIONS}) reached")
            return False

        if symbol in self.positions:
            logger.warning(f"Position already open for {symbol}")
            return False

        return True

    def calculate_position_size(self, price: float, signal_strength: float = 0.5) -> float:
        """Calculate position size based on risk parameters."""
        # Risk a percentage of balance adjusted by signal strength
        risk_pct = (MAX_POSITION_SIZE_PCT / 100) * (0.5 + signal_strength * 0.5)
        position_value = self.balance * risk_pct

        # Calculate amount
        amount = position_value / price if price > 0 else 0

        logger.info(f"Position size: {amount:.6f} (${position_value:.2f}, {risk_pct*100:.1f}% of balance)")
        return amount

    def open_position(
        self,
        symbol: str,
        side: str,
        entry_price: float,
        amount: float
    ) -> Optional[Position]:
        """Open a new position with stop loss and take profit."""
        if not self.can_open_position(symbol):
            return None

        if side == 'long':
            stop_loss = entry_price * (1 - STOP_LOSS_PCT / 100)
            take_profit = entry_price * (1 + TAKE_PROFIT_PCT / 100)
            trailing_stop = entry_price * (1 - TRAILING_STOP_PCT / 100)
        else:
            stop_loss = entry_price * (1 + STOP_LOSS_PCT / 100)
            take_profit = entry_price * (1 - TAKE_PROFIT_PCT / 100)
            trailing_stop = entry_price * (1 + TRAILING_STOP_PCT / 100)

        position = Position(
            symbol=symbol,
            side=side,
            entry_price=entry_price,
            amount=amount,
            stop_loss=stop_loss,
            take_profit=take_profit,
            trailing_stop=trailing_stop,
            highest_price=entry_price,
            lowest_price=entry_price,
        )

        self.positions[symbol] = position
        logger.info(f"Opened {side} position: {amount:.6f} {symbol} @ ${entry_price:.2f}")
        logger.info(f"  Stop Loss: ${stop_loss:.2f} | Take Profit: ${take_profit:.2f}")

        return position

    def update_position(self, symbol: str, current_price: float) -> Optional[str]:
        """Update position with current price. Returns 'closed' if position was closed."""
        if symbol not in self.positions:
            return None

        pos = self.positions[symbol]

        # Update highest/lowest
        pos.highest_price = max(pos.highest_price, current_price)
        pos.lowest_price = min(pos.lowest_price, current_price)

        # Calculate PnL
        if pos.side == 'long':
            pos.pnl = (current_price - pos.entry_price) * pos.amount
            pos.pnl_pct = (current_price / pos.entry_price - 1) * 100
        else:
            pos.pnl = (pos.entry_price - current_price) * pos.amount
            pos.pnl_pct = (pos.entry_price / current_price - 1) * 100

        # Check stop loss
        if pos.side == 'long' and current_price <= pos.stop_loss:
            logger.info(f"Stop loss triggered for {symbol} @ ${current_price:.2f}")
            self.close_position(symbol, current_price, "stop_loss")
            return "closed"

        if pos.side == 'short' and current_price >= pos.stop_loss:
            logger.info(f"Stop loss triggered for {symbol} @ ${current_price:.2f}")
            self.close_position(symbol, current_price, "stop_loss")
            return "closed"

        # Check take profit
        if pos.side == 'long' and current_price >= pos.take_profit:
            logger.info(f"Take profit triggered for {symbol} @ ${current_price:.2f}")
            self.close_position(symbol, current_price, "take_profit")
            return "closed"

        if pos.side == 'short' and current_price <= pos.take_profit:
            logger.info(f"Take profit triggered for {symbol} @ ${current_price:.2f}")
            self.close_position(symbol, current_price, "take_profit")
            return "closed"

        # Update trailing stop
        if pos.side == 'long':
            new_trailing = pos.highest_price * (1 - TRAILING_STOP_PCT / 100)
            if new_trailing > pos.trailing_stop:
                pos.trailing_stop = new_trailing
            if current_price <= pos.trailing_stop:
                logger.info(f"Trailing stop triggered for {symbol} @ ${current_price:.2f}")
                self.close_position(symbol, current_price, "trailing_stop")
                return "closed"
        else:
            new_trailing = pos.lowest_price * (1 + TRAILING_STOP_PCT / 100)
            if new_trailing < pos.trailing_stop:
                pos.trailing_stop = new_trailing
            if current_price >= pos.trailing_stop:
                logger.info(f"Trailing stop triggered for {symbol} @ ${current_price:.2f}")
                self.close_position(symbol, current_price, "trailing_stop")
                return "closed"

        return None

    def close_position(self, symbol: str, exit_price: float, reason: str = "signal") -> Optional[Position]:
        """Close a position and record the trade."""
        if symbol not in self.positions:
            return None

        pos = self.positions.pop(symbol)

        # Calculate final PnL
        if pos.side == 'long':
            pnl = (exit_price - pos.entry_price) * pos.amount
        else:
            pnl = (pos.entry_price - exit_price) * pos.amount

        pnl_pct = (pnl / (pos.entry_price * pos.amount)) * 100 if pos.entry_price > 0 else 0

        # Update balance
        self.balance += pnl

        # Record trade
        trade = {
            'symbol': symbol,
            'side': pos.side,
            'entry_price': pos.entry_price,
            'exit_price': exit_price,
            'amount': pos.amount,
            'pnl': pnl,
            'pnl_pct': pnl_pct,
            'reason': reason,
            'opened_at': pos.opened_at,
            'closed_at': datetime.now().isoformat(),
        }
        self.trade_history.append(trade)

        logger.info(f"Closed {pos.side} position: {symbol} @ ${exit_price:.2f}")
        logger.info(f"  PnL: ${pnl:.2f} ({pnl_pct:+.2f}%) | Reason: {reason}")
        logger.info(f"  Balance: ${self.balance:.2f}")

        return pos

    def get_portfolio_summary(self) -> Dict:
        """Get portfolio summary."""
        total_pnl = sum(t['pnl'] for t in self.trade_history)
        winning_trades = [t for t in self.trade_history if t['pnl'] > 0]
        losing_trades = [t for t in self.trade_history if t['pnl'] <= 0]

        return {
            'balance': self.balance,
            'total_pnl': total_pnl,
            'total_pnl_pct': ((self.balance - self.initial_balance) / self.initial_balance) * 100,
            'total_trades': len(self.trade_history),
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': (len(winning_trades) / len(self.trade_history) * 100) if self.trade_history else 0,
            'open_positions': len(self.positions),
        }
