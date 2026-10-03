'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchDropdown from './SearchDropdown';
import { useApp } from '@/lib/store';

export type TabKey = 'dashboard' | 'scanner' | 'regime' | 'news' | 'flow' | 'calendar';

export const TABS: { key: TabKey; label: string; icon: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '◧', desc: 'Live predictions' },
  { key: 'scanner', label: 'Verdict Scanner', icon: '◎', desc: '15m · 1h · 4h · 1D' },
  { key: 'regime', label: 'Market Regime', icon: '◈', desc: 'Risk on/off' },
  { key: 'news', label: 'News Intelligent', icon: '✦', desc: 'Sentiment feed' },
  { key: 'flow', label: 'Flow & Derivatives', icon: '⇄', desc: 'OI · L/S · funding' },
  { key: 'calendar', label: 'Economic Calendar', icon: '▤', desc: 'Events & impact' },
];

const SYM_META: Record<string, { name: string; icon: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿' }, ETH: { name: 'Ethereum', icon: 'Ξ' },
  SOL: { name: 'Solana', icon: '◎' }, BNB: { name: 'BNB', icon: '⬡' },
  XRP: { name: 'XRP', icon: '✕' }, DOGE: { name: 'Dogecoin', icon: 'Ð' },
  GOLD: { name: 'Gold', icon: '🥇' }, SILVER: { name: 'Silver', icon: '🥈' }, WTI: { name: 'WTI Crude', icon: '🛢️' },
};

export default function WorkspaceShell({ active, children }: { active: TabKey; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { user, logout, watchlist, toggleWatch, livePrices, alerts, removeAlert, toasts, dismissToast, unread, markRead } = useApp();
  const router = useRouter();

  const fmt = (s: string) => {
    const lp = livePrices[s];
    if (!lp) return '—';
    return s === 'GOLD' || s === 'SILVER' || s === 'WTI'
      ? `$${lp.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : `$${lp.price.toLocaleString(undefined, { maximumFractionDigits: lp.price < 10 ? 4 : 2 })}`;
  };

  return (
    <div className="ws-root">
      {/* toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.kind}`} onClick={() => dismissToast(t.id)}>
            <strong>{t.title}</strong><span>{t.body}</span>
          </div>
        ))}
      </div>

      {/* topbar */}
      <header className="ws-topbar">
        <button className="icon-btn only-mobile" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
        <Link href="/" className="ws-logo"><span className="logo-icon">◆</span><span>GnC Signal</span><em>workspace</em></Link>
        <div className="ws-search"><SearchDropdown compact /></div>
        <div className="ws-top-actions">
          <button className="icon-btn watch-toggle" onClick={() => setWatchOpen(v => !v)} title="Watchlist">★ <span className="hide-sm">{watchlist.length}</span></button>
          <button className="icon-btn" onClick={() => { setAlertsOpen(v => !v); markRead(); }} title="Alerts">🔔{unread > 0 && <i className="badge">{unread}</i>}</button>
          {user ? (
            <div className="user-chip" title={user.email}>
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="hide-sm">{user.name.split(' ')[0]}</span>
              <button onClick={() => { logout(); router.push('/'); }} className="link-btn">Logout</button>
            </div>
          ) : (
            <div className="auth-btns">
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </div>
          )}
        </div>
      </header>

      <div className="ws-body">
        {/* sidebar */}
        <aside className={`ws-side ${mobileOpen ? 'open' : ''}`}>
          <div className="side-head">
            <span>WORKSPACE</span>
            <button className="icon-btn only-mobile" onClick={() => setMobileOpen(false)}>✕</button>
          </div>
          <nav className="side-nav">
            {TABS.map(t => (
              <Link key={t.key} href={t.key === 'dashboard' ? '/' : `/${t.key}`} onClick={() => setMobileOpen(false)}
                className={`side-link ${active === t.key ? 'active' : ''}`}>
                <span className="side-ico">{t.icon}</span>
                <span className="side-txt"><strong>{t.label}</strong><small>{t.desc}</small></span>
              </Link>
            ))}
          </nav>
          <div className="side-sec">LIBRARY</div>
          <nav className="side-nav">
            <Link href="/track-record" className="side-link"><span className="side-ico">✓</span><span className="side-txt"><strong>Track Record</strong><small>Accuracy log</small></span></Link>
            <Link href="/about" className="side-link"><span className="side-ico">?</span><span className="side-txt"><strong>Methodology</strong><small>Factors & weights</small></span></Link>
          </nav>
          <div className="side-foot">
            <div className="live-dot"><span className="pulse" />Realtime · Binance WS</div>
            <small>15m · 1h · 4h · 1D predictions</small>
          </div>
        </aside>
        {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}

        {/* main */}
        <main className="ws-main">{children}</main>

        {/* watchlist drawer */}
        <aside className={`ws-watch ${watchOpen ? 'open' : ''}`}>
          <div className="watch-head"><strong>★ Watchlist</strong><button className="icon-btn" onClick={() => setWatchOpen(false)}>✕</button></div>
          <p className="muted-sm">Tap ★ on any card or search result to pin it here. Prices stream live.</p>
          <div className="watch-list">
            {watchlist.map(s => (
              <div key={s} className="watch-row" onClick={() => router.push(`/asset/${s}`)}>
                <span className="w-ico">{SYM_META[s]?.icon || '●'}</span>
                <span className="w-sym">{s}<small>{SYM_META[s]?.name || s}</small></span>
                <span className={`w-price ${(livePrices[s]?.change24h || 0) >= 0 ? 'up' : 'down'}`}>{fmt(s)}</span>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleWatch(s); }} title="Remove">✕</button>
              </div>
            ))}
            {watchlist.length === 0 && <p className="muted-sm">Empty — add symbols from Dashboard.</p>}
          </div>
          <div className="watch-head" style={{ marginTop: 12 }}><strong>🔔 Price alerts ({alerts.filter(a => !a.triggered).length})</strong></div>
          <div className="watch-list">
            {alerts.slice(0, 8).map(a => (
              <div key={a.id} className={`watch-row ${a.triggered ? 'hit' : ''}`}>
                <span className="w-sym">{a.symbol}<small>{a.condition} ${a.price.toLocaleString()}</small></span>
                <span className="w-state">{a.triggered ? 'HIT' : 'LIVE'}</span>
                <button className="icon-btn" onClick={() => removeAlert(a.id)}>✕</button>
              </div>
            ))}
            {alerts.length === 0 && <p className="muted-sm">No alerts. Create one from any asset page.</p>}
          </div>
        </aside>
      </div>

      {/* alerts dropdown */}
      {alertsOpen && (
        <div className="alerts-pop">
          <div className="watch-head"><strong>Notifications</strong><button className="icon-btn" onClick={() => setAlertsOpen(false)}>✕</button></div>
          {toasts.length === 0 && <p className="muted-sm">No notifications yet. Price alerts and verdict flips appear here.</p>}
          {toasts.map(t => <div key={t.id} className="alert-row"><strong>{t.title}</strong><span>{t.body}</span></div>)}
          <Link href="/flow" className="btn-ghost full" onClick={() => setAlertsOpen(false)}>Manage alerts in Flow & Derivatives</Link>
        </div>
      )}

      {/* mobile bottom nav */}
      <nav className="ws-bottomnav">
        {TABS.map(t => (
          <Link key={t.key} href={t.key === 'dashboard' ? '/' : `/${t.key}`} className={active === t.key ? 'active' : ''}>
            <span>{t.icon}</span><small>{t.label.split(' ')[0]}</small>
          </Link>
        ))}
      </nav>
    </div>
  );
}
