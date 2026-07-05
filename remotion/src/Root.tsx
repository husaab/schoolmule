import './index.css';
import { AbsoluteFill, Composition } from 'remotion';

// Placeholder — replaced by the FeatureTour composition in a later step.
const Placeholder: React.FC = () => <AbsoluteFill style={{ backgroundColor: '#ffffff' }} />;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Placeholder"
      component={Placeholder}
      durationInFrames={30}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
