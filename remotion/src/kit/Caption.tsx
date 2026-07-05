import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { BRAND, EASE, FONT } from '../brand';

/**
 * Lower-third caption chip. Fades/slides in at inFrame, out at outFrame.
 * Positioned relative to the full 1080p frame (centered near the bottom).
 */
export const Caption: React.FC<{ text: string; inFrame: number; outFrame: number }> = ({
  text,
  inFrame,
  outFrame,
}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [inFrame, inFrame + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  const disappear = interpolate(frame, [outFrame - 12, outFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(appear, disappear);
  const y = (1 - appear) * 24;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 54,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        translate: `0px ${y}px`,
      }}
    >
      <div
        style={{
          background: 'rgba(8,145,178,0.95)',
          color: '#fff',
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: -0.3,
          padding: '14px 34px',
          borderRadius: 999,
          boxShadow: BRAND.cardShadow,
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
