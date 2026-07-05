import { Img, staticFile } from 'remotion';
import { BRAND, FONT } from '../brand';
import { NAV_ITEMS, type NavKey } from './nav';

export const Sidebar: React.FC<{ active: NavKey }> = ({ active }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: BRAND.sidebarW,
        background: '#ffffff',
        borderRight: `1px solid ${BRAND.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.body,
      }}
    >
      {/* logo */}
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center' }}>
        <Img src={staticFile('logo.png')} style={{ height: 46, width: 'auto' }} />
      </div>

      {/* nav */}
      <div style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ key, label, Icon, danger }) => {
          const isActive = key === active;
          const color = danger ? BRAND.red : isActive ? BRAND.teal2 : BRAND.slate;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                borderRadius: 10,
                background: isActive ? BRAND.tealSoft : 'transparent',
                color,
                fontSize: 15,
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon size={19} color={color} strokeWidth={2} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* footer user */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${BRAND.line}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
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
            fontFamily: FONT.display,
          }}
        >
          S
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.ink }}>SchoolMule</div>
          <div style={{ fontSize: 11, color: BRAND.slate400, letterSpacing: 0.4 }}>ADMIN</div>
        </div>
      </div>
    </div>
  );
};
