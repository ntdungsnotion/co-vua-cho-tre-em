# ================================================================
# KỊCH BẢN BLENDER: tao_toc_mu_dep_chuan.py
# CHỨC NĂNG: Tạo tóc hoạt hình 3D mượt mà (Stylized Anime Hair)
#            kết hợp Mũ/Băng trán/Vương miện phủ kín mọi vùng trọc của đầu.
#            - Tóc mái rủ che trán dô
#            - Tóc mai ôm 2 bên má
#            - Tóc gáy phủ kín sau cổ
#            - Tóc đỉnh bồng bềnh lộ trong lòng mũ/vương miện
#            - Ánh sáng studio chân dung, mặt sáng tươi vui
# BƯỚC: Thử nghiệm đồ họa 3D nhân vật (Cách 2) - Bản Tinh Chỉnh Đẹp
# NGÀY: 24/10/2026
# ================================================================
import bpy, os, math
from mathutils import Matrix, Vector

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def load_base_model():
    glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/nhan_vat.glb')
    bpy.ops.import_scene.gltf(filepath=glb_path)
    for name in ['1H_Axe', '2H_Axe', 'Barbarian_Hat']:
        if name in bpy.data.objects:
            bpy.data.objects[name].hide_render = True
            bpy.data.objects[name].hide_viewport = True

def parent_to_bone(obj, bone_name):
    rig = bpy.data.objects.get('Rig')
    world_mat = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    bone_mat = rig.matrix_world @ rig.pose.bones[bone_name].matrix
    obj.matrix_parent_inverse = bone_mat.inverted()
    obj.matrix_world = world_mat

def make_mat(name, color, roughness=0.5, metallic=0.0, emissive=(0,0,0,1), emissive_intensity=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emissive
            bsdf.inputs['Emission Strength'].default_value = emissive_intensity
    return mat

def create_smooth_cone(name, r1, r2, depth, loc, rot, scale=(1,1,1), verts=8):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=verts, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = tuple(math.radians(a) for a in rot)
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

# --- DỰNG TÓC HOẠT HÌNH 3D MỀM MẠI (ANIME STYLIZED HAIR) ---
def build_flowing_hair(hair_mat):
    parts = []

    # 1. Mũi vòm đỉnh đầu (ôm sát sọ, phủ kín toàn bộ đỉnh)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.50, segments=32, ring_count=20, location=(0, -0.01, 1.98))
    cap = bpy.context.active_object
    cap.scale = (1.06, 1.08, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    for p in cap.data.polygons: p.use_smooth = True
    cap.data.materials.append(hair_mat)
    parts.append(cap)

    # 2. TÓC MÁI PHÍA TRƯỚC (7 lọn tóc rủ xuống trán cực kỳ sống động)
    # Lọn uốn cong, vuốt nhọn ở đuôi, che trán và viền mắt
    bangs = [
        # (name, r1, r2, depth, loc, rot, scale)
        ("bang_c", 0.12, 0.015, 0.46, (0.00, -0.44, 1.94), (-25, 4, 0), (1.1, 0.7, 1.0)),      # Giữa trán
        ("bang_l1", 0.11, 0.015, 0.42, (-0.14, -0.43, 1.95), (-24, -14, 6), (1.1, 0.7, 1.0)),  # Trái 1
        ("bang_r1", 0.11, 0.015, 0.42, (0.14, -0.43, 1.95), (-24, 14, -6), (1.1, 0.7, 1.0)),   # Phải 1
        ("bang_l2", 0.10, 0.015, 0.38, (-0.28, -0.40, 1.93), (-20, -28, 12), (1.1, 0.7, 1.0)), # Trái 2
        ("bang_r2", 0.10, 0.015, 0.38, (0.28, -0.40, 1.93), (-20, 28, -12), (1.1, 0.7, 1.0)),  # Phải 2
        ("bang_top1", 0.10, 0.02, 0.36, (-0.08, -0.47, 2.05), (-34, -5, 0), (1.2, 0.8, 1.0)),   # Lớp mái trên bồng bềnh
        ("bang_top2", 0.10, 0.02, 0.36, (0.09, -0.47, 2.05), (-34, 8, 0), (1.2, 0.8, 1.0)),    # Lớp mái trên bồng bềnh
    ]
    for bname, r1, r2, d, loc, rot, sc in bangs:
        obj = create_smooth_cone(bname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 3. TÓC HAI BÊN MANG TAI (Sideburns ôm lấy gò má)
    side_hair = [
        # Tai trái
        ("side_l1", 0.12, 0.02, 0.45, (-0.46, -0.18, 1.76), (12, -18, -10), (1.0, 0.8, 1.0)),
        ("side_l2", 0.10, 0.015, 0.38, (-0.48, -0.05, 1.62), (8, -12, 0), (1.0, 0.8, 1.0)),
        # Tai phải
        ("side_r1", 0.12, 0.02, 0.45, (0.46, -0.18, 1.76), (12, 18, 10), (1.0, 0.8, 1.0)),
        ("side_r2", 0.10, 0.015, 0.38, (0.48, -0.05, 1.62), (8, 12, 0), (1.0, 0.8, 1.0)),
    ]
    for sname, r1, r2, d, loc, rot, sc in side_hair:
        obj = create_smooth_cone(sname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 4. TÓC SAU GÁY (Back Hair ôm trọn cổ áo, uốn lượn mềm mại)
    back_hair = [
        ("back_c1", 0.18, 0.04, 0.48, (0.00, 0.42, 1.72), (-18, 0, 0), (1.3, 0.8, 1.0)),
        ("back_l1", 0.16, 0.03, 0.44, (-0.22, 0.38, 1.70), (-16, 18, -8), (1.2, 0.8, 1.0)),
        ("back_r1", 0.16, 0.03, 0.44, (0.22, 0.38, 1.70), (-16, -18, 8), (1.2, 0.8, 1.0)),
        ("back_l2", 0.14, 0.03, 0.40, (-0.38, 0.28, 1.68), (-12, 28, -15), (1.1, 0.8, 1.0)),
        ("back_r2", 0.14, 0.03, 0.40, (0.38, 0.28, 1.68), (-12, -28, 15), (1.1, 0.8, 1.0)),
        ("back_c2", 0.15, 0.03, 0.38, (0.00, 0.44, 1.52), (-12, 0, 0), (1.3, 0.7, 1.0)),
        ("back_l3", 0.13, 0.02, 0.35, (-0.18, 0.42, 1.50), (-10, 12, -5), (1.2, 0.7, 1.0)),
        ("back_r3", 0.13, 0.02, 0.35, (0.18, 0.42, 1.50), (-10, -12, 5), (1.2, 0.7, 1.0)),
    ]
    for bname, r1, r2, d, loc, rot, sc in back_hair:
        obj = create_smooth_cone(bname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 5. CÁC CHỎM TÓC NHỌN ĐỈNH ĐẦU (Stylized Top Tufts)
    tufts = [
        ("tuft_1", 0.09, 0.01, 0.32, (0.06, -0.12, 2.28), (28, 12, 0), (1.0, 0.8, 1.0)),
        ("tuft_2", 0.08, 0.01, 0.28, (-0.10, -0.06, 2.30), (22, -18, 0), (1.0, 0.8, 1.0)),
        ("tuft_3", 0.07, 0.01, 0.26, (0.15, 0.08, 2.26), (-15, 24, 0), (1.0, 0.8, 1.0)),
        ("tuft_4", 0.07, 0.01, 0.25, (-0.14, 0.12, 2.25), (-20, -18, 0), (1.0, 0.8, 1.0)),
    ]
    for tname, r1, r2, d, loc, rot, sc in tufts:
        obj = create_smooth_cone(tname, r1, r2, d, loc, rot, sc, verts=6)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # Gộp tất cả tóc thành 1 object duy nhất
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = cap
    bpy.ops.object.join()
    hair = cap
    hair.name = 'Stylized_Anime_Hair'
    parent_to_bone(hair, 'head')
    return hair

# --- BĂNG TRÁN DA THÚ + LÔNG CHIM HOẠT HÌNH THỦ LĨNH ĐỜI 1 ---
def build_deluxe_tribal_headband():
    head_parts = []
    mat_leather = make_mat('Band_Leather', (0.52, 0.18, 0.08, 1.0), roughness=0.6) # Da nâu đậm sang trọng
    mat_gold = make_mat('Band_Gold', (1.0, 0.82, 0.20, 1.0), roughness=0.25, metallic=0.92) # Viền vàng
    mat_ruby = make_mat('Band_Ruby', (0.92, 0.06, 0.12, 1.0), roughness=0.15, metallic=0.2, emissive=(0.85, 0.05, 0.1, 1), emissive_intensity=0.6)
    mat_feather_red = make_mat('Feather_Red', (0.92, 0.10, 0.15, 1.0), roughness=0.6)
    mat_feather_white = make_mat('Feather_White', (0.98, 0.98, 0.96, 1.0), roughness=0.6)

    # 1. Băng trán chính (dày dặn, ôm quanh đầu ngay phía trên tóc mái)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.51, minor_radius=0.038, major_segments=48, minor_segments=16, location=(0, -0.01, 1.96))
    band = bpy.context.active_object
    band.scale = (1.05, 1.08, 1.1)
    bpy.ops.object.transform_apply(scale=True)
    for p in band.data.polygons: p.use_smooth = True
    band.data.materials.append(mat_leather)
    head_parts.append(band)

    # 2. Hai sợi chỉ vàng nẹp trên & dưới băng trán
    for z_off in [-0.026, 0.026]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.518, minor_radius=0.008, major_segments=40, minor_segments=8, location=(0, -0.01, 1.96 + z_off))
        wire = bpy.context.active_object
        wire.scale = (1.05, 1.08, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        for p in wire.data.polygons: p.use_smooth = True
        wire.data.materials.append(mat_gold)
        head_parts.append(wire)

    # 3. Huy hiệu trán: Đĩa vàng mặt trời chạm khắc + viên ngọc đỏ tỏa sáng
    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.035, vertices=24, location=(0, -0.55, 1.96))
    medallion = bpy.context.active_object
    medallion.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    for p in medallion.data.polygons: p.use_smooth = True
    medallion.data.materials.append(mat_gold)
    head_parts.append(medallion)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.048, subdivisions=2, location=(0, -0.575, 1.96))
    gem = bpy.context.active_object
    for p in gem.data.polygons: p.use_smooth = True
    gem.data.materials.append(mat_ruby)
    head_parts.append(gem)

    # 4. LÔNG VŨ ĐẠI BÀNG (2 cọng lông uốn cong mềm mại sau tai phải)
    # Cọng 1: Lông đỏ chóp trắng vươn cao
    bpy.ops.mesh.primitive_cone_add(radius1=0.075, radius2=0.01, depth=0.55, vertices=8, location=(0.50, -0.12, 2.26))
    f1 = bpy.context.active_object
    f1.scale = (1.0, 0.18, 1.0)
    f1.rotation_euler = (math.radians(14), math.radians(26), math.radians(-15))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in f1.data.polygons: p.use_smooth = True
    f1.data.materials.append(mat_feather_red)
    head_parts.append(f1)

    # Cọng 2: Lông trắng chóp đỏ bay nhẹ phía sau
    bpy.ops.mesh.primitive_cone_add(radius1=0.065, radius2=0.01, depth=0.45, vertices=8, location=(0.46, -0.02, 2.18))
    f2 = bpy.context.active_object
    f2.scale = (1.0, 0.18, 1.0)
    f2.rotation_euler = (math.radians(-6), math.radians(35), math.radians(-24))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in f2.data.polygons: p.use_smooth = True
    f2.data.materials.append(mat_feather_white)
    head_parts.append(f2)

    # Khuyên giữ lông chim bằng vàng
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.06, vertices=16, location=(0.48, -0.08, 1.98))
    clasp = bpy.context.active_object
    clasp.rotation_euler = (math.radians(20), math.radians(30), 0)
    bpy.ops.object.transform_apply(rotation=True)
    for p in clasp.data.polygons: p.use_smooth = True
    clasp.data.materials.append(mat_gold)
    head_parts.append(clasp)

    # Gộp thành 1 object
    bpy.ops.object.select_all(action='DESELECT')
    for p in head_parts: p.select_set(True)
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.join()
    headband = band
    headband.name = 'Deluxe_Tribal_Headband'
    parent_to_bone(headband, 'head')
    return headband

# --- VƯƠNG MIỆN HOÀNG GIA CHO ĐỜI CAO ---
def build_deluxe_royal_crown():
    crown_parts = []
    mat_gold = make_mat('Crown_Gold', (1.0, 0.82, 0.16, 1.0), roughness=0.18, metallic=0.96)
    mat_ruby = make_mat('Crown_Ruby', (0.95, 0.05, 0.15, 1.0), roughness=0.1, metallic=0.2, emissive=(0.9, 0.02, 0.1, 1), emissive_intensity=0.7)
    mat_sapphire = make_mat('Crown_Sapphire', (0.06, 0.45, 1.0, 1.0), roughness=0.1, metallic=0.2, emissive=(0.0, 0.35, 0.95, 1), emissive_intensity=0.7)

    # Vành vương miện tròn bao quanh đỉnh tóc
    bpy.ops.mesh.primitive_cylinder_add(radius=0.51, depth=0.11, vertices=48, location=(0, -0.01, 2.08))
    ring = bpy.context.active_object
    ring.scale = (1.04, 1.08, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    for p in ring.data.polygons: p.use_smooth = True
    ring.data.materials.append(mat_gold)
    crown_parts.append(ring)

    # 5 chóp nhọn khảm ngọc
    angles = [-math.pi/2 - 0.95, -math.pi/2 - 0.48, -math.pi/2, -math.pi/2 + 0.48, -math.pi/2 + 0.95]
    for i, ang in enumerate(angles):
        is_center = (i == 2)
        r = 0.51
        x = math.cos(ang) * r * 1.04
        y = math.sin(ang) * r * 1.08
        h = 0.38 if is_center else (0.28 if abs(i-2) == 1 else 0.22)
        w = 0.095 if is_center else 0.08
        
        bpy.ops.mesh.primitive_cone_add(radius1=w, depth=h, vertices=4, location=(x, y, 2.13 + h/2))
        sp = bpy.context.active_object
        sp.rotation_euler = (0, 0, ang + math.pi/4)
        bpy.ops.object.transform_apply(rotation=True)
        for p in sp.data.polygons: p.use_smooth = True
        sp.data.materials.append(mat_gold)
        crown_parts.append(sp)

        # Hạt ngọc tỏa sáng
        gmat = mat_ruby if is_center or abs(i-2) == 2 else mat_sapphire
        gr = 0.058 if is_center else 0.045
        bpy.ops.mesh.primitive_ico_sphere_add(radius=gr, subdivisions=2, location=(x * 1.04, y * 1.04, 2.12 + h * 0.48))
        gem = bpy.context.active_object
        for p in gem.data.polygons: p.use_smooth = True
        gem.data.materials.append(gmat)
        crown_parts.append(gem)

    bpy.ops.object.select_all(action='DESELECT')
    for p in crown_parts: p.select_set(True)
    bpy.context.view_layer.objects.active = ring
    bpy.ops.object.join()
    crown = ring
    crown.name = 'Deluxe_Royal_Crown'
    parent_to_bone(crown, 'head')
    return crown

# --- CHIẾU SÁNG STUDIO CHÂN DUNG HOẠT HÌNH (MẶT TƯƠI SÁNG, MẮT RÕ RÀNG) ---
def setup_portrait_studio_lighting():
    # 1. Key light chiếu từ trên chếch trước
    k_data = bpy.data.lights.new('KeyLight', type='SUN')
    k_data.energy = 3.6
    k_obj = bpy.data.objects.new('KeyLight', k_data)
    bpy.context.scene.collection.objects.link(k_obj)
    k_obj.rotation_euler = (math.radians(35), math.radians(-15), math.radians(25))

    # 2. Eye & Face Fill Light (Chiếu thẳng mặt nhẹ nhàng để xóa bóng hốc mắt dưới tóc mái)
    f_data = bpy.data.lights.new('FaceFill', type='SUN')
    f_data.energy = 2.8
    f_obj = bpy.data.objects.new('FaceFill', f_data)
    bpy.context.scene.collection.objects.link(f_obj)
    f_obj.rotation_euler = (math.radians(8), 0, 0)

    # 3. Rim Light sau lưng làm óng ánh đường viền tóc
    r_data = bpy.data.lights.new('RimLight', type='SUN')
    r_data.energy = 4.0
    r_obj = bpy.data.objects.new('RimLight', r_data)
    bpy.context.scene.collection.objects.link(r_obj)
    r_obj.rotation_euler = (math.radians(-60), math.radians(20), math.radians(-30))

def render_angle(file_name, cam_pos, cam_rot):
    cam_data = bpy.data.cameras.new('Camera')
    cam_data.lens = 55
    cam_obj = bpy.data.objects.new('Camera', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = cam_pos
    cam_obj.rotation_euler = tuple(math.radians(a) for a in cam_rot)

    bpy.context.scene.render.resolution_x = 850
    bpy.context.scene.render.resolution_y = 850
    bpy.context.scene.render.film_transparent = True
    out_path = os.path.abspath(f'co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh/{file_name}.png')
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    bpy.context.scene.collection.objects.unlink(cam_obj)
    bpy.data.objects.remove(cam_obj)
    bpy.data.cameras.remove(cam_data)
    print('Rendered:', out_path)

# ================================================================
# THỰC THI: MẪU 1 (THỦ LĨNH THIẾU NIÊN ĐỜI 1)
# ================================================================
clear_scene()
load_base_model()

# Tóc nâu sô-cô-la ấm áp, óng ả
mat_hair_rich = make_mat('Hair_RichBrown', (0.22, 0.11, 0.05, 1.0), roughness=0.45)
build_flowing_hair(mat_hair_rich)
build_deluxe_tribal_headband()
setup_portrait_studio_lighting()

# Áo choàng da thú ấm áp
cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_FurWarm', (0.62, 0.28, 0.12, 1.0), roughness=0.75))

render_angle('thu_linh_chuan_chinh_dien', (0, -3.1, 1.82), (88, 0, 0))
render_angle('thu_linh_chuan_goc_34', (-2.1, -2.4, 1.90), (83, 0, -42))
render_angle('thu_linh_chuan_canh_phai', (3.1, -0.2, 1.82), (88, 0, 90))
render_angle('thu_linh_chuan_phia_sau', (0, 3.1, 1.82), (92, 0, 180))
render_angle('thu_linh_chuan_toan_than', (0, -4.6, 1.35), (82, 0, 0))

# ================================================================
# THỰC THI: MẪU 2 (VƯƠNG MIỆN HOÀNG GIA ĐỜI CAO)
# ================================================================
clear_scene()
load_base_model()

mat_hair_gold = make_mat('Hair_NobleGold', (0.82, 0.60, 0.18, 1.0), roughness=0.45)
build_flowing_hair(mat_hair_gold)
build_deluxe_royal_crown()
setup_portrait_studio_lighting()

cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_RoyalRed', (0.78, 0.08, 0.12, 1.0), roughness=0.6))

render_angle('vua_chuan_chinh_dien', (0, -3.1, 1.82), (88, 0, 0))
render_angle('vua_chuan_goc_34', (-2.1, -2.4, 1.90), (83, 0, -42))
render_angle('vua_chuan_toan_than', (0, -4.6, 1.35), (82, 0, 0))
