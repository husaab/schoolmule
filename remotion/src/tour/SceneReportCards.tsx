import { interpolate, useCurrentFrame } from 'remotion';
import { Check, ChevronDown, CheckSquare, CircleCheck } from 'lucide-react';
import { BRAND, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, PageTitle } from '../kit/Panel';

const CLICK = 120;
const GROUP = [
  { name: 'John Smit', grade: 'Grade 3' },
  { name: 'Christopher Hernande', grade: 'Grade 3' },
  { name: 'Hussein Majid', grade: 'Grade 3' },
  { name: 'Test Student 2', grade: 'Grade 3' },
];

const Dropdown: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.ink, marginBottom: 8 }}>{label}</div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: `1px solid ${BRAND.cardBorder}`,
        borderRadius: 10,
        padding: '13px 14px',
        fontSize: 15,
        color: BRAND.ink,
      }}
    >
      {value}
      <ChevronDown size={18} color={BRAND.slate400} />
    </div>
  </div>
);

export const SceneReportCards: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [CLICK + 6, CLICK + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const done = progress >= 1;
  const generating = frame >= CLICK + 6;

  return (
    <AppFrame
      active="reportcards"
      caption={{ text: 'Report cards in one click', inFrame: 16, outFrame: 290 }}
      cursor={{
        path: [
          { x: 900, y: 250, at: 0 },
          { x: 960, y: 900, at: CLICK - 8 }, // Generate button (bottom center)
        ],
        clicks: [CLICK],
      }}
    >
      <PageTitle title="Generate Report Cards" subtitle="Select students and generate report cards for the selected term" centered />

      <Card style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <Dropdown label="Select term:" value="Term 1 (2025-2026) - Active" />
          <Dropdown label="Or select specific grade:" value="-- All Grades --" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: BRAND.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: BRAND.ink }}>Generate Report Cards for All Students</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: BRAND.slate, fontSize: 14, marginBottom: 18 }}>
          <span>Selected: 23 students</span>
          <span style={{ color: BRAND.blue }}>Clear selection</span>
        </div>

        {/* grade group */}
        <div style={{ background: BRAND.teal2, color: '#fff', borderRadius: 10, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 10 }}>
          <span>Grade 3</span>
          <span style={{ opacity: 0.9, fontWeight: 600 }}>5 students</span>
        </div>
        {GROUP.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BRAND.line}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.ink }}>{s.name}</div>
              <div style={{ fontSize: 13, color: BRAND.slate400 }}>{s.grade}</div>
            </div>
            <CheckSquare size={20} color={BRAND.slate400} />
          </div>
        ))}
      </Card>

      {/* generate button / progress */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        {!generating ? (
          <Button variant="teal" style={{ fontSize: 18, padding: '15px 30px' }}>Generate 23 Report Cards</Button>
        ) : (
          <div style={{ width: 460, textAlign: 'center' }}>
            {done ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: BRAND.green, fontSize: 20, fontWeight: 700, fontFamily: FONT.display }}>
                <CircleCheck size={26} color={BRAND.green} /> 23 report cards generated
              </div>
            ) : (
              <>
                <div style={{ fontSize: 15, color: BRAND.slate, marginBottom: 8 }}>
                  Generating report cards… {Math.round(progress * 23)}/23
                </div>
                <div style={{ height: 12, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: BRAND.teal, borderRadius: 999 }} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppFrame>
  );
};
