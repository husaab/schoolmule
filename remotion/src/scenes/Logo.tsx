import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { EASE } from '../brand';

export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  // fade out over the last frames so the loop back to Dashboard (empty start) is seamless
  const outP = interpolate(frame, [64, 84], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Img
        src={staticFile('mulelogo.png')}
        style={{ width: 380, opacity: inP * outP, scale: `${0.9 + inP * 0.12}` }}
      />
    </AbsoluteFill>
  );
};
