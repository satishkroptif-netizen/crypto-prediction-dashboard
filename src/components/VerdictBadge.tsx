import { VerdictLabel } from '@/lib/types';

const VERDICT_CONFIG: Record<VerdictLabel, { color: string; bg: string; border: string }> = {
  'Strong Sell': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  'Sell': { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)' },
  'Neutral': { color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)' },
  'Buy': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  'Strong Buy': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
};

export default function VerdictBadge({ verdict, size = 'md' }: { verdict: VerdictLabel; size?: 'sm' | 'md' | 'lg' }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['Neutral'];

  return (
    <span
      className={`verdict-badge verbatim-badge-${size}`}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
    >
      {verdict}
    </span>
  );
}
