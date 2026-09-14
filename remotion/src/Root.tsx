import './index.css';
import { Composition } from 'remotion';
import { FeatureTour, TOTAL_FRAMES } from './FeatureTour';
import { FinanceVideo } from './finance/FinanceVideo';
import { TOTAL_FRAMES as FINANCE_FRAMES } from './finance/timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FeatureTour"
        component={FeatureTour}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AlHaadiFinanceGuide"
        component={FinanceVideo}
        durationInFrames={FINANCE_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
