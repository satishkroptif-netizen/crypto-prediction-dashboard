"""
Database Models
Stores trade history, signals, and bot performance.
"""

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import DATABASE_URL

logger = logging.getLogger(__name__)

Base = declarative_base()


class Trade(Base):
    """Trade record."""
    __tablename__ = 'trades'

    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'long' or 'short'
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    pnl = Column(Float, nullable=False)
    pnl_pct = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    opened_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime, nullable=False)
    is_paper = Column(Boolean, default=True)


class SignalRecord(Base):
    """Signal record."""
    __tablename__ = 'signals'

    id = Column(Integer, primary_key=True)
    symbol = Column(String, nullable=False)
    signal = Column(String, nullable=False)  # 'buy', 'sell', 'hold'
    strength = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    executed = Column(Boolean, default=False)


class BotMetrics(Base):
    """Bot performance metrics."""
    __tablename__ = 'bot_metrics'

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    balance = Column(Float, nullable=False)
    total_pnl = Column(Float, nullable=False)
    total_trades = Column(Integer, nullable=False)
    win_rate = Column(Float, nullable=False)
    open_positions = Column(Integer, nullable=False)


class Database:
    """Database handler."""

    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def save_trade(self, trade: dict):
        """Save a trade to the database."""
        session = self.Session()
        try:
            record = Trade(
                symbol=trade['symbol'],
                side=trade['side'],
                entry_price=trade['entry_price'],
                exit_price=trade['exit_price'],
                amount=trade['amount'],
                pnl=trade['pnl'],
                pnl_pct=trade['pnl_pct'],
                reason=trade['reason'],
                opened_at=datetime.fromisoformat(trade['opened_at']),
                closed_at=datetime.fromisoformat(trade['closed_at']),
                is_paper=True,
            )
            session.add(record)
            session.commit()
        except Exception as e:
            logger.error(f"Failed to save trade: {e}")
            session.rollback()
        finally:
            session.close()

    def save_signal(self, signal: dict):
        """Save a signal to the database."""
        session = self.Session()
        try:
            record = SignalRecord(
                symbol=signal['symbol'],
                signal=signal['signal'],
                strength=signal['strength'],
                reason=signal['reason'],
                timestamp=datetime.utcnow(),
            )
            session.add(record)
            session.commit()
        except Exception as e:
            logger.error(f"Failed to save signal: {e}")
            session.rollback()
        finally:
            session.close()

    def save_metrics(self, metrics: dict):
        """Save bot metrics to the database."""
        session = self.Session()
        try:
            record = BotMetrics(
                balance=metrics['balance'],
                total_pnl=metrics['total_pnl'],
                total_trades=metrics['total_trades'],
                win_rate=metrics['win_rate'],
                open_positions=metrics['open_positions'],
            )
            session.add(record)
            session.commit()
        except Exception as e:
            logger.error(f"Failed to save metrics: {e}")
            session.rollback()
        finally:
            session.close()

    def get_trade_history(self, limit: int = 50) -> List[Trade]:
        """Get recent trade history."""
        session = self.Session()
        try:
            return session.query(Trade).order_by(Trade.closed_at.desc()).limit(limit).all()
        finally:
            session.close()

    def get_performance_summary(self) -> dict:
        """Get performance summary."""
        session = self.Session()
        try:
            trades = session.query(Trade).all()
            if not trades:
                return {
                    'total_trades': 0,
                    'winning_trades': 0,
                    'losing_trades': 0,
                    'win_rate': 0,
                    'total_pnl': 0,
                    'avg_pnl': 0,
                }

            winning = [t for t in trades if t.pnl > 0]
            losing = [t for t in trades if t.pnl <= 0]
            total_pnl = sum(t.pnl for t in trades)

            return {
                'total_trades': len(trades),
                'winning_trades': len(winning),
                'losing_trades': len(losing),
                'win_rate': (len(winning) / len(trades)) * 100,
                'total_pnl': total_pnl,
                'avg_pnl': total_pnl / len(trades),
            }
        finally:
            session.close()
