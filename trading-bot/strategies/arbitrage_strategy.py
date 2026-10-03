"""
Arbitrage Strategy
Exploits price differences between exchanges or trading pairs.
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ArbitrageOpportunity:
    symbol: str
    buy_exchange: str
    sell_exchange: str
    buy_price: float
    sell_price: float
    spread_pct: float
    max_amount: float
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ArbitrageTrade:
    opportunity: ArbitrageOpportunity
    amount: float
    buy_order_id: str
    sell_order_id: str
    pnl: float
    status: str  # 'open', 'closed', 'failed'


class ArbitrageStrategy:
    """Arbitrage trading strategy implementation."""

    def __init__(self, min_spread_pct: float = 0.5, max_trade_amount: float = 1000):
        self.min_spread_pct = min_spread_pct
        self.max_trade_amount = max_trade_amount
        self.active_trades: List[ArbitrageTrade] = []
        self.trade_history: List[ArbitrageTrade] = []

    def find_opportunities(
        self,
        prices: Dict[str, Dict[str, float]]  # {exchange: {symbol: price}}
    ) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities across exchanges."""
        opportunities = []

        if len(prices) < 2:
            return opportunities

        exchanges = list(prices.keys())

        for i in range(len(exchanges)):
            for j in range(i + 1, len(exchanges)):
                ex1, ex2 = exchanges[i], exchanges[j]

                # Get common symbols
                symbols1 = set(prices[ex1].keys())
                symbols2 = set(prices[ex2].keys())
                common_symbols = symbols1 & symbols2

                for symbol in common_symbols:
                    price1 = prices[ex1][symbol]
                    price2 = prices[ex2][symbol]

                    if price1 <= 0 or price2 <= 0:
                        continue

                    # Calculate spread
                    if price1 < price2:
                        spread = ((price2 - price1) / price1) * 100
                        if spread >= self.min_spread_pct:
                            opportunities.append(ArbitrageOpportunity(
                                symbol=symbol,
                                buy_exchange=ex1,
                                sell_exchange=ex2,
                                buy_price=price1,
                                sell_price=price2,
                                spread_pct=spread,
                                max_amount=self.max_trade_amount,
                            ))
                    else:
                        spread = ((price1 - price2) / price2) * 100
                        if spread >= self.min_spread_pct:
                            opportunities.append(ArbitrageOpportunity(
                                symbol=symbol,
                                buy_exchange=ex2,
                                sell_exchange=ex1,
                                buy_price=price2,
                                sell_price=price1,
                                spread_pct=spread,
                                max_amount=self.max_trade_amount,
                            ))

        # Sort by spread (highest first)
        opportunities.sort(key=lambda x: x.spread_pct, reverse=True)

        return opportunities

    def execute_arbitrage(self, opportunity: ArbitrageOpportunity) -> Optional[ArbitrageTrade]:
        """Execute an arbitrage trade."""
        try:
            # In paper trading, simulate the trade
            buy_cost = opportunity.buy_price * opportunity.max_amount
            sell_revenue = opportunity.sell_price * opportunity.max_amount
            pnl = sell_revenue - buy_cost

            trade = ArbitrageTrade(
                opportunity=opportunity,
                amount=opportunity.max_amount,
                buy_order_id=f"arb_buy_{datetime.now().timestamp()}",
                sell_order_id=f"arb_sell_{datetime.now().timestamp()}",
                pnl=pnl,
                status='closed',
            )

            self.trade_history.append(trade)

            logger.info(f"Arbitrage executed: {opportunity.symbol}")
            logger.info(f"  Buy on {opportunity.buy_exchange} @ ${opportunity.buy_price:.2f}")
            logger.info(f"  Sell on {opportunity.sell_exchange} @ ${opportunity.sell_price:.2f}")
            logger.info(f"  Spread: {opportunity.spread_pct:.2f}% | PnL: ${pnl:.2f}")

            return trade

        except Exception as e:
            logger.error(f"Arbitrage execution failed: {e}")
            return None

    def get_arbitrage_summary(self) -> Dict:
        """Get arbitrage performance summary."""
        if not self.trade_history:
            return {
                'total_trades': 0,
                'total_pnl': 0,
                'avg_spread': 0,
            }

        total_pnl = sum(t.pnl for t in self.trade_history)
        avg_spread = sum(t.opportunity.spread_pct for t in self.trade_history) / len(self.trade_history)

        return {
            'total_trades': len(self.trade_history),
            'total_pnl': total_pnl,
            'avg_spread': avg_spread,
            'min_spread_threshold': self.min_spread_pct,
        }

    def find_triangular_arbitrage(
        self,
        prices: Dict[str, float]  # {pair: price}
    ) -> Optional[Dict]:
        """Find triangular arbitrage opportunities (e.g., BTC -> ETH -> USDT -> BTC)."""
        # Example: BTC/USDT, ETH/BTC, ETH/USDT
        # If BTC/USDT * ETH/BTC > ETH/USDT, there's an opportunity

        opportunities = []

        # Common triangular paths
        paths = [
            ('BTC_USDT', 'ETH_BTC', 'ETH_USDT'),
            ('ETH_USDT', 'BTC_ETH', 'BTC_USDT'),
            ('SOL_USDT', 'BTC_SOL', 'BTC_USDT'),
        ]

        for path in paths:
            if all(p in prices for p in path):
                # Calculate if there's an opportunity
                # This is a simplified check
                rate = prices[path[0]] * prices[path[1]]
                if rate > prices[path[2]] * 1.001:  # 0.1% threshold
                    opportunities.append({
                        'path': path,
                        'rate': rate,
                        'expected_profit_pct': ((rate / prices[path[2]]) - 1) * 100,
                    })

        return opportunities[0] if opportunities else None
