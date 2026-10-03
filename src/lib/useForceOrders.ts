'use client';

import { useEffect, useRef, useState } from 'react';

export interface LiqEvent { side: 'LONG' | 'SHORT'; price: number; qty: number; notional: number; time: number; }
export interface LiqState { longUsd: number; shortUsd: number; count: number; recent: LiqEvent[]; connected: boolean; }

// Live liquidations via Binance public force-order stream (keyless).
// SELL force order = longs liquidated, BUY = shorts liquidated.
export function useForceOrders(pair: string | null, enabled = true) {
  const [state, setState] = useState<LiqState>({ longUsd: 0, shortUsd: 0, count: 0, recent: [], connected: false });
  const acc = useRef({ longUsd: 0, shortUsd: 0, count: 0, recent: [] as LiqEvent[] });

  useEffect(() => {
    if (!enabled || !pair) return;
    acc.current = { longUsd: 0, shortUsd: 0, count: 0, recent: [] };
    setState({ longUsd: 0, shortUsd: 0, count: 0, recent: [], connected: false });
    let ws: WebSocket | null = null;
    let alive = true;
    const connect = () => {
      try {
        ws = new WebSocket(`wss://fstream.binance.com/stream?streams=${pair.toLowerCase()}@forceOrder`);
        ws.onopen = () => alive && setState(s => ({ ...s, connected: true }));
        ws.onmessage = (ev) => {
          try {
            const o = JSON.parse(ev.data)?.data?.o;
            if (!o) return;
            const price = parseFloat(o.p), qty = parseFloat(o.q);
            if (!Number.isFinite(price) || !Number.isFinite(qty)) return;
            const ev2: LiqEvent = {
              side: o.S === 'SELL' ? 'LONG' : 'SHORT',
              price, qty, notional: price * qty, time: o.T || Date.now(),
            };
            const a = acc.current;
            if (ev2.side === 'LONG') a.longUsd += ev2.notional; else a.shortUsd += ev2.notional;
            a.count += 1;
            a.recent = [ev2, ...a.recent].slice(0, 15);
            setState({ longUsd: a.longUsd, shortUsd: a.shortUsd, count: a.count, recent: [...a.recent], connected: true });
          } catch { /* noop */ }
        };
        ws.onclose = () => { if (alive) { setState(s => ({ ...s, connected: false })); setTimeout(connect, 5000); } };
        ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
      } catch { /* noop */ }
    };
    connect();
    return () => { alive = false; try { ws?.close(); } catch { /* noop */ } };
  }, [pair, enabled]);

  return state;
}
