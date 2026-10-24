import bpy, os
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/nhan_vat.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

head = bpy.data.objects.get('Barbarian_Head')
if head:
    bb = [head.matrix_world @ Vector(corner) for corner in head.bound_box]
    print('Head bound box X:', min(v.x for v in bb), 'to', max(v.x for v in bb))
    print('Head bound box Y:', min(v.y for v in bb), 'to', max(v.y for v in bb))
    print('Head bound box Z:', min(v.z for v in bb), 'to', max(v.z for v in bb))

rig = bpy.data.objects.get('Rig')
if rig:
    b = rig.pose.bones.get('head')
    if b:
        print('Head bone location:', rig.matrix_world @ b.matrix.translation)
