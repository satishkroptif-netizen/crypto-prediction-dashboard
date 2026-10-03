"""
Notifications Module
Sends alerts via Telegram and Discord.
"""

import logging
import requests
from typing import Optional
from config import (
    ENABLE_NOTIFICATIONS,
    DISCORD_WEBHOOK_URL,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
)

logger = logging.getLogger(__name__)


class NotificationManager:
    """Manages notifications across multiple channels."""

    def __init__(self):
        self.enabled = ENABLE_NOTIFICATIONS
        self.discord_webhook = DISCORD_WEBHOOK_URL
        self.telegram_token = TELEGRAM_BOT_TOKEN
        self.telegram_chat_id = TELEGRAM_CHAT_ID

    def send_signal_alert(self, symbol: str, signal: str, strength: float, price: float, reason: str):
        """Send a trading signal alert."""
        if not self.enabled:
            return

        message = (
            f"🔔 *Trading Signal*\n"
            f"Symbol: `{symbol}`\n"
            f"Signal: *{signal.upper()}*\n"
            f"Strength: {strength:.0%}\n"
            f"Price: ${price:.2f}\n"
            f"Reason: {reason}"
        )

        self._send_telegram(message)
        self._send_discord("Trading Signal", message.replace('*', ''))

    def send_trade_alert(self, symbol: str, side: str, amount: float, price: float, pnl: Optional[float] = None):
        """Send a trade execution alert."""
        if not self.enabled:
            return

        emoji = "🟢" if side == "buy" else "🔴"
        message = (
            f"{emoji} *Trade Executed*\n"
            f"Symbol: `{symbol}`\n"
            f"Side: *{side.upper()}*\n"
            f"Amount: {amount:.6f}\n"
            f"Price: ${price:.2f}"
        )

        if pnl is not None:
            pnl_emoji = "✅" if pnl > 0 else "❌"
            message += f"\n{pnl_emoji} PnL: ${pnl:.2f}"

        self._send_telegram(message)
        self._send_discord("Trade Executed", message.replace('*', ''))

    def send_position_closed(self, symbol: str, side: str, pnl: float, pnl_pct: float, reason: str):
        """Send a position closed alert."""
        if not self.enabled:
            return

        emoji = "✅" if pnl > 0 else "❌"
        message = (
            f"{emoji} *Position Closed*\n"
            f"Symbol: `{symbol}`\n"
            f"Side: *{side.upper()}*\n"
            f"PnL: ${pnl:.2f} ({pnl_pct:+.2f}%)\n"
            f"Reason: {reason}"
        )

        self._send_telegram(message)
        self._send_discord("Position Closed", message.replace('*', ''))

    def send_error_alert(self, error: str):
        """Send an error alert."""
        if not self.enabled:
            return

        message = f"⚠️ *Bot Error*\n```\n{error}\n```"
        self._send_telegram(message)
        self._send_discord("Bot Error", error)

    def send_daily_report(self, report: dict):
        """Send a daily performance report."""
        if not self.enabled:
            return

        message = (
            f"📊 *Daily Report*\n"
            f"Balance: ${report.get('balance', 0):.2f}\n"
            f"Total PnL: ${report.get('total_pnl', 0):.2f}\n"
            f"Trades: {report.get('total_trades', 0)}\n"
            f"Win Rate: {report.get('win_rate', 0):.1f}%"
        )

        self._send_telegram(message)
        self._send_discord("Daily Report", message.replace('*', ''))

    def _send_telegram(self, message: str):
        """Send a message via Telegram."""
        if not self.telegram_token or not self.telegram_chat_id:
            return

        try:
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            requests.post(url, json={
                'chat_id': self.telegram_chat_id,
                'text': message,
                'parse_mode': 'Markdown',
            }, timeout=5)
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")

    def _send_discord(self, title: str, description: str):
        """Send a message via Discord webhook."""
        if not self.discord_webhook:
            return

        try:
            requests.post(self.discord_webhook, json={
                'embeds': [{
                    'title': title,
                    'description': description,
                    'color': 0x00ff00 if '✅' in description else 0xff0000 if '❌' in description else 0x3498db,
                }]
            }, timeout=5)
        except Exception as e:
            logger.error(f"Failed to send Discord message: {e}")
