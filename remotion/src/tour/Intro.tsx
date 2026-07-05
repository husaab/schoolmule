import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { BRAND, EASE, FONT } from '../brand';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  const tag = interpolate(frame, [22, 46], [0, 1], {
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
      <Img src={staticFile('logo.png')} style={{ width: 360, opacity: logo, scale: `${0.85 + logo * 0.15}` }} />
      <div
        style={{
          marginTop: 30,
          fontSize: 44,
          fontWeight: 800,
          color: BRAND.ink,
          letterSpacing: -0.5,
          opacity: tag,
          translate: `0px ${(1 - tag) * 16}px`,
        }}
      >
        Everything your school needs — in one place
      </div>
    </AbsoluteFill>
  );
};
