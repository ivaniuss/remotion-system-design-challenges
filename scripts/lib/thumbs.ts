import path from 'node:path';
import {renderStill, selectComposition} from '@remotion/renderer';
import type {Timeline} from '../../src/timeline/timeline';

// Renders the designed thumbnail of a video: out/<id>/<theme>.thumbnail.png (1280×720,
// YouTube) and out/<id>/<theme>.cover.png (1080×1920, cover of a Short / TikTok).
export const thumbFiles = (tl: Timeline) => ({
  wide: path.join('out', tl.id, `${tl.theme}.thumbnail.png`),
  tall: path.join('out', tl.id, `${tl.theme}.cover.png`),
});

export async function renderThumbnails(serveUrl: string, tl: Timeline, browserExecutable: string | null): Promise<string[]> {
  const files = thumbFiles(tl);
  const out: string[] = [];
  for (const [variant, id, file] of [['wide', 'ThumbWide', files.wide], ['tall', 'ThumbTall', files.tall]] as const) {
    const inputProps = {...tl, variant};
    const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
    await renderStill({composition, serveUrl, output: file, frame: 0, inputProps, browserExecutable});
    out.push(file);
  }
  return out;
}
