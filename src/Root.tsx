import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import './fonts';
import {Video} from './video/Video';
import type {Timeline} from './timeline/timeline';
import type {Format} from './layout/frame';
import preview from './generated/preview.json';

// Two compositions share the same timeline. `npm run make` writes the timeline
// file and renders; `npm run dev` previews the last one in src/generated/preview.json.
type Props = Timeline & {format: Format};

const metadata: CalculateMetadataFunction<Props> = ({props}) => ({
  durationInFrames: Math.max(1, Math.ceil(props.duration * props.fps)),
  fps: props.fps,
});

const base = preview as unknown as Timeline;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Vertical"
      component={Video}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={{...base, format: 'vertical' as Format}}
      calculateMetadata={metadata}
    />
    <Composition
      id="Horizontal"
      component={Video}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={300}
      defaultProps={{...base, format: 'horizontal' as Format}}
      calculateMetadata={metadata}
    />
  </>
);
