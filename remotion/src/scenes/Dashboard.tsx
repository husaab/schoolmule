import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BRAND, EASE } from '../brand';

const CARDS = [
  { w: 260, h: 150, x: -320, y: -40, delay: 0 },
  { w: 260, h: 150, x: 320, y: -40, delay: 6 },
  { w: 620, h: 180, x: 0, y: 170, delay: 12 },
];

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {CARDS.map((c, i) => {
        const p = interpolate(frame, [c.delay, c.delay + 24], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(...EASE),
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: c.w,
              height: c.h,
              translate: `${c.x}px ${c.y + (1 - p) * 30}px`,
              scale: 0.9 + p * 0.1,
              opacity: p,
              background: '#fff',
              borderRadius: 16,
              border: `1px solid ${BRAND.cardBorder}`,
              boxShadow: BRAND.cardShadow,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
