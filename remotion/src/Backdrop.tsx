import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { BRAND } from './brand';

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const pan = ((frame % 240) / 240) * 48;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgMid} 42%, ${BRAND.bgBottom} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${BRAND.grid} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.grid} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: `${pan}px ${pan}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          filter: 'blur(120px)',
          background: '#a5f3fc',
          opacity: 0.35,
          left: -120,
          top: -160,
          translate: `0px ${Math.sin(frame / 40) * 20}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          filter: 'blur(130px)',
          background: '#fde68a',
          opacity: 0.28,
          right: -140,
          bottom: -200,
          translate: `0px ${Math.cos(frame / 45) * 20}px`,
        }}
      />
      <Img
        src={staticFile('mulelogo.png')}
        style={{ position: 'absolute', right: -40, bottom: -60, width: 520, opacity: 0.05 }}
      />
    </AbsoluteFill>
  );
};
