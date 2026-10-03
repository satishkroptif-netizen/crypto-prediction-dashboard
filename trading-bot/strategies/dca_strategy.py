"""
DCA (Dollar-Cost Averaging) Strategy
Buys at regular intervals regardless of price.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class DCAPurchase:
    symbol: str
    price: float
    amount: float
    timestamp: str


@dataclass
class DCAPosition:
    symbol: str
    target_amount: float  # Total USDT to invest
    purchase_amount: float  # USDT per purchase
    interval_hours: int  # Hours between purchases
    purchases: List[DCAPurchase] = field(default_factory=list)
    last_purchase: Optional[str] = None
    is_active: bool = True

    @property
    def total_invested(self) -> float:
        return sum(p.price * p.amount for p in self.purchases)

    @property
    def total_coins(self) -> float:
        return sum(p.amount for p in self.purchases)

    @property
    def avg_buy_price(self) -> float:
        if not self.purchases:
            return 0
        return self.total_invested / self.total_coins if self.total_coins > 0 else 0

    def current_pnl(self, current_price: float) -> float:
        if not self.purchases:
            return 0
        return (current_price - self.avg_buy_price) * self.total_coins


class DCAStrategy:
    """DCA trading strategy implementation."""

    def __init__(self):
        self.positions: Dict[str, DCAPosition] = {}

    def start_dca(
        self,
        symbol: str,
        target_amount: float,
        purchase_amount: float,
        interval_hours: int = 24
    ) -> DCAPosition:
        """Start a DCA position."""
        if symbol in self.positions and self.positions[symbol].is_active:
            logger.warning(f"DCA already active for {symbol}")
            return self.positions[symbol]

        position = DCAPosition(
            symbol=symbol,
            target_amount=target_amount,
            purchase_amount=purchase_amount,
            interval_hours=interval_hours,
        )

        self.positions[symbol] = position
        logger.info(f"Started DCA for {symbol}: ${purchase_amount} every {interval_hours}h, target ${target_amount}")

        return position

    def should_buy(self, symbol: str) -> bool:
        """Check if it's time to buy."""
        if symbol not in self.positions:
            return False

        position = self.positions[symbol]
        if not position.is_active:
            return False

        # Check if target reached
        if position.total_invested >= position.target_amount:
            position.is_active = False
            logger.info(f"DCA target reached for {symbol}")
            return False

        # Check interval
        if position.last_purchase:
            last = datetime.fromisoformat(position.last_purchase)
            if datetime.now() - last < timedelta(hours=position.interval_hours):
                return False

        return True

    def execute_purchase(self, symbol: str, current_price: float) -> Optional[DCAPurchase]:
        """Execute a DCA purchase."""
        if not self.should_buy(symbol):
            return None

        position = self.positions[symbol]
        amount = position.purchase_amount / current_price

        purchase = DCAPurchase(
            symbol=symbol,
            price=current_price,
            amount=amount,
            timestamp=datetime.now().isoformat(),
        )

        position.purchases.append(purchase)
        position.last_purchase = purchase.timestamp

        logger.info(f"DCA purchase: {amount:.6f} {symbol} @ ${current_price:.2f}")

        return purchase

    def stop_dca(self, symbol: str) -> Optional[Dict]:
        """Stop a DCA position."""
        if symbol not in self.positions:
            return None

        position = self.positions[symbol]
        position.is_active = False

        result = {
            'symbol': symbol,
            'total_invested': position.total_invested,
            'total_coins': position.total_coins,
            'avg_buy_price': position.avg_buy_price,
            'purchase_count': len(position.purchases),
        }

        logger.info(f"Stopped DCA for {symbol}. Total invested: ${position.total_invested:.2f}")

        return result

    def get_dca_status(self, symbol: str, current_price: float) -> Optional[Dict]:
        """Get DCA position status."""
        if symbol not in self.positions:
            return None

        position = self.positions[symbol]
        return {
            'symbol': symbol,
            'is_active': position.is_active,
            'total_invested': position.total_invested,
            'target_amount': position.target_amount,
            'progress_pct': (position.total_invested / position.target_amount * 100) if position.target_amount > 0 else 0,
            'total_coins': position.total_coins,
            'avg_buy_price': position.avg_buy_price,
            'current_pnl': position.current_pnl(current_price),
            'purchase_count': len(position.purchases),
            'interval_hours': position.interval_hours,
        }
