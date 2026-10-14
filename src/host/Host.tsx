import React from 'react';
import {getRemotionEnvironment, Img, staticFile} from 'remotion';
import type {Frame} from '../layout/frame';
import type {Timeline} from '../timeline/timeline';
import type {Word} from '../timeline/words';
import {PATO} from './pato';
import {clipFrame, hostTrack, HostSegment, mouthAt, segmentAt} from './track';
import type {HostClip, HostManifest} from './types';

const CHARACTERS: Record<string, HostManifest> = {pato: PATO};

// Remotion's <Img> waits for the image before a frame is rendered, but it needs a
// composition around it; the markup check (scripts/check.tsx) renders without one.
function Picture(props: React.ComponentProps<typeof Img>) {
  const env = getRemotionEnvironment();
  if (env.isRendering || env.isStudio || env.isPlayer) return <Img {...props} />;
  return <img src={props.src} style={props.style} alt="" />;
}

// The host in its corner at time t. The current clip's sheets stay mounted (only the
// current mouth is visible), so lip sync never waits for an image to load.
export const Host: React.FC<{tl: Timeline; t: number; frame: Frame; words: Word[]; track?: HostSegment[]}> = ({tl, t, frame, words, track}) => {
  const box = frame.host;
  if (!box || !tl.host) return null;
  const m = CHARACTERS[tl.host.character] ?? PATO;
  const segs = track ?? hostTrack(tl);
  const seg = segmentAt(segs, t);
  const clip = (m.clips[seg.clip] ? seg.clip : 'idle') as HostClip;
  const info = m.clips[clip];
  const fi = clipFrame(info, m.fps, seg, clip, t);
  const sheet = info.talks ? mouthAt(words, t) : 'main';
  const scale = box.size / m.size;
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y, width: box.size, height: box.size, overflow: 'hidden', transform: box.mirror ? 'scaleX(-1)' : undefined}}>
      {[[clip, info] as const].flatMap(([name, c]) =>
        Object.entries(c.sheets).map(([variant, src]) => {
          const on = name === clip && variant === sheet;
          const rows = Math.ceil(c.frames / m.cols);
          const f = on ? fi : 0;
          return (
            <Picture
              key={`${name}.${variant}`}
              src={staticFile(src as string)}
              style={{
                position: 'absolute',
                left: -(f % m.cols) * box.size,
                top: -Math.floor(f / m.cols) * box.size,
                width: m.cols * m.size * scale,
                height: rows * m.size * scale,
                maxWidth: 'none',
                opacity: on ? 1 : 0,
              }}
            />
          );
        }),
      )}
    </div>
  );
};
