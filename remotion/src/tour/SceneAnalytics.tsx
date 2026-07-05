import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { Sparkles, FileText, TrendingUp, Users, BookOpen, Activity } from 'lucide-react';
import { BRAND, EASE, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, StatCard } from '../kit/Panel';
import { CountUp } from '../kit/CountUp';
import { Typewriter } from '../kit/Typewriter';

const BARS = [
  { g: 'Gr 1', v: 79 },
  { g: 'Gr 2', v: 78 },
  { g: 'Gr 3', v: 82 },
  { g: 'Gr 4', v: 80 },
  { g: 'Gr 5', v: 74 },
  { g: 'Gr 6', v: 81 },
  { g: 'Gr 7', v: 84 },
  { g: 'Gr 8', v: 83 },
];

const AI_TEXT =
  'Performance dips in Grade 5 (avg 74%), driven by lower Math scores. Overall the school trends strong at 84% — consider targeted support for Grade 5.';

export const SceneAnalytics: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AppFrame active="analytics" caption={{ text: 'Insights & AI, built in', inFrame: 16, outFrame: 290 }}>
      {/* filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Term 2 2025-2026', 'All grades', 'All subjects'].map((f) => (
            <div key={f} style={{ border: `1px solid ${BRAND.cardBorder}`, borderRadius: 9, padding: '9px 14px', fontSize: 14, color: BRAND.slate, background: '#fff' }}>
              {f}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline"><FileText size={16} color={BRAND.slate} /> AI Report</Button>
          <Button variant="teal"><Sparkles size={16} color="#fff" /> Ask AI</Button>
        </div>
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>School Analytics</div>
      <div style={{ fontSize: 14, color: BRAND.slate400, marginBottom: 18 }}>Term 2 2025-2026 · ungraded work skipped</div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="School Average" value={<CountUp to={84.4} startFrame={20} durFrames={40} format={(v) => `${v.toFixed(1)}%`} />} icon={<TrendingUp size={24} />} tint={BRAND.teal} tintBg={BRAND.tealSoft} />
        <StatCard label="School Median" value={<CountUp to={86.1} startFrame={26} durFrames={40} format={(v) => `${v.toFixed(1)}%`} />} icon={<Activity size={24} />} tint={BRAND.green} tintBg="#f0fdf4" />
        <StatCard label="Students" value={<CountUp to={128} startFrame={30} durFrames={40} format={(v) => `${Math.round(v)}`} />} icon={<Users size={24} />} tint={BRAND.blue} tintBg="#eff6ff" />
        <StatCard label="Classes" value={<CountUp to={80} startFrame={34} durFrames={40} format={(v) => `${Math.round(v)}`} />} icon={<BookOpen size={24} />} tint="#7c3aed" tintBg="#f5f3ff" />
      </div>

      {/* two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display, marginBottom: 4 }}>Grade-Level Averages</div>
          <div style={{ fontSize: 13, color: BRAND.slate400, marginBottom: 16 }}>Average of student overall grades per cohort</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 220, paddingLeft: 8 }}>
            {BARS.map((b, i) => {
              const sf = 30 + i * 5;
              const h = interpolate(frame, [sf, sf + 24], [0, b.v / 100], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(...EASE),
              });
              return (
                <div key={b.g} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ width: '70%', height: `${h * 100}%`, background: `linear-gradient(180deg, ${BRAND.cyan}, ${BRAND.teal2})`, borderRadius: '6px 6px 0 0' }} />
                  <div style={{ fontSize: 12, color: BRAND.slate400, marginTop: 8 }}>{b.g}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sparkles size={20} color={BRAND.teal} />
            <span style={{ fontSize: 18, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>AI Insights</span>
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.6, color: BRAND.slate }}>
            <Typewriter text={AI_TEXT} startFrame={70} cps={26} caret />
          </div>
        </Card>
      </div>
    </AppFrame>
  );
};
