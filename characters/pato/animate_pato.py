"""Renders the duck's animated clips (transparent background) for the video host.

Usage:
  python3 animate_pato.py                      # every clip
  python3 animate_pato.py --clips idle,talk    # some clips
  RES=400 SAMPLES=14 python3 animate_pato.py   # FORCE=1 re-renders existing frames
Output: frames/<clip>/<variant>/<nnn>.png (variant = closed|half|open for talking clips,
"main" for the rest). Then: python3 pack_sprites.py <project> → sprite sheets + manifest.

Every clip has an intro (from the neutral pose), a loop and an outro (back to neutral),
so the video can chain clips without jumps: the engine plays the intro, repeats the loop
as long as needed and ends on the outro.
"""
import sys, os, math, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pato_model as pm

FPS = 15
YAW = -14            # faces a little to the left of the picture (mirrored when the host stands on the left)
MOUTH = {"closed": 0.0, "half": 11.0, "open": 24.0}
TAU = 2 * math.pi


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def env(i, intro, loop, outro):
    """0→1 during the intro, 1 in the loop, 1→0 during the outro."""
    if i < intro:
        return ease((i + 1) / (intro + 1))
    if i >= intro + loop:
        return ease(1 - (i - intro - loop + 1) / (outro + 1))
    return 1.0


def ph(i, intro, loop):
    """loop phase 0..1 (periodic; keeps running through intro/outro)."""
    return ((i - intro) % loop) / loop


def blink(i, at, rest=pm.EYES_REST):
    seq = {at: 0.35, at + 1: 0.0, at + 2: 0.3}
    return seq.get(i, rest)


def mix(a, b, k):
    return a + (b - a) * k


# --------------------------------------------------------------------------- clips
# Each function takes the frame index and returns the pose parameters.

def idle(i, n=45):
    p = i / n
    return dict(squash=0.022 * math.sin(TAU * p), head_tilt=3 * math.sin(TAU * p + 1),
                head_turn=4 * math.sin(TAU * p), head_nod=2 * math.sin(TAU * 2 * p),
                wing_l_up=4 + 3 * math.sin(TAU * p + 2), wing_r_up=4 + 3 * math.sin(TAU * p + 2.5),
                eyes=blink(i, 31))


def talk(i, intro=3, loop=24, outro=3):
    k = env(i, intro, loop, outro)
    p = ph(i, intro, loop)
    return dict(squash=k * 0.03 * math.sin(TAU * 2 * p),
                head_nod=k * (4 * math.sin(TAU * 2 * p)),
                head_tilt=k * (6 * math.sin(TAU * p)),
                head_turn=k * (-6 + 5 * math.sin(TAU * p + 1)),
                wing_l_up=k * (22 + 14 * math.sin(TAU * 2 * p)), wing_l_fwd=k * 25,
                wing_r_up=k * (12 + 8 * math.sin(TAU * p + 1)), wing_r_fwd=k * 15,
                lean=k * 2 * math.sin(TAU * p),
                eyes=mix(pm.EYES_REST, 0.74, k) if i not in (intro + 15, intro + 16) else 0.15)


def point(i, intro=6, loop=24, outro=6):
    k = env(i, intro, loop, outro)
    p = ph(i, intro, loop)
    return dict(wing_r_up=k * (140 + 7 * math.sin(TAU * 2 * p)), wing_r_fwd=k * 15,
                wing_r_twist=k * -20,
                head_turn=k * (-18 + 3 * math.sin(TAU * p)), head_nod=k * (-9 + 3 * math.sin(TAU * 2 * p)),
                head_tilt=k * -6, lean=k * -4,
                squash=k * 0.025 * math.sin(TAU * 2 * p),
                wing_l_up=k * 10, eyes=mix(pm.EYES_REST, 0.8, k))


def think(i, intro=6, loop=30, outro=6):
    k = env(i, intro, loop, outro)
    p = ph(i, intro, loop)
    tap = max(0.0, math.sin(TAU * 3 * p))            # taps on the "chin"
    eyes = mix(pm.EYES_REST, 0.48, k)
    if intro + 20 <= i <= intro + 22:
        eyes = [0.25, 0.0, 0.25][i - intro - 20]
    return dict(head_tilt=k * (13 + 2 * math.sin(TAU * p)), head_nod=k * -13, head_turn=k * 12,
                wing_l_up=k * 30, wing_l_fwd=k * (82 + 8 * tap), wing_l_twist=k * 35,
                lean=k * (3 + 2 * math.sin(TAU * p)), squash=k * 0.015 * math.sin(TAU * p),
                eyes=eyes, beak=0)


def surprised(i, intro=6, loop=8, outro=4):
    if i < intro:
        k = ease((i + 1) / intro)
        hop = 0.22 * math.sin(math.pi * (i + 1) / intro)
        return dict(hop=hop, squash=-0.08 * k, eyes=mix(pm.EYES_REST, 1.05, k), beak=24 * k,
                    wing_l_up=55 * k, wing_r_up=55 * k, head_nod=-8 * k)
    if i < intro + loop:
        j = i - intro
        w = 3 * math.sin(TAU * j / loop)
        return dict(squash=-0.03, eyes=1.05, beak=24, wing_l_up=50 + w, wing_r_up=50 - w, head_nod=-8,
                    head_tilt=w)
    k = ease(1 - (i - intro - loop + 1) / (outro + 1))
    return dict(squash=-0.03 * k, eyes=mix(pm.EYES_REST, 1.05, k), beak=24 * k,
                wing_l_up=50 * k, wing_r_up=50 * k, head_nod=-8 * k)


def celebrate(i, intro=3, loop=12, outro=4):
    k = env(i, intro, loop, outro)
    if intro <= i < intro + loop:
        j = (i - intro) / loop
        hop = 0.38 * max(0.0, math.sin(TAU * j / 1.0 * 0.5 * 2)) if j < 0.5 else 0.0
        hop = 0.38 * math.sin(math.pi * j / 0.6) if j < 0.6 else 0.0
        sq = -0.06 if 0.05 < j < 0.55 else (0.10 if j >= 0.6 else 0.0)
        flap = 25 * math.sin(TAU * 2 * j)
    else:
        hop, sq, flap = 0.0, 0.08 * k, 0.0
    return dict(hop=hop, squash=sq, wing_l_up=k * (105 + flap), wing_r_up=k * (105 + flap),
                wing_l_fwd=k * 10, wing_r_fwd=k * 10,
                eyes=mix(pm.EYES_REST, 0.95, k), happy=0.6 * k, beak=24 * k, head_nod=-8 * k)


def suspicious(i, intro=6, loop=30, outro=6):
    """Spot the mistake: a suspicious squint, leaning in towards the claim."""
    k = env(i, intro, loop, outro)
    p = ph(i, intro, loop)
    shift = math.sin(TAU * p)                         # glances side to side
    return dict(eye_l=mix(pm.EYES_REST, 0.30, k), eye_r=mix(pm.EYES_REST, 0.55, k), lid_tilt=-16 * k,
                head_tilt=k * (-9 + 2 * shift), head_turn=k * (-14 + 10 * shift), head_nod=k * 4,
                lean=k * -6, wing_r_up=k * 35, wing_r_fwd=k * -20, wing_l_up=k * 35, wing_l_fwd=k * -20,
                squash=k * 0.015 * math.sin(TAU * 2 * p))


def wave(i, intro=5, loop=12, outro=5):
    k = env(i, intro, loop, outro)
    p = ph(i, intro, loop)
    return dict(wing_r_up=k * 160, wing_r_fwd=k * 10, wing_r_twist=k * 28 * math.sin(TAU * 2 * p),
                head_tilt=k * (9 + 3 * math.sin(TAU * p)), head_turn=k * -8,
                lean=k * (-3 + 2 * math.sin(TAU * 2 * p)), squash=k * 0.02 * math.sin(TAU * 2 * p),
                eyes=mix(pm.EYES_REST, 0.85, k), happy=0.4 * k)


# name: (function, frames, intro, outro, talks)
CLIPS = {
    "idle":      (idle, 45, 0, 0, False),
    "talk":      (talk, 30, 3, 3, True),
    "point":     (point, 36, 6, 6, True),
    "think":     (think, 42, 6, 6, False),
    "surprised": (surprised, 18, 6, 4, False),
    "celebrate": (celebrate, 19, 3, 4, False),
    "wave":      (wave, 22, 5, 5, True),
    "suspicious": (suspicious, 42, 6, 6, False),
}


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    only = None
    if "--clips" in args:
        only = args[args.index("--clips") + 1].split(",")
    res = int(os.environ.get("RES", 400))
    samples = int(os.environ.get("SAMPLES", 16))
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frames")

    P = pm.build()
    pm.stage(P, res=res, samples=samples, transparent=True)
    P.scene.render.use_persistent_data = True
    pm.aim(P, (0, -12, 2.75), (0, 0, 1.85), ortho=4.4)

    meta = {"fps": FPS, "size": res, "clips": {}}
    for name, (fn, n, intro, outro, talks) in CLIPS.items():
        meta["clips"][name] = {"frames": n, "intro": intro, "outro": outro, "talks": talks}
        if only and name not in only:
            continue
        variants = MOUTH if talks else {"main": None}
        for var, beak in variants.items():
            d = os.path.join(out, name, var)
            os.makedirs(d, exist_ok=True)
            for i in range(n):
                path = os.path.join(d, f"{i:03d}.png")
                if os.path.exists(path) and not os.environ.get("FORCE"):
                    continue
                kw = fn(i)
                kw["yaw"] = YAW + kw.get("yaw", 0)
                if beak is not None:
                    kw["beak"] = beak
                P.pose(**kw)
                t = time.time()
                pm.render(P, path)
                print(f"{name}/{var}/{i:03d} {time.time() - t:.1f}s", flush=True)
    with open(os.path.join(out, "clips.json"), "w") as f:
        json.dump(meta, f, indent=2)


if __name__ == "__main__":
    main()
