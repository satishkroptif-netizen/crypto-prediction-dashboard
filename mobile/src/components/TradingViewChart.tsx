import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

function getTradingViewSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === 'GOLD' || s === 'XAU') return 'OANDA:XAUUSD';
  if (s === 'SILVER' || s === 'XAG') return 'OANDA:XAGUSD';
  if (s === 'WTI' || s === 'CRUDEOIL') return 'TVC:USOIL';
  return `BINANCE:${s}USDT`;
}

export default function TradingViewChart({ symbol, height = 300 }: TradingViewChartProps) {
  const tvSymbol = getTradingViewSymbol(symbol);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; background: #0a0a0f; }
          #tv_chart { width: 100%; height: ${height}px; }
        </style>
      </head>
      <body>
        <div id="tv_chart"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
          new TradingView.widget({
            "autosize": true,
            "symbol": "${tvSymbol}",
            "interval": "240",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "backgroundColor": "#0a0a0f",
            "gridColor": "rgba(42, 46, 57, 0.3)",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "allow_symbol_change": true,
            "save_image": false,
            "calendar": false,
            "container_id": "tv_chart"
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});
