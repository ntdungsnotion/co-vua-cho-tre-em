import bpy, os, math
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_in = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/dau_quy_toc_1.glb')
bpy.ops.import_scene.gltf(filepath=glb_in)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
obj = meshes[0]
poly_before = len(obj.data.polygons)
print(f"Polygon trước tối ưu: {poly_before:,}")

# 1. DECIMATE: Giảm xuống ~18,000 polygons (chuẩn tối ưu cho Web 3D)
ratio = 18000 / poly_before
mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
mod.ratio = ratio
bpy.context.view_layer.objects.active = obj
bpy.ops.object.modifier_apply(modifier="Decimate")
poly_after = len(obj.data.polygons)
print(f"Polygon sau tối ưu: {poly_after:,}")

# Smooth shading
for p in obj.data.polygons:
    p.use_smooth = True

# Đặt gốc tọa độ về tâm
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
obj.location = (0, 0, 0)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# 2. XUẤT GLB ĐÃ TỐI ƯU
glb_out = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/mo_hinh/dau_quy_toc_1_toi_uu.glb')
bpy.ops.export_scene.gltf(filepath=glb_out, export_format='GLB')
print(f"Đã xuất: {glb_out}")

# 3. RENDER ẢNH CHÂN DUNG SÁNG RÕ
mat = bpy.data.materials.new('AnimeSkin')
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.92, 0.72, 0.65, 1.0) # Màu da tươi tắn
    bsdf.inputs['Roughness'].default_value = 0.45
obj.data.materials.clear()
obj.data.materials.append(mat)

# Studio Lights
front_l = bpy.data.lights.new('Front', type='POINT')
front_l.energy = 50.0
front_obj = bpy.data.objects.new('Front', front_l)
bpy.context.scene.collection.objects.link(front_obj)
front_obj.location = (0, -2.5, 0.2)

sun_l = bpy.data.lights.new('Sun', type='SUN')
sun_l.energy = 2.5
sun_obj = bpy.data.objects.new('Sun', sun_l)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(35), math.radians(-20), math.radians(20))

rim_l = bpy.data.lights.new('Rim', type='SUN')
rim_l.energy = 3.5
rim_obj = bpy.data.objects.new('Rim', rim_l)
bpy.context.scene.collection.objects.link(rim_obj)
rim_obj.rotation_euler = (math.radians(-65), math.radians(15), math.radians(-30))

cam_d = bpy.data.cameras.new('C')
cam_d.lens = 55
cam_o = bpy.data.objects.new('C', cam_d)
bpy.context.scene.collection.objects.link(cam_o)
bpy.context.scene.camera = cam_o
cam_o.location = (0, -3.1, 0)
cam_o.rotation_euler = (math.radians(90), 0, 0)

bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.film_transparent = True

out_dir = os.path.abspath('co-vua-cho-tre-em/kc/dt/3d_nhap/hinh_anh')

# Chính diện
bpy.context.scene.render.filepath = os.path.join(out_dir, 'dau_quy_toi_uu_chinh_dien.png')
bpy.ops.render.render(write_still=True)

# Góc nghiêng 3/4
cam_o.location = (-2.0, -2.4, 0.2)
cam_o.rotation_euler = (math.radians(86), 0, math.radians(-40))
bpy.context.scene.render.filepath = os.path.join(out_dir, 'dau_quy_toi_uu_goc_34.png')
bpy.ops.render.render(write_still=True)
print("Render xong 2 góc ảnh tối ưu!")
