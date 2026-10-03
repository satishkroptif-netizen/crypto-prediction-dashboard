"""
Signal Generator
Generates trading signals using technical indicators.
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

import numpy as np
import pandas as pd

from config import (
    RSI_PERIOD, RSI_OVERSOLD, RSI_OVERBOUGHT,
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    BOLLINGER_PERIOD, BOLLINGER_STD,
    VOLUME_MA_PERIOD
)

logger = logging.getLogger(__name__)


class SignalType(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


@dataclass
class Signal:
    symbol: str
    signal: SignalType
    strength: float  # 0.0 to 1.0
    indicators: Dict[str, float]
    reason: str
    timestamp: int


class SignalGenerator:
    """Generates trading signals from technical analysis."""

    def __init__(self):
        self.min_data_points = 50

    def generate_signal(self, symbol: str, ohlcv: List) -> Optional[Signal]:
        """Generate a trading signal from OHLCV data."""
        if len(ohlcv) < self.min_data_points:
            logger.warning(f"Not enough data for {symbol}: {len(ohlcv)} < {self.min_data_points}")
            return None

        df = self._ohlcv_to_dataframe(ohlcv)
        indicators = self._calculate_indicators(df)

        signal, strength, reason = self._evaluate_conditions(indicators)

        return Signal(
            symbol=symbol,
            signal=signal,
            strength=strength,
            indicators=indicators,
            reason=reason,
            timestamp=int(pd.Timestamp.now().timestamp() * 1000)
        )

    def _ohlcv_to_dataframe(self, ohlcv: List) -> pd.DataFrame:
        """Convert OHLCV list to pandas DataFrame."""
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        return df

    def _calculate_indicators(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate all technical indicators."""
        indicators = {}

        # RSI
        indicators['rsi'] = self._calculate_rsi(df['close'], RSI_PERIOD)

        # MACD
        macd, signal, hist = self._calculate_macd(df['close'])
        indicators['macd'] = macd
        indicators['macd_signal'] = signal
        indicators['macd_hist'] = hist

        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = self._calculate_bollinger_bands(df['close'])
        indicators['bb_upper'] = bb_upper
        indicators['bb_middle'] = bb_middle
        indicators['bb_lower'] = bb_lower
        indicators['bb_position'] = (df['close'].iloc[-1] - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5

        # Moving Averages
        indicators['sma_20'] = df['close'].rolling(window=20).mean().iloc[-1]
        indicators['sma_50'] = df['close'].rolling(window=50).mean().iloc[-1]
        indicators['ema_12'] = df['close'].ewm(span=12).mean().iloc[-1]
        indicators['ema_26'] = df['close'].ewm(span=26).mean().iloc[-1]

        # Volume
        indicators['volume'] = df['volume'].iloc[-1]
        indicators['volume_ma'] = df['volume'].rolling(window=VOLUME_MA_PERIOD).mean().iloc[-1]
        indicators['volume_ratio'] = indicators['volume'] / indicators['volume_ma'] if indicators['volume_ma'] > 0 else 1.0

        # Price
        indicators['price'] = df['close'].iloc[-1]
        indicators['price_change_1h'] = (df['close'].iloc[-1] / df['close'].iloc[-2] - 1) * 100 if len(df) > 1 else 0
        indicators['price_change_24h'] = (df['close'].iloc[-1] / df['close'].iloc[-25] - 1) * 100 if len(df) > 25 else 0

        # ATR (Average True Range)
        indicators['atr'] = self._calculate_atr(df)
        indicators['atr_pct'] = (indicators['atr'] / indicators['price']) * 100 if indicators['price'] > 0 else 0

        # Stochastic
        indicators['stoch_k'], indicators['stoch_d'] = self._calculate_stochastic(df)

        return indicators

    def _calculate_rsi(self, series: pd.Series, period: int) -> float:
        """Calculate RSI."""
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50.0

    def _calculate_macd(self, series: pd.Series) -> Tuple[float, float, float]:
        """Calculate MACD."""
        ema_fast = series.ewm(span=MACD_FAST).mean()
        ema_slow = series.ewm(span=MACD_SLOW).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=MACD_SIGNAL).mean()
        histogram = macd_line - signal_line

        return (
            macd_line.iloc[-1] if not pd.isna(macd_line.iloc[-1]) else 0,
            signal_line.iloc[-1] if not pd.isna(signal_line.iloc[-1]) else 0,
            histogram.iloc[-1] if not pd.isna(histogram.iloc[-1]) else 0
        )

    def _calculate_bollinger_bands(self, series: pd.Series) -> Tuple[float, float, float]:
        """Calculate Bollinger Bands."""
        middle = series.rolling(window=BOLLINGER_PERIOD).mean()
        std = series.rolling(window=BOLLINGER_PERIOD).std()
        upper = middle + (std * BOLLINGER_STD)
        lower = middle - (std * BOLLINGER_STD)

        return (
            upper.iloc[-1] if not pd.isna(upper.iloc[-1]) else series.iloc[-1],
            middle.iloc[-1] if not pd.isna(middle.iloc[-1]) else series.iloc[-1],
            lower.iloc[-1] if not pd.isna(lower.iloc[-1]) else series.iloc[-1]
        )

    def _calculate_atr(self, df: pd.DataFrame, period: int = 14) -> float:
        """Calculate Average True Range."""
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = true_range.rolling(window=period).mean()
        return atr.iloc[-1] if not pd.isna(atr.iloc[-1]) else 0

    def _calculate_stochastic(self, df: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> Tuple[float, float]:
        """Calculate Stochastic Oscillator."""
        low_min = df['low'].rolling(window=k_period).min()
        high_max = df['high'].rolling(window=k_period).max()
        k = 100 * (df['close'] - low_min) / (high_max - low_min)
        d = k.rolling(window=d_period).mean()

        k_val = k.iloc[-1] if not pd.isna(k.iloc[-1]) else 50
        d_val = d.iloc[-1] if not pd.isna(d.iloc[-1]) else 50
        return k_val, d_val

    def _evaluate_conditions(self, ind: Dict[str, float]) -> Tuple[SignalType, float, str]:
        """Evaluate all conditions and return signal."""
        buy_score = 0
        sell_score = 0
        reasons = []

        # RSI
        if ind['rsi'] < RSI_OVERSOLD:
            buy_score += 2
            reasons.append(f"RSI oversold ({ind['rsi']:.1f})")
        elif ind['rsi'] > RSI_OVERBOUGHT:
            sell_score += 2
            reasons.append(f"RSI overbought ({ind['rsi']:.1f})")

        # MACD
        if ind['macd_hist'] > 0 and ind['macd'] > ind['macd_signal']:
            buy_score += 2
            reasons.append("MACD bullish crossover")
        elif ind['macd_hist'] < 0 and ind['macd'] < ind['macd_signal']:
            sell_score += 2
            reasons.append("MACD bearish crossover")

        # Bollinger Bands
        if ind['bb_position'] < 0.1:
            buy_score += 1
            reasons.append("Price near lower BB")
        elif ind['bb_position'] > 0.9:
            sell_score += 1
            reasons.append("Price near upper BB")

        # Moving Averages
        if ind['sma_20'] > ind['sma_50']:
            buy_score += 1
            reasons.append("SMA20 > SMA50")
        else:
            sell_score += 1
            reasons.append("SMA20 < SMA50")

        # Volume
        if ind['volume_ratio'] > 1.5:
            if ind['price_change_1h'] > 0:
                buy_score += 1
                reasons.append("High volume + price up")
            else:
                sell_score += 1
                reasons.append("High volume + price down")

        # Stochastic
        if ind['stoch_k'] < 20:
            buy_score += 1
            reasons.append("Stochastic oversold")
        elif ind['stoch_k'] > 80:
            sell_score += 1
            reasons.append("Stochastic overbought")

        # Determine signal
        total = buy_score + sell_score
        if buy_score >= 4 and buy_score > sell_score * 1.5:
            strength = min(buy_score / 8, 1.0)
            return SignalType.BUY, strength, "; ".join(reasons)
        elif sell_score >= 4 and sell_score > buy_score * 1.5:
            strength = min(sell_score / 8, 1.0)
            return SignalType.SELL, strength, "; ".join(reasons)
        else:
            return SignalType.HOLD, 0.0, "No strong signal"
