import { AbsoluteFill } from 'remotion';
import { BRAND, FONT } from '../brand';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Caption } from './Caption';
import { Cursor, type Waypoint } from './Cursor';
import type { NavKey } from './nav';

/**
 * Persistent app chrome (sidebar + topbar) shared by every scene, with an
 * optional lower-third caption and an animated cursor overlay.
 *
 * Cursor waypoint coordinates are in full 1920x1080 canvas space. The content
 * area begins at x = sidebarW (240) and y = topbarH (68), plus 32px padding.
 */
export const AppFrame: React.FC<{
  active: NavKey;
  caption?: { text: string; inFrame: number; outFrame: number };
  cursor?: { path: Waypoint[]; clicks?: number[] };
  children: React.ReactNode;
}> = ({ active, caption, cursor, children }) => (
  <AbsoluteFill style={{ background: BRAND.appBg, fontFamily: FONT.body }}>
    <Sidebar active={active} />
    <div
      style={{
        position: 'absolute',
        left: BRAND.sidebarW,
        right: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Topbar />
      <div style={{ flex: 1, padding: 32, overflow: 'hidden' }}>{children}</div>
    </div>
    {caption ? <Caption {...caption} /> : null}
    {cursor ? <Cursor path={cursor.path} clicks={cursor.clicks} /> : null}
  </AbsoluteFill>
);
