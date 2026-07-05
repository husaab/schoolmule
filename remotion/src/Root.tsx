import './index.css';
import { Composition } from 'remotion';
import { FeatureTour, TOTAL_FRAMES } from './FeatureTour';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FeatureTour"
      component={FeatureTour}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
