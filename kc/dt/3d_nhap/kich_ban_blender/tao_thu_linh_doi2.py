"""
FILE: tao_thu_linh_doi2.py
CHỨC NĂNG: Dựng Thủ lĩnh Đời 2 — Tù trưởng Đồ Đồng / Sắt
           - Dùng Warrior Quaternius làm khung cơ thể
           - Thêm giáp đồng / sắt bằng khối hộp PBR Metallic
           - Mũ chóp kim loại (nón lính), tấm vai, thắt lưng da
           - Vũ khí: rìu chiến đầu đồng hoặc kiếm ngắn
CHẠY: "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python co-vua-cho-tre-em/kc/dt/3d_nhap/kich_ban_blender/tao_thu_linh_doi2.py
BƯỚC: 3d-nhan-vat (24/10/2026 16:15)
"""

import bpy, math, os, mathutils

# ── Đường dẫn ──────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "..", "..", ".."))
NHAP_DIR    = os.path.join(BASE_DIR, "co-vua-cho-tre-em", "kc", "dt", "3d_nhap")
RPG_DIR     = os.path.join(NHAP_DIR, "rpg_quaternius",
                            "RPG Characters - Nov 2020", "Characters", "FBX")
FBX_WARRIOR = os.path.join(RPG_DIR, "Warrior.fbx")
HINH_DIR    = os.path.join(NHAP_DIR, "hinh_anh")
GLB_XUAT    = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_doi2.glb")

print("BASE_DIR :", BASE_DIR)
print("FBX_WARRIOR:", FBX_WARRIOR, "tồn tại:", os.path.exists(FBX_WARRIOR))

# ── Xoá scene ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# ── Nạp Warrior FBX ────────────────────────────────────────────────────────
bpy.ops.import_scene.fbx(filepath=FBX_WARRIOR, global_scale=0.01)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(scale=True)

# Tìm armature và mesh warrior
rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
warrior = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None

if warrior:
    print(f"Warrior mesh: {warrior.name}, {len(warrior.data.vertices)} vertices")
if rig:
    print(f"Rig: {rig.name}, bones: {[b.name for b in rig.data.bones[:5]]}")

# ── Màu PBR helper ────────────────────────────────────────────────────────
def mat_pbr(ten, mau_rgb, metallic=0.0, rough=0.5, emis=None):
    mat = bpy.data.materials.new(name=ten)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*mau_rgb, 1)
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = rough
    if emis:
        bsdf.inputs["Emission Color"].default_value  = (*emis, 1)
        bsdf.inputs["Emission Strength"].default_value = 0.3
    return mat

MAT_DONG   = mat_pbr("dong",     (0.72, 0.45, 0.20), metallic=1.0, rough=0.25)
MAT_SAT    = mat_pbr("sat",      (0.55, 0.55, 0.58), metallic=1.0, rough=0.15)
MAT_DA_NAU = mat_pbr("da_nau",   (0.35, 0.20, 0.10), metallic=0.0, rough=0.8)
MAT_TRANG  = mat_pbr("luong_do", (0.85, 0.15, 0.10), metallic=0.0, rough=0.6)

# ── Hàm thêm phụ kiện: parent vào bone ────────────────────────────────────
def them_phu_kien(ten, loc_world, kich_thuoc, mat,
                  hinh="box", bone=None, xoay=(0,0,0)):
    if hinh == "box":
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc_world)
    elif hinh == "cone":
        bpy.ops.mesh.primitive_cone_add(radius1=kich_thuoc[0]/2,
                                        depth=kich_thuoc[2], location=loc_world)
    elif hinh == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(radius=kich_thuoc[0]/2,
                                             depth=kich_thuoc[2], location=loc_world)
    obj = bpy.context.object
    obj.name = ten
    obj.scale = kich_thuoc if hinh == "box" else (1, 1, 1)
    obj.rotation_euler = [math.radians(x) for x in xoay]
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if bone and rig:
        obj.parent = rig
        obj.parent_type = 'BONE'
        obj.parent_bone = bone
        b = rig.pose.bones.get(bone)
        if b:
            bm = rig.matrix_world @ b.matrix
            obj.matrix_parent_inverse = bm.inverted()
    return obj

# ── Lấy vị trí bone trong world space ─────────────────────────────────────
def bone_world(ten_bone):
    if not rig: return (0, 0, 0)
    b = rig.pose.bones.get(ten_bone)
    if not b: return (0, 0, 0)
    v = rig.matrix_world @ b.matrix.translation
    return (v.x, v.y, v.z)

# ── Tìm vị trí các bone quan trọng ────────────────────────────────────────
bpy.context.view_layer.update()

HEAD_LOC  = bone_world("Head")
TORSO_LOC = bone_world("Torso")
ABDOMEN_L = bone_world("Abdomen")
FIST_R    = bone_world("Fist.R")
FIST_L    = bone_world("Fist.L")
SHOULDER_L = bone_world("Shoulder.L")
SHOULDER_R = bone_world("Shoulder.R")

print("Head loc:", HEAD_LOC)
print("Torso loc:", TORSO_LOC)
print("Fist.R loc:", FIST_R)

# ── MŨ CHÓP KIM LOẠI (nón lính) ──────────────────────────────────────────
# Chóp chính
HL = HEAD_LOC
chop_z = HL[2] + 0.12
mui_chop = them_phu_kien("mui_chop", (HL[0], HL[1], chop_z + 0.1),
                          (0.24, 0.24, 0.22), MAT_DONG, hinh="cone", bone="Head")

# Vành mũ dẹt xung quanh đầu
vanh_z = HL[2] + 0.07
them_phu_kien("mui_vanh", (HL[0], HL[1], vanh_z),
              (0.32, 0.32, 0.04), MAT_SAT, hinh="cyl", bone="Head")

# Tấm che mặt (thanh ngang nhỏ)
them_phu_kien("mui_che_mat", (HL[0], HL[1] - 0.13, HL[2] + 0.04),
              (0.22, 0.04, 0.06), MAT_SAT, bone="Head")

# ── GIÁP NGỰC (breastplate đồng) ─────────────────────────────────────────
TL = TORSO_LOC
them_phu_kien("giap_nguc", (TL[0], TL[1] - 0.05, TL[2]),
              (0.28, 0.08, 0.32), MAT_DONG, bone="Torso")

# Dải giáp bụng (lamellar plates)
AL = ABDOMEN_L
them_phu_kien("giap_bung", (AL[0], AL[1] - 0.04, AL[2]),
              (0.22, 0.06, 0.12), MAT_DONG, bone="Abdomen")

# ── TẤM VAI ──────────────────────────────────────────────────────────────
for bone, side in [("Shoulder.L", 1), ("Shoulder.R", -1)]:
    loc = bone_world(bone)
    them_phu_kien(f"vai_{bone}", (loc[0], loc[1] - 0.02, loc[2]),
                  (0.12, 0.10, 0.10), MAT_DONG, hinh="cone",
                  bone=bone, xoay=(90, 0, 0))

# ── THẮT LƯNG DA ─────────────────────────────────────────────────────────
HIPS_LOC = bone_world("Hips")
HL2 = HIPS_LOC
them_phu_kien("that_lung", (HL2[0], HL2[1] - 0.02, HL2[2] + 0.08),
              (0.26, 0.07, 0.08), MAT_DA_NAU, bone="Hips")

# ── VŨ KHÍ: RÌU CHIẾN ────────────────────────────────────────────────────
# Cán rìu (trụ gỗ)
FR = FIST_R
can_riu_loc = (FR[0], FR[1], FR[2] + 0.3)
cyl_can = them_phu_kien("can_riu", can_riu_loc, (0.035, 0.035, 0.60),
                         MAT_DA_NAU, hinh="cyl", bone="Fist.R")

# Đầu rìu đồng
dau_riu_loc = (FR[0] + 0.10, FR[1], FR[2] + 0.58)
them_phu_kien("dau_riu", dau_riu_loc, (0.22, 0.04, 0.18), MAT_DONG,
              bone="Fist.R")

# ── Chiếu sáng studio ──────────────────────────────────────────────────────
def them_den(vi_tri, nang_luong=800, loai='POINT'):
    bpy.ops.object.light_add(type=loai, location=vi_tri)
    d = bpy.context.object
    d.data.energy = nang_luong
    return d

them_den((3, -3, 4), 1200)
them_den((-3, -2, 3), 600)
them_den((0,  5, 2), 400)
bpy.ops.object.light_add(type='SUN', location=(1, -1, 8))
bpy.context.object.data.energy = 2.0

# ── Render 4 góc ──────────────────────────────────────────────────────────
TAM_Z = 1.0
KHOANG = 3.8

def render_goc(ten_file, vi_tri_cam, tam=(0, 0, TAM_Z)):
    bpy.ops.object.camera_add(location=vi_tri_cam)
    cam = bpy.context.object
    dx = tam[0] - vi_tri_cam[0]
    dy = tam[1] - vi_tri_cam[1]
    dz = tam[2] - vi_tri_cam[2]
    d  = math.sqrt(dx*dx + dy*dy + dz*dz)
    cam.rotation_euler[0] = math.acos(max(-1, min(1, dz/d)))
    cam.rotation_euler[2] = math.atan2(dx, -dy)
    bpy.context.scene.camera = cam
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.render.resolution_x = 800
    sc.render.resolution_y = 1000
    sc.cycles.samples = 64
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = os.path.join(HINH_DIR, ten_file)
    bpy.ops.render.render(write_still=True)
    print(f"Đã render: {ten_file}")

render_goc("doi2_chinh_dien.png", (0, -KHOANG, TAM_Z))
render_goc("doi2_goc_phai.png",   (KHOANG*.7, -KHOANG*.7, TAM_Z + 0.3))
render_goc("doi2_canh_phai.png",  (KHOANG, 0, TAM_Z))
render_goc("doi2_phia_sau.png",   (0, KHOANG, TAM_Z))

# ── Xuất GLB ──────────────────────────────────────────────────────────────
for o in bpy.data.objects:
    o.select_set(o.type in ('MESH', 'ARMATURE'))
bpy.ops.export_scene.gltf(
    filepath=GLB_XUAT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_animations=True,
)
print(f"Đã xuất: {GLB_XUAT}")
print("=== HOÀN THÀNH tao_thu_linh_doi2.py ===")
