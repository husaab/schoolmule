import { useCurrentFrame } from 'remotion';
import { Check, Calendar, Search } from 'lucide-react';
import { BRAND, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, PageTitle } from '../kit/Panel';

type Status = 'PRESENT' | 'LATE' | 'ABSENT';
const OPTS: Status[] = ['PRESENT', 'LATE', 'ABSENT'];
const COLOR: Record<Status, string> = { PRESENT: BRAND.green, LATE: BRAND.amber, ABSENT: BRAND.red };

interface Row {
  name: string;
  grade: string;
  status: Status;
  at: number;
}
const GROUPS: { grade: string; rows: Row[] }[] = [
  {
    grade: 'Grade 4',
    rows: [
      { name: 'David Martinez', grade: 'Grade 4', status: 'PRESENT', at: 45 },
      { name: 'William Wilso', grade: 'Grade 4', status: 'LATE', at: 80 },
    ],
  },
  { grade: 'Grade 5', rows: [{ name: 'huser', grade: 'Grade 5', status: 'PRESENT', at: 115 }] },
  { grade: 'Grade 6', rows: [{ name: 'Amanda Lopez', grade: 'Grade 6', status: 'ABSENT', at: 150 }] },
];

const StatusCheck: React.FC<{ opt: Status; on: boolean }> = ({ opt, on }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 5,
        border: `2px solid ${on ? COLOR[opt] : BRAND.cardBorder}`,
        background: on ? COLOR[opt] : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <Check size={15} color="#fff" /> : null}
    </div>
    <span style={{ fontSize: 14, fontWeight: on ? 700 : 500, color: on ? COLOR[opt] : BRAND.slate400 }}>{opt}</span>
  </div>
);

export const SceneAttendance: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AppFrame
      active="attendance"
      caption={{ text: 'Take attendance in seconds', inFrame: 16, outFrame: 290 }}
      cursor={{
        path: [
          { x: 900, y: 250, at: 0 },
          { x: 1450, y: 430, at: 42 },
          { x: 1560, y: 494, at: 78 },
          { x: 1450, y: 606, at: 112 },
          { x: 1660, y: 706, at: 148 },
          { x: 960, y: 980, at: 180 }, // Save All Changes
        ],
        clicks: [45, 80, 115, 150, 182],
      }}
    >
      <PageTitle title="General Attendance" subtitle="Track daily attendance for all students" centered />

      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>Student Attendance</div>
            <div style={{ fontSize: 14, color: BRAND.slate400 }}>Mark attendance for Jul 23, 2025</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 10, padding: '10px 14px', color: BRAND.slate }}>
            <Calendar size={17} color={BRAND.slate400} /> 07/24/2025
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 10, padding: '12px 14px', color: BRAND.slate400, fontSize: 15 }}>
            <Search size={18} color={BRAND.slate400} /> Search by name...
          </div>
          <div style={{ flex: 1, border: `1px solid ${BRAND.cardBorder}`, borderRadius: 10, padding: '12px 14px', color: BRAND.slate, fontSize: 15 }}>All Grades</div>
        </div>

        {GROUPS.map((g) => (
          <div key={g.grade}>
            <div style={{ background: BRAND.teal2, color: '#fff', borderRadius: 10, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, margin: '10px 0' }}>
              <span>{g.grade}</span>
              <span style={{ opacity: 0.9, fontWeight: 600 }}>{g.rows.length} students</span>
            </div>
            {g.rows.map((r) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BRAND.line}`, borderRadius: 10, padding: '13px 18px', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.ink }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: BRAND.slate400 }}>{r.grade}</div>
                </div>
                <div style={{ display: 'flex', gap: 26 }}>
                  {OPTS.map((o) => (
                    <StatusCheck key={o} opt={o} on={o === r.status && frame >= r.at} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <Button variant="green" style={{ fontSize: 17, padding: '14px 28px' }}>Save All Changes</Button>
      </div>
    </AppFrame>
  );
};
