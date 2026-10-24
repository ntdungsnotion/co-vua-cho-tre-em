"""
FILE: decimate_thu_linh.py
CHỨC NĂNG: Giảm polygon mesh TRELLIS từ ~1M → ~50K, chỉnh T-pose sơ bộ,
           render ảnh 4 góc nhìn chất lượng cao cho Đời 1 Thủ lĩnh Nhân Tộc.
CHẠY: blender --background --python co-vua-cho-tre-em/kc/dt/3d_nhap/kich_ban_blender/decimate_thu_linh.py
BƯỚC: 3d-nhan-vat (24/10/2026 16:15)
"""

import bpy, math, os, sys

# ── Đường dẫn ──────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR    = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "..", "..", ".."))
NHAP_DIR    = os.path.join(BASE_DIR, "co-vua-cho-tre-em", "kc", "dt", "3d_nhap")
GLB_NGUON   = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_nhan_toc_chuan.glb")
GLB_XUAT    = os.path.join(NHAP_DIR, "mo_hinh", "thu_linh_doi1_web.glb")
HINH_DIR    = os.path.join(NHAP_DIR, "hinh_anh")

print("BASE_DIR :", BASE_DIR)
print("GLB_NGUON:", GLB_NGUON)

# ── Xoá scene mặc định ─────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# ── Nạp GLB ────────────────────────────────────────────────────────────────
bpy.ops.import_scene.gltf(filepath=GLB_NGUON)
print("Đã nạp:", GLB_NGUON)

# ── Tìm mesh chính ─────────────────────────────────────────────────────────
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
if not meshes:
    print("KHÔNG TÌM THẤY MESH — dừng.")
    sys.exit(1)

obj = max(meshes, key=lambda o: len(o.data.polygons))
print(f"Mesh chính: {obj.name}, polygon: {len(obj.data.polygons):,}")
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# ── Decimate: giảm xuống ~50 000 polygon ───────────────────────────────────
RATIO_MUC_TIEU = 50_000 / max(len(obj.data.polygons), 1)
RATIO_MUC_TIEU = max(0.01, min(1.0, RATIO_MUC_TIEU))

mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
mod.ratio = RATIO_MUC_TIEU
bpy.ops.object.modifier_apply(modifier="Decimate")
print(f"Sau Decimate: {len(obj.data.polygons):,} polygon")

# ── Căn chỉnh vị trí: đặt gốc tại chân, nhìn về +Y ────────────────────────
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
bb = obj.bound_box
z_min = min(v[2] for v in bb) * obj.scale.z + obj.location.z
obj.location.z -= z_min   # chân chạm Z=0
obj.location.x  = 0
obj.location.y  = 0

# Xoay để nhân vật nhìn về +Y (trước camera)
# Giá trị xoay này phụ thuộc hướng mesh sau khi nạp GLB
# Mesh chuan đã được xoay -90° Z ở bước trước → giữ nguyên
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

print(f"Vị trí sau căn: {obj.location}")

# ── Chiếu sáng studio ──────────────────────────────────────────────────────
def them_den(vi_tri, nang_luong=800, mau=(1,1,1,1), loai='POINT'):
    bpy.ops.object.light_add(type=loai, location=vi_tri)
    den = bpy.context.object
    den.data.energy = nang_luong
    den.data.color  = mau[:3]
    return den

them_den((3, -3, 4), 1000)          # Chính
them_den((-3, -2, 3), 500)          # Phụ trái
them_den((0,  4, 2), 300)           # Phía sau

# ── Camera helper ──────────────────────────────────────────────────────────
def dat_camera(vi_tri, huong_den=(0, 0, 1.0)):
    bpy.ops.object.camera_add(location=vi_tri)
    cam = bpy.context.object
    dx = huong_den[0] - vi_tri[0]
    dy = huong_den[1] - vi_tri[1]
    dz = huong_den[2] - vi_tri[2]
    dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    cam.rotation_euler[0] = math.acos(max(-1, min(1, dz / dist)))
    cam.rotation_euler[2] = math.atan2(dx, -dy)
    bpy.context.scene.camera = cam
    return cam

# ── Render helper ──────────────────────────────────────────────────────────
def render(ten_file, cam):
    bpy.context.scene.camera = cam
    scene = bpy.context.scene
    scene.render.engine              = 'CYCLES'
    scene.render.resolution_x        = 800
    scene.render.resolution_y        = 1000
    scene.cycles.samples              = 64
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(HINH_DIR, ten_file)
    bpy.ops.render.render(write_still=True)
    print(f"Đã render: {ten_file}")

# Chiều cao nhân vật (bound box sau apply)
bb2 = obj.bound_box
z_max = max(v[2] for v in bb2)
tam_z = z_max * 0.5

# ── 4 góc nhìn ─────────────────────────────────────────────────────────────
KHOANG = 3.5  # khoảng cách camera
goc_0   = dat_camera((0,     -KHOANG, tam_z), (0, 0, tam_z));  render("doi1_chinh_dien.png", goc_0)
goc_45  = dat_camera((KHOANG*.7, -KHOANG*.7, tam_z), (0,0,tam_z)); render("doi1_goc_phai.png", goc_45)
goc_90  = dat_camera((KHOANG, 0,      tam_z), (0, 0, tam_z));  render("doi1_canh_phai.png", goc_90)
goc_sau = dat_camera((0,      KHOANG, tam_z), (0, 0, tam_z));  render("doi1_phia_sau.png", goc_sau)

# ── Xuất GLB gọn cho web ───────────────────────────────────────────────────
for o in bpy.data.objects:
    o.select_set(o.type == 'MESH')
bpy.ops.export_scene.gltf(
    filepath=GLB_XUAT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
)
print(f"Đã xuất GLB: {GLB_XUAT}")
print("=== HOÀN THÀNH decimate_thu_linh.py ===")
