'use client';

const IST = 'Asia/Kolkata';

// Event times stored in UTC — displayed in IST (UTC+5:30)
const EVENTS = [
  { utc: '2026-10-07T12:30:00Z', title: 'US CPI (Sep)', impact: 'high', assets: 'BTC · GOLD · ALL', note: 'Risk moves on surprise. Expect volatility 15m–1h.' },
  { utc: '2026-10-15T18:00:00Z', title: 'FOMC Minutes', impact: 'high', assets: 'BTC · ETH · GOLD', note: 'Rate-path repricing drives 4h verdicts.' },
  { utc: '2026-10-22T12:30:00Z', title: 'US Jobless Claims + Retail', impact: 'medium', assets: 'ALL', note: 'Growth scare/gold bid check.' },
  { utc: '2026-10-29T18:00:00Z', title: 'FOMC Rate Decision', impact: 'high', assets: 'BTC · GOLD · WTI', note: 'Do not hold max leverage into decision.' },
  { utc: '2026-11-05T13:30:00Z', title: 'NFP Payrolls', impact: 'high', assets: 'ALL', note: 'Classic whipsaw — wait 15m candle close.' },
  { utc: '2026-11-12T15:30:00Z', title: 'OPEC Monthly Report', impact: 'medium', assets: 'WTI', note: 'Key for crude 1h/4h bias.' },
];

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso));
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: '2-digit', month: 'short', weekday: 'short' }).format(new Date(iso));

export default function EconomicCalendar() {
  const now = new Date();
  return (
    <div className="ws-page">
      <div className="page-head">
        <div><h1>Economic Calendar</h1><p>High-impact events that flip Macro & News factors — plan size around them</p></div>
        <div className="sent-pill">All times <b>IST (UTC+5:30)</b></div>
      </div>
      <div className="cal-list">
        {EVENTS.map(e => {
          const d = new Date(e.utc);
          const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
          return (
            <div key={e.title} className="cal-row">
              <div className="cal-date"><b>{fmtDate(e.utc)}</b><small>{days >= 0 ? `T-${days}d` : 'past'}</small></div>
              <div className="cal-main">
                <h4>{e.title} <span className={`tag impact-${e.impact}`}>{e.impact}</span></h4>
                <p>{fmtTime(e.utc)} IST · {e.assets}</p>
                <small>{e.note}</small>
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted-sm">Connect FMP / ForexFactory API in <code>/api</code> for auto-updating calendar.</p>
    </div>
  );
}
