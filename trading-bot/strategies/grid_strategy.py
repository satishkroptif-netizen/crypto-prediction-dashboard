"""
Grid Trading Strategy
Places buy and sell orders at regular intervals within a price range.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

from config import STOP_LOSS_PCT, TAKE_PROFIT_PCT

logger = logging.getLogger(__name__)


@dataclass
class GridLevel:
    price: float
    side: str  # 'buy' or 'sell'
    amount: float
    filled: bool = False
    order_id: Optional[str] = None


@dataclass
class GridPosition:
    symbol: str
    upper_price: float
    lower_price: float
    grid_count: int
    total_amount: float
    levels: List[GridLevel] = field(default_factory=list)
    opened_at: str = field(default_factory=lambda: datetime.now().isoformat())


class GridStrategy:
    """Grid trading strategy implementation."""

    def __init__(self, grid_count: int = 5, grid_spacing_pct: float = 1.0):
        self.grid_count = grid_count
        self.grid_spacing_pct = grid_spacing_pct
        self.active_grids: Dict[str, GridPosition] = {}

    def create_grid(self, symbol: str, current_price: float, total_amount: float) -> GridPosition:
        """Create a new grid for a symbol."""
        spacing = current_price * (self.grid_spacing_pct / 100)
        upper = current_price + (spacing * self.grid_count / 2)
        lower = current_price - (spacing * self.grid_count / 2)

        levels = []
        amount_per_level = total_amount / self.grid_count

        for i in range(self.grid_count):
            price = lower + (spacing * i)
            side = 'buy' if price < current_price else 'sell'
            levels.append(GridLevel(
                price=price,
                side=side,
                amount=amount_per_level,
            ))

        grid = GridPosition(
            symbol=symbol,
            upper_price=upper,
            lower_price=lower,
            grid_count=self.grid_count,
            total_amount=total_amount,
            levels=levels,
        )

        self.active_grids[symbol] = grid
        logger.info(f"Created grid for {symbol}: {self.grid_count} levels between ${lower:.2f} - ${upper:.2f}")

        return grid

    def update_grid(self, symbol: str, current_price: float) -> List[Dict]:
        """Update grid with current price and return orders to execute."""
        if symbol not in self.active_grids:
            return []

        grid = self.active_grids[symbol]
        orders = []

        for level in grid.levels:
            if level.filled:
                continue

            if level.side == 'buy' and current_price <= level.price:
                orders.append({
                    'symbol': symbol,
                    'side': 'buy',
                    'price': level.price,
                    'amount': level.amount,
                })
                level.filled = True

            elif level.side == 'sell' and current_price >= level.price:
                orders.append({
                    'symbol': symbol,
                    'side': 'sell',
                    'price': level.price,
                    'amount': level.amount,
                })
                level.filled = True

        return orders

    def close_grid(self, symbol: str, current_price: float) -> Dict:
        """Close all positions in a grid."""
        if symbol not in self.active_grids:
            return {}

        grid = self.active_grids.pop(symbol)

        # Calculate total PnL
        total_pnl = 0
        for level in grid.levels:
            if level.filled:
                if level.side == 'buy':
                    total_pnl += (current_price - level.price) * level.amount
                else:
                    total_pnl += (level.price - current_price) * level.amount

        logger.info(f"Closed grid for {symbol}. Total PnL: ${total_pnl:.2f}")

        return {
            'symbol': symbol,
            'total_pnl': total_pnl,
            'levels_filled': sum(1 for l in grid.levels if l.filled),
        }

    def get_grid_status(self, symbol: str) -> Optional[Dict]:
        """Get status of a grid."""
        if symbol not in self.active_grids:
            return None

        grid = self.active_grids[symbol]
        return {
            'symbol': symbol,
            'upper_price': grid.upper_price,
            'lower_price': grid.lower_price,
            'grid_count': grid.grid_count,
            'levels_filled': sum(1 for l in grid.levels if l.filled),
            'total_levels': len(grid.levels),
        }
