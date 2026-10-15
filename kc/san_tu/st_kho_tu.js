/* ================================================================
   FILE: san_tu/st_kho_tu.js
   CHỨC NĂNG: KHO TỪ VỰNG của game Săn Từ, chia 4 cấp theo độ khó:
                cấp 1 (Dễ)        - từ ngắn, bé gặp hằng ngày
                cấp 2 (Trung bình) - từ thông dụng
                cấp 3 (Khó)        - từ dài hơn, ít gặp hơn
                cấp 4 (Thử thách)  - từ dài, ít quen, dễ nhầm
              Từ KHÔNG gắn với loại quái: chướng ngại vật nào cũng bốc từ trong kho
              của cấp đang chơi, nên thêm bao nhiêu từ cũng được.
   BƯỚC: TC_00B (15/10/2026: mở rộng từ 130 lên hơn 450 từ)
   THÊM TỪ: thêm một dòng "từ|hình|nghĩa" vào đúng cấp. Từ viết thường, không dấu
            cách, không trùng với từ đã có (kiểm thử tự động sẽ báo nếu trùng).
   ================================================================ */
(function (goc) {
  "use strict";
  const ST = goc.ST = goc.ST || {};

  const DONG = {
    1: `
cat|🐱|con mèo
dog|🐶|con chó
sun|☀️|mặt trời
hat|👒|cái mũ
cup|☕|cái cốc
bus|🚌|xe buýt
egg|🥚|quả trứng
pig|🐷|con heo
cow|🐮|con bò
fox|🦊|con cáo
bee|🐝|con ong
car|🚗|xe hơi
bed|🛏️|cái giường
box|📦|cái hộp
pen|🖊️|cây bút
ant|🐜|con kiến
owl|🦉|con cú
key|🔑|chìa khóa
bat|🦇|con dơi
hen|🐔|gà mái
map|🗺️|bản đồ
bag|👜|cái túi
toy|🧸|đồ chơi
red|🔴|màu đỏ
ice|🧊|nước đá
sea|🌊|biển
leg|🦵|cái chân
arm|💪|cánh tay
ear|👂|cái tai
eye|👁️|con mắt
lip|👄|đôi môi
boy|👦|bé trai
man|👨|người đàn ông
mom|👩|mẹ
dad|🧔|bố
tea|🍵|trà
nut|🥜|hạt lạc
pie|🥧|bánh nướng
bug|🐛|con bọ
web|🕸️|mạng nhện
van|🚐|xe con
one|1️⃣|số một
two|2️⃣|số hai
six|6️⃣|số sáu
ten|🔟|số mười
sad|😢|buồn
hot|🥵|nóng
run|🏃|chạy
eat|🍽️|ăn
cry|😭|khóc
fish|🐟|con cá
duck|🦆|con vịt
frog|🐸|con ếch
ball|⚽|quả bóng
book|📕|quyển sách
cake|🍰|bánh ngọt
moon|🌙|mặt trăng
star|⭐|ngôi sao
tree|🌳|cái cây
milk|🥛|sữa
bird|🐦|con chim
door|🚪|cửa ra vào
bear|🐻|con gấu
lion|🦁|sư tử
baby|👶|em bé
girl|👧|bé gái
hand|✋|bàn tay
foot|🦶|bàn chân
nose|👃|cái mũi
hair|💇|mái tóc
face|🙂|khuôn mặt
rain|🌧️|mưa
snow|❄️|tuyết
wind|🌬️|gió
fire|🔥|lửa
rock|🪨|hòn đá
leaf|🍃|chiếc lá
rose|🌹|hoa hồng
corn|🌽|bắp ngô
rice|🍚|cơm
soup|🍲|món súp
meat|🍖|thịt
pear|🍐|quả lê
kiwi|🥝|quả kiwi
coat|🧥|áo choàng
sock|🧦|chiếc tất
shoe|👞|chiếc giày
ring|💍|chiếc nhẫn
bell|🔔|cái chuông
drum|🥁|cái trống
kite|🪁|con diều
doll|🪆|búp bê
boat|⛵|cái thuyền
ship|🚢|tàu thủy
bike|🚲|xe đạp
taxi|🚕|xe taxi
road|🛣️|con đường
home|🏡|nhà của mình
farm|🌾|nông trại
park|🌳|công viên
lamp|🪔|cái đèn
sofa|🛋️|ghế sofa
bath|🛁|bồn tắm
soap|🧼|xà phòng
gift|🎁|món quà
game|🎮|trò chơi
song|🎵|bài hát
king|🤴|nhà vua
goat|🐐|con dê
deer|🦌|con nai
wolf|🐺|chó sói
seal|🦭|hải cẩu
crab|🦀|con cua
worm|🪱|con giun
cold|🥶|lạnh
sing|🎤|hát
swim|🏊|bơi
read|📖|đọc
draw|🖍️|vẽ
walk|🚶|đi bộ
cook|🍳|nấu ăn
blue|🔵|màu xanh dương
five|5️⃣|số năm
four|4️⃣|số bốn
nine|9️⃣|số chín
three|3️⃣|số ba
sleep|😴|ngủ
snail|🐌|con ốc sên
shark|🦈|cá mập
`,
    2: `
apple|🍎|quả táo
happy|😊|vui vẻ
water|💧|nước
house|🏠|ngôi nhà
horse|🐴|con ngựa
train|🚆|tàu hỏa
chair|🪑|cái ghế
bread|🍞|bánh mì
green|🟢|màu xanh lá
smile|😄|nụ cười
cloud|☁️|đám mây
grape|🍇|quả nho
tiger|🐯|con hổ
mouse|🐭|con chuột
sheep|🐑|con cừu
snake|🐍|con rắn
juice|🧃|nước ép
lemon|🍋|quả chanh
piano|🎹|đàn piano
clock|⏰|đồng hồ
shoes|👟|đôi giày
plant|🪴|cây trồng
beach|🏖️|bãi biển
robot|🤖|người máy
pizza|🍕|bánh pizza
queen|👸|nữ hoàng
river|🏞️|dòng sông
light|💡|ánh sáng
sweet|🍬|ngọt
truck|🚚|xe tải
whale|🐳|cá voi
zebra|🦓|ngựa vằn
panda|🐼|gấu trúc
koala|🐨|gấu túi
camel|🐫|lạc đà
llama|🦙|lạc đà không bướu
eagle|🦅|đại bàng
puppy|🐕|cún con
otter|🦦|rái cá
sloth|🦥|con lười
skunk|🦨|chồn hôi
hippo|🦛|hà mã
squid|🦑|con mực
comet|☄️|sao chổi
peach|🍑|quả đào
mango|🥭|quả xoài
melon|🍈|quả dưa
onion|🧅|củ hành
bacon|🥓|thịt xông khói
candy|🍭|kẹo
honey|🍯|mật ong
salad|🥗|món rau trộn
pasta|🍝|mì Ý
toast|🥪|bánh mì nướng
donut|🍩|bánh vòng
sushi|🍣|món sushi
phone|📱|điện thoại
radio|📻|đài radio
watch|⌚|đồng hồ đeo tay
money|💵|tiền
paper|📄|tờ giấy
brush|🖌️|cây cọ vẽ
crown|👑|vương miện
dress|👗|cái váy
shirt|👕|áo phông
pants|👖|cái quần
scarf|🧣|khăn quàng
plane|🛩️|máy bay nhỏ
grass|🌱|cỏ non
storm|🌩️|cơn bão
ocean|🌊|đại dương
earth|🌍|trái đất
heart|❤️|trái tim
music|🎶|âm nhạc
dance|💃|nhảy múa
laugh|😂|cười to
angry|😠|tức giận
tired|😫|mệt mỏi
funny|😆|buồn cười
seven|7️⃣|số bảy
eight|8️⃣|số tám
white|⚪|màu trắng
black|⚫|màu đen
brown|🟤|màu nâu
nurse|🧑‍⚕️|y tá
clown|🤡|chú hề
ghost|👻|con ma
fairy|🧚|cô tiên
angel|👼|thiên thần
chess|♟️|cờ vua
drink|🥤|đồ uống
bowl|🥣|cái bát
spoon|🥄|cái thìa
fork|🍴|cái nĩa
plate|🍽️|cái đĩa
tooth|🦷|cái răng
brain|🧠|bộ não
hello|👋|xin chào
spider|🕷️|con nhện
parrot|🦜|con vẹt
cherry|🍒|quả anh đào
cookie|🍪|bánh quy
noodle|🍜|sợi mì
tomato|🍅|quả cà chua
potato|🥔|củ khoai tây
cheese|🧀|phô mai
camera|📷|máy ảnh
purple|🟣|màu tím
yellow|🟡|màu vàng
hungry|😋|đói bụng
tennis|🎾|quần vợt
puzzle|🧩|trò xếp hình
thanks|🙏|cảm ơn
flower|🌼|bông hoa
pencil|✏️|bút chì
school|🏫|trường học
monkey|🐒|con khỉ
rabbit|🐰|con thỏ
orange|🍊|quả cam
banana|🍌|quả chuối
turtle|🐢|con rùa
chicken|🐔|con gà
`,
    3: `
garden|🌷|khu vườn
morning|🌅|buổi sáng
window|🪟|cửa sổ
rocket|🚀|tên lửa
castle|🏰|lâu đài
dragon|🐉|con rồng
bridge|🌉|cây cầu
planet|🪐|hành tinh
kitchen|🍳|nhà bếp
rainbow|🌈|cầu vồng
teacher|🧑‍🏫|giáo viên
doctor|🩺|bác sĩ
guitar|🎸|đàn ghi-ta
jacket|🧥|áo khoác
button|🔘|cái nút
carrot|🥕|củ cà rốt
butter|🧈|bơ
bottle|🍼|cái chai
island|🏝️|hòn đảo
winter|⛄|mùa đông
summer|🏖️|mùa hè
mitten|🧤|găng tay
kitten|🐈|mèo con
lizard|🦎|thằn lằn
beaver|🦫|hải ly
badger|🦡|con lửng
rooster|🐓|gà trống
peacock|🦚|con công
hamster|🐹|chuột hamster
leopard|🐆|con báo
gorilla|🦍|khỉ đột
mammoth|🦣|voi ma mút
unicorn|🦄|kỳ lân
ladybug|🐞|bọ rùa
lobster|🦞|tôm hùm
shrimp|🦐|con tôm
avocado|🥑|quả bơ
garlic|🧄|củ tỏi
popcorn|🍿|bỏng ngô
pretzel|🥨|bánh quy xoắn
burger|🍔|bánh kẹp thịt
hotdog|🌭|bánh mì xúc xích
cupcake|🧁|bánh nướng nhỏ
waffle|🧇|bánh tổ ong
coconut|🥥|quả dừa
pepper|🌶️|quả ớt
mirror|🪞|cái gương
ladder|🪜|cái thang
basket|🧺|cái giỏ
candle|🕯️|cây nến
magnet|🧲|nam châm
hammer|🔨|cái búa
crayon|🖍️|bút sáp màu
ribbon|🎀|cái nơ
balloon|🎈|bóng bay
trophy|🏆|cái cúp
medal|🏅|huy chương
ticket|🎫|tấm vé
bicycle|🚲|xe đạp hai bánh
tractor|🚜|máy kéo
scooter|🛴|xe trượt scooter
subway|🚇|tàu điện ngầm
anchor|⚓|mỏ neo
forest|🌲|khu rừng
desert|🏜️|sa mạc
galaxy|🌌|dải ngân hà
sunset|🌇|hoàng hôn
tornado|🌪️|lốc xoáy
autumn|🍂|mùa thu
farmer|🧑‍🌾|nông dân
singer|🧑‍🎤|ca sĩ
artist|🧑‍🎨|họa sĩ
police|👮|cảnh sát
student|🧑‍🎓|học sinh
wizard|🧙|phù thủy
pirate|🏴‍☠️|cướp biển
mermaid|🧜|nàng tiên cá
excited|🤩|háo hức
nervous|😬|lo lắng
baseball|⚾|bóng chày
bowling|🎳|ném bowling
skating|⛸️|trượt băng
surfing|🏄|lướt sóng
camping|🏕️|cắm trại
fishing|🎣|câu cá
picture|🖼️|bức tranh
trumpet|🎺|kèn trumpet
violin|🎻|đàn vi-ô-lông
museum|🏛️|bảo tàng
present|🎁|quà tặng
pumpkin|🎃|quả bí ngô
penguin|🐧|chim cánh cụt
dolphin|🐬|cá heo
octopus|🐙|bạch tuộc
giraffe|🦒|hươu cao cổ
thunder|⛈️|sấm sét
blanket|🛌|cái chăn
pancake|🥞|bánh kếp
captain|🧑‍✈️|thuyền trưởng
compass|🧭|la bàn
volcano|🌋|núi lửa
backpack|🎒|ba lô
diamond|💎|kim cương
sandals|🩴|dép xỏ ngón
teapot|🫖|ấm trà
toilet|🚽|nhà vệ sinh
shower|🚿|vòi sen
pillow|💤|cái gối
sponge|🧽|miếng bọt biển
battery|🔋|cục pin
rainy|☔|trời mưa
sunny|🌞|trời nắng
snowy|🌨️|có tuyết
cactus|🌵|cây xương rồng
mushroom|🍄|cây nấm
sunflower|🌻|hoa hướng dương
tulip|🌷|hoa tulip
seashell|🐚|vỏ sò
`,
    4: `
elephant|🐘|con voi
butterfly|🦋|con bướm
umbrella|☂️|cái ô
dinosaur|🦕|khủng long
strawberry|🍓|dâu tây
helicopter|🚁|trực thăng
telescope|🔭|kính thiên văn
vegetable|🥦|rau củ
mountain|⛰️|ngọn núi
library|📚|thư viện
birthday|🎂|sinh nhật
kangaroo|🦘|chuột túi
airplane|✈️|máy bay
scissors|✂️|cái kéo
treasure|💰|kho báu
squirrel|🐿️|con sóc
sandwich|🥪|bánh mì kẹp
princess|👸|công chúa
astronaut|🧑‍🚀|phi hành gia
crocodile|🐊|cá sấu
chocolate|🍫|sô-cô-la
notebook|📓|quyển vở
firework|🎆|pháo hoa
fountain|⛲|đài phun nước
flamingo|🦩|chim hồng hạc
mosquito|🦟|con muỗi
scorpion|🦂|con bọ cạp
broccoli|🥦|bông cải xanh
cucumber|🥒|quả dưa chuột
dumpling|🥟|bánh bao
lightning|⚡|tia chớp
envelope|✉️|phong bì
computer|💻|máy tính
keyboard|⌨️|bàn phím
surprised|😮|ngạc nhiên
hedgehog|🦔|con nhím
caterpillar|🐛|sâu bướm
rhinoceros|🦏|tê giác
hippopotamus|🦛|hà mã lớn
pineapple|🍍|quả dứa
watermelon|🍉|dưa hấu
blueberry|🫐|quả việt quất
lollipop|🍭|kẹo mút
croissant|🥐|bánh sừng bò
microscope|🔬|kính hiển vi
thermometer|🌡️|nhiệt kế
calendar|📅|tờ lịch
skateboard|🛹|ván trượt
ambulance|🚑|xe cứu thương
motorcycle|🏍️|xe máy
parachute|🪂|cái dù
satellite|🛰️|vệ tinh
stadium|🏟️|sân vận động
hospital|🏥|bệnh viện
supermarket|🛒|siêu thị
detective|🕵️|thám tử
scientist|🧑‍🔬|nhà khoa học
firefighter|🧑‍🚒|lính cứu hỏa
magician|🪄|ảo thuật gia
superhero|🦸|siêu anh hùng
headphones|🎧|tai nghe
saxophone|🎷|kèn saxophone
basketball|🏀|bóng rổ
volleyball|🏐|bóng chuyền
badminton|🏸|cầu lông
grandmother|👵|bà
grandfather|👴|ông
toothbrush|🪥|bàn chải đánh răng
snowflake|❄️|bông tuyết
playground|🛝|sân chơi
spaceship|🛸|đĩa bay
crystal|🔮|quả cầu pha lê
skeleton|💀|bộ xương
jigsaw|🧩|tranh ghép hình
juggling|🤹|tung hứng
gymnastics|🤸|thể dục dụng cụ
swimming|🏊|bơi lội
hurricane|🌀|cơn bão lớn
neighbor|🏘️|hàng xóm
chopsticks|🥢|đôi đũa
honeybee|🐝|ong mật
porcupine|🦔|con nhím gai
nightmare|😱|ác mộng
wonderful|🤩|tuyệt vời
beautiful|🌺|xinh đẹp
dangerous|⚠️|nguy hiểm
delicious|😋|ngon tuyệt
important|❗|quan trọng
yesterday|⏪|hôm qua
tomorrow|⏩|ngày mai
afternoon|🌤️|buổi chiều
breakfast|🥞|bữa sáng
adventure|🗺️|cuộc phiêu lưu
`
  };

  // Chuyển chữ sang danh sách { en, e, vi }
  const KHO = {};
  Object.keys(DONG).forEach(cap => {
    KHO[cap] = DONG[cap].split("\n").map(d => d.trim()).filter(Boolean).map(d => {
      const [en, e, vi] = d.split("|");
      return [en.trim(), (e || "").trim(), (vi || "").trim()];
    });
  });
  ST.KHO_TU = KHO;
})(typeof window !== "undefined" ? window : globalThis);
