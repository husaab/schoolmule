import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Backdrop } from './Backdrop';
import { Dashboard } from './scenes/Dashboard';
import { Attendance } from './scenes/Attendance';
import { ReportCard } from './scenes/ReportCard';
import { Gradebook } from './scenes/Gradebook';
import { Logo } from './scenes/Logo';

const S = 84; // frames per scene
const T = 15; // crossfade frames

export const HeroLoop: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
    <Backdrop />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={S}>
        <Dashboard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S}>
        <Attendance />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S}>
        <ReportCard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S}>
        <Gradebook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={S}>
        <Logo />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
