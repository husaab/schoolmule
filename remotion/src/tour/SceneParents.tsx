import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { BRAND, EASE, FONT } from '../brand';
import { Button, Card } from '../kit/Panel';
import { Caption } from '../kit/Caption';
import { Cursor } from '../kit/Cursor';

const CHILDREN = [
  { name: 'Michael Brown', grade: '1', relation: 'Mother' },
  { name: 'Majida Shouaib', grade: '2', relation: 'father' },
  { name: 'David Martinez', grade: '4', relation: 'father' },
];

export const SceneParents: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BRAND.appBg, fontFamily: FONT.body }}>
      {/* slim top bar */}
      <div style={{ height: BRAND.topbarH, background: '#fff', borderBottom: `1px solid ${BRAND.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
        <Img src={staticFile('logo.png')} style={{ height: 40, width: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: BRAND.slate }}>
          Parent Portal
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: BRAND.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: FONT.display }}>P</div>
        </div>
      </div>

      <div style={{ padding: '40px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>Parent Dashboard</div>
          <div style={{ fontSize: 17, color: BRAND.slate, marginTop: 6 }}>Welcome to your dashboard. View updates for your children below.</div>
        </div>

        {/* communication */}
        <Card style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>Communication</div>
            <div style={{ fontSize: 14, color: BRAND.slate }}>View messages or announcements from the school.</div>
          </div>
          <Button variant="teal">Go to Communication</Button>
        </Card>

        {/* children */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {CHILDREN.map((c, i) => {
            const sf = 10 + i * 8;
            const p = interpolate(frame, [sf, sf + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(...EASE),
            });
            return (
              <div key={c.name} style={{ opacity: p, translate: `0px ${(1 - p) * 16}px` }}>
                <Card style={{ padding: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>{c.name}</div>
                  <div style={{ fontSize: 15, color: BRAND.slate, marginTop: 6 }}>Grade: {c.grade}</div>
                  <div style={{ fontSize: 14, color: BRAND.slate400, fontStyle: 'italic', marginBottom: 18 }}>Relation: {c.relation}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Button variant="blue" style={{ justifyContent: 'center' }}>View Student Assessments &amp; Feedback</Button>
                    <Button variant="green" style={{ justifyContent: 'center' }}>View Report Card</Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <Caption text="Parents stay in the loop" inFrame={16} outFrame={260} />
      <Cursor
        path={[
          { x: 900, y: 250, at: 0 },
          { x: 366, y: 556, at: 100 }, // View Report Card (first child)
        ]}
        clicks={[110]}
      />
    </AbsoluteFill>
  );
};
