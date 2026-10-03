'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string; // e.g. "BTC", "ETH", "GOLD", "SILVER", "WTI"
  height?: number;
}

function getTradingViewSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === 'GOLD' || s === 'XAU') return 'OANDA:XAUUSD';
  if (s === 'SILVER' || s === 'XAG') return 'OANDA:XAGUSD';
  if (s === 'WTI' || s === 'CRUDEOIL') return 'TVC:USOIL';
  return `BINANCE:${s}USDT`;
}

export default function TradingViewChart({ symbol, height = 500 }: TradingViewChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const tvSymbol = getTradingViewSymbol(symbol);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    // Rebuild the widget mount (keeps the mount node itself, so autosize measures correctly)
    box.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: '240',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(17, 17, 17, 1)',
      gridColor: 'rgba(42, 46, 57, 0.3)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      studies: ['STD;Volume'],
      support_host: 'https://www.tradingview.com',
    });

    box.appendChild(script);
    return () => { box.innerHTML = ''; };
  }, [tvSymbol]);

  return (
    <div className="tv-wrap" style={{ height: `${height}px` }}>
      <div className="tradingview-widget-container" ref={boxRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
