import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { EASE } from '../brand';

const COLS = 6;
const ROWS = 3;

export const Gradebook: React.FC = () => {
  const frame = useCurrentFrame();
  const cells = Array.from({ length: COLS * ROWS });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 84px)`, gap: 12 }}>
        {cells.map((_, i) => {
          const delay = (i % COLS) * 3 + Math.floor(i / COLS) * 4;
          const p = interpolate(frame, [delay, delay + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(...EASE),
          });
          return (
            <div
              key={i}
              style={{ height: 54, borderRadius: 8, background: `rgba(6,182,212,${0.12 + p * 0.78})` }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
