import { loadFont as loadOutfit } from '@remotion/google-fonts/Outfit';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';

const { fontFamily: outfit } = loadOutfit();
const { fontFamily: roboto } = loadRoboto();

export const FONT = {
  display: outfit, // headings, captions, buttons
  body: roboto, // tables, labels, body text
} as const;

export const BRAND = {
  // primary
  cyan: '#06b6d4',
  teal: '#0891b2',
  teal2: '#0e7490',
  tealSoft: '#ecfeff', // active nav pill / soft chips
  navy: '#0f172a',

  // status
  green: '#16a34a',
  greenDeep: '#059669',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  red: '#dc2626',
  blue: '#2563eb', // links / grade cell values

  // surfaces
  appBg: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  line: '#eef2f6',
  cardShadow: '0 10px 30px -18px rgba(15,23,42,0.25)',

  // text
  ink: '#0f172a',
  slate: '#475569',
  slate400: '#94a3b8',

  // layout
  sidebarW: 240,
  topbarH: 68,
} as const;

// easeOutExpo-ish; shared across all motion
export const EASE = [0.16, 1, 0.3, 1] as const;

// timing (30fps)
export const FPS = 30;
export const XFADE = 12; // crossfade frames between scenes
