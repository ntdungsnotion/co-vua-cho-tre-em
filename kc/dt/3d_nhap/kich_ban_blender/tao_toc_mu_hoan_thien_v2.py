# ================================================================
# KỊCH BẢN BLENDER: tao_toc_mu_hoan_thien_v2.py
# CHỨC NĂNG: Tinh chỉnh tóc 3D hoàn hảo:
#            - Khối tóc ôm khít 100% sọ sau gáy, không để lọt khe hở da đầu
#            - Tóc mái anime mềm mại, tỉa lớp đan chéo tự nhiên
#            - Tóc đỉnh đầu phủ kín lòng vương miện & trên băng trán
# BƯỚC: Thử nghiệm đồ họa 3D nhân vật (Cách 2 - Hoàn thiện v2)
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

def make_mat(name, color, roughness=0.45, metallic=0.0, emissive=(0,0,0,1), emissive_intensity=0.0):
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

def create_smooth_lock(name, r1, r2, depth, loc, rot, scale, verts=8):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=verts, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = tuple(math.radians(a) for a in rot)
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in obj.data.polygons: p.use_smooth = True
    return obj

# --- DỰNG BỘ TÓC ANIME LIỀN MẠCH, CHE KÍN 100% DA ĐẦU TRỌC ---
def build_perfect_anime_hair(hair_mat):
    parts = []

    # 1. Khối đế tóc chính (Top Skull Dome): bao trùm đỉnh sọ
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.505, segments=36, ring_count=24, location=(0, -0.01, 1.95))
    cap = bpy.context.active_object
    cap.scale = (1.05, 1.07, 0.76)
    bpy.ops.object.transform_apply(scale=True)
    for p in cap.data.polygons: p.use_smooth = True
    cap.data.materials.append(hair_mat)
    parts.append(cap)

    # 2. Khối vỏ tóc gáy (Back Head Shell): bao phủ toàn bộ sau gáy từ Z=1.95 xuống Z=1.42 (xóa sạch khe hở)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.495, depth=0.48, vertices=36, location=(0, 0.05, 1.68))
    back_shell = bpy.context.active_object
    back_shell.scale = (1.04, 1.05, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    for p in back_shell.data.polygons: p.use_smooth = True
    back_shell.data.materials.append(hair_mat)
    parts.append(back_shell)

    # 3. TÓC MÁI ANIME ĐAN XẾP TỰ NHIÊN (Bangs)
    # Các lọn tóc vuốt nhọn hình giọt nước, áp sát trán (độ dày mỏng 0.035, không che mắt, không đổ bóng)
    bangs = [
        # Lọn rẽ ngôi trái vắt chéo nhẹ
        ("b_mid_l", 0.09, 0.008, 0.36, (-0.05, -0.47, 1.88), (-16, 8, 4), (1.1, 0.32, 1.0)),
        # Lọn rẽ ngôi phải vuốt qua
        ("b_mid_r", 0.09, 0.008, 0.38, (0.08, -0.47, 1.87), (-16, -10, -4), (1.1, 0.32, 1.0)),
        # Lọn trái 1
        ("b_l1", 0.085, 0.008, 0.34, (-0.18, -0.45, 1.89), (-14, 16, 8), (1.1, 0.32, 1.0)),
        # Lọn phải 1
        ("b_r1", 0.085, 0.008, 0.34, (0.22, -0.45, 1.89), (-14, -16, -8), (1.1, 0.32, 1.0)),
        # Lọn mai trái ôm trán
        ("b_l2", 0.08, 0.008, 0.32, (-0.30, -0.42, 1.88), (-12, 24, 12), (1.1, 0.32, 1.0)),
        # Lọn mai phải ôm trán
        ("b_r2", 0.08, 0.008, 0.32, (0.33, -0.42, 1.88), (-12, -24, -12), (1.1, 0.32, 1.0)),
    ]
    for bname, r1, r2, d, loc, rot, sc in bangs:
        obj = create_smooth_lock(bname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 4. TÓC HAI BÊN MANG TAI (Sideburns)
    side_locks = [
        ("side_l1", 0.09, 0.010, 0.42, (-0.49, -0.16, 1.72), (8, -14, -8), (1.0, 0.40, 1.0)),
        ("side_l2", 0.08, 0.008, 0.36, (-0.51, -0.04, 1.58), (5, -10, 0), (1.0, 0.40, 1.0)),
        ("side_r1", 0.09, 0.010, 0.42, (0.49, -0.16, 1.72), (8, 14, 8), (1.0, 0.40, 1.0)),
        ("side_r2", 0.08, 0.008, 0.36, (0.51, -0.04, 1.58), (5, 10, 0), (1.0, 0.40, 1.0)),
    ]
    for sname, r1, r2, d, loc, rot, sc in side_locks:
        obj = create_smooth_lock(sname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 5. LỌN TÓC ĐUÔI GÁY (Xếp lớp mềm phủ sau lưng áo)
    back_locks = [
        ("tail_c1", 0.12, 0.02, 0.38, (0.00, 0.47, 1.52), (-12, 0, 0), (1.2, 0.40, 1.0)),
        ("tail_l1", 0.11, 0.02, 0.36, (-0.18, 0.45, 1.51), (-10, 12, -4), (1.1, 0.40, 1.0)),
        ("tail_r1", 0.11, 0.02, 0.36, (0.18, 0.45, 1.51), (-10, -12, 4), (1.1, 0.40, 1.0)),
        ("tail_l2", 0.10, 0.015, 0.34, (-0.32, 0.36, 1.50), (-8, 20, -8), (1.0, 0.40, 1.0)),
        ("tail_r2", 0.10, 0.015, 0.34, (0.32, 0.36, 1.50), (-8, -20, 8), (1.0, 0.40, 1.0)),
    ]
    for tname, r1, r2, d, loc, rot, sc in back_locks:
        obj = create_smooth_lock(tname, r1, r2, d, loc, rot, sc, verts=8)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    # 6. CÁC CHỎM TÓC ĐỈNH ĐẦU (Tự nhiên, lấp đầy bên trong vương miện)
    tufts = [
        ("tuft_1", 0.08, 0.01, 0.25, (0.05, -0.08, 2.22), (20, 8, 0), (1.0, 0.8, 1.0)),
        ("tuft_2", 0.07, 0.01, 0.23, (-0.08, -0.04, 2.23), (16, -14, 0), (1.0, 0.8, 1.0)),
        ("tuft_3", 0.07, 0.01, 0.21, (0.12, 0.06, 2.20), (-10, 18, 0), (1.0, 0.8, 1.0)),
        ("tuft_4", 0.06, 0.01, 0.19, (-0.11, 0.09, 2.19), (-14, -14, 0), (1.0, 0.8, 1.0)),
    ]
    for tname, r1, r2, d, loc, rot, sc in tufts:
        obj = create_smooth_lock(tname, r1, r2, d, loc, rot, sc, verts=6)
        obj.data.materials.append(hair_mat)
        parts.append(obj)

    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = cap
    bpy.ops.object.join()
    hair = cap
    hair.name = 'Perfect_Anime_Hair'
    parent_to_bone(hair, 'head')
    return hair

# --- BĂNG TRÁN DA THÚ + LÔNG CHIM HOẠT HÌNH ---
def build_tribal_headband_v2():
    head_parts = []
    mat_leather = make_mat('Band_Leather', (0.46, 0.15, 0.06, 1.0), roughness=0.55)
    mat_gold = make_mat('Band_Gold', (1.0, 0.82, 0.18, 1.0), roughness=0.22, metallic=0.94)
    mat_ruby = make_mat('Band_Ruby', (0.95, 0.05, 0.12, 1.0), roughness=0.1, metallic=0.2, emissive=(0.95, 0.05, 0.1, 1), emissive_intensity=0.9)
    mat_feather_red = make_mat('Feather_Red', (0.92, 0.10, 0.14, 1.0), roughness=0.55)
    mat_feather_white = make_mat('Feather_White', (0.98, 0.98, 0.96, 1.0), roughness=0.55)

    # 1. Băng trán chính
    bpy.ops.mesh.primitive_torus_add(major_radius=0.512, minor_radius=0.032, major_segments=48, minor_segments=16, location=(0, -0.01, 1.96))
    band = bpy.context.active_object
    band.scale = (1.05, 1.07, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    for p in band.data.polygons: p.use_smooth = True
    band.data.materials.append(mat_leather)
    head_parts.append(band)

    # 2. Hai sợi chỉ vàng
    for z_off in [-0.022, 0.022]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.518, minor_radius=0.007, major_segments=40, minor_segments=8, location=(0, -0.01, 1.96 + z_off))
        wire = bpy.context.active_object
        wire.scale = (1.05, 1.07, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        for p in wire.data.polygons: p.use_smooth = True
        wire.data.materials.append(mat_gold)
        head_parts.append(wire)

    # 3. Huy hiệu trán: Mặt trời vàng nhỏ xinh + viên ngọc đỏ tỏa sáng
    bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.025, vertices=24, location=(0, -0.55, 1.96))
    med = bpy.context.active_object
    med.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    for p in med.data.polygons: p.use_smooth = True
    med.data.materials.append(mat_gold)
    head_parts.append(med)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.038, subdivisions=2, location=(0, -0.57, 1.96))
    gem = bpy.context.active_object
    for p in gem.data.polygons: p.use_smooth = True
    gem.data.materials.append(mat_ruby)
    head_parts.append(gem)

    # 4. LÔNG VŨ ĐẠI BÀNG (2 cọng lông uốn cong mềm mại sau tai phải)
    bpy.ops.mesh.primitive_cone_add(radius1=0.065, radius2=0.008, depth=0.52, vertices=8, location=(0.50, -0.10, 2.22))
    f1 = bpy.context.active_object
    f1.scale = (1.0, 0.15, 1.0)
    f1.rotation_euler = (math.radians(12), math.radians(24), math.radians(-14))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in f1.data.polygons: p.use_smooth = True
    f1.data.materials.append(mat_feather_red)
    head_parts.append(f1)

    bpy.ops.mesh.primitive_cone_add(radius1=0.055, radius2=0.008, depth=0.42, vertices=8, location=(0.47, -0.01, 2.15))
    f2 = bpy.context.active_object
    f2.scale = (1.0, 0.15, 1.0)
    f2.rotation_euler = (math.radians(-6), math.radians(34), math.radians(-22))
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    for p in f2.data.polygons: p.use_smooth = True
    f2.data.materials.append(mat_feather_white)
    head_parts.append(f2)

    # Khuyên giữ vàng
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.05, vertices=16, location=(0.49, -0.06, 1.97))
    clasp = bpy.context.active_object
    clasp.rotation_euler = (math.radians(15), math.radians(28), 0)
    bpy.ops.object.transform_apply(rotation=True)
    for p in clasp.data.polygons: p.use_smooth = True
    clasp.data.materials.append(mat_gold)
    head_parts.append(clasp)

    bpy.ops.object.select_all(action='DESELECT')
    for p in head_parts: p.select_set(True)
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.join()
    headband = band
    headband.name = 'Perfect_Tribal_Headband'
    parent_to_bone(headband, 'head')
    return headband

# --- VƯƠNG MIỆN HOÀNG GIA ĐỜI CAO ---
def build_royal_crown_v2():
    crown_parts = []
    mat_gold = make_mat('Crown_Gold', (1.0, 0.82, 0.16, 1.0), roughness=0.18, metallic=0.96)
    mat_ruby = make_mat('Crown_Ruby', (0.95, 0.05, 0.15, 1.0), roughness=0.1, metallic=0.2, emissive=(0.95, 0.02, 0.1, 1), emissive_intensity=0.8)
    mat_sapphire = make_mat('Crown_Sapphire', (0.06, 0.45, 1.0, 1.0), roughness=0.1, metallic=0.2, emissive=(0.0, 0.35, 0.95, 1), emissive_intensity=0.8)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.512, depth=0.09, vertices=48, location=(0, -0.01, 2.06))
    ring = bpy.context.active_object
    ring.scale = (1.04, 1.07, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    for p in ring.data.polygons: p.use_smooth = True
    ring.data.materials.append(mat_gold)
    crown_parts.append(ring)

    angles = [-math.pi/2 - 0.95, -math.pi/2 - 0.48, -math.pi/2, -math.pi/2 + 0.48, -math.pi/2 + 0.95]
    for i, ang in enumerate(angles):
        is_center = (i == 2)
        r = 0.512
        x = math.cos(ang) * r * 1.04
        y = math.sin(ang) * r * 1.07
        h = 0.34 if is_center else (0.25 if abs(i-2) == 1 else 0.19)
        w = 0.085 if is_center else 0.072
        
        bpy.ops.mesh.primitive_cone_add(radius1=w, depth=h, vertices=4, location=(x, y, 2.10 + h/2))
        sp = bpy.context.active_object
        sp.rotation_euler = (0, 0, ang + math.pi/4)
        bpy.ops.object.transform_apply(rotation=True)
        for p in sp.data.polygons: p.use_smooth = True
        sp.data.materials.append(mat_gold)
        crown_parts.append(sp)

        gmat = mat_ruby if is_center or abs(i-2) == 2 else mat_sapphire
        gr = 0.052 if is_center else 0.040
        bpy.ops.mesh.primitive_ico_sphere_add(radius=gr, subdivisions=2, location=(x * 1.04, y * 1.04, 2.09 + h * 0.48))
        gem = bpy.context.active_object
        for p in gem.data.polygons: p.use_smooth = True
        gem.data.materials.append(gmat)
        crown_parts.append(gem)

    bpy.ops.object.select_all(action='DESELECT')
    for p in crown_parts: p.select_set(True)
    bpy.context.view_layer.objects.active = ring
    bpy.ops.object.join()
    crown = ring
    crown.name = 'Perfect_Royal_Crown'
    parent_to_bone(crown, 'head')
    return crown

# --- HỆ THỐNG ĐÈN CHÂN DUNG TRỰC DIỆN ---
def setup_bright_portrait_lighting():
    # Đèn trực diện xóa bóng
    front_data = bpy.data.lights.new('FrontFill', type='POINT')
    front_data.energy = 85.0
    front_data.shadow_soft_size = 0.35
    front_obj = bpy.data.objects.new('FrontFill', front_data)
    bpy.context.scene.collection.objects.link(front_obj)
    front_obj.location = (0, -2.5, 1.85)

    # Đèn trên đỉnh tạo khối
    sun_data = bpy.data.lights.new('KeySun', type='SUN')
    sun_data.energy = 2.5
    sun_obj = bpy.data.objects.new('KeySun', sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (math.radians(35), math.radians(-15), math.radians(20))

    # Đèn viền óng ánh
    rim_data = bpy.data.lights.new('RimSun', type='SUN')
    rim_data.energy = 3.2
    rim_obj = bpy.data.objects.new('RimSun', rim_data)
    bpy.context.scene.collection.objects.link(rim_obj)
    rim_obj.rotation_euler = (math.radians(-65), math.radians(20), math.radians(-30))

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
# THỰC THI MẪU 1: THỦ LĨNH THIẾU NIÊN ĐỜI 1
# ================================================================
clear_scene()
load_base_model()

mat_hair_brown = make_mat('Hair_Chestnut', (0.24, 0.12, 0.05, 1.0), roughness=0.45)
build_perfect_anime_hair(mat_hair_brown)
build_tribal_headband_v2()
setup_bright_portrait_lighting()

cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_FurWarm', (0.62, 0.28, 0.12, 1.0), roughness=0.75))

render_angle('thu_linh_v2_chinh_dien', (0, -3.1, 1.82), (88, 0, 0))
render_angle('thu_linh_v2_goc_34', (-2.1, -2.4, 1.90), (83, 0, -42))
render_angle('thu_linh_v2_canh_phai', (3.1, -0.2, 1.82), (88, 0, 90))
render_angle('thu_linh_v2_phia_sau', (0, 3.1, 1.82), (92, 0, 180))
render_angle('thu_linh_v2_toan_than', (0, -4.6, 1.35), (82, 0, 0))

glb_out1 = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/thu_linh_doi1_v2.glb')
bpy.ops.export_scene.gltf(filepath=glb_out1, export_format='GLB')
print('Exported GLB 1:', glb_out1)

# ================================================================
# THỰC THI MẪU 2: QUỐC VƯƠNG HOÀNG GIA ĐỜI CAO
# ================================================================
clear_scene()
load_base_model()

mat_hair_gold = make_mat('Hair_Golden', (0.85, 0.62, 0.18, 1.0), roughness=0.45)
build_perfect_anime_hair(mat_hair_gold)
build_royal_crown_v2()
setup_bright_portrait_lighting()

cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_RoyalRed', (0.78, 0.08, 0.12, 1.0), roughness=0.6))

render_angle('vua_v2_chinh_dien', (0, -3.1, 1.82), (88, 0, 0))
render_angle('vua_v2_goc_34', (-2.1, -2.4, 1.90), (83, 0, -42))
render_angle('vua_v2_toan_than', (0, -4.6, 1.35), (82, 0, 0))

glb_out2 = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/vua_v2.glb')
bpy.ops.export_scene.gltf(filepath=glb_out2, export_format='GLB')
print('Exported GLB 2:', glb_out2)
