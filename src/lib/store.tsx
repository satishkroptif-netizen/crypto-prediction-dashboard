'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// ─── Types ───
export interface User { name: string; email: string; phone: string; password: string; verified: boolean; createdAt: number; }
export interface PriceAlert { id: string; symbol: string; pair: string; condition: 'above' | 'below'; price: number; note?: string; createdAt: number; triggered: boolean; }
export interface Toast { id: string; title: string; body: string; kind: 'info' | 'success' | 'warn' | 'alert'; ts: number; }

interface AppState {
  user: User | null;
  users: User[];
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ otp: string }>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<{ otp: string }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  lastOtp: string | null;
  watchlist: string[];
  toggleWatch: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
  alerts: PriceAlert[];
  addAlert: (a: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  clearTriggered: () => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id' | 'ts'>) => void;
  dismissToast: (id: string) => void;
  unread: number;
  markRead: () => void;
  livePrices: Record<string, { price: number; change24h: number; ts: number }>;
  freeVerdictKey: string | null;
  isVerdictOpen: (key: string) => boolean;
  consumeFreeView: (key: string) => boolean;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => { const c = useContext(Ctx); if (!c) throw new Error('useApp outside provider'); return c; };

// ─── Helpers ───
const LS_USERS = 'pc_users_v1';
const LS_SESSION = 'pc_session_v1';
const LS_WATCH = 'pc_watchlist_v1';
const LS_ALERTS = 'pc_alerts_v1';
const LS_READ = 'pc_alerts_read_v1';
const LS_FREE = 'pc_free_verdict_v1';

function load<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } }
const uid = () => Math.random().toString(36).slice(2, 10);
const normSym = (s: string) => s.toUpperCase().replace('USDT', '');

const COMMODITY_BASE: Record<string, number> = { GOLD: 2650, XAU: 2650, SILVER: 31.5, XAG: 31.5, WTI: 72 };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [lastOtp, setLastOtp] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'ETH', 'SOL', 'GOLD', 'WTI']);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(0);
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change24h: number; ts: number }>>({});
  const [freeVerdictKey, setFreeVerdictKey] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // init from localStorage
  useEffect(() => {
    setUsers(load<User[]>(LS_USERS, []));
    const sess = load<string | null>(LS_SESSION, null);
    const all = load<User[]>(LS_USERS, []);
    if (sess) { const u = all.find(x => x.email.toLowerCase() === sess.toLowerCase()); if (u) setUser(u); }
    setWatchlist(load<string[]>(LS_WATCH, ['BTC', 'ETH', 'SOL', 'GOLD', 'WTI']));
    setFreeVerdictKey(load<string | null>(LS_FREE, null));
    setAlerts(load<PriceAlert[]>(LS_ALERTS, []));
    setUnread(load<PriceAlert[]>(LS_ALERTS, []).filter(a => !a.triggered).length > 0 ? 0 : 0);
  }, []);

  useEffect(() => { save(LS_WATCH, watchlist); }, [watchlist]);
  useEffect(() => { save(LS_ALERTS, alerts); }, [alerts]);

  const pushToast = useCallback((t: Omit<Toast, 'id' | 'ts'>) => {
    const toast: Toast = { ...t, id: uid(), ts: Date.now() };
    setToasts(prev => [toast, ...prev].slice(0, 5));
    setUnread(u => u + 1);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== toast.id)), 6000);
  }, []);

  const markRead = useCallback(() => setUnread(0), []);
  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(x => x.id !== id)), []);

  // ─── Auth (OTP via API, demo code returned) ───
  const signup = useCallback(async (name: string, email: string, phone: string, password: string) => {
    email = email.trim().toLowerCase();
    if (!name.trim()) throw new Error('Name is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Enter a valid email');
    if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) throw new Error('Enter a valid phone number');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    const all = load<User[]>(LS_USERS, []);
    if (all.some(u => u.email.toLowerCase() === email)) throw new Error('Email already registered. Please login.');
    const nu: User = { name: name.trim(), email, phone: phone.trim(), password, verified: false, createdAt: Date.now() };
    const next = [...all, nu];
    save(LS_USERS, next); setUsers(next);
    // request OTP from server (demo: returned in response)
    const r = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed to send OTP');
    setLastOtp(j.demoOtp || null);
    return { otp: j.demoOtp as string };
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    email = email.trim().toLowerCase();
    const all0 = load<User[]>(LS_USERS, []);
    const pending = all0.find(u => u.email.toLowerCase() === email);
    const r = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, name: pending?.name, phone: pending?.phone }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Invalid OTP');
    const all = load<User[]>(LS_USERS, []);
    const next = all.map(u => u.email.toLowerCase() === email ? { ...u, verified: true } : u);
    save(LS_USERS, next); setUsers(next);
    const me = next.find(u => u.email.toLowerCase() === email) || null;
    setUser(me); save(LS_SESSION, email);
    pushToast({ title: 'Welcome', body: `Email verified. Logged in as ${me?.name}`, kind: 'success' });
    return true;
  }, [pushToast]);

  const resendOtp = useCallback(async (email: string) => {
    const r = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Failed to resend OTP');
    setLastOtp(j.demoOtp || null);
    return { otp: j.demoOtp as string };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    email = email.trim().toLowerCase();
    const all = load<User[]>(LS_USERS, []);
    const u = all.find(x => x.email.toLowerCase() === email);
    if (!u) throw new Error('No account for this email. Please sign up.');
    if (u.password !== password) throw new Error('Incorrect password');
    if (!u.verified) {
      const r = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const j = await r.json();
      setLastOtp(j.demoOtp || null);
      throw new Error('UNVERIFIED');
    }
    setUser(u); save(LS_SESSION, email);
    pushToast({ title: 'Welcome back', body: `Logged in as ${u.name}`, kind: 'success' });
  }, [pushToast]);

  const logout = useCallback(() => { setUser(null); try { localStorage.removeItem(LS_SESSION); } catch { /* noop */ } }, []);

  // ─── Watchlist ───
  const toggleWatch = useCallback((symbol: string) => {
    const s = normSym(symbol);
    setWatchlist(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].slice(0, 30));
  }, []);
  const isWatched = useCallback((s: string) => watchlist.includes(normSym(s)), [watchlist]);

  // ─── Alerts ───
  const addAlert = useCallback((a: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const na: PriceAlert = { ...a, symbol: normSym(a.symbol), id: uid(), createdAt: Date.now(), triggered: false };
    setAlerts(prev => [na, ...prev].slice(0, 50));
    pushToast({ title: 'Alert created', body: `${na.symbol} ${na.condition} $${na.price.toLocaleString()}`, kind: 'info' });
  }, [pushToast]);
  const removeAlert = useCallback((id: string) => setAlerts(p => p.filter(a => a.id !== id)), []);
  const clearTriggered = useCallback(() => setAlerts(p => p.filter(a => !a.triggered)), []);

  // ─── Realtime prices: Binance WS for crypto + live polls for metals/oil ───
  const anchorRef = useRef<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let synthTimer: ReturnType<typeof setInterval> | null = null;

    const cryptoSyms = Array.from(new Set([...watchlist.map(normSym), 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE']
      .filter(s => !COMMODITY_BASE[s])))
      .map(s => `${s.toLowerCase()}usdt@miniTicker`).join('/');

    const connect = () => {
      try {
        wsRef.current?.close();
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${cryptoSyms}`);
        wsRef.current = ws;
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            const d = msg.data;
            if (d && d.s) {
              const sym = normSym(d.s);
              const price = parseFloat(d.c);
              const open = parseFloat(d.o);
              const chg = open ? ((price - open) / open) * 100 : 0;
              setLivePrices(prev => ({ ...prev, [sym]: { price, change24h: chg, ts: Date.now() } }));
              // check alerts
              setAlerts(prev => {
                let changed = false;
                const next = prev.map(a => {
                  if (!a.triggered && a.symbol === sym) {
                    const hit = a.condition === 'above' ? price >= a.price : price <= a.price;
                    if (hit) { changed = true; return { ...a, triggered: true }; }
                  }
                  return a;
                });
                if (changed) {
                  const hits = next.filter(a => a.triggered && !prev.find(p => p.id === a.id)?.triggered);
                  hits.forEach(h => {
                    pushToast({ title: `Alert: ${h.symbol}`, body: `${h.symbol} is ${h.condition} $${h.price.toLocaleString()} (now $${price.toLocaleString()})`, kind: 'alert' });
                    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(`GnC Signal: ${h.symbol}`, { body: `${h.symbol} ${h.condition} $${h.price}` }); } catch { /* noop */ }
                  });
                  return next;
                }
                return prev;
              });
            }
          } catch { /* noop */ }
        };
        ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
        ws.onclose = () => { if (alive) setTimeout(connect, 5000); };
      } catch { /* fallback to polling below */ }
    };
    connect();

    // Live commodity polls (gold via Binance PAXG, silver/oil via gold-api/stooq).
    // Micro-ticks between polls keep the tape moving but anchored to the real price.
    const commTimer: ReturnType<typeof setInterval> | null = setInterval(async () => {
      try {
        const r = await fetch('/api/commodity-price');
        if (!r.ok) return;
        const j = await r.json();
        (['GOLD', 'SILVER', 'WTI'] as const).forEach(s => {
          const p = j[s]?.price;
          if (typeof p === 'number' && Number.isFinite(p) && p > 0) {
            anchorRef.current[s] = p;
            setLivePrices(prev => ({ ...prev, [s]: { price: p, change24h: j[s]?.change24h ?? prev[s]?.change24h ?? 0, ts: Date.now() } }));
          }
        });
      } catch { /* keep last anchored price */ }
    }, 20000);

    // immediate first poll (no wait for interval)
    (async () => {
      try {
        const r = await fetch('/api/commodity-price');
        if (r.ok) {
          const j = await r.json();
          (['GOLD', 'SILVER', 'WTI'] as const).forEach(s => {
            const p = j[s]?.price;
            if (typeof p === 'number' && Number.isFinite(p) && p > 0) {
              anchorRef.current[s] = p;
              setLivePrices(prev => ({ ...prev, [s]: { price: p, change24h: j[s]?.change24h ?? 0, ts: Date.now() } }));
            }
          });
        }
      } catch { /* noop */ }
    })();

    synthTimer = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        (['GOLD', 'SILVER', 'WTI'] as const).forEach(s => {
          const anchor = anchorRef.current[s] || COMMODITY_BASE[s] || 100;
          const cur = next[s]?.price || anchor;
          // mean-reverting micro-tick: drift toward anchor, tiny noise
          const noise = cur * (Math.random() - 0.5) * 0.0004;
          const pull = (anchor - cur) * 0.08;
          next[s] = { price: Math.max(cur + noise + pull, anchor * 0.9), change24h: next[s]?.change24h ?? 0, ts: Date.now() };
        });
        return next;
      });
    }, 2500);

    // polling fallback for crypto if WS blocked
    pollTimer = setInterval(async () => {
      if (wsRef.current && wsRef.current.readyState === 1) return;
      try {
        for (const s of ['BTC', 'ETH']) {
          const r = await fetch(`/api/predictions?symbol=${s}USDT&timeframe=1h`);
          if (r.ok) { const j = await r.json(); if (j.ticker) setLivePrices(p => ({ ...p, [s]: { price: j.ticker.price, change24h: j.ticker.priceChange24h, ts: Date.now() } })); }
        }
      } catch { /* noop */ }
    }, 15000);

    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); } catch { /* noop */ }

    return () => { alive = false; if (pollTimer) clearInterval(pollTimer); if (synthTimer) clearInterval(synthTimer); if (commTimer) clearInterval(commTimer); try { wsRef.current?.close(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join(',')]);

  // ─── Free verdict budget: guests get exactly ONE unlocked verdict, then must sign up ───
  const isVerdictOpen = useCallback((key: string) => {
    if (user) return true;
    return freeVerdictKey !== null && freeVerdictKey === key;
  }, [user, freeVerdictKey]);

  const consumeFreeView = useCallback((key: string) => {
    if (user) return true;
    const cur = load<string | null>(LS_FREE, null);
    if (cur === key) return true;
    if (cur !== null) return false; // budget spent on another verdict
    save(LS_FREE, key);
    setFreeVerdictKey(key);
    return true;
  }, [user]);

  const value: AppState = { user, users, signup, verifyOtp, resendOtp, login, logout, lastOtp, watchlist, toggleWatch, isWatched, alerts, addAlert, removeAlert, clearTriggered, toasts, pushToast, dismissToast, unread, markRead, livePrices, freeVerdictKey, isVerdictOpen, consumeFreeView };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
