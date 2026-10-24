"""
FILE: tao_thu_linh_doi2.py  (v2)
CHỨC NĂNG: Dựng Thủ lĩnh Đời 2 — Tù trưởng Đồ Đồng
           Warrior Quaternius + giáp đồng, mũ chóp, rìu chiến.
           Sửa: dùng rig.data.bones[].head_local cho vị trí bone đúng.
CHẠY: "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python co-vua-cho-tre-em/kc/dt/3d_nhap/kich_ban_blender/tao_thu_linh_doi2.py
BƯỚC: 3d-nhan-vat (24/10/2026 16:35)
"""

import bpy, math, os, mathutils

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "..", "..", ".."))
NHAP_DIR    = os.path.join(BASE_DIR, "co-vua-cho-tre-em", "kc", "dt", "3d_nhap")
RPG_DIR     = os.path.join(NHAP_DIR, "rpg_quaternius", "RPG Characters - Nov 2020", "FBX")
FBX_WARRIOR = os.path.join(RPG_DIR, "Warrior.fbx")
HINH_DIR    = os.path.join(NHAP_DIR, "hinh_anh")
GLB_XUAT    = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_doi2.glb")

print("FBX_WARRIOR:", FBX_WARRIOR, "→ tồn tại:", os.path.exists(FBX_WARRIOR))

# ── Scene sạch ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# Nền sáng
world = bpy.data.worlds.new("W")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.85, 0.88, 0.92, 1)
    bg.inputs["Strength"].default_value = 1.5

# ── Nạp Warrior FBX ─────────────────────────────────────────────────────────
bpy.ops.import_scene.fbx(filepath=FBX_WARRIOR, global_scale=1.0)
bpy.context.view_layer.update()

rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
warrior = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None

if warrior: print(f"Warrior mesh: {warrior.name}, {len(warrior.data.vertices)} verts")
if rig:
    print(f"Rig: {rig.name}")
    print(f"  bones: {[b.name for b in list(rig.data.bones)[:8]]}")

# Tô màu da/nâu cho body Warrior (thay trắng)
if warrior:
    bpy.context.view_layer.objects.active = warrior
    for mat_slot in warrior.material_slots:
        if mat_slot.material:
            mat = mat_slot.material
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                # Màu da nâu ấm
                bsdf.inputs["Base Color"].default_value = (0.55, 0.38, 0.22, 1)
                bsdf.inputs["Roughness"].default_value  = 0.7
    print(f"Đã tô màu warrior mesh")

# ── Vị trí bone trong world space (dùng rest pose) ──────────────────────────
def bone_world(ten_bone):
    """Trả (x,y,z) đầu bone trong world space dùng rest pose."""
    if not rig: return mathutils.Vector((0, 0, 1))
    b = rig.data.bones.get(ten_bone)
    if not b:
        print(f"  [!] Không tìm bone: {ten_bone}")
        return mathutils.Vector((0, 0, 1))
    v = rig.matrix_world @ b.head_local
    return v

HEAD_W     = bone_world("Head")
TORSO_W    = bone_world("Torso")
ABDOMEN_W  = bone_world("Abdomen")
HIPS_W     = bone_world("Hips")
FIST_R_W   = bone_world("Fist.R")
FIST_L_W   = bone_world("Fist.L")
SHOULDER_L = bone_world("Shoulder.L")
SHOULDER_R = bone_world("Shoulder.R")

print(f"Head:    {HEAD_W[:]}")
print(f"Torso:   {TORSO_W[:]}")
print(f"Hips:    {HIPS_W[:]}")
print(f"Fist.R:  {FIST_R_W[:]}")

# ── Màu PBR ─────────────────────────────────────────────────────────────────
def mat_pbr(ten, mau_rgb, metallic=0.0, rough=0.5):
    mat = bpy.data.materials.new(name=ten)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*mau_rgb, 1)
    bsdf.inputs["Metallic"].default_value   = metallic
    bsdf.inputs["Roughness"].default_value  = rough
    return mat

M_DONG = mat_pbr("dong",   (0.72, 0.45, 0.20), metallic=1.0, rough=0.25)
M_SAT  = mat_pbr("sat",    (0.55, 0.55, 0.58), metallic=1.0, rough=0.15)
M_DA   = mat_pbr("da_nau", (0.35, 0.20, 0.10), metallic=0.0, rough=0.8)
M_GOC  = mat_pbr("go_nau", (0.45, 0.28, 0.12), metallic=0.0, rough=0.9)

# ── Hàm tạo phụ kiện đơn giản ───────────────────────────────────────────────
def box(ten, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = ten
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(mat)
    return o

def cone(ten, loc, radius, depth, mat, xoay_z=0):
    bpy.ops.mesh.primitive_cone_add(radius1=radius, radius2=0,
                                     depth=depth, location=loc)
    o = bpy.context.object; o.name = ten
    if xoay_z: o.rotation_euler[2] = math.radians(xoay_z)
    bpy.ops.object.transform_apply(rotation=True)
    o.data.materials.clear(); o.data.materials.append(mat)
    return o

def cyl(ten, loc, radius, depth, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth,
                                          location=loc)
    o = bpy.context.object; o.name = ten
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(mat)
    return o

# ── Phụ kiện theo bone ───────────────────────────────────────────────────────
H = HEAD_W
T = TORSO_W
A = ABDOMEN_W
HI = HIPS_W
FR = FIST_R_W
SL = SHOULDER_L
SR = SHOULDER_R

# Mũ chóp đồng
cone("mui_chop",  (H.x, H.y, H.z + 0.10), radius=0.12, depth=0.24, mat=M_DONG)
cyl ("mui_vanh",  (H.x, H.y, H.z + 0.02), radius=0.16, depth=0.03, mat=M_SAT)
box ("mui_tranguri", (H.x, H.y - 0.13, H.z - 0.02), (0.20, 0.03, 0.06), M_SAT)

# Giáp ngực
box("giap_nguc", (T.x, T.y - 0.04, T.z),      (0.28, 0.07, 0.28), M_DONG)
box("giap_bung", (A.x, A.y - 0.03, A.z + 0.02),(0.22, 0.05, 0.12), M_DONG)

# Dải giáp bụng dưới (lamellar)
for i in range(3):
    box(f"tam_bung_{i}", (HI.x + (i-1)*0.08, HI.y - 0.03, HI.z + 0.06),
        (0.065, 0.04, 0.10), M_DONG)

# Tấm vai
cone("vai_trai", (SL.x, SL.y, SL.z - 0.02), radius=0.09, depth=0.10, mat=M_DONG)
cone("vai_phai", (SR.x, SR.y, SR.z - 0.02), radius=0.09, depth=0.10, mat=M_DONG)

# Thắt lưng da
box("that_lung", (HI.x, HI.y - 0.02, HI.z + 0.08), (0.25, 0.06, 0.07), M_DA)

# Cán rìu (gỗ)
cyl("can_riu",  (FR.x, FR.y, FR.z + 0.28), radius=0.018, depth=0.55, mat=M_GOC)
# Đầu rìu đồng (hình nêm)
box("dau_riu_a", (FR.x + 0.10, FR.y, FR.z + 0.50), (0.18, 0.035, 0.16), M_DONG)
box("dau_riu_b", (FR.x - 0.05, FR.y, FR.z + 0.50), (0.06, 0.035, 0.10), M_DONG)

# ── Đèn ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(3, -4, 3))
bpy.context.object.data.energy = 1800; bpy.context.object.data.size = 3

bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
bpy.context.object.data.energy = 800; bpy.context.object.data.size = 2

bpy.ops.object.light_add(type='SUN', location=(1, -1, 8))
bpy.context.object.data.energy = 2.5
bpy.context.object.rotation_euler = (math.radians(40), 0, math.radians(25))

# ── Render helper (track_to) ─────────────────────────────────────────────────
# Chiều cao nhân vật: ước tính từ head bone
TAM_Z = float(HEAD_W.z) * 0.5 if HEAD_W.z > 0.1 else 1.0
print(f"TAM_Z = {TAM_Z:.3f}")

def render_goc(ten_file, vi_tri_cam, dich=None):
    if dich is None: dich = (0, 0, TAM_Z)
    bpy.ops.object.empty_add(location=dich); empty = bpy.context.object
    bpy.ops.object.camera_add(location=vi_tri_cam); cam = bpy.context.object
    ct = cam.constraints.new('TRACK_TO')
    ct.target = empty; ct.track_axis = 'TRACK_NEGATIVE_Z'; ct.up_axis = 'UP_Y'
    bpy.context.scene.camera = cam; bpy.context.view_layer.update()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 80
    sc.render.resolution_x = 800; sc.render.resolution_y = 1000
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(HINH_DIR, ten_file)
    bpy.ops.render.render(write_still=True)
    print(f"✓ Render: {ten_file}")
    bpy.data.objects.remove(cam,   do_unlink=True)
    bpy.data.objects.remove(empty, do_unlink=True)

R = 3.5
render_goc("doi2_chinh_dien.png", (0,     -R,     TAM_Z))
render_goc("doi2_goc_phai.png",   (R*.7,  -R*.7,  TAM_Z + 0.3))
render_goc("doi2_canh_phai.png",  (R,      0,     TAM_Z))
render_goc("doi2_phia_sau.png",   (0,      R,     TAM_Z))

# ── Xuất GLB ────────────────────────────────────────────────────────────────
for o in bpy.data.objects: o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.gltf(
    filepath=GLB_XUAT, export_format='GLB',
    use_selection=True, export_apply=True, export_animations=True,
)
print(f"✓ Xuất GLB: {GLB_XUAT}")
print("=== HOÀN THÀNH tao_thu_linh_doi2.py ===")
