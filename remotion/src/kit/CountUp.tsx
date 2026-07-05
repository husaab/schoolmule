import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { EASE } from '../brand';

/**
 * Counts from `from` to `to` between startFrame and startFrame+durFrames.
 * `format` renders the current numeric value (e.g. v => `${v.toFixed(1)}%`).
 */
export const CountUp: React.FC<{
  to: number;
  from?: number;
  startFrame: number;
  durFrames?: number;
  format: (v: number) => string;
}> = ({ to, from = 0, startFrame, durFrames = 40, format }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [startFrame, startFrame + durFrames], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });
  return <>{format(v)}</>;
};
