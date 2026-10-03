"""
Web Dashboard
Real-time monitoring dashboard using Flask.
"""

import logging
import json
from datetime import datetime
from typing import Dict, Optional

from flask import Flask, render_template_string, jsonify

from bot import TradingBot
from database import Database

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global bot instance (set when dashboard starts)
bot: Optional[TradingBot] = None
db: Optional[Database] = None


DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PredictChain Trading Bot Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #fff; min-height: 100vh; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .header h1 { font-size: 24px; font-weight: 700; }
        .header .status { display: flex; gap: 20px; margin-top: 10px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-badge.paper { background: rgba(34,197,94,0.1); color: #22c55e; }
        .status-badge.live { background: rgba(239,68,68,0.1); color: #ef4444; }
        .container { max-width: 1400px; margin: 0 auto; padding: 30px 40px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; }
        .card-title { font-size: 14px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-value { font-size: 32px; font-weight: 700; }
        .card-value.positive { color: #22c55e; }
        .card-value.negative { color: #ef4444; }
        .card-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .positions { margin-top: 30px; }
        .positions h2 { font-size: 18px; margin-bottom: 16px; }
        .position-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .position-info { display: flex; gap: 16px; align-items: center; }
        .position-symbol { font-weight: 600; font-size: 16px; }
        .position-side { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .position-side.long { background: rgba(34,197,94,0.1); color: #22c55e; }
        .position-side.short { background: rgba(239,68,68,0.1); color: #ef4444; }
        .position-pnl { font-weight: 600; }
        .position-pnl.positive { color: #22c55e; }
        .position-pnl.negative { color: #ef4444; }
        .trades { margin-top: 30px; }
        .trades h2 { font-size: 18px; margin-bottom: 16px; }
        .trade-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .trade-info { display: flex; gap: 16px; align-items: center; }
        .trade-symbol { font-weight: 600; }
        .trade-side { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .trade-side.buy { background: rgba(34,197,94,0.1); color: #22c55e; }
        .trade-side.sell { background: rgba(239,68,68,0.1); color: #ef4444; }
        .refresh-info { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        .strategy-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px; }
        .strategy-badge.signal { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .strategy-badge.grid { background: rgba(168,85,247,0.1); color: #a855f7; }
        .strategy-badge.dca { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .strategy-badge.arbitrage { background: rgba(236,72,153,0.1); color: #ec4899; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PredictChain Trading Bot</h1>
        <div class="status">
            <span class="status-badge {{ 'paper' if paper_trading else 'live' }}">
                {{ 'PAPER TRADING' if paper_trading else 'LIVE TRADING' }}
            </span>
            <span class="status-badge" style="background: rgba(59,130,246,0.1); color: #3b82f6;">
                {{ strategy.upper() }} STRATEGY
            </span>
            <span style="color: #6b7280; font-size: 12px;">Last updated: {{ last_updated }}</span>
        </div>
    </div>

    <div class="container">
        <!-- Summary Cards -->
        <div class="grid">
            <div class="card">
                <div class="card-title">Balance</div>
                <div class="card-value">${{ "%.2f"|format(balance) }}</div>
                <div class="card-subtitle">Available USDT</div>
            </div>
            <div class="card">
                <div class="card-title">Total PnL</div>
                <div class="card-value {{ 'positive' if total_pnl >= 0 else 'negative' }}">
                    ${{ "%.2f"|format(total_pnl) }}
                </div>
                <div class="card-subtitle">{{ "%.2f"|format(total_pnl_pct) }}%</div>
            </div>
            <div class="card">
                <div class="card-title">Total Trades</div>
                <div class="card-value">{{ total_trades }}</div>
                <div class="card-subtitle">{{ winning_trades }}W / {{ losing_trades }}L</div>
            </div>
            <div class="card">
                <div class="card-title">Win Rate</div>
                <div class="card-value">{{ "%.1f"|format(win_rate) }}%</div>
                <div class="card-subtitle">{{ open_positions }} open positions</div>
            </div>
        </div>

        <!-- Open Positions -->
        <div class="positions">
            <h2>Open Positions</h2>
            {% if positions %}
                {% for pos in positions %}
                <div class="position-item">
                    <div class="position-info">
                        <span class="position-symbol">{{ pos.symbol }}</span>
                        <span class="position-side {{ pos.side }}">{{ pos.side.upper() }}</span>
                        <span style="color: #9ca3af; font-size: 14px;">
                            ${{ "%.2f"|format(pos.entry_price) }}
                        </span>
                    </div>
                    <div class="position-pnl {{ 'positive' if pos.pnl >= 0 else 'negative' }}">
                        ${{ "%.2f"|format(pos.pnl) }} ({{ "%.2f"|format(pos.pnl_pct) }}%)
                    </div>
                </div>
                {% endfor %}
            {% else %}
                <div class="card" style="text-align: center; color: #6b7280;">
                    No open positions
                </div>
            {% endif %}
        </div>

        <!-- Recent Trades -->
        <div class="trades">
            <h2>Recent Trades</h2>
            {% if trades %}
                {% for trade in trades[-10:]|reverse %}
                <div class="trade-item">
                    <div class="trade-info">
                        <span class="trade-symbol">{{ trade.symbol }}</span>
                        <span class="trade-side {{ trade.side }}">{{ trade.side.upper() }}</span>
                        <span style="color: #9ca3af; font-size: 14px;">
                            ${{ "%.2f"|format(trade.entry_price) }} → ${{ "%.2f"|format(trade.exit_price) }}
                        </span>
                        <span style="color: #6b7280; font-size: 12px;">{{ trade.reason }}</span>
                    </div>
                    <div class="position-pnl {{ 'positive' if trade.pnl >= 0 else 'negative' }}">
                        ${{ "%.2f"|format(trade.pnl) }}
                    </div>
                </div>
                {% endfor %}
            {% else %}
                <div class="card" style="text-align: center; color: #6b7280;">
                    No trades yet
                </div>
            {% endif %}
        </div>

        <div class="refresh-info">Auto-refreshes every 30 seconds</div>
    </div>

    <script>
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
"""


@app.route('/')
def dashboard():
    """Main dashboard page."""
    if not bot or not db:
        return "Bot not initialized", 500

    summary = bot.risk_manager.get_portfolio_summary()
    positions = list(bot.risk_manager.positions.values())
    trades = bot.risk_manager.trade_history

    return render_template_string(
        DASHBOARD_HTML,
        balance=summary['balance'],
        total_pnl=summary['total_pnl'],
        total_pnl_pct=summary['total_pnl_pct'],
        total_trades=summary['total_trades'],
        winning_trades=summary['winning_trades'],
        losing_trades=summary['losing_trades'],
        win_rate=summary['win_rate'],
        open_positions=summary['open_positions'],
        positions=[{
            'symbol': p.symbol,
            'side': p.side,
            'entry_price': p.entry_price,
            'pnl': p.pnl,
            'pnl_pct': p.pnl_pct,
        } for p in positions],
        trades=[{
            'symbol': t['symbol'],
            'side': t['side'],
            'entry_price': t['entry_price'],
            'exit_price': t['exit_price'],
            'pnl': t['pnl'],
            'reason': t['reason'],
        } for t in trades],
        paper_trading=bot.exchange.paper_trading,
        strategy=getattr(bot, 'strategy', 'signal'),
        last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    )


@app.route('/api/status')
def api_status():
    """API endpoint for bot status."""
    if not bot:
        return jsonify({'error': 'Bot not initialized'}), 500

    summary = bot.risk_manager.get_portfolio_summary()
    return jsonify({
        'balance': summary['balance'],
        'total_pnl': summary['total_pnl'],
        'total_trades': summary['total_trades'],
        'win_rate': summary['win_rate'],
        'open_positions': summary['open_positions'],
        'is_running': bot.is_running,
        'paper_trading': bot.exchange.paper_trading,
    })


@app.route('/api/positions')
def api_positions():
    """API endpoint for open positions."""
    if not bot:
        return jsonify({'error': 'Bot not initialized'}), 500

    positions = [{
        'symbol': p.symbol,
        'side': p.side,
        'entry_price': p.entry_price,
        'current_pnl': p.pnl,
        'current_pnl_pct': p.pnl_pct,
    } for p in bot.risk_manager.positions.values()]

    return jsonify(positions)


@app.route('/api/trades')
def api_trades():
    """API endpoint for trade history."""
    if not bot:
        return jsonify({'error': 'Bot not initialized'}), 500

    return jsonify(bot.risk_manager.trade_history)


def start_dashboard(bot_instance: TradingBot, db_instance: Database, host='0.0.0.0', port=5000):
    """Start the web dashboard."""
    global bot, db
    bot = bot_instance
    db = db_instance

    logger.info(f"Dashboard starting on http://{host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)
