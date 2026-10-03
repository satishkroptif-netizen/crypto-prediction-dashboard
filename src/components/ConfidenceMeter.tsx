interface ConfidenceMeterProps {
  confidence: number;
}

export default function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, confidence));
  const color =
    clamped >= 70 ? '#22c55e' :
    clamped >= 50 ? '#eab308' :
    clamped >= 30 ? '#f97316' : '#ef4444';

  return (
    <div className="confidence-meter">
      <div className="confidence-label">
        <span>Confidence</span>
        <span style={{ color }}>{clamped}%</span>
      </div>
      <div className="confidence-bar-bg">
        <div
          className="confidence-bar-fill"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
