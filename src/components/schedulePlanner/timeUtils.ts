// Shared time helpers for the schedule planner (minutes-from-midnight ints).

export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const dayLabel = (day: number, short = false) =>
  (short ? DAY_LABELS_SHORT : DAY_LABELS)[day - 1] ?? `Day ${day}`;

/** 545 -> "9:05 AM" */
export const formatMin = (minutes: number): string => {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
};

/** 545 -> "09:05" (for <input type="time">) */
export const minToTimeStr = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "09:05" -> 545; returns null for invalid input */
export const timeStrToMin = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
};

/** Deterministic pastel background per label (matches the PDF palette). */
const SESSION_COLORS = [
  '#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#ede9fe',
  '#ffedd5', '#cffafe', '#fee2e2', '#d1fae5', '#e0e7ff',
];

export const colorForLabel = (label: string): string => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  return SESSION_COLORS[Math.abs(hash) % SESSION_COLORS.length];
};
