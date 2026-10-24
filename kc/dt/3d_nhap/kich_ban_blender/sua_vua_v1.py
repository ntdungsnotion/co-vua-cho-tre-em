# ================================================================
# KỊCH BẢN BLENDER: sua_vua_v1.py
# CHỨC NĂNG: Tạo bản thử nghiệm Vua v1: Vương miện vàng khảm ngọc,
#            Kiếm báu hoàng gia, Giáp vai, Áo choàng đỏ.
# BƯỚC: Thử nghiệm đồ họa 3D nhân vật người lớn (cho bé 11 tuổi)
# NGÀY: 24/10/2026
# ================================================================
import bpy, os, math
from mathutils import Matrix, Vector

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/nhan_vat.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

# Hide old barbarian weapons & hat
for name in ['1H_Axe', '2H_Axe', 'Barbarian_Hat']:
    if name in bpy.data.objects:
        bpy.data.objects[name].hide_render = True

rig = bpy.data.objects.get('Rig')

def parent_to_bone(obj, bone_name):
    world_mat = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    bone_mat = rig.matrix_world @ rig.pose.bones[bone_name].matrix
    obj.matrix_parent_inverse = bone_mat.inverted()
    obj.matrix_world = world_mat

def make_mat(name, color, metallic=0.0, roughness=0.5, emissive=(0,0,0,1), emissive_intensity=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emissive
            bsdf.inputs['Emission Strength'].default_value = emissive_intensity
    return mat

mat_gold = make_mat('Gold_Royal', (1.0, 0.78, 0.15, 1.0), metallic=0.9, roughness=0.25)
mat_ruby = make_mat('Ruby_Gem', (0.9, 0.05, 0.12, 1.0), metallic=0.2, roughness=0.1, emissive=(0.85, 0.0, 0.1, 1), emissive_intensity=0.6)
mat_sapphire = make_mat('Sapphire_Gem', (0.05, 0.35, 0.95, 1.0), metallic=0.2, roughness=0.1, emissive=(0.0, 0.25, 0.85, 1), emissive_intensity=0.6)
mat_steel = make_mat('Blade_Steel', (0.85, 0.9, 0.95, 1.0), metallic=0.95, roughness=0.18)
mat_cape = make_mat('Royal_Red', (0.65, 0.06, 0.1, 1.0), metallic=0.05, roughness=0.7)
mat_fur = make_mat('White_Fur', (0.95, 0.95, 0.95, 1.0), metallic=0.0, roughness=0.9)

# 1. BUILD ROYAL CROWN
bpy.ops.mesh.primitive_cylinder_add(radius=0.40, depth=0.10, vertices=32, location=(0, -0.01, 2.02))
crown_ring = bpy.context.active_object
crown_ring.name = 'Crown_Ring'
crown_ring.data.materials.append(mat_gold)
parts = [crown_ring]

spike_angles = [
    -math.pi/2 - 0.9,
    -math.pi/2 - 0.45,
    -math.pi/2,         # Center front
    -math.pi/2 + 0.45,
    -math.pi/2 + 0.9,
]

for i, ang in enumerate(spike_angles):
    r = 0.40
    x = math.cos(ang) * r
    y = math.sin(ang) * r
    is_center = (i == 2)
    h = 0.32 if is_center else (0.24 if abs(i-2) == 1 else 0.18)
    w = 0.08 if is_center else 0.065
    
    bpy.ops.mesh.primitive_cone_add(radius1=w, depth=h, vertices=4, location=(x, y, 2.07 + h/2))
    sp = bpy.context.active_object
    sp.rotation_euler = (0, 0, ang + math.pi/4)
    sp.data.materials.append(mat_gold)
    parts.append(sp)
    
    gem_mat = mat_ruby if is_center or abs(i-2) == 2 else mat_sapphire
    gem_r = 0.05 if is_center else 0.038
    bpy.ops.mesh.primitive_ico_sphere_add(radius=gem_r, subdivisions=2, location=(x * 1.04, y * 1.04, 2.05 + h * 0.45))
    gem = bpy.context.active_object
    gem.data.materials.append(gem_mat)
    parts.append(gem)

bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = crown_ring
bpy.ops.object.join()
crown = crown_ring
crown.name = 'Royal_Crown'
parent_to_bone(crown, 'head')

# 2. BUILD ROYAL PAULDRONS
def make_pauldron(side, x_sign):
    pos_x = 0.38 * x_sign
    pos_y = -0.02
    pos_z = 1.18
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(pos_x, pos_y, pos_z))
    p = bpy.context.active_object
    p.scale = (1.0, 1.25, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    p.name = f'Pauldron_{side}'
    p.data.materials.append(mat_gold)
    
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, location=(pos_x + 0.12 * x_sign, pos_y, pos_z))
    gem = bpy.context.active_object
    gem.data.materials.append(mat_ruby)
    
    p.select_set(True)
    gem.select_set(True)
    bpy.context.view_layer.objects.active = p
    bpy.ops.object.join()
    
    bone_name = 'upperarm.l' if side == 'Left' else 'upperarm.r'
    parent_to_bone(p, bone_name)
    return p

make_pauldron('Left', 1)
make_pauldron('Right', -1)

# 3. BUILD ROYAL SWORD
sword_parts = []
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.48, -0.15, 0.48))
blade = bpy.context.active_object
blade.scale = (0.025, 0.08, 0.65)
bpy.ops.object.transform_apply(scale=True)
blade.data.materials.append(mat_steel)
sword_parts.append(blade)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.48, -0.15, 0.82))
guard = bpy.context.active_object
guard.scale = (0.06, 0.28, 0.045)
bpy.ops.object.transform_apply(scale=True)
guard.data.materials.append(mat_gold)
sword_parts.append(guard)

bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.18, location=(-0.48, -0.15, 0.92))
grip = bpy.context.active_object
grip.data.materials.append(mat_ruby)
sword_parts.append(grip)

bpy.ops.mesh.primitive_ico_sphere_add(radius=0.045, location=(-0.48, -0.15, 1.02))
pommel = bpy.context.active_object
pommel.data.materials.append(mat_gold)
sword_parts.append(pommel)

bpy.ops.object.select_all(action='DESELECT')
for sp in sword_parts:
    sp.select_set(True)
bpy.context.view_layer.objects.active = blade
bpy.ops.object.join()
sword = blade
sword.name = 'Royal_Sword'
parent_to_bone(sword, 'handslot.r')

# 4. CAPE
cape = bpy.data.objects.get('Barbarian_Cape')
if cape:
    cape.data.materials.clear()
    cape.data.materials.append(mat_cape)

# CAMERA & LIGHTING
cam_data = bpy.data.cameras.new('Camera')
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -4.6, 1.35)
cam_obj.rotation_euler = (math.radians(82), 0, 0)

light1_data = bpy.data.lights.new('KeyLight', type='SUN')
light1_data.energy = 4.2
light1_obj = bpy.data.objects.new('KeyLight', light1_data)
bpy.context.scene.collection.objects.link(light1_obj)
light1_obj.rotation_euler = (math.radians(45), math.radians(-20), math.radians(30))

light2_data = bpy.data.lights.new('FillLight', type='SUN')
light2_data.energy = 2.0
light2_obj = bpy.data.objects.new('FillLight', light2_data)
bpy.context.scene.collection.objects.link(light2_obj)
light2_obj.rotation_euler = (math.radians(-30), math.radians(30), math.radians(-140))

light3_data = bpy.data.lights.new('RimLight', type='SUN')
light3_data.energy = 3.5
light3_obj = bpy.data.objects.new('RimLight', light3_data)
bpy.context.scene.collection.objects.link(light3_obj)
light3_obj.rotation_euler = (math.radians(-60), math.radians(10), math.radians(-10))

bpy.context.scene.render.resolution_x = 750
bpy.context.scene.render.resolution_y = 750
bpy.context.scene.render.film_transparent = True
out_img = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh/vua_v1.png')
bpy.context.scene.render.filepath = out_img
bpy.ops.render.render(write_still=True)
