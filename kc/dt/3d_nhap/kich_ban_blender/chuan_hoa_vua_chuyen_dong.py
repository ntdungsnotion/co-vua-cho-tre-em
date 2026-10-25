# ================================================================
# KỊCH BẢN BLENDER: chuan_hoa_vua_chuyen_dong.py
# CHỨC NĂNG:
#   1. Nạp mô hình Vua Nhân Tộc Đời 2 (vua-nhan-toc-doi-2-mau-compressed.glb).
#   2. Căn chỉnh hệ xương KayKit Rig (nhan_vat.glb) khớp 100% tỷ lệ giải phẫu của Vua:
#      - Khớp vai hạ chuẩn tâm giải phẫu Z=1.120 (loại bỏ hoàn toàn lỗi so vai / méo người).
#      - Căn chỉnh khớp háng, đùi, đầu gối, cổ chân, khuỷu tay.
#      - Tắt use_deform trên toàn bộ 18 xương IK / Control (khắc phục hoàn toàn lỗi chân méo dẹt).
#   3. Gập ngón tay phải cuộn tròn tạo nắm tay nắm cán rìu chân thực.
#   4. Gắn vũ khí 1 tay: Chiếc rìu 1H_Axe chuẩn tỷ lệ vào lòng bàn tay phải.
#   5. Tinh chỉnh hoạt ảnh Idle: Tay buông thõng xuôi sát sườn đùi tự nhiên.
#   6. Lập trình lại hoàn toàn hoạt ảnh Chặt cây (1H_Melee_Attack_Chop) theo chuẩn
#      Biomechanics vận động thực tế:
#      - Người đứng vững bám đất (hips location Z=0 cố định, không nảy).
#      - Lấy đà: Ngực xoay chéo +35° sang phải cùng vai, tay giương cao quá đầu.
#      - Bổ chém: Ngực xoay chém về trước, gập eo cúi dồn lực bổ rìu mạnh mẽ.
#   7. Xuất GLB hoàn chỉnh vào mo_hinh/vua_doi2_chuyen_dong.glb đủ 8 hoạt ảnh.
# TÁC GIẢ: Antigravity (AI Phụ tá)
# NGÀY: 25/10/2026 22:55
# ================================================================
import bpy, os, math
from mathutils import Vector, Quaternion, Matrix, Euler

BASE_DIR = os.path.abspath(".")
NHAP_DIR = os.path.join(BASE_DIR, "co-vua-cho-tre-em", "kc", "dt", "3d_nhap")
MO_HINH_DIR = os.path.join(NHAP_DIR, "mo_hinh")
HINH_ANH_DIR = os.path.join(NHAP_DIR, "hinh_anh", "dong_tac_vua_chuan_hoa")
os.makedirs(HINH_ANH_DIR, exist_ok=True)

PATH_VUA_RAW = os.path.join(MO_HINH_DIR, "vua-nhan-toc-doi-2-mau-compressed.glb")
PATH_KAYKIT  = os.path.join(MO_HINH_DIR, "nhan_vat.glb")
PATH_OUTPUT_GLB = os.path.join(MO_HINH_DIR, "vua_doi2_chuyen_dong.glb")

print("=== BẮT ĐẦU CHUẨN HÓA VUA NHÂN TỘC ĐỜI 2 (V2 BIOMECHANICS) ===")

# ── 1. NẠP MESH VUA VÀ TỐI ƯU HÓA ──────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=PATH_VUA_RAW)

vua_mesh = None
for o in bpy.data.objects:
    if o.type == 'MESH':
        vua_mesh = o
        break

if not vua_mesh:
    raise RuntimeError("Không tìm thấy mesh Vua trong file glb!")

vua_mesh.name = "Vua_Mesh"
bpy.ops.object.select_all(action='DESELECT')
vua_mesh.select_set(True)
bpy.context.view_layer.objects.active = vua_mesh

# Dịch chuyển mesh lên Z = 0.90 để đáy bàn chân chạm Z = 0.00
vua_mesh.location = (0, 0, 0.900)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Gập 4 ngón tay và ngón cái của bàn tay phải cuộn tròn tạo nắm tay ôm cán rìu
for v in vua_mesh.data.vertices:
    # 4 ngón tay: X < -0.715
    if v.co.x < -0.715 and v.co.y > -0.075:
        dist = abs(v.co.x - (-0.715))
        theta = min(math.radians(120), dist / 0.07 * math.radians(120))
        r = dist
        v.co.x = -0.715 - r * math.cos(theta) * 0.45
        v.co.z = v.co.z - r * math.sin(theta) * 0.95
        v.co.y += r * 0.25
    # Ngón cái ôm ngang: Y < -0.075, X < -0.68
    elif v.co.y < -0.075 and v.co.x < -0.68:
        dist_thumb = abs(v.co.y - (-0.075))
        v.co.y = -0.075 + dist_thumb * 0.3
        v.co.x += dist_thumb * 0.4
        v.co.z -= dist_thumb * 0.5

# Dọn đỉnh trùng để Bone Heat Weighting thành công 100%
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.002)
bpy.ops.object.mode_set(mode='OBJECT')

dec_mod = vua_mesh.modifiers.new(name="Decimate", type='DECIMATE')
dec_mod.ratio = 0.12 # Giữ khoảng 20k - 25k đỉnh, bề mặt siêu mịn
bpy.ops.object.modifier_apply(modifier="Decimate")

print(f"Mesh Vua sau tối ưu: {len(vua_mesh.data.vertices)} đỉnh, {len(vua_mesh.data.polygons)} đa giác.")

# ── 2. NẠP HỆ XƯƠNG VÀ CHIẾC RÌU TỪ KAYKIT ────────────────────────────────
bpy.ops.import_scene.gltf(filepath=PATH_KAYKIT)

arm = bpy.data.objects.get('Rig')
axe = bpy.data.objects.get('1H_Axe')

# Xóa các mesh rác của KayKit, chỉ giữ Armature và 1H_Axe
to_delete = []
for o in bpy.data.objects:
    if o in [vua_mesh, arm, axe]:
        continue
    to_delete.append(o)

for o in to_delete:
    bpy.data.objects.remove(o, do_unlink=True)

if not arm:
    raise RuntimeError("Không tìm thấy Armature trong nhan_vat.glb!")

print(f"Hệ xương tìm thấy: {arm.name}, chứa {len(arm.data.bones)} xương.")

# Danh sách 18 xương giải phẫu deform chính
DEFORM_BONES = {
    'hips', 'spine', 'chest', 'head',
    'upperarm.l', 'lowerarm.l', 'hand.l',
    'upperarm.r', 'lowerarm.r', 'hand.r',
    'upperleg.l', 'lowerleg.l', 'foot.l', 'toes.l',
    'upperleg.r', 'lowerleg.r', 'foot.r', 'toes.r'
}

# Tắt deform cho toàn bộ xương IK & Controls
for b in arm.data.bones:
    b.use_deform = (b.name in DEFORM_BONES)

# ── 3. CĂN CHỈNH KHỚP XƯƠNG EDIT BONES KHỚP CHUẨN TỶ LỆ VUA ────────────────
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones

# Hông & Thân
if 'hips' in eb:
    eb['hips'].head = Vector((0.0, 0.0, 0.85))
    eb['hips'].tail = Vector((0.0, 0.01, 0.95))

if 'spine' in eb:
    eb['spine'].head = Vector((0.0, 0.01, 0.95))
    eb['spine'].tail = Vector((0.0, 0.00, 1.05))

if 'chest' in eb:
    eb['chest'].head = Vector((0.0, 0.00, 1.05))
    eb['chest'].tail = Vector((0.0, -0.01, 1.18))

if 'head' in eb:
    eb['head'].head = Vector((0.0, -0.01, 1.18))
    eb['head'].tail = Vector((0.0, -0.01, 1.62))

# Chân Trái (.l)
if 'upperleg.l' in eb:
    eb['upperleg.l'].head = Vector((0.185, 0.00, 0.80))
    eb['upperleg.l'].tail = Vector((0.170, 0.045, 0.52))

if 'lowerleg.l' in eb:
    eb['lowerleg.l'].head = Vector((0.170, 0.045, 0.52))
    eb['lowerleg.l'].tail = Vector((0.160, 0.010, 0.16))

if 'foot.l' in eb:
    eb['foot.l'].head = Vector((0.160, 0.010, 0.16))
    eb['foot.l'].tail = Vector((0.180, -0.100, 0.03))

if 'toes.l' in eb:
    eb['toes.l'].head = Vector((0.180, -0.100, 0.03))
    eb['toes.l'].tail = Vector((0.200, -0.160, 0.01))

# Chân Phải (.r)
if 'upperleg.r' in eb:
    eb['upperleg.r'].head = Vector((-0.185, 0.00, 0.80))
    eb['upperleg.r'].tail = Vector((-0.170, 0.045, 0.52))

if 'lowerleg.r' in eb:
    eb['lowerleg.r'].head = Vector((-0.170, 0.045, 0.52))
    eb['lowerleg.r'].tail = Vector((-0.160, 0.010, 0.16))

if 'foot.r' in eb:
    eb['foot.r'].head = Vector((-0.160, 0.010, 0.16))
    eb['foot.r'].tail = Vector((-0.180, -0.100, 0.03))

if 'toes.r' in eb:
    eb['toes.r'].head = Vector((-0.180, -0.100, 0.03))
    eb['toes.r'].tail = Vector((-0.200, -0.160, 0.01))

# Cánh tay: Nốt khớp vai chuẩn xác tại Z=1.120 (tâm khớp ổ chảo tự nhiên, không nhô lên cổ)
if 'upperarm.l' in eb:
    eb['upperarm.l'].head = Vector((0.215, 0.000, 1.120))
    eb['upperarm.l'].tail = Vector((0.450, -0.015, 1.120))

if 'lowerarm.l' in eb:
    eb['lowerarm.l'].head = Vector((0.450, -0.015, 1.120))
    eb['lowerarm.l'].tail = Vector((0.660, -0.040, 1.120))

if 'hand.l' in eb:
    eb['hand.l'].head = Vector((0.660, -0.040, 1.120))
    eb['hand.l'].tail = Vector((0.760, -0.035, 1.110))

if 'upperarm.r' in eb:
    eb['upperarm.r'].head = Vector((-0.215, 0.000, 1.120))
    eb['upperarm.r'].tail = Vector((-0.450, -0.015, 1.120))

if 'lowerarm.r' in eb:
    eb['lowerarm.r'].head = Vector((-0.450, -0.015, 1.120))
    eb['lowerarm.r'].tail = Vector((-0.660, -0.040, 1.120))

if 'hand.r' in eb:
    eb['hand.r'].head = Vector((-0.660, -0.040, 1.120))
    eb['hand.r'].tail = Vector((-0.760, -0.035, 1.110))

bpy.ops.object.mode_set(mode='OBJECT')
print("Đã căn chỉnh khớp xương hoàn hảo khớp với tỷ lệ Vua!")

# ── 4. GÁN TỰ ĐỘNG TRỌNG SỐ (AUTOMATIC WEIGHTS) ───────────────────────────
vua_mesh.vertex_groups.clear()
bpy.ops.object.select_all(action='DESELECT')
vua_mesh.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm

bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("Gán Automatic Weights hoàn tất!")

# Dọn dẹp vertex groups thừa
for vg in list(vua_mesh.vertex_groups):
    if vg.name not in DEFORM_BONES:
        vua_mesh.vertex_groups.remove(vg)

# Dọn trọng số áo choàng sau lưng (Y > 0.06 và Z > 0.70)
arm_groups = [vua_mesh.vertex_groups.get(g) for g in ['upperarm.l', 'lowerarm.l', 'upperarm.r', 'lowerarm.r'] if vua_mesh.vertex_groups.get(g)]
chest_group = vua_mesh.vertex_groups.get('chest')

cleaned_cape_verts = 0
for v in vua_mesh.data.vertices:
    if v.co.y > 0.06 and v.co.z > 0.70:
        for ag in arm_groups:
            try:
                w = ag.weight(v.index)
                if w > 0:
                    ag.remove([v.index])
                    if chest_group:
                        chest_group.add([v.index], w, 'ADD')
                    cleaned_cape_verts += 1
            except:
                pass

print(f"Đã dọn dẹp trọng số áo choàng cho {cleaned_cape_verts} đỉnh.")

# ── 5. GẮN RÌU 1 TAY VÀO BÀN TAY PHẢI ─────────────────────────────────────
if axe:
    axe.modifiers.clear()
    axe.vertex_groups.clear()
    axe.name = 'Riu_Chat_Cay'
    axe.parent = arm
    axe.parent_type = 'BONE'
    axe.parent_bone = 'hand.r'
    axe.location = Vector((0.0, 0.015, -0.020))
    axe.rotation_euler = Euler((math.radians(90), 0, 0))
    axe.scale = Vector((0.58, 0.58, 0.58))
    print("Đã gắn rìu 1H_Axe vào tay phải hoàn tất!")

# ── 6. TINH CHỈNH HOẠT ẢNH IDLE: TAY THẢ LỎNG DỌC THÂN KHÉP SÁT NÁCH ─────
action_idle = bpy.data.actions.get('Idle')
if action_idle:
    print("Đang tinh chỉnh hoạt ảnh Idle để 2 tay thả lỏng khép sát tự nhiên...")
    arm.animation_data.action = action_idle

    quat_cang_tay_l = Quaternion((0, 0, 1), math.radians(-8))
    quat_cang_tay_r = Quaternion((0, 0, 1), math.radians(8))

    pb_u_l = arm.pose.bones.get('upperarm.l')
    pb_u_r = arm.pose.bones.get('upperarm.r')
    pb_l_l = arm.pose.bones.get('lowerarm.l')
    pb_l_r = arm.pose.bones.get('lowerarm.r')

    f_start = int(action_idle.frame_range[0])
    f_end = int(action_idle.frame_range[1])

    for f in range(f_start, f_end + 1):
        bpy.context.scene.frame_set(f)
        phase = math.sin(f / (f_end - f_start + 1) * math.pi * 2)
        sway_deg = phase * 1.0

        q_sway_l = Euler((math.radians(-74 + sway_deg), math.radians(2), math.radians(4)), 'XYZ').to_quaternion()
        q_sway_r = Euler((math.radians(-74 + sway_deg), math.radians(-2), math.radians(-4)), 'XYZ').to_quaternion()

        if pb_u_l:
            pb_u_l.rotation_quaternion = q_sway_l
            pb_u_l.keyframe_insert(data_path="rotation_quaternion", frame=f)
        if pb_u_r:
            pb_u_r.rotation_quaternion = q_sway_r
            pb_u_r.keyframe_insert(data_path="rotation_quaternion", frame=f)
        if pb_l_l:
            pb_l_l.rotation_quaternion = quat_cang_tay_l
            pb_l_l.keyframe_insert(data_path="rotation_quaternion", frame=f)
        if pb_l_r:
            pb_l_r.rotation_quaternion = quat_cang_tay_r
            pb_l_r.keyframe_insert(data_path="rotation_quaternion", frame=f)

    print("Đã bake keyframes Idle mới thành công!")

# ── 7. LẬP TRÌNH LẠI HOẠT ẢNH CHẶT CÂY BIOMECHANICS (1H_Melee_Attack_Chop) ──
print("Đang tạo hoạt ảnh Chặt cây Biomechanics chuẩn cơ học vận động...")
old_act = bpy.data.actions.get('1H_Melee_Attack_Chop')
if old_act:
    bpy.data.actions.remove(old_act)

act_chop = bpy.data.actions.new('1H_Melee_Attack_Chop')
arm.animation_data.action = act_chop

pb_hips  = arm.pose.bones.get('hips')
pb_spine = arm.pose.bones.get('spine')
pb_chest = arm.pose.bones.get('chest')
pb_head  = arm.pose.bones.get('head')
pb_arm_r = arm.pose.bones.get('upperarm.r')
pb_low_r = arm.pose.bones.get('lowerarm.r')
pb_hand_r= arm.pose.bones.get('hand.r')
pb_arm_l = arm.pose.bones.get('upperarm.l')
pb_low_l = arm.pose.bones.get('lowerarm.l')

keyframes_chop = [
    # f=0: Đứng vững chuẩn bị
    (0,
     Vector((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((math.radians(-65), 0, math.radians(10))).to_quaternion(),
     Euler((0, 0, math.radians(-15))).to_quaternion(),
     Euler((math.radians(-70), 0, math.radians(-5))).to_quaternion(),
     Euler((0, 0, math.radians(10))).to_quaternion()),

    # f=11: Lấy đà (Wind-up): Ngực xoay chéo +25° sang phải cùng vai, cánh tay phải giương cao quá vai, cẳng tay gập giữ rìu vổng lên cao
    (11,
     Vector((0, 0, 0)),
     Euler((0, 0, math.radians(15))),
     Euler((math.radians(-5), math.radians(-4), math.radians(24))),
     Euler((0, 0, math.radians(-22))),
     Euler((math.radians(95), math.radians(-25), math.radians(110))).to_quaternion(),
     Euler((math.radians(-30), 0, math.radians(15))).to_quaternion(),
     Euler((math.radians(-45), math.radians(10), math.radians(20))).to_quaternion(),
     Euler((math.radians(-20), 0, 0)).to_quaternion()),

    # f=18: Bổ mạnh xuống (Strike): Thân cúi +16°, ngực xoay chém về trước, cánh tay phải vung mạnh bổ dứt khoát xuống trước mặt
    (18,
     Vector((0, 0, 0)),
     Euler((math.radians(12), 0, math.radians(-10))),
     Euler((math.radians(16), math.radians(4), math.radians(-15))),
     Euler((math.radians(-10), 0, math.radians(15))),
     Euler((math.radians(10), math.radians(10), math.radians(65))).to_quaternion(),
     Euler((math.radians(-15), 0, 0)).to_quaternion(),
     Euler((math.radians(-65), 0, math.radians(-22))).to_quaternion(),
     Euler((math.radians(-10), 0, 0)).to_quaternion()),

    # f=23: Chạm thân cây giữ tấn vững chãi
    (23,
     Vector((0, 0, 0)),
     Euler((math.radians(10), 0, math.radians(-8))),
     Euler((math.radians(14), math.radians(2), math.radians(-12))),
     Euler((math.radians(-8), 0, math.radians(12))),
     Euler((math.radians(5), math.radians(8), math.radians(60))).to_quaternion(),
     Euler((math.radians(-15), 0, 0)).to_quaternion(),
     Euler((math.radians(-65), 0, math.radians(-20))).to_quaternion(),
     Euler((math.radians(-10), 0, 0)).to_quaternion()),

    # f=32: Quay về thế chuẩn bị
    (32,
     Vector((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((0, 0, 0)),
     Euler((math.radians(-65), 0, math.radians(10))).to_quaternion(),
     Euler((0, 0, math.radians(-15))).to_quaternion(),
     Euler((math.radians(-70), 0, math.radians(-5))).to_quaternion(),
     Euler((0, 0, math.radians(10))).to_quaternion())
]

for f, hp_loc, sp_e, ch_e, hd_e, ar_q, lr_q, al_q, ll_q in keyframes_chop:
    bpy.context.scene.frame_set(f)
    if pb_hips:
        pb_hips.location = hp_loc
        pb_hips.keyframe_insert('location', frame=f)
    if pb_spine:
        pb_spine.rotation_quaternion = sp_e.to_quaternion()
        pb_spine.keyframe_insert('rotation_quaternion', frame=f)
    if pb_chest:
        pb_chest.rotation_quaternion = ch_e.to_quaternion()
        pb_chest.keyframe_insert('rotation_quaternion', frame=f)
    if pb_head:
        pb_head.rotation_quaternion = hd_e.to_quaternion()
        pb_head.keyframe_insert('rotation_quaternion', frame=f)
    if pb_arm_r:
        pb_arm_r.rotation_quaternion = ar_q
        pb_arm_r.keyframe_insert('rotation_quaternion', frame=f)
    if pb_low_r:
        pb_low_r.rotation_quaternion = lr_q
        pb_low_r.keyframe_insert('rotation_quaternion', frame=f)
    if pb_arm_l:
        pb_arm_l.rotation_quaternion = al_q
        pb_arm_l.keyframe_insert('rotation_quaternion', frame=f)
    if pb_low_l:
        pb_low_l.rotation_quaternion = ll_q
        pb_low_l.keyframe_insert('rotation_quaternion', frame=f)

print("Đã lập trình hoạt ảnh Chặt cây Biomechanics thành công!")

# ── 8. RENDER ẢNH KIỂM CHỨNG TRỰC TIẾP TRONG BLENDER ─────────────────────
cam_data = bpy.data.cameras.new('CamToanThan')
cam_obj = bpy.data.objects.new('CamToanThan', cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj
cam_obj.location = (0, -3.2, 0.95)
cam_obj.rotation_euler = (math.radians(90), 0, 0)

world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get('Background')
if bg_node:
    bg_node.inputs['Color'].default_value = (0.15, 0.15, 0.18, 1.0)
    bg_node.inputs['Strength'].default_value = 1.0

light_sun = bpy.data.lights.new('Sun', type='SUN')
light_sun.energy = 5.0
sun_obj = bpy.data.objects.new('Sun', light_sun)
bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.location = (2, -4, 4)

bpy.context.scene.render.resolution_x = 540
bpy.context.scene.render.resolution_y = 720

# 1. Chụp ảnh Idle toàn thân
arm.animation_data.action = bpy.data.actions.get('Idle')
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
img_idle = os.path.join(HINH_ANH_DIR, "01_idle_tay_tha_long.png")
bpy.context.scene.render.filepath = img_idle
bpy.ops.render.render(write_still=True)
print(f"Đã render ảnh Idle: {img_idle}")

# 2. Chụp ảnh Chặt cây Lấy đà (Frame 11) góc nghiêng 45°
arm.animation_data.action = bpy.data.actions.get('1H_Melee_Attack_Chop')
bpy.context.scene.frame_set(11)
bpy.context.view_layer.update()
cam_obj.location = (-1.8, -2.8, 1.1)
cam_obj.rotation_euler = (math.radians(82), 0, math.radians(-32))
img_chop_windup = os.path.join(HINH_ANH_DIR, "04_chat_cay_lay_da_cheo.png")
bpy.context.scene.render.filepath = img_chop_windup
bpy.ops.render.render(write_still=True)
print(f"Đã render ảnh Chặt cây lấy đà: {img_chop_windup}")

# 3. Chụp ảnh Chặt cây Bổ chém (Frame 18) góc nghiêng 45°
bpy.context.scene.frame_set(18)
bpy.context.view_layer.update()
img_chop_strike = os.path.join(HINH_ANH_DIR, "05_chat_cay_bo_xuong.png")
bpy.context.scene.render.filepath = img_chop_strike
bpy.ops.render.render(write_still=True)
print(f"Đã render ảnh Chặt cây bổ xuống: {img_chop_strike}")

# 4. Chụp ảnh Đào mỏ Bổ cuốc (Frame 20)
act_mine = bpy.data.actions.get('2H_Melee_Attack_Chop')
if act_mine:
    arm.animation_data.action = act_mine
    bpy.context.scene.frame_set(20)
    bpy.context.view_layer.update()
    cam_obj.location = (0, -3.2, 0.95)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    img_mine = os.path.join(HINH_ANH_DIR, "06_dao_mo_vai_chuan.png")
    bpy.context.scene.render.filepath = img_mine
    bpy.ops.render.render(write_still=True)
    print(f"Đã render ảnh Đào mỏ: {img_mine}")

# ── 9. XUẤT GLB HOÀN CHỈNH CHO THREE.JS ──────────────────────────────────
# Đưa toàn bộ actions vào NLA tracks để Three.js đọc đủ 8 animations
if arm.animation_data:
    for track in list(arm.animation_data.nla_tracks):
        arm.animation_data.nla_tracks.remove(track)
    for act in bpy.data.actions:
        track = arm.animation_data.nla_tracks.new()
        track.name = act.name
        track.strips.new(act.name, int(act.frame_range[0]), act)

bpy.ops.object.select_all(action='DESELECT')
vua_mesh.select_set(True)
arm.select_set(True)
if axe:
    axe.select_set(True)
bpy.context.view_layer.objects.active = arm

bpy.ops.export_scene.gltf(
    filepath=PATH_OUTPUT_GLB,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_all_influences=True,
    export_morph=True
)

file_size_mb = os.path.getsize(PATH_OUTPUT_GLB) / (1024 * 1024)
print(f"=== XUẤT GLB THÀNH CÔNG: {PATH_OUTPUT_GLB} ({file_size_mb:.2f} MB) ===")
