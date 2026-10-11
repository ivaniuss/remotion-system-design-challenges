import type {Frame} from '../layout/frame';
import type {Theme} from '../theme';
import type {TimedScene} from '../timeline/timeline';

// Every scene is a pure component of (scene, t). `t` is seconds since the scene began.
export type SceneProps<T extends TimedScene['type']> = {
  scene: Extract<TimedScene, {type: T}>;
  t: number;
  frame: Frame;
  theme: Theme;
  lang: string;
  cta?: string | null;
};
