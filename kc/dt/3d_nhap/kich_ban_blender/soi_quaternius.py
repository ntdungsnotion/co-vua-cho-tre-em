import bpy, os

fbx_dir = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/rpg_quaternius/RPG Characters - Nov 2020/FBX')
for f in os.listdir(fbx_dir):
    if f.endswith('.fbx'):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        fbx_path = os.path.join(fbx_dir, f)
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        anims = [a.name for a in bpy.data.actions]
        meshes = [m.name for m in bpy.data.objects if m.type == 'MESH']
        print(f"=== {f} ===")
        print("  Meshes:", meshes)
        print("  Animations:", anims)
