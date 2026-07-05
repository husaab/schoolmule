export const BRAND = {
  cyan: '#06b6d4',
  teal: '#0891b2',
  navy: '#0f172a',
  cardBorder: '#e2e8f0',
  bgTop: '#ecfeff',
  bgMid: '#ffffff',
  bgBottom: '#f8fafc',
  grid: 'rgba(8,145,178,0.06)',
  cardShadow: '0 24px 60px -20px rgba(8,145,178,0.35)',
} as const;

// easeOutExpo-ish; used across all scenes for consistent motion
export const EASE = [0.16, 1, 0.3, 1] as const;
