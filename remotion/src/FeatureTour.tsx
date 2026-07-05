import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { XFADE } from './brand';
import { Intro } from './tour/Intro';
import { SceneDashboard } from './tour/SceneDashboard';
import { SceneStudents } from './tour/SceneStudents';
import { SceneGradebook } from './tour/SceneGradebook';
import { SceneReportCards } from './tour/SceneReportCards';
import { SceneAttendance } from './tour/SceneAttendance';
import { SceneAnalytics } from './tour/SceneAnalytics';
import { SceneFinancials } from './tour/SceneFinancials';
import { SceneParents } from './tour/SceneParents';
import { Outro } from './tour/Outro';

const D = {
  intro: 90,
  dashboard: 300,
  students: 300,
  gradebook: 360,
  reportcards: 300,
  attendance: 300,
  analytics: 300,
  financials: 300,
  parents: 270,
  outro: 120,
};

const SCENE_FRAMES = Object.values(D).reduce((a, b) => a + b, 0);
export const TOTAL_FRAMES = SCENE_FRAMES - 9 * XFADE;

const xfade = () => (
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />
);

export const FeatureTour: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
    <Audio
      src={staticFile('music.mp3')}
      volume={(f) =>
        interpolate(f, [0, 24, TOTAL_FRAMES - 45, TOTAL_FRAMES], [0, 0.3, 0.3, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={D.intro}><Intro /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.dashboard}><SceneDashboard /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.students}><SceneStudents /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.gradebook}><SceneGradebook /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.reportcards}><SceneReportCards /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.attendance}><SceneAttendance /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.analytics}><SceneAnalytics /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.financials}><SceneFinancials /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.parents}><SceneParents /></TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={D.outro}><Outro /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
