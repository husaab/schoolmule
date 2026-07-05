import { useCurrentFrame } from 'remotion';

/**
 * Reveals `text` character-by-character starting at `startFrame`.
 * `cps` = characters per second (at 30fps).
 */
export const Typewriter: React.FC<{
  text: string;
  startFrame: number;
  cps?: number;
  caret?: boolean;
}> = ({ text, startFrame, cps = 18, caret = false }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const shown = Math.min(text.length, Math.floor((elapsed / 30) * cps));
  const done = shown >= text.length;
  const blink = caret && !done && Math.floor(frame / 8) % 2 === 0;
  return (
    <span>
      {text.slice(0, shown)}
      {caret && !done ? <span style={{ opacity: blink ? 1 : 0.2 }}>|</span> : null}
    </span>
  );
};
