import { HelpCircle, Mail } from 'lucide-react';
import { BRAND, FONT } from '../brand';

export const Topbar: React.FC = () => {
  return (
    <div
      style={{
        height: BRAND.topbarH,
        borderBottom: `1px solid ${BRAND.cardBorder}`,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        fontFamily: FONT.body,
      }}
    >
      {/* school identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: BRAND.tealSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.display,
            fontWeight: 800,
            color: BRAND.teal2,
            fontSize: 16,
          }}
        >
          AH
        </div>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: BRAND.ink, fontFamily: FONT.display }}>
            Al Haadi Academy
          </div>
          <div style={{ fontSize: 12, color: BRAND.slate400 }}>Administrator</div>
        </div>
      </div>

      {/* right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, color: BRAND.slate }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <HelpCircle size={17} color={BRAND.slate} /> Help
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <Mail size={17} color={BRAND.slate} /> Contact
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: BRAND.teal,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: FONT.display,
          }}
        >
          S
        </div>
      </div>
    </div>
  );
};
