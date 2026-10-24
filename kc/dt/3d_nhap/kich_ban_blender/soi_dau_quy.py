import bpy, os
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/dau_quy_toc_1.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

print("=== STATS OF dau_quy_toc_1.glb ===")
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
total_polys = sum(len(m.data.polygons) for m in meshes)
total_verts = sum(len(m.data.vertices) for m in meshes)
print(f"Meshes count: {len(meshes)}")
for m in meshes:
    print(f" - {m.name}: {len(m.data.polygons):,} polygons, {len(m.data.vertices):,} vertices")
print(f"Total polygons: {total_polys:,}")
print(f"Total vertices: {total_verts:,}")

print("\n=== IMAGES / TEXTURES ===")
for img in bpy.data.images:
    print(f" - Image: {img.name}, size: {img.size[0]}x{img.size[1]}, channels: {img.channels}")

# Check bounding box
for m in meshes:
    bb = [m.matrix_world @ Vector(c) for c in m.bound_box]
    print(f"Bounding box X: {min(v.x for v in bb):.3f} to {max(v.x for v in bb):.3f}")
    print(f"Bounding box Y: {min(v.y for v in bb):.3f} to {max(v.y for v in bb):.3f}")
    print(f"Bounding box Z: {min(v.z for v in bb):.3f} to {max(v.z for v in bb):.3f}")
