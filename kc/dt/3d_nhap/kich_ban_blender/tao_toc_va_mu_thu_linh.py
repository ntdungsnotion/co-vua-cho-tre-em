# ================================================================
# KỊCH BẢN BLENDER: tao_toc_va_mu_thu_linh.py
# CHỨC NĂNG: Tạo tóc 3D bồng bềnh (che trán dô, hai bên mang tai, sau gáy, đỉnh đầu)
#            kết hợp với Mũ/Băng trán/Vương miện cho Thủ lĩnh.
#            Render 2 mẫu:
#            - Mẫu 1: Thủ lĩnh Thiếu niên Đời 1 (Băng trán da thú + Lông chim + Tóc mái lãng tử)
#            - Mẫu 2: Quốc Vương Hoàng Gia (Vương miện vàng khảm ngọc + Tóc quý tộc)
# BƯỚC: Thử nghiệm đồ họa 3D nhân vật (Cách 2)
# NGÀY: 24/10/2026
# ================================================================
import bpy, os, math
from mathutils import Matrix, Vector

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def load_base_model():
    glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/nhan_vat.glb')
    bpy.ops.import_scene.gltf(filepath=glb_path)
    # Hide barbarian hat & axes
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

def make_mat(name, color, roughness=0.6, metallic=0.0, emissive=(0,0,0,1), emissive_intensity=0.0):
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

# --- TẠO MÁI TÓC 3D BỒNG BỀNH (STYLIZED CHIBI HAIR) ---
# Trùm kín hộp sọ để không bao giờ lộ đầu trọc dù nhìn từ góc nào
def build_stylized_hair(hair_mat, is_royal=False):
    hair_parts = []
    
    # 1. Đỉnh đầu (Top Hair Dome): Một vòm tóc phồng mềm mại ôm trọn đỉnh sọ
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.48, segments=24, ring_count=16, location=(0, -0.02, 2.02))
    dome = bpy.context.active_object
    dome.scale = (1.05, 1.08, 0.72)
    bpy.ops.object.transform_apply(scale=True)
    dome.data.materials.append(hair_mat)
    hair_parts.append(dome)

    # 2. Tóc phía sau gáy (Back Hair - 3 lớp lọn tóc ôm sát gáy xuống vai)
    back_layers = [
        (0.0, 0.40, 1.82, 0.38, 0.15, 0.42, 15),
        (-0.25, 0.35, 1.78, 0.28, 0.14, 0.38, 20),
        (0.25, 0.35, 1.78, 0.28, 0.14, 0.38, -20),
        (-0.16, 0.38, 1.62, 0.26, 0.12, 0.36, 12),
        (0.16, 0.38, 1.62, 0.26, 0.12, 0.36, -12),
        (0.0, 0.42, 1.55, 0.30, 0.12, 0.32, 5),
    ]
    for x, y, z, sx, sy, sz, rot_y in back_layers:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z))
        b = bpy.context.active_object
        b.scale = (sx, sy, sz)
        b.rotation_euler = (math.radians(-15), math.radians(rot_y), 0)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        b.data.materials.append(hair_mat)
        hair_parts.append(b)

    # 3. Tóc hai bên mang tai / tóc mai (Sideburns)
    for s in [-1, 1]:
        # Tóc mai trên
        bpy.ops.mesh.primitive_cone_add(radius1=0.14, radius2=0.03, depth=0.42, location=(0.46 * s, -0.15, 1.75))
        sb1 = bpy.context.active_object
        sb1.rotation_euler = (math.radians(10), math.radians(-15 * s), math.radians(-10 * s))
        bpy.ops.object.transform_apply(rotation=True)
        sb1.data.materials.append(hair_mat)
        hair_parts.append(sb1)
        # Tóc mai dưới nhọn dần
        bpy.ops.mesh.primitive_cone_add(radius1=0.10, radius2=0.01, depth=0.35, location=(0.48 * s, -0.12, 1.50))
        sb2 = bpy.context.active_object
        sb2.rotation_euler = (math.radians(15), math.radians(-8 * s), 0)
        bpy.ops.object.transform_apply(rotation=True)
        sb2.data.materials.append(hair_mat)
        hair_parts.append(sb2)

    # 4. Tóc mái phía trước (Bangs/Fringe - Che trán dô, tạo lọn anime đáng yêu)
    # 5 lọn tóc mái xếp lớp rủ xuống trán
    bangs_specs = [
        # (x, y, z, r1, r2, depth, rot_x, rot_y, rot_z)
        (0.0, -0.42, 1.95, 0.14, 0.02, 0.45, -28, 5, 0),        # Lọn giữa trán dài nhất
        (-0.16, -0.40, 1.96, 0.13, 0.02, 0.40, -25, -15, 8),     # Lọn trái 1
        (0.16, -0.40, 1.96, 0.13, 0.02, 0.40, -25, 15, -8),      # Lọn phải 1
        (-0.32, -0.36, 1.94, 0.12, 0.02, 0.38, -20, -32, 18),    # Lọn trái ngoài
        (0.32, -0.36, 1.94, 0.12, 0.02, 0.38, -20, 32, -18),     # Lọn phải ngoài
        (-0.08, -0.44, 2.04, 0.12, 0.03, 0.35, -35, -5, 0),      # Lớp mái thứ 2 (bồng bềnh)
        (0.10, -0.44, 2.04, 0.12, 0.03, 0.35, -35, 8, 0),       # Lớp mái thứ 2 (bồng bềnh)
    ]
    for x, y, z, r1, r2, depth, rx, ry, rz in bangs_specs:
        bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=6, location=(x, y, z))
        bg = bpy.context.active_object
        bg.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
        bpy.ops.object.transform_apply(rotation=True)
        bg.data.materials.append(hair_mat)
        hair_parts.append(bg)

    # 5. Các chỏm tóc nhọn tự nhiên trên đỉnh đầu (Hair tufts on top)
    tufts = [
        (0.08, -0.15, 2.30, 0.10, 0.28, 25, 10),
        (-0.12, -0.10, 2.32, 0.11, 0.30, 20, -15),
        (0.18, 0.08, 2.28, 0.10, 0.26, -15, 25),
        (-0.15, 0.12, 2.27, 0.09, 0.25, -20, -20),
    ]
    for x, y, z, r, depth, rx, ry in tufts:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=0.01, depth=depth, vertices=5, location=(x, y, z))
        tf = bpy.context.active_object
        tf.rotation_euler = (math.radians(rx), math.radians(ry), 0)
        bpy.ops.object.transform_apply(rotation=True)
        tf.data.materials.append(hair_mat)
        hair_parts.append(tf)

    # Gộp tất cả tóc thành 1 mesh duy nhất
    bpy.ops.object.select_all(action='DESELECT')
    for p in hair_parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = dome
    bpy.ops.object.join()
    hair = dome
    hair.name = 'Stylized_Hair'
    parent_to_bone(hair, 'head')
    return hair

# --- MẪU 1: BĂNG TRÁN DA THÚ + LÔNG CHIM THỦ LĨNH ĐỜI 1 ---
def build_tribal_headband():
    head_parts = []
    mat_band = make_mat('Band_Leather', (0.78, 0.26, 0.12, 1.0), roughness=0.6)  # Da nâu đỏ tươi
    mat_gold_ornament = make_mat('Ornament_Gold', (1.0, 0.82, 0.2, 1.0), roughness=0.25, metallic=0.9)
    mat_feather_white = make_mat('Feather_White', (0.96, 0.96, 0.95, 1.0), roughness=0.7)
    mat_feather_red = make_mat('Feather_Red', (0.90, 0.12, 0.15, 1.0), roughness=0.6)
    
    # 1. Băng trán quấn ngang đầu (đè lên chân tóc)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.485, minor_radius=0.042, major_segments=36, minor_segments=12, location=(0, -0.01, 1.96))
    band = bpy.context.active_object
    band.scale = (1.06, 1.10, 0.95)
    bpy.ops.object.transform_apply(scale=True)
    band.data.materials.append(mat_band)
    head_parts.append(band)

    # 2. Huy hiệu ngọc vàng chính giữa trán
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.04, vertices=16, location=(0, -0.53, 1.96))
    gem = bpy.context.active_object
    gem.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    gem.data.materials.append(mat_gold_ornament)
    head_parts.append(gem)

    # Viên ngọc đỏ ở tâm huy hiệu
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, subdivisions=2, location=(0, -0.555, 1.96))
    ruby = bpy.context.active_object
    ruby.data.materials.append(mat_feather_red)
    head_parts.append(ruby)

    # 3. Hai cọng lông chim dựng chéo ngộ nghĩnh bên tai phải (phong cách thiếu niên hoạt hình)
    feathers = [
        # (x, y, z, len, w, rot_x, rot_y, rot_z, mat)
        (0.48, -0.15, 2.22, 0.48, 0.075, 12, 28, -15, mat_feather_red),      # Lông đỏ chính
        (0.44, -0.05, 2.15, 0.38, 0.065, -8, 38, -25, mat_feather_white),    # Lông trắng phụ
    ]
    for x, y, z, l, w, rx, ry, rz, fmat in feathers:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z))
        f = bpy.context.active_object
        f.scale = (w, 0.015, l)
        f.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        f.data.materials.append(fmat)
        head_parts.append(f)

    # Gộp băng trán & phụ kiện
    bpy.ops.object.select_all(action='DESELECT')
    for p in head_parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.join()
    headband = band
    headband.name = 'Tribal_Headband'
    parent_to_bone(headband, 'head')
    return headband

# --- MẪU 2: VƯƠNG MIỆN HOÀNG GIA CHO ĐỜI CAO ---
def build_royal_crown():
    crown_parts = []
    mat_gold = make_mat('Crown_Gold', (1.0, 0.82, 0.18, 1.0), roughness=0.2, metallic=0.95)
    mat_ruby = make_mat('Ruby_Gem', (0.92, 0.08, 0.15, 1.0), roughness=0.1, metallic=0.2, emissive=(0.8, 0.0, 0.1, 1), emissive_intensity=0.5)
    mat_sapphire = make_mat('Sapphire_Gem', (0.08, 0.42, 0.98, 1.0), roughness=0.1, metallic=0.2, emissive=(0.0, 0.3, 0.9, 1), emissive_intensity=0.5)

    # Vành vương miện bao quanh đỉnh đầu
    bpy.ops.mesh.primitive_cylinder_add(radius=0.48, depth=0.10, vertices=32, location=(0, -0.01, 2.08))
    ring = bpy.context.active_object
    ring.scale = (1.04, 1.08, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    ring.data.materials.append(mat_gold)
    crown_parts.append(ring)

    # 5 chóp nhọn khảm ngọc
    angles = [-math.pi/2 - 0.95, -math.pi/2 - 0.48, -math.pi/2, -math.pi/2 + 0.48, -math.pi/2 + 0.95]
    for i, ang in enumerate(angles):
        is_center = (i == 2)
        r = 0.48
        x = math.cos(ang) * r * 1.04
        y = math.sin(ang) * r * 1.08
        h = 0.35 if is_center else (0.26 if abs(i-2) == 1 else 0.20)
        w = 0.09 if is_center else 0.075
        
        bpy.ops.mesh.primitive_cone_add(radius1=w, depth=h, vertices=4, location=(x, y, 2.13 + h/2))
        sp = bpy.context.active_object
        sp.rotation_euler = (0, 0, ang + math.pi/4)
        bpy.ops.object.transform_apply(rotation=True)
        sp.data.materials.append(mat_gold)
        crown_parts.append(sp)

        # Hạt ngọc
        gmat = mat_ruby if is_center or abs(i-2) == 2 else mat_sapphire
        gr = 0.055 if is_center else 0.042
        bpy.ops.mesh.primitive_ico_sphere_add(radius=gr, subdivisions=2, location=(x * 1.05, y * 1.05, 2.12 + h * 0.45))
        gem = bpy.context.active_object
        gem.data.materials.append(gmat)
        crown_parts.append(gem)

    bpy.ops.object.select_all(action='DESELECT')
    for p in crown_parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = ring
    bpy.ops.object.join()
    crown = ring
    crown.name = 'Royal_Crown'
    parent_to_bone(crown, 'head')
    return crown

# --- THIẾT LẬP CAMERA VÀ ÁNH SÁNG STUDIO ĐỂ RENDER ---
def setup_lighting():
    # Key light
    k_data = bpy.data.lights.new('KeyLight', type='SUN')
    k_data.energy = 4.5
    k_obj = bpy.data.objects.new('KeyLight', k_data)
    bpy.context.scene.collection.objects.link(k_obj)
    k_obj.rotation_euler = (math.radians(45), math.radians(-20), math.radians(35))

    # Fill light
    f_data = bpy.data.lights.new('FillLight', type='SUN')
    f_data.energy = 2.2
    f_obj = bpy.data.objects.new('FillLight', f_data)
    bpy.context.scene.collection.objects.link(f_obj)
    f_obj.rotation_euler = (math.radians(-30), math.radians(30), math.radians(-140))

    # Rim light
    r_data = bpy.data.lights.new('RimLight', type='SUN')
    r_data.energy = 3.8
    r_obj = bpy.data.objects.new('RimLight', r_data)
    bpy.context.scene.collection.objects.link(r_obj)
    r_obj.rotation_euler = (math.radians(-65), math.radians(10), math.radians(-10))

def render_angle(file_name, cam_pos, cam_rot, target_z=1.80):
    cam_data = bpy.data.cameras.new('Camera')
    cam_data.lens = 55 # Ống kính chân dung không bị méo góc
    cam_obj = bpy.data.objects.new('Camera', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = cam_pos
    cam_obj.rotation_euler = tuple(math.radians(a) for a in cam_rot)

    bpy.context.scene.render.resolution_x = 800
    bpy.context.scene.render.resolution_y = 800
    bpy.context.scene.render.film_transparent = True
    out_path = os.path.abspath(f'co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh/{file_name}.png')
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    bpy.context.scene.collection.objects.unlink(cam_obj)
    bpy.data.objects.remove(cam_obj)
    bpy.data.cameras.remove(cam_data)
    print('Rendered:', out_path)

# ================================================================
# CHẠY TẠO VÀ RENDER 2 MẪU
# ================================================================

# --- THỰC HIỆN MẪU 1: THỦ LĨNH THIẾU NIÊN ĐỜI 1 ---
clear_scene()
load_base_model()
mat_hair_brown = make_mat('Hair_Chestnut', (0.35, 0.18, 0.08, 1.0), roughness=0.7) # Nâu hạt dẻ ấm áp
build_stylized_hair(mat_hair_brown)
build_tribal_headband()
setup_lighting()

# Đổi áo choàng sang màu nâu cam da thú ấm áp
cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_Fur', (0.55, 0.28, 0.12, 1.0), roughness=0.8))

# 4 góc chụp cho Mẫu 1 (tập trung vào phần đầu & khuôn mặt)
# 1. Chính diện cận cảnh
render_angle('thu_linh_doi1_chinh_dien', (0, -3.2, 1.85), (88, 0, 0))
# 2. Góc nghiêng 3/4
render_angle('thu_linh_doi1_goc_34', (-2.2, -2.5, 1.95), (82, 0, -42))
# 3. Nhìn từ phía sau (kiểm tra tóc sau gáy & lông chim)
render_angle('thu_linh_doi1_phia_sau', (0, 3.2, 1.85), (92, 0, 180))
# 4. Toàn thân chính diện
render_angle('thu_linh_doi1_toan_than', (0, -4.5, 1.35), (82, 0, 0))

# Xuất file GLB cho Mẫu 1
glb_out1 = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/thu_linh_doi1_toc_mu.glb')
bpy.ops.export_scene.gltf(filepath=glb_out1, export_format='GLB')
print('Exported GLB 1:', glb_out1)

# --- THỰC HIỆN MẪU 2: QUỐC VƯƠNG HOÀNG GIA (VƯƠNG MIỆN VÀNG + TÓC QUÝ TỘC) ---
clear_scene()
load_base_model()
mat_hair_gold = make_mat('Hair_Golden', (0.85, 0.65, 0.22, 1.0), roughness=0.6) # Tóc vàng ánh kim
build_stylized_hair(mat_hair_gold, is_royal=True)
build_royal_crown()
setup_lighting()

# Áo choàng đỏ hoàng gia
cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(make_mat('Cape_RoyalRed', (0.75, 0.08, 0.12, 1.0), roughness=0.6))

# Render Mẫu 2
render_angle('vua_vuong_mien_chinh_dien', (0, -3.2, 1.85), (88, 0, 0))
render_angle('vua_vuong_mien_goc_34', (-2.2, -2.5, 1.95), (82, 0, -42))
render_angle('vua_vuong_mien_toan_than', (0, -4.5, 1.35), (82, 0, 0))

glb_out2 = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/vua_vuong_mien_toc.glb')
bpy.ops.export_scene.gltf(filepath=glb_out2, export_format='GLB')
print('Exported GLB 2:', glb_out2)
