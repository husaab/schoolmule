import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BRAND, EASE } from '../brand';

const LEN = 1000;

export const Attendance: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = interpolate(frame, [0, 50], [LEN, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  const pct = interpolate(frame, [10, 60], [0, 98.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 760,
          background: '#fff',
          borderRadius: 20,
          border: `1px solid ${BRAND.cardBorder}`,
          padding: 32,
          boxShadow: BRAND.cardShadow,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.navy, marginBottom: 16 }}>
          Attendance Trend
        </div>
        <svg viewBox="0 0 700 220" style={{ width: '100%' }}>
          <polyline
            points="10,190 130,175 250,110 370,60 490,72 640,48"
            fill="none"
            stroke={BRAND.cyan}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={LEN}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 150,
          right: 240,
          fontSize: 60,
          fontWeight: 800,
          color: BRAND.teal,
        }}
      >
        {pct.toFixed(1)}%
      </div>
    </AbsoluteFill>
  );
};
