'use client';

import { Timeframe } from '@/lib/types';
import { ALL_TIMEFRAMES, TIMEFRAME_LABELS } from '@/lib/weights';

interface TimeframeTabsProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export default function TimeframeTabs({ active, onChange }: TimeframeTabsProps) {
  return (
    <div className="timeframe-tabs">
      {ALL_TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`timeframe-tab ${active === tf ? 'active' : ''}`}
          onClick={() => onChange(tf)}
        >
          <span className="tab-label">{TIMEFRAME_LABELS[tf]}</span>
          <span className="tab-short">{tf}</span>
        </button>
      ))}
    </div>
  );
}
