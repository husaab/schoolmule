import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { ArrowLeft, Check, ClipboardList, Download, TrendingUp, Users, Save } from 'lucide-react';
import { BRAND, EASE, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, StatCard, Badge } from '../kit/Panel';
import { CountUp } from '../kit/CountUp';

const ASSESSMENTS = ['Classwork', 'Homework', 'Quiz', 'Exam', 'Unit Test'];

interface Row {
  name: string;
  cells: string[]; // one per assessment; '' = ungraded
  total: string;
}

const ROWS: Row[] = [
  { name: 'Ali Raed Al Waeli', cells: ['5.0/5', '10.0/10', '16.9/20', '', '24.5/30'], total: '56.4%' },
  { name: 'Amir Bassam Mokdad', cells: ['5.0/5', '10.0/10', '13.1/20', '', '19.8/30'], total: '47.8%' },
  { name: 'Aya Chakroun', cells: ['5.0/5', '10.0/10', '14.0/20', '', '23.1/30'], total: '52.2%' },
  { name: 'Fatima Khsheish', cells: ['5.0/5', '10.0/10', '20.0/20', '', '27.4/30'], total: '62.4%' },
  { name: 'Hasnain Haider Zaidi', cells: ['5.0/5', '10.0/10', '16.5/20', '', '26.5/30'], total: '58.1%' },
  { name: 'Lana Jaafar', cells: ['5.0/5', '10.0/10', '19.0/20', '', '27.0/30'], total: '61.0%' },
  { name: 'Madina Nori', cells: ['5.0/5', '10.0/10', '17.4/20', '', '24.5/30'], total: '56.9%' },
];

// column layout (px, within the table card)
const NAME_W = 360;
const COL_W = 150;
const TOTAL_W = 120;
const PROG_W = 130;

export const SceneGradebook: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(...EASE),
  });

  // interaction timeline (local frames)
  const CLICK_CELL = 55;
  const TYPE_START = 62;
  const UPDATE_START = 92;
  const CLICK_SAVE = 175;
  const saved = frame >= CLICK_SAVE + 6;
  const typedValue = interpolate(frame, [TYPE_START, TYPE_START + 24], [0, 42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cellFilled = frame >= TYPE_START;

  // header class average + unsaved counter
  const unsaved = frame < UPDATE_START ? 0 : saved ? 0 : 1;

  return (
    <AppFrame
      active="gradebook"
      caption={{ text: 'Grades that calculate themselves', inFrame: 20, outFrame: 350 }}
      cursor={{
        path: [
          { x: 900, y: 250, at: 0 },
          { x: 1180, y: 410, at: CLICK_CELL - 5 }, // Exam cell, row 1
          { x: 1180, y: 410, at: CLICK_SAVE - 30 },
          { x: 1690, y: 150, at: CLICK_SAVE - 4 }, // Save Changes button
        ],
        clicks: [CLICK_CELL, CLICK_SAVE],
      }}
    >
      <div style={{ opacity: appear }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ArrowLeft size={26} color={BRAND.slate} />
              <span style={{ fontSize: 32, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>
                English
              </span>
              <Badge color={BRAND.teal2} bg={BRAND.tealSoft}>Grade 8</Badge>
            </div>
            <div style={{ fontSize: 15, color: BRAND.slate, marginTop: 6 }}>
              Term 2 (Feb 1 – Jun 30, 2026)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="teal">Bulk Feedback</Button>
            <Button variant="green">Bulk Progress</Button>
            <Button variant="outline"><Download size={16} color={BRAND.slate} /> Export</Button>
            <Button variant={saved ? 'outline' : 'teal'}>
              {saved ? <><Check size={16} color={BRAND.green} /> Saved</> : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <StatCard label="Students" value="14" tint={BRAND.teal} tintBg={BRAND.tealSoft} icon={<Users size={24} />} />
          <StatCard label="Assessments" value="5" tint={BRAND.blue} tintBg="#eff6ff" icon={<ClipboardList size={24} />} />
          <StatCard
            label="Class Average"
            value={<CountUp to={56.3} from={54.9} startFrame={UPDATE_START} durFrames={40} format={(v) => `${v.toFixed(1)}%`} />}
            tint={BRAND.green}
            tintBg="#f0fdf4"
            icon={<TrendingUp size={24} />}
          />
          <StatCard
            label="Unsaved Changes"
            value={unsaved}
            tint={unsaved ? BRAND.amber : BRAND.slate400}
            tintBg={unsaved ? BRAND.amberSoft : '#f1f5f9'}
            icon={<Save size={24} />}
          />
        </div>

        {/* table */}
        <Card style={{ overflow: 'hidden' }}>
          {/* head */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 24px',
              background: '#f8fafc',
              borderBottom: `1px solid ${BRAND.cardBorder}`,
              fontSize: 13,
              fontWeight: 700,
              color: BRAND.slate400,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            <div style={{ width: NAME_W }}>Student Name</div>
            {ASSESSMENTS.map((a) => (
              <div key={a} style={{ width: COL_W, textAlign: 'center' }}>{a}</div>
            ))}
            <div style={{ width: TOTAL_W, textAlign: 'center' }}>Total</div>
            <div style={{ width: PROG_W, textAlign: 'center' }}>Progress</div>
          </div>

          {/* rows */}
          {ROWS.map((row, ri) => (
            <div
              key={row.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '13px 24px',
                borderBottom: ri < ROWS.length - 1 ? `1px solid ${BRAND.line}` : 'none',
                fontSize: 15,
              }}
            >
              <div style={{ width: NAME_W, fontWeight: 600, color: BRAND.ink }}>{row.name}</div>
              {row.cells.map((c, ci) => {
                const isTarget = ri === 0 && ASSESSMENTS[ci] === 'Exam';
                if (isTarget) {
                  return (
                    <div key={ci} style={{ width: COL_W, textAlign: 'center' }}>
                      <span
                        style={{
                          color: cellFilled ? BRAND.blue : BRAND.slate400,
                          fontWeight: 700,
                          background: frame >= CLICK_CELL && frame < UPDATE_START ? BRAND.tealSoft : 'transparent',
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: frame >= CLICK_CELL && frame < UPDATE_START ? `1px solid ${BRAND.teal}` : '1px solid transparent',
                        }}
                      >
                        {cellFilled ? `${typedValue.toFixed(0)}/50` : '/50'}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={ci} style={{ width: COL_W, textAlign: 'center', color: c ? BRAND.blue : BRAND.slate400, fontWeight: 600 }}>
                    {c || '/20'}
                  </div>
                );
              })}
              <div style={{ width: TOTAL_W, textAlign: 'center', fontWeight: 700, color: BRAND.ink }}>
                {ri === 0 ? (
                  <CountUp to={58.1} from={45.2} startFrame={UPDATE_START} durFrames={40} format={(v) => `${v.toFixed(1)}%`} />
                ) : (
                  row.total
                )}
              </div>
              <div style={{ width: PROG_W, textAlign: 'center' }}>
                <Badge color="#fff" bg={BRAND.green}>Progress</Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
};
