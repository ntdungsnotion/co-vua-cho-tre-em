import bpy, os, math
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/dau_quy_toc_1.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
obj = meshes[0]

# Add a default clay material to see details
mat = bpy.data.materials.new('Clay')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.85, 0.45, 0.42, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.5
obj.data.materials.clear()
obj.data.materials.append(mat)

# Center origin
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
obj.location = (0, 0, 0)

# Studio lights
for ang, en, col in [(35, 4.0, (1, 0.98, 0.95)), (-140, 2.0, (0.8, 0.9, 1.0)), (-60, 3.5, (1, 1, 1))]:
    ld = bpy.data.lights.new('L', type='SUN')
    ld.energy = en
    ld.color = col
    lo = bpy.data.objects.new('L', ld)
    bpy.context.scene.collection.objects.link(lo)
    lo.rotation_euler = (math.radians(ang), math.radians(20), math.radians(ang/2))

# Camera
cam_d = bpy.data.cameras.new('C')
cam_d.lens = 50
cam_o = bpy.data.objects.new('C', cam_d)
bpy.context.scene.collection.objects.link(cam_o)
bpy.context.scene.camera = cam_o
cam_o.location = (0, -3.2, 0)
cam_o.rotation_euler = (math.radians(90), 0, 0)

bpy.context.scene.render.resolution_x = 750
bpy.context.scene.render.resolution_y = 750
bpy.context.scene.render.film_transparent = True

# Render 4 angles
out_dir = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh')
for name, rot_z in [('dau_quy_meshy_goc1', 0), ('dau_quy_meshy_goc2', 45), ('dau_quy_meshy_goc3', 90), ('dau_quy_meshy_goc4', 180)]:
    obj.rotation_euler = (0, 0, math.radians(rot_z))
    bpy.context.scene.render.filepath = os.path.join(out_dir, f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('Rendered:', name)
