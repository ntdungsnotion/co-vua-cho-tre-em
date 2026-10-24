# ================================================================
# KỊCH BẢN BLENDER: sua_thu_linh_doi1.py
# CHỨC NĂNG: Dựng và render Thủ lĩnh Đời 1 (Áo da thú + Mũ lông vũ Da đỏ)
# BƯỚC: Thử nghiệm đồ họa 3D nhân vật Đời 1
# NGÀY: 24/10/2026
# ================================================================
import bpy, os, math
from mathutils import Matrix, Vector

bpy.ops.wm.read_factory_settings(use_empty=True)

fbx_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/rpg_quaternius/RPG Characters - Nov 2020/FBX/Warrior.fbx')
bpy.ops.import_scene.fbx(filepath=fbx_path)

tex_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/rpg_quaternius/RPG Characters - Nov 2020/Textures/Warrior_Texture.png')
tex_img = bpy.data.images.load(tex_path)

for mat in bpy.data.materials:
    if mat.use_nodes:
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            tex_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
            tex_node.image = tex_img
            mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Roughness'].default_value = 0.55

sword = bpy.data.objects.get('Warrior_Sword')
if sword:
    sword.hide_render = True

rig = bpy.data.objects.get('CharacterArmature')

def parent_to_bone(obj, bone_name):
    world_mat = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    bone_mat = rig.matrix_world @ rig.pose.bones[bone_name].matrix
    obj.matrix_parent_inverse = bone_mat.inverted()
    obj.matrix_world = world_mat

def make_mat(name, color, roughness=0.6, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
    return mat

mat_band = make_mat('Band_Beaded', (0.9, 0.22, 0.1, 1.0), roughness=0.5)
mat_bead_gold = make_mat('Bead_Gold', (1.0, 0.8, 0.2, 1.0), roughness=0.3, metallic=0.8)
mat_feather_white = make_mat('Feather_White', (0.98, 0.98, 0.95, 1.0), roughness=0.8)
mat_feather_black = make_mat('Feather_Black', (0.1, 0.1, 0.12, 1.0), roughness=0.8)
mat_feather_red = make_mat('Feather_Red', (0.85, 0.08, 0.1, 1.0), roughness=0.7)
mat_wood = make_mat('Spear_Wood', (0.35, 0.22, 0.12, 1.0), roughness=0.7)
mat_flint = make_mat('Spear_Flint', (0.2, 0.22, 0.25, 1.0), roughness=0.3, metallic=0.2)

head_b = rig.pose.bones.get('Head')
head_wloc = rig.matrix_world @ head_b.matrix.translation

# Brow is above eyes at hairline: Z + 0.48
head_center = Vector((head_wloc.x, head_wloc.y - 0.02, head_wloc.z + 0.48))

bonnet_parts = []
# Brow band (Vòng trán)
bpy.ops.mesh.primitive_torus_add(major_radius=0.31, minor_radius=0.038, major_segments=32, minor_segments=12, location=head_center)
band = bpy.context.active_object
band.scale = (1.0, 1.15, 0.9)
bpy.ops.object.transform_apply(scale=True)
band.data.materials.append(mat_band)
bonnet_parts.append(band)

# Side Rosettes
for side_x in [-0.32, 0.32]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.03, location=(head_center.x + side_x, head_center.y - 0.05, head_center.z))
    ros = bpy.context.active_object
    ros.rotation_euler = (0, math.radians(90), 0)
    ros.data.materials.append(mat_bead_gold)
    bonnet_parts.append(ros)

# Fan of 15 eagle feathers
num_feathers = 15
for i in range(num_feathers):
    t = (i / (num_feathers - 1)) - 0.5
    ang_x = t * math.pi * 0.92
    r = 0.31
    
    fx = head_center.x + math.sin(ang_x) * r
    fy = head_center.y + 0.02 + abs(t) * 0.08
    fz = head_center.z + math.cos(ang_x) * r * 0.9
    
    feather_len = 0.58 - abs(t) * 0.14
    feather_w = 0.085
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(fx, fy, fz + feather_len * 0.45))
    f_body = bpy.context.active_object
    f_body.scale = (feather_w, 0.012, feather_len * 0.65)
    f_body.rotation_euler = (math.radians(-12), -ang_x * 0.85, 0)
    bpy.ops.object.transform_apply(scale=True)
    f_body.data.materials.append(mat_feather_white)
    bonnet_parts.append(f_body)
    
    tip_z = fz + feather_len * 0.82
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(fx, fy + 0.03, tip_z))
    f_tip = bpy.context.active_object
    f_tip.scale = (feather_w * 0.9, 0.012, feather_len * 0.28)
    f_tip.rotation_euler = (math.radians(-12), -ang_x * 0.85, 0)
    bpy.ops.object.transform_apply(scale=True)
    f_tip.data.materials.append(mat_feather_black)
    bonnet_parts.append(f_tip)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.09, location=(fx, fy - 0.01, fz + 0.04))
    f_wrap = bpy.context.active_object
    f_wrap.data.materials.append(mat_feather_red)
    bonnet_parts.append(f_wrap)

for side_x in [-0.33, 0.33]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.45, location=(head_center.x + side_x, head_center.y - 0.02, head_center.z - 0.32))
    drop = bpy.context.active_object
    drop.data.materials.append(mat_feather_white)
    bonnet_parts.append(drop)

bpy.ops.object.select_all(action='DESELECT')
for p in bonnet_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = band
bpy.ops.object.join()
bpy.ops.object.shade_smooth()
band.name = 'Chieftain_War_Bonnet'
parent_to_bone(band, 'Head')

# 2. BUILD CHIEFTAIN SPEAR
hand_b = rig.pose.bones.get('Fist.R')
hx, hy, hz = (rig.matrix_world @ hand_b.matrix.translation)[:]

spear_parts = []
bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=2.55, vertices=16, location=(hx, hy, 1.25))
shaft = bpy.context.active_object
shaft.data.materials.append(mat_wood)
spear_parts.append(shaft)

bpy.ops.mesh.primitive_cone_add(radius1=0.065, depth=0.35, vertices=4, location=(hx, hy, 2.55))
ahead = bpy.context.active_object
ahead.scale = (1.0, 0.3, 1.0)
bpy.ops.object.transform_apply(scale=True)
ahead.data.materials.append(mat_flint)
spear_parts.append(ahead)

bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.15, location=(hx, hy, 2.35))
wrap = bpy.context.active_object
wrap.data.materials.append(mat_band)
spear_parts.append(wrap)

for i, dx in enumerate([-0.06, 0.06]):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.32, location=(hx + dx, hy, 2.15))
    sf = bpy.context.active_object
    sf.rotation_euler = (0, 0, math.radians(15 * (1 if i==0 else -1)))
    sf.data.materials.append(mat_feather_white)
    spear_parts.append(sf)

bpy.ops.object.select_all(action='DESELECT')
for p in spear_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = shaft
bpy.ops.object.join()
bpy.ops.object.shade_smooth()
shaft.name = 'Chieftain_Spear'
parent_to_bone(shaft, 'Fist.R')

# CAMERA & LIGHTING
cam_data = bpy.data.cameras.new('Camera')
cam_obj = bpy.data.objects.new('Camera', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -6.0, 1.55)
cam_obj.rotation_euler = (math.radians(83), 0, 0)

l1 = bpy.data.lights.new('Key', type='SUN')
l1.energy = 5.0
l1.color = (1.0, 0.96, 0.92)
o1 = bpy.data.objects.new('Key', l1)
bpy.context.scene.collection.objects.link(o1)
o1.rotation_euler = (math.radians(45), math.radians(-25), math.radians(35))

l2 = bpy.data.lights.new('Fill', type='SUN')
l2.energy = 2.4
l2.color = (0.85, 0.92, 1.0)
o2 = bpy.data.objects.new('Fill', l2)
bpy.context.scene.collection.objects.link(o2)
o2.rotation_euler = (math.radians(-25), math.radians(25), math.radians(-135))

l3 = bpy.data.lights.new('Rim', type='SUN')
l3.energy = 5.5
l3.color = (1.0, 0.88, 0.6)
o3 = bpy.data.objects.new('Rim', l3)
bpy.context.scene.collection.objects.link(o3)
o3.rotation_euler = (math.radians(-65), math.radians(5), math.radians(-15))

bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.film_transparent = True
out_img = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh/thu_linh_doi1.png')
bpy.context.scene.render.filepath = out_img
bpy.ops.render.render(write_still=True)

out_glb = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/thu_linh_doi1.glb')
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB')
