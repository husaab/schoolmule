import { Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  BarChart3,
  ScrollText,
  Ruler,
  TrendingUp,
} from 'lucide-react';
import { BRAND, EASE, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Card, StatCard } from '../kit/Panel';
import { CountUp } from '../kit/CountUp';

interface Stat {
  label: string;
  icon: React.ReactNode;
  tint: string;
  tintBg: string;
  render: (startFrame: number) => React.ReactNode;
}

const num = (to: number, fmt: (v: number) => string) => (sf: number) =>
  <CountUp to={to} startFrame={sf} durFrames={36} format={fmt} />;

const STATS: Stat[] = [
  { label: 'Total Students', icon: <Users size={24} />, tint: BRAND.blue, tintBg: '#eff6ff', render: num(159, (v) => `${Math.round(v)}`) },
  { label: 'Total Teachers', icon: <GraduationCap size={24} />, tint: '#7c3aed', tintBg: '#f5f3ff', render: num(17, (v) => `${Math.round(v)}`) },
  { label: 'Total Classes', icon: <BookOpen size={24} />, tint: BRAND.green, tintBg: '#f0fdf4', render: num(173, (v) => `${Math.round(v)}`) },
  { label: "Today's Attendance", icon: <CalendarX size={24} />, tint: BRAND.teal, tintBg: BRAND.tealSoft, render: () => 'N/A' },
  { label: 'Weekly Attendance', icon: <CalendarCheck size={24} />, tint: BRAND.amber, tintBg: BRAND.amberSoft, render: num(98.1, (v) => `${v.toFixed(1)}%`) },
  { label: 'Monthly Attendance', icon: <CalendarClock size={24} />, tint: BRAND.red, tintBg: '#fef2f2', render: num(98.1, (v) => `${v.toFixed(1)}%`) },
  { label: 'Avg. Grade', icon: <BarChart3 size={24} />, tint: BRAND.blue, tintBg: '#eff6ff', render: num(75.4, (v) => `${v.toFixed(1)}%`) },
  { label: 'Report Cards', icon: <ScrollText size={24} />, tint: BRAND.green, tintBg: '#f0fdf4', render: num(10, (v) => `${Math.round(v)}`) },
  { label: 'Avg. Class Size', icon: <Ruler size={24} />, tint: BRAND.amber, tintBg: BRAND.amberSoft, render: num(16.1, (v) => v.toFixed(1)) },
];

export const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [70, 130], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });

  return (
    <AppFrame active="dashboard" caption={{ text: 'Your whole school at a glance', inFrame: 16, outFrame: 290 }}>
      <div style={{ fontSize: 34, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>
        Welcome back, SchoolMule
      </div>
      <div style={{ fontSize: 16, color: BRAND.slate, marginTop: 4, marginBottom: 22 }}>
        Here&apos;s what&apos;s happening at Al Haadi Academy today.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {STATS.map((s, i) => {
          const sf = 6 + i * 4;
          const p = interpolate(frame, [sf, sf + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(...EASE),
          });
          return (
            <div key={s.label} style={{ opacity: p, translate: `0px ${(1 - p) * 14}px` }}>
              <StatCard label={s.label} value={s.render(sf + 4)} icon={s.icon} tint={s.tint} tintBg={s.tintBg} />
            </div>
          );
        })}
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <TrendingUp size={22} color={BRAND.teal} />
          <span style={{ fontSize: 20, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>
            Attendance Trend
          </span>
        </div>
        <div style={{ fontSize: 13, color: BRAND.slate400, marginBottom: 8 }}>Attendance patterns over time</div>
        <svg viewBox="0 0 1500 260" style={{ width: '100%', height: 220 }}>
          <polyline
            points="20,230 260,225 500,120 740,70 980,66 1220,60 1480,58"
            fill="none"
            stroke={BRAND.teal}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1600}
            strokeDashoffset={line * 1600}
          />
        </svg>
      </Card>
    </AppFrame>
  );
};
