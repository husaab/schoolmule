import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BRAND, EASE } from '../brand';

const ROW_WIDTHS = ['100%', '86%', '70%'];

export const ReportCard: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [40, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 560,
          background: '#fff',
          borderRadius: 20,
          border: `1px solid ${BRAND.cardBorder}`,
          padding: 36,
          boxShadow: BRAND.cardShadow,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.navy, marginBottom: 22 }}>
          Report Card
        </div>
        {ROW_WIDTHS.map((w, r) => {
          const p = interpolate(frame, [r * 8, r * 8 + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(...EASE),
          });
          return (
            <div
              key={r}
              style={{ height: 14, borderRadius: 7, background: '#e2e8f0', marginBottom: 14, width: w }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  borderRadius: 7,
                  background: BRAND.cyan,
                  transformOrigin: 'left',
                  scale: `${p} 1`,
                }}
              />
            </div>
          );
        })}
        <div
          style={{
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: stamp,
            transformOrigin: 'left',
            scale: `${1.3 - stamp * 0.3}`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#059669',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <span style={{ fontWeight: 700, color: '#059669', fontSize: 20 }}>Grade 5 — Complete</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
