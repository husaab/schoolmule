import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { MousePointer2 } from 'lucide-react';
import { BRAND, EASE } from '../brand';

export interface Waypoint {
  x: number;
  y: number;
  at: number; // frame at which the cursor reaches this point
}

/**
 * Animated pointer that eases through a list of waypoints and renders a click
 * "pulse" ring at the cursor's position on each frame in `clicks`.
 */
export const Cursor: React.FC<{ path: Waypoint[]; clicks?: number[] }> = ({ path, clicks = [] }) => {
  const frame = useCurrentFrame();
  const frames = path.map((p) => p.at);

  const posAt = (f: number) => ({
    x: interpolate(f, frames, path.map((p) => p.x), {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(...EASE),
    }),
    y: interpolate(f, frames, path.map((p) => p.y), {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(...EASE),
    }),
  });

  const { x, y } = posAt(frame);

  return (
    <>
      {clicks.map((cf, i) => {
        if (frame < cf || frame > cf + 20) return null;
        const p = interpolate(frame, [cf, cf + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const c = posAt(cf);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c.x - 22,
              top: c.y - 22,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `3px solid ${BRAND.teal}`,
              opacity: 1 - p,
              scale: `${0.3 + p}`,
            }}
          />
        );
      })}
      <div style={{ position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}>
        <MousePointer2 size={30} color="#0f172a" fill="#ffffff" strokeWidth={1.5} />
      </div>
    </>
  );
};
