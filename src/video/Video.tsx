import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Format, frameFor} from '../layout/frame';
import {globalWords, Timeline} from '../timeline/timeline';
import {VideoFrame} from './VideoFrame';
import {musicVolume, SOUND_SECONDS, soundEvents} from './sound';

// Remotion entry component: turns the frame number into seconds and adds the voice,
// the sound effects and the optional background music.
export const Video: React.FC<Timeline & {format: Format}> = ({format, ...tl}) => {
  const frameNo = useCurrentFrame();
  const {fps} = useVideoConfig();
  const captions = format === 'vertical' ? tl.captions.vertical : tl.captions.horizontal;
  const frame = frameFor(format, captions);
  const words = useMemo(() => globalWords(tl), [tl]);
  const sounds = useMemo(() => (tl.sfx === false ? [] : soundEvents(tl)), [tl]);
  const music = tl.music;
  return (
    <AbsoluteFill>
      <VideoFrame tl={tl} t={frameNo / fps} frame={frame} words={words} />
      {tl.audio.map((a, i) => (
        <Sequence key={`v${i}`} from={Math.round(a.start * fps)} layout="none">
          <Audio src={staticFile(a.src)} />
        </Sequence>
      ))}
      {sounds.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.round(s.t * fps)} durationInFrames={Math.ceil(SOUND_SECONDS[s.kind] * fps)} layout="none">
          <Audio src={staticFile(`sfx/${s.kind}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
      {music && (
        <Audio
          src={staticFile(music.src)}
          loop
          volume={(f) => musicVolume(music.volume, f / fps, tl.duration, words)}
        />
      )}
    </AbsoluteFill>
  );
};
