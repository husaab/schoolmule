import React from 'react';
import { BRAND, FONT } from '../brand';

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: BRAND.card,
      border: `1px solid ${BRAND.cardBorder}`,
      borderRadius: 16,
      boxShadow: BRAND.cardShadow,
      ...style,
    }}
  >
    {children}
  </div>
);

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tint: string;
  tintBg: string;
}> = ({ label, value, icon, tint, tintBg }) => (
  <Card style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontSize: 13, color: BRAND.slate400, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display, marginTop: 4 }}>
        {value}
      </div>
    </div>
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: tintBg,
        color: tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </div>
  </Card>
);

type BtnVariant = 'teal' | 'green' | 'blue' | 'outline';
const BTN_BG: Record<BtnVariant, string> = {
  teal: BRAND.teal,
  green: BRAND.green,
  blue: BRAND.blue,
  outline: '#ffffff',
};

export const Button: React.FC<{
  children: React.ReactNode;
  variant?: BtnVariant;
  style?: React.CSSProperties;
}> = ({ children, variant = 'teal', style }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 18px',
      borderRadius: 10,
      background: BTN_BG[variant],
      color: variant === 'outline' ? BRAND.slate : '#fff',
      border: variant === 'outline' ? `1px solid ${BRAND.cardBorder}` : 'none',
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: 15,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color: string; bg: string }> = ({
  children,
  color,
  bg,
}) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: FONT.body,
    }}
  >
    {children}
  </span>
);

export const PageTitle: React.FC<{ title: string; subtitle?: string; centered?: boolean }> = ({
  title,
  subtitle,
  centered,
}) => (
  <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: 22 }}>
    <div style={{ fontSize: 34, fontWeight: 800, color: BRAND.ink, fontFamily: FONT.display }}>{title}</div>
    {subtitle ? <div style={{ fontSize: 16, color: BRAND.slate, marginTop: 4 }}>{subtitle}</div> : null}
  </div>
);
