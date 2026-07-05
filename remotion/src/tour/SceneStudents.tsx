import { useCurrentFrame } from 'remotion';
import { Search, Plus, Eye, Pencil, Trash2, User, GraduationCap } from 'lucide-react';
import { BRAND, FONT } from '../brand';
import { AppFrame } from '../kit/AppFrame';
import { Button, Card, PageTitle } from '../kit/Panel';

const ROWS = [
  { name: 'Amanda Lopez', grade: 'Grade 6' },
  { name: 'David Martinez', grade: 'Grade 4' },
  { name: 'Michael Brown', grade: 'Grade 1' },
  { name: 'Jessica Garci', grade: 'Grade 2' },
  { name: 'John Smit', grade: 'Grade 3' },
  { name: 'Test Student', grade: 'Grade 1' },
  { name: 'William Wilso', grade: 'Grade 4' },
];

const TYPE_START = 40;
const QUERY = 'Amanda';

export const SceneStudents: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.max(0, Math.min(QUERY.length, Math.floor(((frame - TYPE_START) / 30) * 16)));
  const typed = QUERY.slice(0, chars);
  const rows = typed ? ROWS.filter((r) => r.name.toLowerCase().includes(typed.toLowerCase())) : ROWS;

  return (
    <AppFrame
      active="students"
      caption={{ text: 'Student information, organized', inFrame: 16, outFrame: 290 }}
      cursor={{
        path: [
          { x: 900, y: 250, at: 0 },
          { x: 520, y: 300, at: 32 }, // search box
          { x: 520, y: 300, at: 120 },
          { x: 1760, y: 210, at: 150 }, // Add Student
        ],
        clicks: [150],
      }}
    >
      <PageTitle title="Students Management" subtitle="Manage student records and information for your school." centered />

      <Card style={{ padding: 24 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>Student Directory</div>
            <div style={{ fontSize: 14, color: BRAND.slate400 }}>View and manage all student records</div>
          </div>
          <Button variant="green"><Plus size={18} color="#fff" /> Add Student</Button>
        </div>

        {/* search + filter */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: `1px solid ${typed ? BRAND.teal : BRAND.cardBorder}`,
              borderRadius: 10,
              padding: '12px 14px',
              color: typed ? BRAND.ink : BRAND.slate400,
              fontSize: 15,
            }}
          >
            <Search size={18} color={BRAND.slate400} />
            {typed || 'Search by name...'}
          </div>
          <div
            style={{
              flex: 1,
              border: `1px solid ${BRAND.cardBorder}`,
              borderRadius: 10,
              padding: '12px 14px',
              color: BRAND.slate,
              fontSize: 15,
            }}
          >
            All Grades
          </div>
        </div>

        {/* table */}
        <div style={{ display: 'flex', padding: '10px 8px', color: BRAND.slate400, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${BRAND.cardBorder}` }}>
          <div style={{ width: 360 }}>Student Name</div>
          <div style={{ width: 200 }}>Grade</div>
          <div style={{ width: 220 }}>OEN</div>
          <div style={{ width: 260 }}>Homeroom Teacher</div>
          <div style={{ width: 240 }}>Parent Contact</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Actions</div>
        </div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', padding: '14px 8px', borderBottom: `1px solid ${BRAND.line}`, fontSize: 15 }}>
            <div style={{ width: 360, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: BRAND.ink }}>
              <User size={18} color={BRAND.slate400} /> {r.name}
            </div>
            <div style={{ width: 200, display: 'flex', alignItems: 'center', gap: 6, color: BRAND.slate }}>
              <GraduationCap size={16} color={BRAND.slate400} /> {r.grade}
            </div>
            <div style={{ width: 220, color: BRAND.slate }}>751-964-859</div>
            <div style={{ width: 260, color: BRAND.slate400 }}>Not Assigned</div>
            <div style={{ width: 240, color: BRAND.slate400 }}>No Contact</div>
            <div style={{ flex: 1, display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
              <Eye size={18} color={BRAND.blue} />
              <Pencil size={18} color={BRAND.green} />
              <Trash2 size={18} color={BRAND.red} />
            </div>
          </div>
        ))}
      </Card>
    </AppFrame>
  );
};
