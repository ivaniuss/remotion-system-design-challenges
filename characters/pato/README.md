# Pato — the host

The duck presenter of the videos (`"host": {"character": "pato"}` in a spec). Everything is
built with Blender's Python API, so the character is code: change a number, re-render.

| File | What it does |
| --- | --- |
| `pato_model.py` | Model (metaball body, beak with hinge, eyes with upper/lower lids, hair strands) and rig (root, body, head, jaw, wings). `build()` returns the duck; `pose(**params)` places it. |
| `animate_pato.py` | The clips: `idle`, `talk`, `point`, `think`, `suspicious`, `surprised`, `celebrate`, `wave`. Each is a function of the frame number (15 fps) with an intro from the neutral pose, a loop and an outro back to it. Talking clips are rendered three times: beak closed, half and open (lip sync picks one per frame). |
| `pack_sprites.py` | Packs the frames into `public/host/pato/<clip>.<mouth>.webp` (8 frames per row, 400 px, transparent) and writes `src/host/pato.ts`. |
| `build_pato.py` | Still renders (front, 3/4, face, back) and `pato.blend` to open in Blender. |

## Re-render

```bash
pip install bpy pillow            # Blender as a Python module (or use blender -b -P <script>)
python3 characters/pato/animate_pato.py                 # ~40 min on 2 CPU cores (430 frames)
python3 characters/pato/animate_pato.py --clips think   # one clip (FORCE=1 overwrites frames)
python3 characters/pato/pack_sprites.py .               # → public/host/pato + src/host/pato.ts
```

`RES` (default 400) and `SAMPLES` (default 14, denoised) set the quality. Frames go to
`characters/pato/frames/` (git-ignored).

## Pose controls

`hop`, `squash`, `yaw`, `lean`, `head_nod` (+ down), `head_tilt`, `head_turn`, `eyes` (0 closed …
0.62 sleepy rest … 1.05 wide), `eye_l` / `eye_r` (one eye), `happy` (lower lid: 0.5 ≈ smiling
eyes), `lid_tilt` (− = skeptical), `beak` (degrees open), `wing_l_up` / `wing_r_up`,
`wing_l_fwd` / `wing_r_fwd`, `wing_l_twist` / `wing_r_twist` (degrees). `R` is the wing on the
left of the picture (the one that points at the content).

## A new clip

1. Write a function in `animate_pato.py` that returns the pose for frame `i` (use `env()` for
   the intro/outro and `ph()` for the loop phase) and add it to `CLIPS`.
2. Render it (`--clips <name>`) and run `pack_sprites.py`.
3. Add the name to `HOST_CLIPS` in `src/host/types.ts`; to make it play by itself, use it in
   `src/host/track.ts`. Specs can already ask for it per scene: `"host": ["<name>"]`.
