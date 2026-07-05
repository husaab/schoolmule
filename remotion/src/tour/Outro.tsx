import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ArrowRight } from 'lucide-react';
import { BRAND, EASE, FONT } from '../brand';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  const rest = interpolate(frame, [22, 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BRAND.tealSoft} 0%, #ffffff 55%, ${BRAND.appBg} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.display,
      }}
    >
      <Img src={staticFile('logo.png')} style={{ width: 300, opacity: logo, scale: `${0.85 + logo * 0.15}` }} />
      <div style={{ marginTop: 26, fontSize: 42, fontWeight: 800, color: BRAND.ink, opacity: rest, translate: `0px ${(1 - rest) * 14}px` }}>
        Start your free trial today
      </div>
      <div
        style={{
          marginTop: 26,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: `linear-gradient(90deg, ${BRAND.cyan}, ${BRAND.teal2})`,
          color: '#fff',
          fontSize: 24,
          fontWeight: 700,
          padding: '16px 34px',
          borderRadius: 14,
          opacity: rest,
          boxShadow: '0 18px 40px -12px rgba(8,145,178,0.6)',
        }}
      >
        Start Free Trial <ArrowRight size={24} color="#fff" />
      </div>
      <div style={{ marginTop: 20, fontSize: 18, color: BRAND.slate, opacity: rest }}>schoolmule.ca</div>
    </AbsoluteFill>
  );
};
