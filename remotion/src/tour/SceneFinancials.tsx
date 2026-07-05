import { interpolate, useCurrentFrame } from 'remotion';
import { Plus, User, Pencil, Trash2 } from 'lucide-react';
import { BRAND, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, PageTitle, Badge } from '../kit/Panel';

const CLICK = 110;
const PLANS = [
  { grade: 'Grade 1', amount: '$300', freq: 'Monthly', period: '7/17/2025 - 4/17/2026' },
  { grade: 'Grade 2', amount: '$800', freq: 'Monthly', period: '7/16/2025 - 7/17/2026' },
];
const INVOICES = [
  { name: 'Majida Shouaib', grade: 'Grade 2', period: 'Aug 2025', due: '$800', date: '8/28/2025' },
  { name: 'Jessica Garci', grade: 'Grade 2', period: 'Aug 2025', due: '$800', date: '8/28/2025' },
  { name: 'David Martinez', grade: 'Grade 4', period: 'Aug 2025', due: '$600', date: '8/28/2025' },
];

export const SceneFinancials: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AppFrame
      active="financials"
      caption={{ text: 'Tuition & invoicing, handled', inFrame: 16, outFrame: 290 }}
      cursor={{
        path: [
          { x: 900, y: 250, at: 0 },
          { x: 1430, y: 690, at: CLICK - 8 }, // Generate Invoices
        ],
        clicks: [CLICK],
      }}
    >
      <PageTitle title="Tuition Management" subtitle="Manage tuition plans and billing for your school." centered />

      {/* plans */}
      <Card style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>Tuition Plans</div>
            <div style={{ fontSize: 13, color: BRAND.slate400 }}>Manage pricing plans by grade level</div>
          </div>
          <Button variant="green"><Plus size={17} color="#fff" /> Add Tuition Plan</Button>
        </div>
        <div style={{ display: 'flex', padding: '8px 4px', fontSize: 12, fontWeight: 700, color: BRAND.slate400, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${BRAND.cardBorder}` }}>
          <div style={{ width: 220 }}>Grade</div>
          <div style={{ width: 220 }}>Amount</div>
          <div style={{ width: 260 }}>Frequency</div>
          <div style={{ flex: 1 }}>Effective Period</div>
          <div style={{ width: 120, textAlign: 'right' }}>Actions</div>
        </div>
        {PLANS.map((p) => (
          <div key={p.grade} style={{ display: 'flex', alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${BRAND.line}`, fontSize: 15, color: BRAND.ink }}>
            <div style={{ width: 220, fontWeight: 600 }}>{p.grade}</div>
            <div style={{ width: 220 }}>{p.amount}</div>
            <div style={{ width: 260, color: BRAND.slate }}>{p.freq}</div>
            <div style={{ flex: 1, color: BRAND.slate }}>{p.period}</div>
            <div style={{ width: 120, display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
              <Pencil size={17} color={BRAND.green} />
              <Trash2 size={17} color={BRAND.red} />
            </div>
          </div>
        ))}
      </Card>

      {/* invoices */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>Tuition Invoices</div>
            <div style={{ fontSize: 13, color: BRAND.slate400 }}>Manage student billing and payments</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="blue"><Plus size={16} color="#fff" /> Generate Invoices</Button>
            <Button variant="green"><User size={16} color="#fff" /> Individual Invoice</Button>
          </div>
        </div>
        <div style={{ display: 'flex', padding: '8px 4px', fontSize: 12, fontWeight: 700, color: BRAND.slate400, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${BRAND.cardBorder}` }}>
          <div style={{ width: 260 }}>Student</div>
          <div style={{ width: 150 }}>Grade</div>
          <div style={{ width: 200 }}>Billing Period</div>
          <div style={{ width: 170 }}>Amount Due</div>
          <div style={{ width: 170 }}>Due Date</div>
          <div style={{ flex: 1 }}>Status</div>
        </div>
        {INVOICES.map((inv, i) => {
          const sf = CLICK + 12 + i * 10;
          const p = interpolate(frame, [sf, sf + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={inv.name} style={{ display: 'flex', alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${BRAND.line}`, fontSize: 15, color: BRAND.ink, opacity: p, translate: `0px ${(1 - p) * 10}px` }}>
              <div style={{ width: 260, fontWeight: 600 }}>{inv.name}</div>
              <div style={{ width: 150, color: BRAND.slate }}>{inv.grade}</div>
              <div style={{ width: 200, color: BRAND.slate }}>{inv.period}</div>
              <div style={{ width: 170 }}>{inv.due}</div>
              <div style={{ width: 170, color: BRAND.slate }}>{inv.date}</div>
              <div style={{ flex: 1 }}><Badge color="#92400e" bg={BRAND.amberSoft}>Pending</Badge></div>
            </div>
          );
        })}
        {frame < CLICK + 12 ? (
          <div style={{ padding: '28px 4px', textAlign: 'center', color: BRAND.slate400, fontSize: 15 }}>
            No invoices yet — generate to get started.
          </div>
        ) : null}
      </Card>
    </AppFrame>
  );
};
