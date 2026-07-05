import './index.css';
import { Composition } from 'remotion';
import { SceneGradebook } from './tour/SceneGradebook';

// Temporary single-scene preview composition; FeatureTour is wired in a later step.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SceneGradebook"
      component={SceneGradebook}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
