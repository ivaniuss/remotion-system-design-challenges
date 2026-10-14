"""Still renders of the duck (front, 3/4, face, back) and pato.blend with the model and rig.

Usage:  python3 build_pato.py   (pip install bpy)   or   blender -b -P build_pato.py
        SAMPLES=64 python3 build_pato.py --no-render
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import pato_model as pm

OUT = os.path.dirname(os.path.abspath(__file__))
P = pm.build()
pm.stage(P, res=1080, samples=int(os.environ.get("SAMPLES", 48)), transparent=False)
pm.aim(P, (0, -8.5, 1.9), (0, 0, 1.6))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "pato.blend"))
if "--no-render" not in sys.argv:
    os.makedirs(os.path.join(OUT, "renders"), exist_ok=True)
    views = {
        "frente": ((0, -8.5, 1.9), (0, 0, 1.6)),
        "tres_cuartos": ((-5.5, -6.5, 2.4), (0, 0, 1.6)),
        "cara": ((-0.6, -5.0, 2.2), (0, -0.3, 2.0)),
        "espalda": ((3.5, 7.5, 2.4), (0, 0, 1.6)),
    }
    for name, (pos, tgt) in views.items():
        pm.aim(P, pos, tgt)
        pm.render(P, os.path.join(OUT, "renders", f"{name}.png"))
