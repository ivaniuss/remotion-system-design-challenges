"""The duck presenter: model + rig, built with Blender's Python API (bpy).

build() clears the scene, builds the duck with its rig and returns an object with a
pose(**params) method. Used by build_pato.py (stills) and animate_pato.py (video clips).

Pose controls (all optional; 0 = rest):
  hop        jump height (units)                  squash   >0 squashes, <0 stretches
  yaw        body turn (degrees)                  lean     sideways lean (degrees)
  head_nod   + looks down, - looks up             head_tilt  tilt (degrees)
  head_turn  head turn (degrees)
  eyes       0 (closed) .. 1 (wide); rest 0.62    eye_l / eye_r  one eye only
  happy      lower lid (0.5 = smiling eyes)       lid_tilt  - = skeptical brows
  beak       beak opening (degrees)
  wing_l_up / wing_r_up        raise a wing outwards (degrees)
  wing_l_fwd / wing_r_fwd      bring a wing forward (degrees)
  wing_l_twist / wing_r_twist  twist a wing about its length (degrees)
Object names are in Spanish (Pato = duck, Ojo = eye, Pico = beak, Ala = wing, Pelo = hair).
"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler

CAB = Vector((0, -0.05, 2.05))          # centre of the head
CAB_R = Vector((0.80, 0.74, 0.80))      # radii of the head
NECK_Z = 1.40
EYES_REST = 0.62


# ---------------------------------------------------------------- materials
def _mat(name, color, rough=0.5, sss=0.0, sheen=0.0, spec=0.3, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = spec
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (1.0, 0.5, 0.25)
        b.inputs["Subsurface Scale"].default_value = 0.05
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.05
    return m


def _smooth(obj, levels=1):
    for p in obj.data.polygons:
        p.use_smooth = True
    mod = obj.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = mod.render_levels = levels
    return obj


def surf(theta_deg, phi_deg, scale=1.0):
    """Point on the head ellipsoid. theta 0 = front, + = towards x+. phi 0 = top."""
    t, p = math.radians(theta_deg), math.radians(phi_deg)
    d = Vector((math.sin(p) * math.sin(t), -math.sin(p) * math.cos(t), math.cos(p)))
    return CAB + Vector((d.x * CAB_R.x, d.y * CAB_R.y, d.z * CAB_R.z)) * scale


class Pato:
    pass


def build(seed=7):
    random.seed(seed)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    coll = scene.collection
    P = Pato()
    P.scene = scene

    M = dict(
        pluma=_mat("Plumaje", (1.00, 0.60, 0.04), rough=0.75, sss=0.08, sheen=0.12),
        pico=_mat("Pico", (0.92, 0.36, 0.24), rough=0.35, sss=0.25),
        boca=_mat("Boca", (0.30, 0.05, 0.05), rough=0.6),
        lengua=_mat("Lengua", (0.85, 0.30, 0.30), rough=0.5),
        ojo=_mat("Ojo", (0.02, 0.016, 0.014), rough=0.1, spec=0.9, coat=1.0),
        brillo=_mat("Brillo", (1, 1, 1), rough=0.2),
        rubor=_mat("Rubor", (1.0, 0.45, 0.30), rough=0.8, sss=0.2),
        pelo=_mat("Pelo", (0.10, 0.05, 0.022), rough=0.55, sheen=0.25),
        # a second, slightly warmer brown mixed in at random: depth, not highlights
        mecha=_mat("Pelo2", (0.16, 0.08, 0.032), rough=0.5, sheen=0.25),
        pata=_mat("Patas", (1.00, 0.45, 0.10), rough=0.5),
    )
    # the eye highlights show even where no light hits them
    em = M["brillo"].node_tree.nodes["Principled BSDF"]
    em.inputs["Emission Color"].default_value = (1, 1, 1, 1)
    em.inputs["Emission Strength"].default_value = 1.5

    def sphere(name, loc, scale, mat, rot=(0, 0, 0), sub=1, segs=32, rings=16):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings, location=loc, rotation=rot)
        o = bpy.context.active_object
        o.name = name
        o.scale = scale
        o.data.materials.append(mat)
        return _smooth(o, sub)

    # ------------------------------------------------ body + head (metaballs: one seamless mesh)
    mb = bpy.data.metaballs.new("PatoMeta")
    mb.resolution = mb.render_resolution = 0.04
    mb.threshold = 0.1
    mbo = bpy.data.objects.new("Pato_Cuerpo", mb)
    coll.objects.link(mbo)

    def blob(co, size, rot=None):
        e = mb.elements.new(type='ELLIPSOID')
        e.co = co
        e.radius = 1.258                 # with threshold 0.1 the surface sits at `size`
        e.size_x, e.size_y, e.size_z = size
        if rot:
            e.rotation = rot

    blob((0, 0.02, 0.78), (0.86, 0.78, 0.72))
    blob(CAB, CAB_R)
    blob((0, 0.02, 1.38), (0.52, 0.50, 0.28))
    blob((0, 0.62, 1.00), (0.20, 0.30, 0.14), Matrix.Rotation(math.radians(-30), 4, 'X').to_quaternion())

    bpy.context.view_layer.objects.active = mbo
    mbo.select_set(True)
    bpy.ops.object.convert(target='MESH')
    body = bpy.context.active_object
    body.name = "Pato_Cuerpo"
    body.data.materials.clear()
    body.data.materials.append(M["pluma"])
    for p in body.data.polygons:
        p.use_smooth = True

    # wings: origin at the shoulder, so they rotate from there
    wings = {}
    for s, side in ((1, 'L'), (-1, 'R')):
        w = sphere(f"Ala_{side}", (0, 0, 0), (0.12, 0.36, 0.33), M["pluma"])
        # move the mesh so the shoulder is at the origin
        for v in w.data.vertices:
            v.co.z -= 0.72          # local units
        w.location = (0.70 * s, 0.06, 1.17)
        w.rotation_euler = (math.radians(12), math.radians(-10 * s), math.radians(-6 * s))
        wings[side] = w

    feet = [sphere(f"Pata_{'L' if s > 0 else 'R'}", (0.30 * s, -0.28, 0.07), (0.22, 0.32, 0.06), M["pata"])
            for s in (1, -1)]

    # ------------------------------------------------ beak (the lower lip hinges open)
    py = CAB.y - CAB_R.y + 0.02
    beak_up = sphere("Pico_Sup", (0, py, CAB.z - 0.27), (0.33, 0.24, 0.125), M["pico"],
                     rot=(math.radians(-8), 0, 0))
    hinge = Vector((0, py + 0.16, CAB.z - 0.33))
    beak_lo = sphere("Pico_Inf", (0, py + 0.04, CAB.z - 0.42), (0.26, 0.19, 0.105), M["pico"],
                     rot=(math.radians(12), 0, 0))
    mouth = sphere("Boca", (0, py + 0.03, CAB.z - 0.355), (0.24, 0.15, 0.085), M["boca"])
    tongue = sphere("Lengua", (0, py - 0.02, CAB.z - 0.40), (0.15, 0.10, 0.04), M["lengua"])

    # ------------------------------------------------ eyes (big, glossy, sleepy upper lid)
    eyes = {}
    for s, side in ((1, 'L'), (-1, 'R')):
        th = 22 * s
        pos = surf(th, 86, 0.975)
        bpy.ops.object.empty_add(type='PLAIN_AXES', radius=0.1)
        ctrl = bpy.context.active_object
        ctrl.name = f"OjoCtrl_{side}"
        # faces out of the head; local Z is the eye's "up"
        ctrl.matrix_world = (Matrix.Translation(pos) @ Matrix.Rotation(math.radians(th), 4, 'Z')
                             @ Matrix.Rotation(math.radians(-6), 4, 'X'))
        eh, ew = 0.088, 0.078            # half height, half width
        eye = sphere(f"Ojo_{side}", (0, 0, 0), (ew, 0.04, eh), M["ojo"])
        hl1 = sphere(f"Brillo1_{side}", (0, 0, 0), (0.024, 0.008, 0.024), M["brillo"])
        hl2 = sphere(f"Brillo2_{side}", (0, 0, 0), (0.011, 0.006, 0.011), M["brillo"])
        lid = sphere(f"Parpado_{side}", (0, 0, 0), (1, 1, 1), M["pluma"])
        low = sphere(f"ParpadoInf_{side}", (0, 0, 0), (1, 1, 1), M["pluma"])
        cheek = sphere(f"Rubor_{side}", (0, 0, 0), (0.10, 0.03, 0.055), M["rubor"])
        for o in (eye, hl1, hl2, lid, low):
            o.parent = ctrl
        eye.location = (0, 0.0, 0)
        hl1.location = (-0.022 * s, -0.040, 0.004)
        hl2.location = (0.026 * s, -0.036, -0.040)
        cheek.location = surf(40 * s, 103, 0.985)
        cheek.rotation_euler = (0, 0, math.radians(40 * s))
        eyes[side] = dict(ctrl=ctrl, eye=eye, lid=lid, low=low, eh=eh, ew=ew, s=s, hl=(hl1, hl2))

    # ------------------------------------------------ hair (a cap + bezier strands)
    casco = sphere("Pelo_Casco", CAB + Vector((0, 0.04, 0.16)), CAB_R * 1.03, M["pelo"], sub=2)
    tex = bpy.data.textures.new("RuidoPelo", 'CLOUDS')
    tex.noise_scale = 0.25
    disp = casco.modifiers.new("Desorden", 'DISPLACE')
    disp.texture = tex
    disp.strength = 0.06
    bm = bmesh.new(); bm.from_mesh(casco.data)
    cut = {v for v in bm.verts if v.co.z < -0.05 and v.co.y < 0.3} | {v for v in bm.verts if v.co.z < -0.55}
    bmesh.ops.delete(bm, geom=list(cut), context='VERTS')
    bm.to_mesh(casco.data); bm.free()
    casco.modifiers.new("Grosor", 'SOLIDIFY').thickness = 0.03

    hair = [casco]

    def strand(name, pts, radii, width, mat):
        cd = bpy.data.curves.new(name, 'CURVE')
        cd.dimensions = '3D'
        cd.bevel_depth = width
        cd.bevel_resolution = 3
        cd.use_fill_caps = True
        sp = cd.splines.new('BEZIER')
        sp.bezier_points.add(len(pts) - 1)
        for bp, co, r in zip(sp.bezier_points, pts, radii):
            bp.co = co
            bp.handle_left_type = bp.handle_right_type = 'AUTO'
            bp.radius = r
        o = bpy.data.objects.new(name, cd)
        coll.objects.link(o)
        o.data.materials.append(mat)
        hair.append(o)
        return o

    def mechon(name, theta, phi_end, width, mat, jitter=6):
        th = theta + random.uniform(-jitter, jitter)
        pts = [surf(th * 0.4, 8, 1.05), surf(th * 0.85, 45, 1.13),
               surf(th, phi_end * 0.85, 1.13), surf(th + random.uniform(-8, 8), phi_end, 1.07)]
        strand(name, pts, [1.0, 1.0, 0.75, 0.12], width, mat)

    plan = []
    for th in range(-160, 181, 14):
        a = abs(th)
        if a < 30:    phi = 78
        elif a < 70:  phi = 84 + (a - 30) * 0.6
        elif a < 120: phi = 112
        else:         phi = 118
        plan.append((th, phi, random.uniform(0.11, 0.15), M["mecha"] if random.random() < 0.3 else M["pelo"]))
    for th in range(-153, 181, 22):
        plan.append((th, 60 + random.uniform(0, 12), 0.13, M["mecha"] if random.random() < 0.3 else M["pelo"]))
    for th in range(-35, 40, 10):
        plan.append((th, 74 + random.uniform(-2, 2), 0.12, M["mecha"] if random.random() < 0.3 else M["pelo"]))
    for i, (th, phi, w, m) in enumerate(plan):
        mechon(f"Mechon_{i:02d}", th, phi, w, m)
    strand("Remolino", [surf(0, 10, 1.05), surf(-20, 5, 1.25), surf(-60, 20, 1.40)], [1, 0.8, 0.1], 0.07, M["pelo"])

    # ------------------------------------------------ rig
    arm_d = bpy.data.armatures.new("Rig")
    rig = bpy.data.objects.new("Pato_Rig", arm_d)
    coll.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_d.edit_bones
    b_root = eb.new("root"); b_root.head = (0, 0, 0); b_root.tail = (0, 0, 0.4)
    b_body = eb.new("body"); b_body.head = (0, 0, 0.35); b_body.tail = (0, 0, NECK_Z); b_body.parent = b_root
    b_head = eb.new("head"); b_head.head = (0, 0, NECK_Z); b_head.tail = (0, 0, 2.6); b_head.parent = b_body
    b_jaw = eb.new("jaw"); b_jaw.head = hinge; b_jaw.tail = hinge + Vector((0, -0.3, 0)); b_jaw.parent = b_head
    for s, side in ((1, 'L'), (-1, 'R')):
        b = eb.new(f"wing.{side}")
        b.head = wings[side].location
        b.tail = wings[side].location + Vector((0.02 * s, 0, -0.4))
        b.parent = b_body
    bpy.ops.object.mode_set(mode='OBJECT')
    P.rig = rig

    # body weights: a smooth head/body blend around the neck
    vg_b = body.vertex_groups.new(name="body")
    vg_h = body.vertex_groups.new(name="head")
    for v in body.data.vertices:
        k = min(1.0, max(0.0, (v.co.z - (NECK_Z - 0.12)) / 0.30))
        k = k * k * (3 - 2 * k)
        if k < 1: vg_b.add([v.index], 1 - k, 'REPLACE')
        if k > 0: vg_h.add([v.index], k, 'REPLACE')
    am = body.modifiers.new("Rig", 'ARMATURE')
    am.object = rig
    body.parent = rig

    bpy.context.view_layer.update()

    def bone_parent(o, bone):
        mw = o.matrix_world.copy()
        o.parent = rig
        o.parent_type = 'BONE'
        o.parent_bone = bone
        bpy.context.view_layer.update()
        o.matrix_world = mw

    for o in [beak_up, mouth, *hair, *(e["ctrl"] for e in eyes.values()),
              *[bpy.data.objects[f"Rubor_{x}"] for x in "LR"]]:
        bone_parent(o, "head")
    for o in (beak_lo, tongue):
        bone_parent(o, "jaw")
    for side, w in wings.items():
        bone_parent(w, f"wing.{side}")
    for f in feet:
        bone_parent(f, "root")

    # floor shadow (a shadow catcher: only the shadow shows in a transparent render)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Suelo_Sombra"
    floor.is_shadow_catcher = True

    P.body, P.wings, P.eyes, P.feet = body, wings, eyes, feet
    P.wing_rest = {k: w.matrix_basis.copy() for k, w in wings.items()}
    P.pose = lambda **kw: _pose(P, **kw)
    _pose(P)
    return P


def _pose(P, hop=0.0, squash=0.0, yaw=0.0, lean=0.0, head_nod=0.0, head_tilt=0.0, head_turn=0.0,
          eyes=EYES_REST, eye_l=None, eye_r=None, happy=0.0, lid_tilt=0.0, beak=0.0,
          wing_l_up=0.0, wing_r_up=0.0, wing_l_fwd=0.0, wing_r_fwd=0.0,
          wing_l_twist=0.0, wing_r_twist=0.0):
    pb = P.rig.pose.bones
    r = math.radians
    sz = 1.0 - squash
    sxy = 1.0 / math.sqrt(max(sz, 0.3))
    pb["root"].location = (0, hop, 0)           # the root bone's Y axis is world Z (up)
    pb["root"].scale = (sxy, sz, sxy)
    pb["root"].rotation_mode = 'XYZ'
    pb["root"].rotation_euler = (0, r(yaw), 0)  # bone Y = world Z
    pb["body"].rotation_mode = 'XYZ'
    pb["body"].rotation_euler = (0, 0, r(-lean))
    pb["head"].rotation_mode = 'XYZ'
    # upright bone: local X = world X, local Y = world Z, local Z = -world Y
    pb["head"].rotation_euler = (r(head_nod), r(head_turn), r(-head_tilt))
    pb["jaw"].rotation_mode = 'XYZ'
    pb["jaw"].rotation_euler = (r(-beak), 0, 0)

    for side, s in (('L', 1), ('R', -1)):
        up = wing_l_up if side == 'L' else wing_r_up
        fwd = wing_l_fwd if side == 'L' else wing_r_fwd
        tw = wing_l_twist if side == 'L' else wing_r_twist
        b = pb[f"wing.{side}"]
        b.rotation_mode = 'XYZ'
        # wing rotations are given in world axes:
        b.rotation_euler = (0, 0, 0)
        # a world-space rotation about the shoulder, converted to bone space
        rot_w = (Matrix.Rotation(r(-up * s), 4, 'Y') @ Matrix.Rotation(r(-fwd), 4, 'X')
                 @ Matrix.Rotation(r(tw * s), 4, 'Z'))
        bone_rest = P.rig.data.bones[f"wing.{side}"].matrix_local
        b.matrix_basis = bone_rest.inverted() @ rot_w @ bone_rest
        b.matrix_basis.translation = (0, 0, 0)

    for side, e in P.eyes.items():
        o = eye_l if side == 'L' and eye_l is not None else eye_r if side == 'R' and eye_r is not None else eyes
        o = max(0.0, min(1.05, o))
        eh, ew = e["eh"], e["ew"]
        lid = e["lid"]
        # the upper lid covers from the top down to L: a curved (sleepy) edge, lower on the outside
        L = -eh + 2 * eh * o
        top = eh * 1.25
        half = max((top - L) / 2, 0.004)
        lid.location = (0, -0.006, (top + L) / 2)
        lid.scale = (ew * 1.22, 0.048, half)
        lid.rotation_euler = (0, r((9 + lid_tilt) * e["s"]), 0)   # outer corner lower: a kind look
        lid.hide_render = o > 1.0
        # lower lid: rises from below (smiling ^^ eyes at happy ~0.5)
        low = e["low"]
        Lb = -eh + 2 * eh * max(0.0, min(1.0, happy))
        bot = -eh * 1.08
        lh = max((Lb - bot) / 2, 0.004)
        low.location = (0, -0.002, (Lb + bot) / 2)
        low.scale = (ew * 1.18, 0.043, lh)
        low.hide_render = happy <= 0.01
        # above 1 the eye itself grows a little (surprise)
        e["eye"].scale = (ew, 0.04, eh * (1 + max(0, o - 0.9) * 1.2))
    bpy.context.view_layer.update()


# ---------------------------------------------------------------- lights, camera, render
def stage(P, res=1080, samples=48, transparent=True, bg=(0.10, 0.30, 0.42)):
    scene = P.scene

    def light(name, loc, energy, color=(1, 1, 1), size=2.0, target=(0, 0, 1.6)):
        ld = bpy.data.lights.new(name, 'AREA')
        ld.energy, ld.color, ld.size = energy, color, size
        o = bpy.data.objects.new(name, ld)
        o.location = loc
        scene.collection.objects.link(o)
        o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

    light("Key", (-2.6, -4.0, 5.0), 600, (1.0, 0.95, 0.88), 3)
    light("Fill", (4.0, -3.0, 2.0), 260, (0.85, 0.9, 1.0), 4)
    light("Rim", (0.0, 4.0, 4.0), 800, (1.0, 0.9, 0.8), 2)
        # the floor shadow comes from an overhead light only (it stays under the duck, inside the frame)
    light("Cenital", (0.0, -0.4, 7.0), 120, (1.0, 0.97, 0.92), 2.5, target=(0, -0.2, 0))
    for n in ("Key", "Fill", "Rim"):
        bpy.data.lights[n].use_shadow = False

    world = bpy.data.worlds.new("Fondo"); world.use_nodes = True
    bgn = world.node_tree.nodes["Background"]
    bgn.inputs[0].default_value = (*bg, 1)
    bgn.inputs[1].default_value = 0.6
    scene.world = world

    cam_d = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_d)
    scene.collection.objects.link(cam)
    scene.camera = cam
    P.cam = cam

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.resolution_x = scene.render.resolution_y = res
    scene.render.film_transparent = transparent
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Punchy'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    P.scene.objects["Suelo_Sombra"].hide_render = not transparent


def aim(P, pos, target, lens=70, ortho=None):
    cam = P.cam
    cam.location = pos
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = ortho
    else:
        cam.data.type = 'PERSP'
        cam.data.lens = lens


def render(P, path):
    P.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
