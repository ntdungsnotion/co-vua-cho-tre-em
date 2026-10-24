"""
FILE: decimate_thu_linh_v2.py
CHỨC NĂNG: Decimate mesh TRELLIS + render 4 góc nhìn (sửa lỗi camera đen).
           Dùng track_to constraint thay vì tính tay rotation_euler.
CHẠY: "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python co-vua-cho-tre-em/kc/dt/3d_nhap/kich_ban_blender/decimate_thu_linh_v2.py
BƯỚC: 3d-nhan-vat (24/10/2026 16:30)
"""

import bpy, math, os, sys, mathutils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "..", "..", ".."))
NHAP_DIR    = os.path.join(BASE_DIR, "co-vua-cho-tre-em", "kc", "dt", "3d_nhap")
GLB_NGUON   = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_nhan_toc_chuan.glb")
GLB_XUAT    = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_doi1_web.glb")
HINH_DIR    = os.path.join(NHAP_DIR, "hinh_anh")

print("GLB_NGUON:", GLB_NGUON, "→ tồn tại:", os.path.exists(GLB_NGUON))

# ── Khởi tạo scene sạch ────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# Nền sáng (world background)
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value    = (0.85, 0.85, 0.90, 1)
    bg.inputs["Strength"].default_value = 1.5

# ── Nạp GLB ────────────────────────────────────────────────────────────────
bpy.ops.import_scene.gltf(filepath=GLB_NGUON)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
if not meshes:
    print("KHÔNG TÌM THẤY MESH"); sys.exit(1)

obj = max(meshes, key=lambda o: len(o.data.polygons))
print(f"Mesh: {obj.name}, polygon trước: {len(obj.data.polygons):,}")

bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)

# ── Decimate ────────────────────────────────────────────────────────────────
tong = len(obj.data.polygons)
ratio = max(0.01, min(1.0, 50_000 / tong))
mod = obj.modifiers.new("Dec", 'DECIMATE')
mod.ratio = ratio
bpy.ops.object.modifier_apply(modifier="Dec")
print(f"Polygon sau decimate: {len(obj.data.polygons):,}")

# Đặt gốc về chân
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
bb8 = [(obj.matrix_world @ mathutils.Vector(c)) for c in obj.bound_box]
z_min = min(v.z for v in bb8)
obj.location.z -= z_min
obj.location.x  = 0
obj.location.y  = 0
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Tính trung tâm nhân vật sau khi áp
bb8b = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
z_max2 = max(v.z for v in bb8b)
TAM_Z  = z_max2 * 0.5
print(f"Chiều cao nhân vật: {z_max2:.3f}, tâm Z: {TAM_Z:.3f}")

# ── Đèn ────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='AREA', location=(3, -4, 3))
bpy.context.object.data.energy = 1500
bpy.context.object.data.size   = 3

bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
bpy.context.object.data.energy = 700
bpy.context.object.data.size   = 2

bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
bpy.context.object.data.energy = 2.0
bpy.context.object.rotation_euler = (math.radians(45), 0, math.radians(30))

# ── Camera helper dùng track_to ───────────────────────────────────────────
def render_goc(ten_file, vi_tri_cam, dich=(0, 0, TAM_Z)):
    # Empty làm điểm nhắm
    bpy.ops.object.empty_add(location=dich)
    empty = bpy.context.object
    empty.name = f"target_{ten_file}"

    # Camera
    bpy.ops.object.camera_add(location=vi_tri_cam)
    cam = bpy.context.object
    cam.name = f"cam_{ten_file}"

    # Constraint track_to
    ct = cam.constraints.new('TRACK_TO')
    ct.target    = empty
    ct.track_axis = 'TRACK_NEGATIVE_Z'
    ct.up_axis    = 'UP_Y'

    bpy.context.scene.camera = cam
    bpy.context.view_layer.update()

    sc = bpy.context.scene
    sc.render.engine                      = 'CYCLES'
    sc.render.resolution_x                = 800
    sc.render.resolution_y                = 1000
    sc.cycles.samples                     = 96
    sc.render.image_settings.file_format  = 'PNG'
    sc.render.filepath = os.path.join(HINH_DIR, ten_file)
    bpy.ops.render.render(write_still=True)
    print(f"✓ Render: {ten_file}")

    # Dọn camera + empty sau khi render
    bpy.data.objects.remove(cam,   do_unlink=True)
    bpy.data.objects.remove(empty, do_unlink=True)

R = 3.5
render_goc("doi1_chinh_dien.png", (0, -R, TAM_Z))
render_goc("doi1_goc_phai.png",   (R*.7, -R*.7, TAM_Z + 0.3))
render_goc("doi1_canh_phai.png",  (R, 0, TAM_Z))
render_goc("doi1_phia_sau.png",   (0, R, TAM_Z))

# ── Xuất GLB ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=GLB_XUAT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
)
print(f"✓ Xuất GLB: {GLB_XUAT}")
print("=== HOÀN THÀNH decimate_thu_linh_v2.py ===")
