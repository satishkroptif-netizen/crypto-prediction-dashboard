"""
Delta Exchange Connector
Handles all interactions with the Delta Exchange API.
"""

import ccxt
import logging
from typing import Optional, Dict, List, Any
from config import API_KEY, API_SECRET, PAPER_TRADING

logger = logging.getLogger(__name__)


class ExchangeConnector:
    """Connects to Delta Exchange and provides trading operations."""

    def __init__(self):
        self.exchange = ccxt.delta({
            'apiKey': API_KEY,
            'secret': API_SECRET,
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot',  # or 'future'
            }
        })
        self.paper_trading = PAPER_TRADING
        self.paper_balance: Dict[str, float] = {'USDT': 10000.0}
        self.paper_positions: Dict[str, Dict] = {}

        if self.paper_trading:
            logger.info("=" * 60)
            logger.info("PAPER TRADING MODE - No real money at risk")
            logger.info("=" * 60)
        else:
            logger.info("=" * 60)
            logger.info("LIVE TRADING MODE - Real money at risk!")
            logger.info("=" * 60)

    def get_balance(self) -> Dict[str, float]:
        """Get account balance."""
        if self.paper_trading:
            return self.paper_balance.copy()

        try:
            balance = self.exchange.fetch_balance()
            return {
                asset: float(info['free'])
                for asset, info in balance.get('total', {}).items()
                if float(info.get('free', 0)) > 0
            }
        except Exception as e:
            logger.error(f"Failed to fetch balance: {e}")
            return {}

    def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Get current ticker data for a symbol."""
        if self.paper_trading:
            # Simulate ticker for paper trading
            return self._simulate_ticker(symbol)

        try:
            return self.exchange.fetch_ticker(symbol)
        except Exception as e:
            logger.error(f"Failed to fetch ticker for {symbol}: {e}")
            return {}

    def get_ohlcv(self, symbol: str, timeframe: str = '1h', limit: int = 100) -> List:
        """Get OHLCV (candlestick) data."""
        if self.paper_trading:
            return self._simulate_ohlcv(symbol, timeframe, limit)

        try:
            return self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        except Exception as e:
            logger.error(f"Failed to fetch OHLCV for {symbol}: {e}")
            return []

    def place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        amount: float,
        price: Optional[float] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Place an order."""
        if self.paper_trading:
            return self._simulate_order(symbol, side, order_type, amount, price)

        try:
            order = self.exchange.create_order(
                symbol=symbol,
                type=order_type,
                side=side,
                amount=amount,
                price=price,
                params=params or {}
            )
            logger.info(f"Order placed: {order['id']} - {side} {amount} {symbol}")
            return order
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            return {}

    def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an order."""
        if self.paper_trading:
            return True

        try:
            self.exchange.cancel_order(order_id, symbol)
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order: {e}")
            return False

    def get_open_positions(self, symbol: Optional[str] = None) -> List[Dict]:
        """Get open positions."""
        if self.paper_trading:
            positions = list(self.paper_positions.values())
            if symbol:
                positions = [p for p in positions if p['symbol'] == symbol]
            return positions

        try:
            positions = self.exchange.fetch_positions([symbol] if symbol else None)
            return [p for p in positions if float(p.get('contracts', 0)) != 0]
        except Exception as e:
            logger.error(f"Failed to fetch positions: {e}")
            return []

    def get_order_history(self, symbol: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """Get order history."""
        if self.paper_trading:
            return []

        try:
            return self.exchange.fetch_orders(symbol, limit=limit)
        except Exception as e:
            logger.error(f"Failed to fetch order history: {e}")
            return []

    # ─── Paper Trading Simulations ────────────────────────────────

    def _simulate_ticker(self, symbol: str) -> Dict[str, Any]:
        """Generate simulated ticker data."""
        import random
        import time

        base_prices = {
            'BTC_USDT': 65000,
            'ETH_USDT': 3500,
            'SOL_USDT': 150,
            'XRP_USDT': 0.55,
            'DOGE_USDT': 0.12,
        }

        base = base_prices.get(symbol, 100)
        change = random.uniform(-0.02, 0.02)
        price = base * (1 + change)

        return {
            'symbol': symbol,
            'last': price,
            'bid': price * 0.999,
            'ask': price * 1.001,
            'high': price * 1.02,
            'low': price * 0.98,
            'volume': random.uniform(100000, 1000000),
            'timestamp': int(time.time() * 1000),
        }

    def _simulate_ohlcv(self, symbol: str, timeframe: str, limit: int) -> List:
        """Generate simulated OHLCV data."""
        import random
        import time

        base_prices = {
            'BTC_USDT': 65000,
            'ETH_USDT': 3500,
            'SOL_USDT': 150,
            'XRP_USDT': 0.55,
            'DOGE_USDT': 0.12,
        }

        base = base_prices.get(symbol, 100)
        ohlcv = []
        now = int(time.time() * 1000)

        # Determine interval in ms
        intervals = {'1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000}
        interval_ms = intervals.get(timeframe, 3600000)

        price = base
        for i in range(limit):
            timestamp = now - (limit - i) * interval_ms
            change = random.uniform(-0.01, 0.01)
            open_price = price
            close_price = price * (1 + change)
            high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.005))
            low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.005))
            volume = random.uniform(1000, 10000)

            ohlcv.append([timestamp, open_price, high_price, low_price, close_price, volume])
            price = close_price

        return ohlcv

    def _simulate_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        amount: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Simulate an order for paper trading."""
        import uuid
        import time

        ticker = self._simulate_ticker(symbol)
        fill_price = price or ticker['last']

        order = {
            'id': str(uuid.uuid4())[:8],
            'symbol': symbol,
            'side': side,
            'type': order_type,
            'amount': amount,
            'price': fill_price,
            'filled': amount,
            'remaining': 0,
            'status': 'closed',
            'timestamp': int(time.time() * 1000),
            'cost': amount * fill_price,
        }

        # Update paper balance
        if side == 'buy':
            cost = amount * fill_price
            self.paper_balance['USDT'] = self.paper_balance.get('USDT', 0) - cost
            base_asset = symbol.split('_')[0]
            self.paper_balance[base_asset] = self.paper_balance.get(base_asset, 0) + amount
        elif side == 'sell':
            revenue = amount * fill_price
            self.paper_balance['USDT'] = self.paper_balance.get('USDT', 0) + revenue
            base_asset = symbol.split('_')[0]
            self.paper_balance[base_asset] = self.paper_balance.get(base_asset, 0) - amount

        logger.info(f"[PAPER] {side.upper()} {amount} {symbol} @ ${fill_price:.2f}")
        return order
