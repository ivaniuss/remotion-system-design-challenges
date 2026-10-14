// A host is an animated character that presents the video from a corner (like the old
// Office assistant): it talks while the voice talks, points at the puzzle, thinks during
// the countdown, reacts to the answer and waves goodbye. Its animations are pre-rendered
// sprite sheets (characters/<name>/ makes them in Blender).

export const HOST_CLIPS = ['idle', 'talk', 'point', 'think', 'suspicious', 'surprised', 'celebrate', 'wave'] as const;
export type HostClip = (typeof HOST_CLIPS)[number];

export type Mouth = 'closed' | 'half' | 'open';

export type HostClipInfo = {
  frames: number;
  intro: number; // frames from the neutral pose into the clip
  outro: number; // frames back to the neutral pose
  talks: boolean; // has closed/half/open mouth sheets for lip sync
  sheets: Partial<Record<Mouth | 'main', string>>; // paths under public/
};

export type HostManifest = {
  fps: number; // the clips were drawn at this rate (held frames in a 30 fps video)
  size: number; // px of one frame (square)
  cols: number; // frames per row in a sheet
  clips: Record<string, HostClipInfo>;
};
