# KỊCH BẢN GAME (Game Design Document – GDD)

> **Dự án:** Web game nông trại 3D nhiều người chơi (multiplayer), chạy trên trình duyệt máy tính và điện thoại.
> **Phiên bản tài liệu:** 0.1 (bản nháp đầu tiên, sẽ chỉnh sau mỗi lần chơi thử)
> **Tài liệu đi kèm:** [ROADMAP.md](ROADMAP.md) (kịch bản làm)

**Cách đọc tài liệu này:**
- Mọi con số (giá, thời gian, XP) đều là **số khởi điểm (initial values)**. Khi chơi thử (playtest), ta sẽ chỉnh chúng trong **bảng cấu hình (config table)** trên database, không cần sửa code.
- Mục nào ghi **[MVP]** thì phải có ở bản đầu tiên. Mục ghi **[Sau MVP]** thì làm sau.
- Thuật ngữ tiếng Anh nằm trong ngoặc. Cuối tài liệu có **Bảng thuật ngữ (Glossary)** để bạn ôn tiếng Anh.

**Những điều đã chốt:**

| Hạng mục | Lựa chọn |
|---|---|
| Điều khiển | Camera nhìn từ trên cao, chạm hoặc click. Không có nhân vật đi lại. |
| Quy mô | Nhóm bạn hoặc lớp, tối đa khoảng 50 người chơi trên một bản đồ chung |
| Nhịp chơi | Cây lớn từ 30 giây đến 8 giờ, vẫn lớn khi tắt máy |
| Thể loại | Làm nông đầy đủ: trồng trọt, chăn nuôi, chế biến, bán hàng, đấu giá |
| MVP | Trồng trọt + chăn nuôi + chế biến cơ bản. Chợ và đấu giá làm ngay sau MVP. |
| Ngân sách | 0 đồng, chỉ dùng gói miễn phí |

---

## Mục lục
1. [Tên game, tầm nhìn, điểm khác biệt](#1-tên-game-tầm-nhìn-điểm-khác-biệt)
2. [Vòng lặp chơi cốt lõi](#2-vòng-lặp-chơi-cốt-lõi-core-loop)
3. [Sản xuất: cây trồng, chăn nuôi, chế biến](#3-sản-xuất-cây-trồng-chăn-nuôi-chế-biến)
4. [Hệ thống kinh tế](#4-hệ-thống-kinh-tế-economy)
5. [Hệ thống nâng cấp](#5-hệ-thống-nâng-cấp-upgrades)
6. [Bản đồ và đất đai](#6-bản-đồ-và-đất-đai-map--land)
7. [Tương tác giữa người chơi, chợ và đấu giá](#7-tương-tác-giữa-người-chơi-chợ-và-đấu-giá)
8. [Nhiệm vụ, sự kiện, thành tựu](#8-nhiệm-vụ-sự-kiện-thành-tựu)
9. [Chống gian lận và lạm dụng](#9-chống-gian-lận-và-lạm-dụng-anti-cheat)
10. [Phong cách hình ảnh, âm thanh, danh sách asset](#10-phong-cách-hình-ảnh-âm-thanh-danh-sách-asset)
11. [Phạm vi MVP](#11-phạm-vi-mvp)
- [Phụ lục: Bảng thuật ngữ](#phụ-lục-bảng-thuật-ngữ-glossary)

---

## 1. Tên game, tầm nhìn, điểm khác biệt

### 1.1 Tên gợi ý

| Tên | Tên tiếng Anh | Ý nghĩa |
|---|---|---|
| **Làng Ô Vuông** (đề xuất) | *Patchwork Valley* | Bản đồ là lưới ô vuông. Mỗi người một mảnh, ghép lại như tấm chăn chắp vá (patchwork). |
| Nông Trại Láng Giềng | *Neighbor Farms* | Nhấn mạnh việc làm nông cạnh bạn bè |
| Đồng Xanh Chung | *Shared Fields* | Cánh đồng chung của cả nhóm |

Tài liệu này dùng tên **Làng Ô Vuông**. Đổi tên lúc nào cũng được.

### 1.2 Tầm nhìn (Vision)

> *"Một ngôi làng low-poly nhỏ, nơi bạn bè cùng làm nông trên một bản đồ chung. Mỗi người bắt đầu với một mảnh đất, rồi mở rộng dần. Cả làng lớn lên trước mắt mọi người."*

- **Người chơi mục tiêu (target audience):** sinh viên và nhóm bạn thích game thư giãn (cozy game). Mỗi lần chơi 5–15 phút, vài lần một ngày.
- **Nền tảng (platform):** trình duyệt trên máy tính và điện thoại, không cần cài đặt. Trên điện thoại nên cầm ngang (landscape), cầm dọc vẫn chơi được.

### 1.3 Trụ cột thiết kế (Design pillars)

Mỗi khi phân vân có nên thêm một tính năng hay không, hãy đối chiếu với 4 trụ cột sau:

| Trụ cột | Ý nghĩa | Ví dụ áp dụng |
|---|---|---|
| **Thư giãn (Cozy)** | Không phạt người chơi | Cây chín không bao giờ héo. Con vật không bao giờ chết. |
| **Cùng nhau (Together)** | Luôn thấy có người khác trong làng | Bản đồ chung, đi thăm nhau, bảng xếp hạng |
| **Lớn dần (Visible growth)** | Thấy rõ mình tiến bộ | Đất rộng thêm, nhà to hơn, có thêm chuồng trại |
| **Nhẹ (Lightweight)** | Chạy được trên điện thoại yếu | Low-poly, không dùng texture nặng, chỉ vẽ lại khi cần |

### 1.4 Điểm khác biệt (Unique selling points)

| So với | Game đó | Làng Ô Vuông |
|---|---|---|
| Hay Day, FarmVille | Mỗi người một nông trại riêng, chỉ ghé thăm nhau | **Một bản đồ chung**: đất của bạn nằm cạnh đất bạn bè, thấy nhau trồng gì |
| Stardew Valley | Chơi trên máy, phải cài đặt | **Mở link là chơi ngay**, kể cả trên điện thoại |
| Các web game 2D | Hình phẳng | **3D low-poly**, xoay và zoom camera được |
| Game nông trại thông thường | Chỉ trồng rồi bán | **Chuỗi sản xuất**: cây → thức ăn → vật nuôi → chế biến → đơn hàng, chợ, đấu giá |

---

## 2. Vòng lặp chơi cốt lõi (Core loop)

### 2.1 Ba vòng lặp lồng nhau

```
VÒNG NGẮN (vài phút)
  Gieo hạt → Chờ cây lớn → Thu hoạch → Bán / cất kho
      ↑                                      │
      └───────────── Xu (coins) ─────────────┘

VÒNG GIỮA (vài chục phút đến vài giờ)
  Nông sản → Máy xay thức ăn → Cho vật nuôi ăn → Trứng, sữa
      → Xưởng chế biến → Bánh, bơ, phô mai → Giao đơn hàng (lời hơn bán thường)

VÒNG DÀI (vài ngày đến vài tuần)
  Tích xu + lên cấp → Nâng cấp nhà/kho/công cụ → Mua thêm đất
      → Mở khóa cây và con vật mới → Leo bảng xếp hạng
      → [Sau MVP] Bán ở chợ, đấu giá vật phẩm hiếm, đất phù sa
```

### 2.2 Các bước của vòng ngắn

| Bước | Người chơi làm gì | Server làm gì |
|---|---|---|
| **Gieo (Plant)** | Chọn hạt giống, chạm vào luống trống | Trừ tiền hạt, lưu thời điểm gieo `planted_at` và thời điểm chín `ready_at` |
| **Chờ (Wait)** | Làm việc khác hoặc tắt máy | Không làm gì. Cây "lớn" chỉ là do thời gian trôi qua. |
| **Thu hoạch (Harvest)** | Chạm vào cây đã chín | Kiểm tra giờ server ≥ `ready_at`, cho nông sản vào kho, cộng XP |
| **Bán (Sell)** | Mở cửa hàng làng, bán nông sản | Trừ hàng trong kho, cộng xu |
| **Nâng cấp (Upgrade)** | Tiêu xu để nâng nhà, kho, công cụ, độ phì nhiêu | Kiểm tra đủ tiền và đủ cấp rồi tăng cấp |
| **Mua đất (Buy land)** | Chọn một ô đất trống kề bên đất mình | Kiểm tra quy tắc mua, trừ tiền, giao đất |

### 2.3 Một lượt chơi mẫu (khoảng 10 phút)

1. Mở game. Camera bay tới nông trại của mình. Thông báo hiện ra: "3 luống cà chua đã chín, có 4 quả trứng".
2. Thu hoạch tất cả cây chín (nhờ công cụ cấp 3 nên chỉ cần vài lần chạm).
3. Nhặt trứng, cho gà ăn lượt mới.
4. Đưa trứng và bột ngô vào lò bánh để làm bánh ngô.
5. Giao 1 đơn hàng ở bảng đơn hàng, được thưởng thêm 30% so với bán thường.
6. Gieo lại cây dài ngày (dưa hấu) vì sắp đi học.
7. Xem bảng xếp hạng, ghé thăm nông trại của bạn đứng hạng 1.

### 2.4 Mười phút đầu tiên của người mới (First-time user experience – FTUE)

| Phút | Diễn biến | Mục đích |
|---|---|---|
| 0:00 | Đăng nhập bằng Google, đặt tên và tên nông trại | Vào game nhanh |
| 0:30 | Camera bay từ quảng trường làng tới mảnh đất của mình | Cho người chơi thấy "làng chung" ngay từ đầu |
| 1:00 | Nhiệm vụ hướng dẫn: gieo 3 cải xanh (lớn trong 30 giây) | Có kết quả ngay |
| 2:00 | Thu hoạch rồi bán, được xu và XP, lên cấp 2 | Cảm giác tiến bộ |
| 5:00 | Mở khóa củ cải, gieo kín 12 luống | Học cách lập kế hoạch |
| 8:00 | Mua ô đất thứ 2 (500 xu) | Đạt mục tiêu dài hạn đầu tiên |
| ~30:00 | Lên cấp 4, mở khóa gà và máy xay thức ăn | Mở vòng giữa |

### 2.5 Cấp độ và kinh nghiệm (Level & XP)

- XP có được khi: thu hoạch, thu sản phẩm từ vật nuôi, chế biến, giao đơn hàng, hoàn thành nhiệm vụ.
- **Công thức:** XP cần để lên từ cấp L lên cấp L+1 = **40 × L²**.
- Ở MVP, cấp tối đa là **30**.

| Cấp hiện tại | XP cần để lên cấp kế | Tổng XP tích lũy để đạt cấp này |
|---|---|---|
| 1 | 40 | 0 |
| 2 | 160 | 40 |
| 3 | 360 | 200 |
| 4 | 640 | 560 |
| 5 | 1.000 | 1.200 |
| 8 | 2.560 | 5.600 |
| 10 | 4.000 | 11.400 |
| 15 | 9.000 | 40.600 |
| 18 | 12.960 | 71.400 |
| 20 | 16.000 | 98.800 |
| 30 | (tối đa) | 342.200 |

(Tổng XP tích lũy để đạt cấp L = 40 × (L−1) × L × (2L−1) ÷ 6.)

### 2.6 Bảng mở khóa theo cấp (Unlock table)

| Cấp | Mở khóa |
|---|---|
| 1 | Cải xanh, cửa hàng làng, mua ô đất (nhà cấp 1 cho tối đa 3 ô) |
| 2 | Củ cải |
| 3 | Cà rốt, bảng đơn hàng, nhiệm vụ hằng ngày |
| 4 | **Gà** + chuồng gà, **máy xay thức ăn**, được nâng nhà lên cấp 2 |
| 5 | Ngô |
| 6 | **Cối xay** (làm bột ngô) |
| 7 | Cà chua, **lò bánh** |
| 8 | **Bò** + chuồng bò, được nâng nhà lên cấp 3. [Sau MVP] Sạp hàng. |
| 9 | Khoai lang, **xưởng sữa** |
| 10 | [Sau MVP] Heo, nhà đấu giá |
| 11 | Dưa hấu |
| 12 | Được nâng nhà lên cấp 4. [Sau MVP] Cừu. |
| 13 | Bí ngô, công thức bánh bí ngô |
| 14 | [Sau MVP] Ong |
| 15 | Lúa |
| 16 | Được nâng nhà lên cấp 5 |
| 18 | Thanh long |

---

## 3. Sản xuất: cây trồng, chăn nuôi, chế biến

### 3.1 Vật phẩm và kho (Items & storage)

Mọi thứ người chơi sở hữu đều là **vật phẩm (item)**. Tất cả được cất chung trong **kho (barn/storage)**. Kho có sức chứa giới hạn (xem mục 5).

| Loại vật phẩm (category) | Ví dụ | Bán cho cửa hàng NPC được không? |
|---|---|---|
| Nông sản (crop) | Cải xanh, ngô, dưa hấu | Được |
| Thức ăn chăn nuôi (feed) | Thức ăn gà, thức ăn bò | **Không** (để không ai lợi dụng chênh lệch giá) |
| Sản phẩm vật nuôi (animal product) | Trứng, sữa | Được |
| Hàng chế biến (processed) | Bột ngô, bánh ngô, bơ, phô mai | Được |
| Vật phẩm hiếm (rare) [Sau MVP] | Hạt giống sự kiện, đồ trang trí độc quyền | Không. Chỉ đấu giá hoặc dùng. |

### 3.2 Cây trồng (Crops) [MVP]

**Nguyên tắc cân bằng:**
- **Lợi nhuận mỗi lần thu ≈ 8 × t^0,85**, với t là thời gian lớn tính bằng phút, sau đó làm tròn. Cây càng lâu thì lời mỗi lần càng nhiều, nhưng **lời mỗi phút giảm dần**.
  - Người chơi online thường xuyên trồng cây ngắn ngày, lời nhanh nhưng phải chạm nhiều.
  - Người hay vắng nhà trồng cây dài ngày, mỗi lần quay lại thu được nhiều.
  - Cả hai kiểu chơi đều có lợi.
- **Giá hạt ≈ 40% đến 100% lợi nhuận.** Cây cao cấp có tỉ lệ thấp hơn nhưng cần nhiều vốn hơn, nên người mới chưa trồng ngay được.
- Mỗi luống cho **1 nông sản** mỗi lần thu.

| # | Cây | Tiếng Anh | Thời gian lớn | Giá hạt | Giá bán | Lời / lần | Lời / phút | XP | Mở ở cấp |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Cải xanh | Bok choy | 30 giây | 5 | 10 | 5 | 10,0 | 1 | 1 |
| 2 | Củ cải | Radish | 2 phút | 10 | 25 | 15 | 7,5 | 2 | 2 |
| 3 | Cà rốt | Carrot | 5 phút | 20 | 50 | 30 | 6,0 | 4 | 3 |
| 4 | Ngô | Corn | 10 phút | 35 | 90 | 55 | 5,5 | 6 | 5 |
| 5 | Cà chua | Tomato | 20 phút | 60 | 160 | 100 | 5,0 | 10 | 7 |
| 6 | Khoai lang | Sweet potato | 45 phút | 100 | 300 | 200 | 4,4 | 18 | 9 |
| 7 | Dưa hấu | Watermelon | 1 giờ 30 phút | 180 | 540 | 360 | 4,0 | 30 | 11 |
| 8 | Bí ngô | Pumpkin | 3 giờ | 300 | 950 | 650 | 3,6 | 50 | 13 |
| 9 | Lúa | Rice | 5 giờ | 450 | 1.450 | 1.000 | 3,3 | 75 | 15 |
| 10 | Thanh long | Dragon fruit | 8 giờ | 600 | 2.100 | 1.500 | 3,1 | 110 | 18 |

**Bốn giai đoạn lớn (growth stages):** chỉ để hiển thị. Client tự tính từ `planted_at`, `ready_at` và giờ server.

| Tiến độ | Giai đoạn | Hình ảnh |
|---|---|---|
| 0–25% | Hạt (Seed) | Ụ đất nhỏ, có chấm màu |
| 25–60% | Mầm (Sprout) | 2 lá nhỏ |
| 60–100% | Đang lớn (Growing) | Thân và lá, chưa có quả |
| 100% | Chín (Ready) | Có quả hoặc củ, nảy nhẹ và có biểu tượng lấp lánh |

### 3.3 Chăn nuôi (Animal husbandry)

**Cách hoạt động:**
- Mỗi **chuồng (pen)** là một **công trình (structure)** chiếm một góc phần tư (2×2 luống) của ô đất (xem mục 6.2).
- Mỗi loại chuồng chỉ nuôi một loại con. Ở MVP, mỗi loại chuồng chỉ xây được 1 cái.
- Mua con vật bỏ vào chuồng, tối đa bằng sức chứa của chuồng. Muốn nuôi nhiều hơn thì nâng cấp chuồng.
- **Vòng chăm sóc:** cho ăn (tốn 1 phần thức ăn mỗi con) → chờ hết chu kỳ → thu sản phẩm → cho ăn lại.
  - Một lần chạm "Cho ăn" sẽ cho cả chuồng ăn.
  - Nếu không cho ăn, con vật chỉ đứng chơi. Không đói, không chết (trụ cột "Thư giãn").
- **Nguyên tắc cân bằng:** một chuồng đầy ở cấp 1 cho lợi nhuận mỗi chu kỳ ≈ 4 luống trồng cây có thời gian lớn tương đương. Chuồng chiếm đúng 4 luống nên không thiệt so với trồng cây. Khi nâng cấp chuồng, lời sẽ cao hơn trồng cây. Đó là phần thưởng cho việc đầu tư.

| Con vật | Mở ở cấp | Chuồng (giá xây) | Giá 1 con | Sức chứa cấp 1/2/3 | Thức ăn mỗi chu kỳ | Chu kỳ | Sản phẩm | Giá bán SP | XP mỗi SP | Phạm vi |
|---|---|---|---|---|---|---|---|---|---|---|
| Gà (Chicken) | 4 | Chuồng gà – 800 | 150 | 4 / 6 / 8 | 1 thức ăn gà | 20 phút | Trứng (Egg) | 110 | 3 | **[MVP]** |
| Bò (Cow) | 8 | Chuồng bò – 3.000 | 1.200 | 3 / 4 / 6 | 1 thức ăn bò | 1 giờ | Sữa (Milk) | 450 | 12 | **[MVP]** |
| Heo (Pig) | 10 | Chuồng heo – 5.000 | 2.000 | 3 / 4 / 6 | 1 thức ăn heo | 2 giờ | Phân bón (Fertilizer) | 950 | 20 | [Sau MVP] |
| Cừu (Sheep) | 12 | Chuồng cừu – 8.000 | 3.000 | 3 / 4 / 6 | 1 thức ăn cừu | 4 giờ | Lông cừu (Wool) | 1.250 | 35 | [Sau MVP] |
| Ong (Bee) | 14 | Tổ ong – 12.000 (đã có đàn ong) | – | 2 / 3 / 4 hũ mỗi chu kỳ | Không cần | 6 giờ | Mật ong (Honey) | 2.200 | 45 | [Sau MVP] |

**Kiểm tra cân bằng với gà:**
- Chuồng gà cấp 1 có 4 con. Mỗi quả trứng lời 110 − 20 (giá trị thức ăn) = 90 xu. Cả chuồng lời **360 xu mỗi 20 phút**.
- 4 luống cà chua (cũng lớn trong 20 phút) lời 4 × 100 = **400 xu**. Hai con số gần bằng nhau, đạt yêu cầu.

**Kiểm tra cân bằng với bò:**
- Chuồng bò cấp 1 có 3 con. Mỗi bình sữa lời 450 − 115 = 335 xu. Cả chuồng lời **≈1.005 xu mỗi giờ**.
- 4 luống cây lớn khoảng 1 giờ lời khoảng 4 × 260 = **1.040 xu**. Gần bằng nhau, đạt yêu cầu.

**Công dụng đặc biệt [Sau MVP]:**
- **Phân bón** (từ heo): bón vào một luống đang lớn để rút ngắn 50% thời gian còn lại.
- **Ong:** mọi cây trong cùng ô đất với tổ ong lớn nhanh hơn 5% (thụ phấn – pollination).

### 3.4 Chế biến (Processing)

**Cách hoạt động:**
- Mỗi **xưởng (processor)** là một công trình chiếm 1 góc phần tư.
- Mỗi xưởng có **hàng đợi sản xuất (production queue)**. Ở cấp 1 có 2 chỗ, nâng cấp tối đa 5 chỗ.
- Khi bấm làm một món, server trừ nguyên liệu ngay. Món đó bắt đầu khi món trước trong hàng đợi xong.
- Xong thì bấm "Thu" để lấy thành phẩm vào kho.
- **Công thức giá (hàng chế biến để bán):** giá bán ≈ tổng giá nguyên liệu × (1,3 + 0,1 × số giờ chế biến), làm tròn đến hàng chục. Chế biến lâu hơn thì được cộng thêm nhiều hơn.
- **Ngoại lệ:** thức ăn chăn nuôi là hàng trung gian, không bán được và không cộng giá. Giá trị của nó chỉ dùng để tính cân bằng.

**Máy xay thức ăn (Feed mill)** – mở ở cấp 4, giá xây 600 **[MVP]**

| Thành phẩm | Nguyên liệu | Ra được | Thời gian | Giá trị mỗi phần | XP |
|---|---|---|---|---|---|
| Thức ăn gà (Chicken feed) | 6 cải xanh | 3 phần | 1 phút | 20 | 1 |
| Thức ăn bò (Cow feed) | 3 ngô + 3 củ cải | 3 phần | 5 phút | 115 | 3 |
| Thức ăn heo (Pig feed) [Sau MVP] | 3 khoai lang + 3 ngô | 3 phần | 10 phút | 390 | 6 |
| Thức ăn cừu (Sheep feed) [Sau MVP] | 3 ngô + 3 cà rốt | 3 phần | 10 phút | 140 | 4 |

Lưu ý: thức ăn của mỗi con chỉ làm từ cây được mở khóa **trước** con đó. Ví dụ gà mở ở cấp 4, thức ăn gà làm từ cải xanh mở ở cấp 1.

**Xưởng chế biến [MVP]**

| Xưởng | Mở ở cấp | Giá xây | Thành phẩm | Nguyên liệu (giá trị) | Thời gian | Giá bán | XP |
|---|---|---|---|---|---|---|---|
| Cối xay (Mill) | 6 | 1.500 | Bột ngô (Cornmeal) | 3 ngô (270) | 10 phút | 360 | 5 |
| Lò bánh (Bakery) | 7 | 2.500 | Bánh ngô (Corn bread) | 1 bột ngô + 2 trứng (580) | 30 phút | 780 | 12 |
| Lò bánh (Bakery) | 13 | – | Bánh bí ngô (Pumpkin pie) | 1 bí ngô + 1 trứng + 1 sữa (1.510) | 1 giờ | 2.110 | 30 |
| Xưởng sữa (Dairy) | 9 | 5.000 | Bơ (Butter) | 2 sữa (900) | 30 phút | 1.220 | 18 |
| Xưởng sữa (Dairy) | 9 | – | Phô mai (Cheese) | 3 sữa (1.350) | 1 giờ | 1.890 | 28 |

Kiểm tra công thức với bánh ngô: 580 × (1,3 + 0,1 × 0,5) = 580 × 1,35 = 783, làm tròn thành **780**. Khớp với bảng.

**Xưởng chế biến [Sau MVP]**

| Xưởng | Thành phẩm | Nguyên liệu | Thời gian | Giá bán (theo công thức) |
|---|---|---|---|---|
| Cối xay | Bột gạo (Rice flour) | 2 lúa | 30 phút | 3.920 |
| Xưởng dệt (Loom) | Khăn len (Wool scarf) | 2 lông cừu | 2 giờ | 3.750 |
| Máy ép (Juice press) | Nước ép dưa hấu (Watermelon juice) | 2 dưa hấu | 30 phút | 1.460 |
| Máy ép | Sinh tố thanh long (Dragon fruit smoothie) | 2 thanh long | 1 giờ | 5.880 |
| Nhà làm mứt (Jam house) | Mứt thanh long (Dragon fruit jam) | 2 thanh long + 1 mật ong | 2 giờ | 9.600 |

### 3.5 Cây ăn quả lâu năm (Fruit trees) [Sau MVP]

- Trồng 1 lần, thu hoạch nhiều lần. Ví dụ: xoài, cam, dừa.
- Cây con (sapling) mất 12–24 giờ để trưởng thành. Sau đó cứ 4–8 giờ cho quả một lần, không cần gieo lại.
- Mỗi cây chiếm 1 luống, nhưng mô hình 3D to hơn luống thường.

---

## 4. Hệ thống kinh tế (Economy)

### 4.1 Tiền tệ

- Chỉ có **một loại tiền là Xu (coins)**. **Không có nạp tiền thật** (no real-money transactions), nên game không bị "trả tiền để thắng" (pay-to-win). Lợi ích khác: website không mang tính thương mại, đúng điều kiện của gói Vercel miễn phí.
- **XP** không phải tiền. XP chỉ dùng để lên cấp.

### 4.2 Khởi đầu

| Hạng mục | Giá trị |
|---|---|
| Xu khởi đầu | 150 |
| Đất | 1 ô đất gốc: 12 luống trồng + nhà và kho |
| Nhà / kho / công cụ | Đều cấp 1 |
| Kho | Chứa được 75 vật phẩm |
| Quà mở đầu | 25 xu (thưởng của nhiệm vụ hướng dẫn đầu tiên) |
| Hạt giống | Không cần mua trước. Gieo đến đâu trả tiền hạt đến đó, bớt được một bước cho người mới. |

### 4.3 Nguồn tiền và chỗ tiêu tiền (Faucets & sinks)

| Nguồn tạo xu (Faucet) | Chỗ rút xu khỏi game (Sink) |
|---|---|
| Bán vật phẩm cho cửa hàng NPC | Mua hạt giống |
| Giao đơn hàng NPC | Mua con vật |
| Thưởng nhiệm vụ, đăng nhập, thành tựu | Xây chuồng, xây xưởng |
| | Mua đất (giá tăng theo cấp số nhân) |
| | Nâng cấp (giá tăng theo cấp số nhân) |
| | [Sau MVP] Thuế chợ 10%, phí đấu giá 10% |
| | [Sau MVP] Phiên đấu giá của hệ thống: toàn bộ xu đấu được bị xóa khỏi game |

**Lưu ý:** giao dịch giữa người chơi (chợ, đấu giá) **không tạo ra xu mới**. Xu chỉ chuyển từ người này sang người kia, phần thuế bị xóa khỏi game.

### 4.4 Giá đất

**Công thức:**

> **Giá mua ô đất tiếp theo = 500 × 1,5^(n − 1) × hệ số vùng**
> - n là số ô đất bạn đang sở hữu, kể cả đất gốc.
> - Kết quả làm tròn đến hàng chục.
> - Hệ số vùng: đất thường = 1. [Sau MVP] Đất phù sa bán qua đấu giá, không theo công thức này.

Giá tăng theo **cấp số nhân (exponential)**, còn thu nhập chỉ tăng **tuyến tính (linear)** theo số đất. Vì vậy, càng nhiều đất thì càng lâu mới mua được ô tiếp theo. Đây là cái phanh tự nhiên chống việc một người chiếm cả bản đồ.

| Đang có (n) | Mua ô thứ | Giá (xu) | Mục tiêu thiết kế: thời gian chơi để đủ tiền |
|---|---|---|---|
| 1 | 2 | 500 | khoảng 5–10 phút |
| 2 | 3 | 750 | khoảng 10–15 phút |
| 3 | 4 | 1.130 | khoảng 20 phút |
| 4 | 5 | 1.690 | khoảng 30 phút |
| 5 | 6 | 2.530 | khoảng 45 phút |
| 6 | 7 | 3.800 | khoảng 1 giờ |
| 8 | 9 | 8.540 | khoảng 2 giờ |
| 10 | 11 | 19.220 | khoảng 3–4 giờ |
| 12 | 13 | 43.250 | khoảng nửa ngày |
| 15 | 16 | 145.960 | khoảng 1 ngày |
| 20 | 21 | 1.108.420 | khoảng 2–3 ngày |
| 24 | 25 (tối đa) | 5.611.370 | khoảng 5–7 ngày |

Cột "mục tiêu thiết kế" là **mong muốn**, chưa phải số đã tính chính xác. Khi chơi thử, nếu thực tế lệch nhiều thì chỉnh `land_base_price` (500) hoặc `land_growth` (1,5) trong bảng cấu hình.

### 4.5 Công thức chung

| Công thức | Giá trị khởi điểm |
|---|---|
| Lợi nhuận cây ≈ 8 × (phút)^0,85 | Xem bảng 3.2 |
| XP lên cấp = 40 × L² | Xem bảng 2.5 |
| Giá đất = 500 × 1,5^(n−1) | Xem bảng 4.4 |
| Chi phí nâng cấp từ cấp L lên L+1 = giá gốc × 4^(L−1) | Xem mục 5 |
| Giá hàng chế biến = tổng nguyên liệu × (1,3 + 0,1 × giờ) | Xem bảng 3.4 |
| Lợi nhuận chuồng mỗi chu kỳ (cấp 1) ≈ 4 luống cây cùng thời gian | Xem bảng 3.3 |
| Thưởng đơn hàng = giá trị hàng × 1,2 đến 1,5 | Xem mục 8 |
| Thưởng nhiệm vụ ngày = 15 × cấp × độ khó (1–3) xu | Xem mục 8 |

### 4.6 Cách tránh lạm phát (Inflation control)

Ở game này, **lạm phát (inflation)** là khi người chơi lâu năm có quá nhiều xu, khiến xu mất ý nghĩa, còn người mới thấy mọi thứ quá đắt (nếu có chợ). Cách chống:

1. **Giá NPC cố định.** Cửa hàng làng mua và bán theo giá cố định, nên giá không bị "thổi phồng".
2. **Chỗ tiêu tiền tăng theo cấp số nhân:** đất, nâng cấp, độ phì nhiêu của từng ô đất. Người càng giàu càng có chỗ để tiêu.
3. **Kho có giới hạn.** Không ai tích trữ vô hạn được, phải bán hoặc dùng.
4. **Thưởng nhỏ.** Tổng thưởng từ nhiệm vụ, đăng nhập và thành tựu không quá khoảng **10–15% thu nhập trong ngày** của người chơi cùng cấp.
5. **[Sau MVP] Thuế 10%** khi bán ở chợ hoặc đấu giá. Số xu thuế bị xóa khỏi game.
6. **[Sau MVP] Phiên đấu giá của hệ thống** (đất phù sa, đồ hiếm). Toàn bộ xu người thắng trả bị xóa khỏi game. Đây là chỗ rút tiền lớn nhất dành cho người giàu.
7. **[Sau MVP] Giới hạn khoảng giá ở chợ** từ 0,8 đến 2 lần giá gốc.
8. **Theo dõi bằng số liệu.** Một **view SQL** tính tổng số xu đang lưu hành và số xu tạo ra hoặc mất đi mỗi ngày. Nếu tổng tăng quá nhanh thì giảm thưởng hoặc tăng giá trong bảng cấu hình.
9. **Đồ trang trí (cosmetics)** [Sau MVP]: tiêu xu cho vui, không ảnh hưởng sức mạnh.

---

## 5. Hệ thống nâng cấp (Upgrades)

**Công thức chi phí chung:** chi phí lên từ cấp L lên cấp L+1 = **giá gốc × 4^(L−1)**.

### 5.1 Nhà (House): giới hạn số ô đất được sở hữu

| Cấp | Số ô đất tối đa | Chi phí nâng lên cấp này | Yêu cầu cấp người chơi |
|---|---|---|---|
| 1 | 3 | – (có sẵn) | – |
| 2 | 6 | 2.000 | 4 |
| 3 | 10 | 8.000 | 8 |
| 4 | 16 | 32.000 | 12 |
| 5 | 25 | 128.000 | 16 |

Nhà cũng to và đẹp hơn sau mỗi cấp (mô hình 3D thay đổi), để mọi người nhìn vào là thấy bạn tiến bộ.

### 5.2 Kho (Barn): sức chứa vật phẩm

| Cấp | Sức chứa | Chi phí nâng lên cấp này |
|---|---|---|
| 1 | 75 | – |
| 2 | 150 | 500 |
| 3 | 300 | 2.000 |
| 4 | 600 | 8.000 |
| 5 | 1.200 | 32.000 |

Khi kho đầy, người chơi **không thu hoạch được nữa**. Cây vẫn nằm chín trên luống chờ bạn, không bị mất.

### 5.3 Công cụ (Tools): mỗi lần chạm tác động được bao nhiêu luống

| Cấp | Vùng tác động khi gieo/thu hoạch | Chi phí nâng lên cấp này |
|---|---|---|
| 1 | 1 luống | – |
| 2 | 1 góc phần tư (2×2 = 4 luống) | 300 |
| 3 | Nửa ô đất (2×4 = 8 luống) | 1.200 |
| 4 | Cả ô đất (tối đa 16 luống) | 4.800 |
| 5 | Mọi ô đất của bạn (nút "Thu hoạch tất cả" / "Gieo tất cả") | 19.200 |

Vùng tác động bám theo góc phần tư (2×2) thay vì 3×3. Lý do: ô đất 4×4 chia đều thành các góc 2×2, và chuồng, xưởng cũng chiếm đúng 1 góc. Nhờ vậy cả cách nhìn lẫn cách kiểm tra ở server đều đơn giản. Công cụ tự bỏ qua những luống đã có công trình.

Công cụ là **tiện ích (quality of life)**, không làm cây lớn nhanh hơn. Trên điện thoại, chạm từng luống rất mệt, nên công cụ là thứ người chơi muốn nâng sớm.

### 5.4 Độ phì nhiêu đất (Soil fertility): tính riêng cho từng ô đất

| Cấp | Cây lớn nhanh hơn | Chi phí nâng lên cấp này (mỗi ô đất) |
|---|---|---|
| 1 | 0% | – |
| 2 | 5% | 400 |
| 3 | 10% | 1.600 |
| 4 | 15% | 6.400 |
| 5 | 20% | 25.600 |

Vì tính riêng từng ô đất, người có 20 ô đất phải trả cho cả 20 ô. Đây là **chỗ rút tiền (money sink) quan trọng** ở cuối game. Thời gian chín được tính lúc gieo: `ready_at = giờ gieo + thời gian lớn × (1 − % nhanh hơn)`.

### 5.5 Chuồng (Pens): sức chứa con vật

| Chuồng | Cấp 1 | Cấp 2 (chi phí) | Cấp 3 (chi phí) |
|---|---|---|---|
| Chuồng gà | 4 con | 6 con (1.600) | 8 con (6.400) |
| Chuồng bò | 3 con | 4 con (6.000) | 6 con (24.000) |

Giá gốc để nâng chuồng = 2 × giá xây chuồng, rồi áp công thức × 4^(L−1).

### 5.6 Xưởng (Processors): số chỗ trong hàng đợi

| Cấp | Số chỗ | Chi phí nâng lên cấp này |
|---|---|---|
| 1 | 2 | – |
| 2 | 3 | giá xây × 1 |
| 3 | 4 | giá xây × 4 |
| 4 | 5 | giá xây × 16 |

Ví dụ với lò bánh (giá xây 2.500): lên cấp 2 tốn 2.500, lên cấp 3 tốn 10.000, lên cấp 4 tốn 40.000.

### 5.7 Sạp hàng (Stall) [Sau MVP]: số ô bày hàng

| Cấp | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Số ô bày hàng | 3 | 4 | 5 | 6 | 8 |
| Chi phí | – | 1.000 | 4.000 | 16.000 | 64.000 |

---

## 6. Bản đồ và đất đai (Map & land)

### 6.1 Đơn vị đo

| Khái niệm | Kích thước | Ghi chú |
|---|---|---|
| **Luống (plot)** | 1 × 1 mét (1 đơn vị trong 3D) | Đơn vị nhỏ nhất, trồng được 1 cây |
| **Góc phần tư (quadrant)** | 2 × 2 luống | Chứa 4 luống, hoặc 1 công trình |
| **Ô đất (parcel)** | 4 × 4 luống = 4 góc phần tư | Đơn vị để mua bán và sở hữu |
| **Lối đi (path)** | Rộng 1 mét quanh mỗi ô đất | Chỉ để nhìn. Mỗi ô đất cách ô kế bên 5 mét. |
| **Vùng (chunk)** | 8 × 8 ô đất = 40 × 40 mét | Dùng để chia bản đồ khi vẽ và khi gửi realtime (xem ROADMAP) |
| **Bản đồ (map)** | 32 × 32 ô đất = 160 × 160 mét | Tổng cộng 1.024 ô đất, 16 vùng |

### 6.2 Bố cục một ô đất

```
 Ô đất gốc (home parcel)          Ô đất mua thêm
┌─────────┬─────────┐            ┌─────────┬─────────┐
│  Q0     │  Q1     │            │  Q0     │  Q1     │
│ NHÀ +   │ □ □     │            │ □ □     │ CHUỒNG  │
│ KHO     │ □ □     │            │ □ □     │  GÀ     │
├─────────┼─────────┤            ├─────────┼─────────┤
│  Q2     │  Q3     │            │  Q2     │  Q3     │
│ □ □     │ □ □     │            │ □ □     │ □ □     │
│ □ □     │ □ □     │            │ □ □     │ □ □     │
└─────────┴─────────┘            └─────────┴─────────┘
 □ = luống trồng; Q0..Q3 = góc phần tư (quadrant)
```

- Trên đất gốc, góc Q0 luôn là **nhà + kho**, nên còn **12 luống**. [Sau MVP] Sạp hàng đặt ở mép trước nhà.
- Bất kỳ góc phần tư nào của đất mình cũng xây được công trình (chuồng, xưởng). Xây ở đâu thì 4 luống ở đó biến mất. [Sau MVP] Có thể phá công trình để lấy lại luống.

### 6.3 Toàn cảnh bản đồ

```
 y
 31 ┌───────────────────────────────────────────┐
    │ ~ rừng / núi bao quanh (chỉ để nhìn) ~    │
    │   H . . . H . . . H . . . H . . . H ...   │
    │   . . . . . . . ≈ ≈ . . . . . . . . .     │   H = vị trí nhà (home slot)
    │   H . . . H . . ┌─────────┐ . H . . . H   │   ≈ = hồ (lake) / đất phù sa
    │   . . . . . . . │QUẢNG    │ . . . . . .   │   . = đất trống để mua
    │   H . . . H . . │TRƯỜNG   │ . H . . . H   │
    │   . . . . . . . │LÀNG 6×6 │ . . . . . .   │
    │   H . . . H . . └─────────┘ . H . . . H   │
    │   ...                                     │
  0 └───────────────────────────────────────────┘
    0                                          31 x
```

| Khu vực | Vị trí (tọa độ ô đất) | Mua được không? |
|---|---|---|
| **Quảng trường làng (Town square)** | x, y từ 13 đến 18 (6×6 = 36 ô) | Không. Đây là nơi đặt cửa hàng làng, bảng đơn hàng, bảng xếp hạng, [Sau MVP] chợ và nhà đấu giá. |
| **Vị trí nhà (Home slot)** | x, y thuộc {2, 6, 10, 14, 18, 22, 26, 30}, trừ 4 vị trí nằm trong quảng trường | Không mua được. Hệ thống tự giao cho người mới. Tổng cộng **60 vị trí**, đủ cho 50 người. |
| **Vùng ưu tiên (Priority zone)** | 8 ô bao quanh mỗi vị trí nhà | Chỉ chủ của vị trí nhà đó được mua |
| **Đất trống (Free land)** | Các ô còn lại, nằm trên các "đường ranh" giữa những vùng ưu tiên | Ai có đất kề bên đều mua được. Đây là nơi hàng xóm cạnh tranh. |
| **Hồ, rừng (Lake, forest)** | Khoảng 5–8% số ô, đặt trên các đường ranh | Không. Chỉ để trang trí và làm bản đồ đa dạng hơn. |
| **Đất phù sa (Alluvial land)** [Sau MVP] | Khoảng 20 ô quanh bờ hồ | Ở MVP thì khóa và cắm biển "Sắp đấu giá". Sau MVP bán qua đấu giá. Cây trồng ở đây lớn nhanh hơn 10%. |

### 6.4 Cách phân bổ đất cho người mới

1. Người chơi đặt tên xong thì server tìm **vị trí nhà còn trống gần trung tâm bản đồ nhất**. Nếu có nhiều vị trí cách trung tâm bằng nhau thì chọn ngẫu nhiên một cái.
2. Giao ô đất đó làm **đất gốc**, xây nhà ở góc Q0, tạo 12 luống trống.
3. Làng lấp dần từ trung tâm ra ngoài. Người mới luôn ở gần người cũ, nên lúc nào cũng thấy làng đông vui.
4. Khi hết vị trí nhà (hơn 60 người), mở rộng bản đồ thêm một vòng (ví dụ lên 40×40). Database lưu tọa độ (x, y) nên mở rộng không cần sửa cấu trúc.
5. [Sau MVP] Có thể nhập **mã mời (invite code)** của bạn bè để được xếp ở gần họ.

### 6.5 Quy tắc mua đất

Một ô đất chỉ mua được khi **thỏa tất cả** các điều kiện sau. Server kiểm tra toàn bộ, client chỉ dùng để tô màu gợi ý:

1. Ô đó **chưa có chủ** và thuộc loại mua được (không phải quảng trường, hồ, rừng, vị trí nhà).
2. Ô đó **chung cạnh** (kề trên, dưới, trái hoặc phải, không tính chéo) với ít nhất 1 ô bạn đang sở hữu.
3. Ô đó **không nằm trong vùng ưu tiên** của người khác.
4. Số ô bạn đang có **nhỏ hơn giới hạn** của cấp nhà.
5. Bạn **đủ xu** theo công thức ở mục 4.4.

Ở MVP, **không bán lại đất**. Lý do: tránh lỗ hổng kiểu mua rẻ bán đắt và giữ cho làng ổn định.

### 6.6 Nông trại bỏ hoang (Inactive farms)

- Người chơi không đăng nhập 14 ngày thì nông trại chuyển sang trạng thái **"ngủ đông"**: có thêm cỏ dại để trang trí và một biển nhỏ. **Không xóa dữ liệu.**
- [Sau MVP, cân nhắc kỹ] Thu hồi vị trí nhà của người bỏ game lâu (ví dụ trên 60 ngày và dưới cấp 5) để nhường cho người mới.

---

## 7. Tương tác giữa người chơi, chợ và đấu giá

### 7.1 Tương tác cơ bản [MVP]

| Tính năng | Mô tả |
|---|---|
| **Nhìn thấy nhau** | Cả làng chung một bản đồ, đất của ai cũng hiện ra với cây, chuồng, nhà của họ |
| **Xem thông tin** | Chạm vào ô đất của người khác để thấy: tên người chơi, tên nông trại, cấp, số ô đất |
| **Thăm nông trại (Visit)** | Bấm nút "Thăm", camera bay tới đất gốc của người đó. Chỉ được xem, không chạm vào đồ của họ. |
| **Cập nhật trực tiếp (Realtime)** | Hàng xóm gieo hay thu hoạch, bạn thấy thay đổi trong khoảng 1–2 giây |
| **Đang online (Presence)** | Danh sách người đang chơi, có chấm xanh trên đất của họ |
| **Bảng xếp hạng (Leaderboard)** | 3 thẻ: **Cấp độ** (theo tổng XP), **Đất đai** (theo số ô), **Tuần này** (XP kiếm được từ thứ Hai, reset 0h thứ Hai giờ Việt Nam, để người mới cũng có cơ hội lên top). Bấm vào tên trên bảng để đi thăm. |

### 7.2 Sạp hàng – chợ giữa người chơi (Roadside stall / Player market) [Sau MVP]

**Ý tưởng:** mỗi người có một sạp hàng nhỏ trước nhà. Bạn bày vật phẩm và tự đặt giá. Người khác ghé thăm hoặc xem trên **Bảng chợ làng** ở quảng trường để mua. Người bán nhận xu ngay cả khi đang offline.

| Quy tắc | Giá trị | Lý do |
|---|---|---|
| Điều kiện tham gia | Cấp 8 trở lên, tài khoản tạo được ít nhất 3 ngày | Chống tài khoản phụ (alt account) |
| Số ô bày hàng | 3 ô, nâng tối đa 8 ô | Xem mục 5.7 |
| Mỗi ô bày | 1 loại vật phẩm, tối đa 10 cái | Tránh một người "xả" quá nhiều hàng |
| **Khoảng giá (price band)** | Từ 0,8 đến 2 lần giá gốc NPC | Không thể bán 1 xu cho tài khoản phụ, cũng không thể mua đắt để chuyển tiền |
| Thời gian treo | Tối đa 24 giờ. Hết hạn thì hàng tự về kho. | Chợ luôn có hàng mới |
| **Thuế chợ (market tax)** | 10% số tiền bán được, trừ vào phần người bán nhận | Chỗ rút tiền, chống lạm phát |
| **Khách vãng lai NPC** | Món treo quá 3 giờ chưa ai mua, nếu giá ≤ 1,1 lần giá gốc, sẽ được NPC mua | Làng ít người nên chợ dễ ế. Sau thuế, người bán nhận ≈ 0,99 lần giá gốc, ngang bán cho NPC, nên không tạo lợi thế hay lạm phát. |
| Giới hạn nhận xu | Mỗi ngày nhận tối đa 5.000 × cấp xu từ người chơi khác | Hạn chế dồn tiền về một tài khoản |
| Hủy bán | Được hủy khi chưa có ai mua. Hàng về kho, không hoàn thuế vì chưa thu. | |

**Vật phẩm hiếm được bán ở chợ:** không. Vật phẩm hiếm chỉ được đấu giá.

### 7.3 Nhà đấu giá (Auction house) [Sau MVP]

Nhà đấu giá nằm ở quảng trường làng. Có **hai loại phiên đấu giá (auction)**:

| | Phiên của hệ thống (System auction) | Phiên của người chơi (Player auction) |
|---|---|---|
| Ai bán | Game | Người chơi cấp 10 trở lên |
| Bán gì | Hạt giống hiếm và sự kiện, đồ trang trí độc quyền, **quyền mua một ô đất phù sa cụ thể** | Vật phẩm thường hoặc hiếm mà người chơi sở hữu (theo lô) |
| Khi nào | 1–3 phiên mỗi ngày, cố định lúc 20:00 giờ Việt Nam | Bất cứ lúc nào. Thời lượng chọn 2, 8 hoặc 24 giờ. |
| Tiền đi đâu | **Bị xóa khỏi game** (chỗ rút tiền lớn) | Người bán nhận giá cuối trừ 10% phí |
| Giới hạn | Muốn đấu đất phù sa thì phải có ô đất kề ô đó và nhà còn chỗ | Mỗi người tối đa 3 phiên đang mở. Phí mở phiên 2% giá khởi điểm, không hoàn lại (chống spam). |

**Quy tắc trả giá (bidding):**

1. Mỗi lần trả giá phải cao hơn giá hiện tại ít nhất **max(5%, 10 xu)**.
2. **Giữ tiền đặt cọc (escrow):** khi bạn trả giá, xu bị trừ ngay khỏi tài khoản và server giữ hộ. Ai bị trả giá cao hơn thì được **hoàn tiền ngay lập tức**. Nhờ vậy người thắng chắc chắn có đủ tiền.
3. **Chống bắn tỉa (anti-sniping):** có người trả giá trong 2 phút cuối thì phiên kéo dài thêm 2 phút.
4. Không được tự trả giá cho phiên của chính mình. Khi đã có người trả giá thì không được hủy phiên.
5. **Chốt phiên (settlement):** khi hết giờ, server giao hàng cho người thắng và giao tiền cho người bán (sau khi trừ phí). Không ai trả giá thì hàng về lại người bán. Mỗi phiên **chỉ được chốt đúng một lần**. ROADMAP giải thích cách đảm bảo điều này.
6. Giá khởi điểm phiên người chơi ≥ 0,5 lần giá gốc.

### 7.4 Tương tác khác [Sau MVP]

| Tính năng | Mô tả ngắn |
|---|---|
| **Tưới giúp (Help water)** | Mỗi ngày giúp mỗi nông trại 1 lần. Cây trong 1 ô đất của họ lớn nhanh hơn 5%, người giúp được XP. |
| **Tặng quà (Gift)** | Tặng hạt giống thường (có giới hạn mỗi ngày, chỉ cho bạn bè) |
| **Hợp tác xã (Co-op)** | Nhóm 3–8 người cùng làm đơn hàng lớn chung |
| **Chat** | Để rất sau, vì cần kiểm duyệt nội dung (moderation) |
| **Trộm rau** | **Không làm.** Dễ gây khó chịu, trái trụ cột "Thư giãn". |

---

## 8. Nhiệm vụ, sự kiện, thành tựu

### 8.1 Nhiệm vụ hướng dẫn (Tutorial quests) [MVP]

Chuỗi 10 nhiệm vụ, làm theo thứ tự, mỗi lần hiện 1 nhiệm vụ.

| # | Nhiệm vụ | Thưởng |
|---|---|---|
| 1 | Gieo 3 cải xanh | 25 xu + 10 XP |
| 2 | Thu hoạch 3 cải xanh | 20 xu |
| 3 | Bán 5 nông sản ở cửa hàng làng | 30 xu |
| 4 | Gieo kín 12 luống | 50 xu |
| 5 | Nâng công cụ lên cấp 2 | 50 xu + 20 XP |
| 6 | Mua ô đất thứ 2 | 100 xu |
| 7 | Thăm nông trại của một người khác | 50 xu |
| 8 | Xây máy xay thức ăn (cấp 4) | 100 xu |
| 9 | Xây chuồng gà và mua 2 con gà | 150 xu |
| 10 | Thu 4 quả trứng | 200 xu + 50 XP |

### 8.2 Nhiệm vụ hằng ngày (Daily quests) [MVP]

- Mở ở cấp 3. Mỗi ngày có **3 nhiệm vụ** chọn ngẫu nhiên từ danh sách mẫu, phù hợp với cấp của người chơi.
- Reset lúc **0h giờ Việt Nam** (Asia/Ho_Chi_Minh).
- Thưởng: **15 × cấp × độ khó** xu và **5 × cấp** XP. Độ khó là Dễ = 1, Vừa = 2, Khó = 3.
- Làm xong cả 3 nhiệm vụ: thêm **10 × cấp** XP. [Sau MVP] Thêm 1 vật phẩm hiếm ngẫu nhiên.

| Mẫu nhiệm vụ (quest template) | Độ khó |
|---|---|
| Thu hoạch X cây bất kỳ | Dễ |
| Gieo Y loại cây khác nhau | Dễ |
| Bán hàng được Z xu | Vừa |
| Cho vật nuôi ăn X lần | Vừa |
| Chế biến X sản phẩm | Vừa |
| Giao X đơn hàng | Khó |
| Thăm 2 nông trại khác | Dễ |

### 8.3 Bảng đơn hàng (Order board) [MVP]

- Bảng đơn hàng ở quảng trường làng có **6 ô đơn hàng**, mở ở cấp 3.
- Mỗi đơn yêu cầu 1–3 loại vật phẩm mà người chơi **đã mở khóa**. Từ cấp 7 trở đi, đơn có thể yêu cầu cả hàng chế biến.
- **Thưởng = tổng giá gốc của hàng × (1,2 đến 1,5)** xu, cộng thêm XP = giá trị hàng ÷ 20. Đơn càng nhiều loại hàng thì hệ số càng cao.
- Không muốn làm đơn nào thì **bỏ qua (skip)** đơn đó. Sau khi giao hoặc bỏ qua, đơn mới xuất hiện ở ô đó sau **15 phút**.
- Đơn hàng là lý do để người chơi giữ hàng trong kho thay vì bán hết, và là lý do để chế biến.

### 8.4 Thưởng đăng nhập (Daily login reward) [MVP]

| Ngày liên tiếp | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Xu cơ bản | 50 | 80 | 120 | 160 | 220 | 300 | 500 |

- Số xu thật nhận được = xu cơ bản × (1 + cấp ÷ 10). Ví dụ cấp 10, ngày 7: 500 × 2 = 1.000 xu.
- Bỏ một ngày thì chuỗi quay lại ngày 1. Qua ngày 7 thì lặp lại từ ngày 1.

### 8.5 Thành tựu (Achievements) [MVP: bản cơ bản]

Mỗi thành tựu có 3 bậc (Đồng, Bạc, Vàng). Thưởng là một ít xu và một **huy hiệu (badge)** hiện trên hồ sơ.

| Thành tựu | Đồng | Bạc | Vàng |
|---|---|---|---|
| Nhà nông chăm chỉ: thu hoạch tổng cộng | 100 cây | 1.000 cây | 10.000 cây |
| Địa chủ: sở hữu | 5 ô đất | 10 ô đất | 20 ô đất |
| Đủ mùa: trồng đủ | 5 loại cây | 8 loại cây | 10 loại cây |
| Trang trại vui: thu sản phẩm vật nuôi | 50 | 500 | 5.000 |
| Thợ khéo tay: chế biến | 20 món | 200 món | 2.000 món |
| Giao hàng nhanh: giao đơn hàng | 10 | 100 | 500 |
| Hàng xóm tốt: thăm nông trại khác | 5 lần | 25 lần | 100 lần |
| Leo cấp: đạt cấp | 10 | 20 | 30 |

### 8.6 Sự kiện (Events) [Sau MVP]

Mọi sự kiện được lưu trong bảng `events` (thời gian bắt đầu, kết thúc, hiệu ứng). Server tự đọc bảng này, không cần sửa code.

| Sự kiện | Thời gian | Nội dung |
|---|---|---|
| **Cuối tuần bội thu** | Thứ Bảy, Chủ Nhật | 1 loại cây ngẫu nhiên bán đắt hơn 20% |
| **Tết Nguyên Đán** | Khoảng 2 tuần quanh Tết | Cây sự kiện "Hoa mai", công thức "Bánh chưng" (lúa + …), trang trí câu đối |
| **Trung Thu** | Khoảng 2 tuần quanh rằm tháng 8 | Trang trí **lồng đèn** (tận dụng kinh nghiệm làm lồng đèn Three.js của bạn), bánh trung thu |
| **Lễ hội mùa gặt** | Hằng tháng | Cả làng cùng góp một loại nông sản đạt mục tiêu chung, tất cả cùng được thưởng |

### 8.7 Thời tiết (Weather) [Sau MVP]

- Mỗi ngày có một kiểu thời tiết chung cho cả làng, server tính từ ngày tháng nên ai cũng thấy giống nhau.
- Chỉ có **hiệu ứng tốt** (trụ cột "Thư giãn"):
  - **Mưa:** cây gieo trong ngày lớn nhanh hơn 10%.
  - **Nắng đẹp:** vật nuôi cho thêm XP.
  - **Cầu vồng** (hiếm): bán hàng thêm 5%.
- Có hình ảnh mưa, mây, ánh nắng. Có thể có ngày và đêm theo giờ thật ở Việt Nam.

---

## 9. Chống gian lận và lạm dụng (Anti-cheat)

### 9.1 Nguyên tắc vàng

> **Server là nguồn sự thật duy nhất (single source of truth).**
> Client (trình duyệt) chỉ **hiển thị** và **gửi ý định (intent)**, ví dụ "tôi muốn thu hoạch luống số 123".
> Client **không bao giờ** gửi kết quả, ví dụ "tôi có 9.999 xu" hay "cây đã chín rồi".

Vì sao? Mọi thứ chạy trong trình duyệt đều sửa được bằng công cụ nhà phát triển (DevTools, phím F12). Người chơi có thể sửa biến, gọi API trực tiếp, đổi giờ máy tính. Vì vậy mọi kiểm tra quan trọng phải nằm ở server.

### 9.2 Bảng mối đe dọa và cách chống

| Mối đe dọa (threat) | Ví dụ | Cách chống (mitigation) |
|---|---|---|
| Sửa số tiền | Mở F12, gọi API để cập nhật cột `coins` | Client **chỉ có quyền đọc** các bảng (chính sách RLS). Mọi thay đổi phải đi qua **hàm server (RPC)**. |
| Đổi giờ máy | Chỉnh đồng hồ Windows nhanh lên 8 tiếng | Server dùng giờ của chính nó (`now()`) để kiểm tra cây chín. Client chỉ dùng giờ để vẽ thanh tiến độ. |
| Gọi API liên tục (bot, macro) | Script gọi thu hoạch 1.000 lần/giây | **Giới hạn tần suất (rate limit)**: khoảng 5 lệnh/giây và 300 lệnh/phút mỗi người, chỉnh được trong cấu hình |
| **Tiêu tiền hai lần (race condition)** | Gửi 2 lệnh mua đất cùng lúc khi chỉ đủ tiền cho 1 ô | Mỗi hàm chạy trong **giao dịch (transaction)** và **khóa dòng (row lock)** dữ liệu người chơi trước khi kiểm tra tiền |
| Mua đất sai quy tắc | Gọi API mua ô không kề bên, ô của người khác | Server kiểm tra đủ 5 điều kiện ở mục 6.5. Thêm **ràng buộc duy nhất (unique constraint)** trên tọa độ. |
| Chiếm đất (land grab) | Người giàu mua hết đất trống | Giới hạn theo cấp nhà, giá tăng theo cấp số nhân, vùng ưu tiên |
| Lỗ hổng công thức | Có chuỗi chế biến tạo ra nhiều giá trị hơn mức hợp lý, lặp mãi để kiếm tiền | Thức ăn không bán được. Không có công thức nào tạo vòng lặp. Giá theo công thức chung. Theo dõi người kiếm tiền nhanh bất thường. |
| **Tài khoản phụ (multi-account / alt)** [quan trọng khi có chợ] | Tạo 10 tài khoản, "bán" hết đồ cho tài khoản chính | Đăng nhập bằng Google; **captcha** khi đăng ký (Supabase hỗ trợ hCaptcha và Cloudflare Turnstile miễn phí); chỉ cho giao dịch từ cấp 8 và tài khoản đã tạo 3 ngày; **khoảng giá** 0,8–2 lần; giới hạn số xu nhận mỗi ngày |
| Thông đồng đấu giá | Hai tài khoản đẩy giá lên cho nhau | Giữ tiền đặt cọc thật, phí 10%, ghi lịch sử trả giá, phát hiện cặp tài khoản bất thường |
| Phá kênh realtime | Gửi tin giả vào kênh chung | Chỉ server được gửi tin. Client chỉ được nghe, có phân quyền (Realtime Authorization). Tin chỉ là "chuông báo", client nhận xong sẽ đọc lại dữ liệu thật. |
| Tên xấu, phản cảm | Đặt tên tục tĩu | Lọc từ cấm, giới hạn 3–16 ký tự, có nút báo cáo, admin đổi được tên |

### 9.3 Công cụ phát hiện và xử lý

- **Sổ cái xu (coin ledger):** mỗi lần cộng hoặc trừ xu đều ghi lại: ai, bao nhiêu, vì sao, giao dịch với ai, số dư sau đó. Có sổ cái thì phát hiện được bất thường và khôi phục được khi có lỗi.
- **View kiểm tra (audit views):**
  - Top người kiếm nhiều xu nhất mỗi giờ.
  - Những cặp tài khoản giao dịch với nhau nhiều bất thường.
  - Tổng lượng xu trong game.
- **Cờ quản trị (admin flags):** có cột `is_admin` và `banned_at`. Tài khoản bị cấm thì mọi lệnh RPC bị từ chối.
- **Thiết kế giúp giảm động cơ gian lận:** game không có tiền thật, không có giải thưởng, chơi với bạn bè. Vì vậy không cần chống gian lận quá nặng, chỉ cần chặn các cách gian lận dễ.

---

## 10. Phong cách hình ảnh, âm thanh, danh sách asset

### 10.1 Phong cách hình ảnh (Art direction)

- **Low-poly + đổ bóng phẳng (flat shading):** ít đa giác, mỗi mặt một màu, **không dùng texture** (ảnh dán bề mặt). Lợi ích: nhẹ, đẹp, dễ dựng bằng code.
- **Bảng màu pastel ấm:**

| Thành phần | Mã màu | Ghi chú |
|---|---|---|
| Cỏ (grass) | `#8CC56B` | Màu nền chính |
| Đất luống (soil) | `#9C6B44` | Luống đã cày |
| Đất trống chưa có chủ | `#B9D99A` | Cỏ nhạt + biển "Bán đất" |
| Lối đi (path) | `#E3CFA0` | |
| Nước (water) | `#6EC6E6` | Hồ |
| Gỗ (wood) | `#A9744F` | Hàng rào, chuồng |
| Mái nhà (roof) | `#E06D5A` | |
| Bầu trời (sky) | `#BFE6FF` → `#FFF3D6` | Chuyển màu từ trên xuống |
| UI chính (primary) | `#4E9F3D` | Nút bấm |
| UI nhấn (accent) | `#F2B33D` | Xu, điểm nhấn |
| Chữ (text) | `#3B2F2A` | Nâu đậm, dịu mắt hơn màu đen |

- **Ánh sáng:**
  - Một nguồn sáng bầu trời (hemisphere light) và một nguồn sáng mặt trời (directional light).
  - Trên điện thoại **không đổ bóng thời gian thực (real-time shadow)**. Thay vào đó dùng **bóng giả (blob shadow)**: một hình tròn tối mờ dưới chân vật.
- **Camera:**
  - Nhìn chéo từ trên xuống, góc 50–60°.
  - Kéo để di chuyển, chụm hai ngón (pinch) để zoom, giới hạn không cho ra ngoài bản đồ.
  - Chạm hai lần (double-tap) để bay về nhà.
- **Chuyển động nhỏ tạo cảm giác sống động (juice):**
  - Cây "nảy" khi đổi giai đoạn.
  - Hạt nhỏ bay ra khi thu hoạch.
  - Đồng xu bay lên thanh tiền.
  - Con vật đi lòng vòng trong chuồng.
  - Có bong bóng biểu tượng trên đầu con vật khi có sản phẩm.
- **Giao diện (UI):** làm bằng HTML/CSS phủ lên cảnh 3D, **không** vẽ UI trong 3D.
  - Thanh trên: xu, cấp, thanh XP, tên.
  - Thanh công cụ dưới: Gieo, Thu hoạch, Cửa hàng, Kho, Nhiệm vụ, Bản đồ.
  - Các bảng (panel) bật lên khi bấm.
  - Nút trên điện thoại cao ít nhất 44px để dễ chạm.
- **Font chữ:** **Be Vietnam Pro** (Google Fonts, miễn phí, hỗ trợ tiếng Việt rất tốt).

### 10.2 Âm thanh (Audio)

| Loại | Danh sách |
|---|---|
| Hiệu ứng (SFX) | Bấm nút, gieo hạt ("bụp"), thu hoạch ("pop"), xu rơi ("ting"), lên cấp (fanfare ngắn), mua đất, gà kêu, bò kêu, xưởng chạy, thông báo đơn hàng, lỗi (âm nhẹ) |
| Nhạc nền (music) | 1–2 bản nhạc êm, lặp lại được (loop), dài khoảng 1–2 phút |
| Âm thanh môi trường (ambient) | Chim hót, gió nhẹ, [Sau MVP] tiếng mưa |
| Cài đặt | Thanh âm lượng riêng cho nhạc và hiệu ứng, có nút tắt tiếng. Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên (autoplay policy), nên âm thanh bật khi người chơi chạm lần đầu. |

### 10.3 Danh sách asset cần có

**Nguồn asset miễn phí:**

| Nguồn | Trang web | Giấy phép thường gặp |
|---|---|---|
| Kenney | kenney.nl | **CC0** (dùng tự do, không bắt buộc ghi công) |
| Quaternius | quaternius.com | **CC0** |
| Poly Pizza | poly.pizza | CC0 hoặc CC-BY (phải ghi công), kiểm tra từng model |
| OpenGameArt | opengameart.org | Nhiều loại giấy phép, **luôn kiểm tra** |
| Google Fonts | fonts.google.com | OFL (dùng tự do) |

**Quy tắc:** ưu tiên CC0. Mọi asset đều ghi vào file `CREDITS.md`: tên, tác giả, link, giấy phép. Model 3D đặt ở thư mục `public/` để Vercel phục vụ, **không** để trên Supabase Storage (tiết kiệm băng thông của Supabase).

| Nhóm | Asset | Cách làm | Phạm vi |
|---|---|---|---|
| Địa hình | Mặt cỏ, luống đất, lối đi, viền ô đất | Dựng bằng code (mặt phẳng, hộp) | MVP |
| Địa hình | Hồ nước, rừng và núi bao quanh | Code + cây/đá từ Kenney Nature Kit hoặc Quaternius | MVP |
| Cây trồng | 10 cây × 4 giai đoạn | **Dựng bằng code** từ hình nón, cầu, trụ. Mỗi cây đổi màu và tỉ lệ. | MVP |
| Công trình | Nhà 5 cấp, kho | Asset miễn phí hoặc ghép khối bằng code. Mỗi cấp thêm chi tiết. | MVP |
| Công trình | Chuồng gà, chuồng bò, máy xay, cối xay, lò bánh, xưởng sữa | Asset miễn phí hoặc ghép khối | MVP |
| Công trình | Hàng rào, biển "Bán đất", biển tên | Code | MVP |
| Con vật | Gà, bò (có hoạt ảnh đứng yên và đi) | Gói động vật low-poly của Quaternius (kiểm tra giấy phép) | MVP |
| Con vật | Heo, cừu, ong | Như trên | Sau MVP |
| Quảng trường | Cửa hàng, bảng đơn hàng, bảng xếp hạng, đài phun nước | Asset miễn phí + code | MVP |
| Quảng trường | Chợ, nhà đấu giá | Như trên | Sau MVP |
| Giao diện | Biểu tượng xu, XP, 10 nông sản, sản phẩm, công cụ | Kenney UI Pack + biểu tượng tự vẽ hoặc emoji tạm thời | MVP |
| Âm thanh | SFX ở mục 10.2 | Kenney Interface Sounds / Impact Sounds (CC0) | MVP |
| Âm thanh | Nhạc nền | Nhạc CC0 trên OpenGameArt | MVP |
| Hiệu ứng | Hạt bay, lấp lánh, mưa | Code (particles đơn giản) | MVP (mưa thì sau) |

---

## 11. Phạm vi MVP

**MVP (Minimum Viable Product, sản phẩm khả dụng tối thiểu)** là bản nhỏ nhất mà bạn bè chơi được và thấy vui. Xong MVP mới làm tiếp các phần còn lại.

### 11.1 BẮT BUỘC có ở MVP

| Nhóm | Tính năng |
|---|---|
| Tài khoản | Đăng nhập bằng Google (và email nếu cấu hình SMTP), đặt tên và tên nông trại, tự xếp vị trí nhà |
| Trồng trọt | 10 cây, gieo, thu hoạch, 4 giai đoạn lớn, cây lớn cả khi tắt máy |
| Chăn nuôi | Gà, bò, chuồng (3 cấp), cho ăn, thu sản phẩm |
| Chế biến | Máy xay thức ăn, cối xay, lò bánh, xưởng sữa. Hàng đợi sản xuất. |
| Kinh tế | Xu, XP, cấp độ (tối đa 30), cửa hàng làng (bán vật phẩm; hạt giống trả tiền ngay khi gieo), kho có giới hạn |
| Đất đai | Bản đồ 32×32, mua đất kề bên, vùng ưu tiên, giới hạn theo cấp nhà |
| Nâng cấp | Nhà, kho, công cụ, độ phì nhiêu, chuồng, xưởng |
| Giữ chân | Nhiệm vụ hướng dẫn, 3 nhiệm vụ mỗi ngày, bảng đơn hàng, thưởng đăng nhập, thành tựu cơ bản |
| Xã hội | Xem đất người khác, thăm nông trại, bảng xếp hạng 3 thẻ, cập nhật trực tiếp (realtime), danh sách người online |
| Kỹ thuật | Server quyết định mọi thứ (RPC + RLS), giới hạn tần suất, sổ cái xu, chạy mượt trên điện thoại tầm trung, đã deploy lên Vercel |
| Âm thanh và hình ảnh | Low-poly, SFX cơ bản, 1 bản nhạc nền, font tiếng Việt |

### 11.2 Nên có nếu kịp (MVP+)

- Hoạt ảnh và hiệu ứng đẹp hơn (hạt bay, xu bay).
- Bản đồ thu nhỏ ở góc màn hình (minimap).
- Mã mời bạn bè để được xếp nhà ở gần nhau.
- Cài lên màn hình điện thoại như một app (PWA – Progressive Web App).

### 11.3 Để sau (Post-MVP), theo thứ tự ưu tiên

| Thứ tự | Tính năng | Giai đoạn trong ROADMAP |
|---|---|---|
| 1 | **Sạp hàng / chợ giữa người chơi** | GĐ7 |
| 2 | **Nhà đấu giá** (phiên của hệ thống và của người chơi), đất phù sa | GĐ7 |
| 3 | Heo, cừu, ong. Xưởng dệt, máy ép, nhà làm mứt. | GĐ8 |
| 4 | Sự kiện theo mùa (Tết, Trung Thu), cuối tuần bội thu | GĐ8 |
| 5 | Thời tiết, ngày và đêm | GĐ8 |
| 6 | Cây ăn quả lâu năm | GĐ8 |
| 7 | Tưới giúp, tặng quà, hợp tác xã | GĐ8 |
| 8 | Trang trí nông trại, câu cá, thú cưng | GĐ8 |
| 9 | Giao diện tiếng Anh (i18n), thông báo đẩy (push notification) | GĐ8 |
| – | Chat | Chỉ làm khi có giải pháp kiểm duyệt |

---

## Phụ lục: Bảng thuật ngữ (Glossary)

| Tiếng Việt | Tiếng Anh | Giải thích ngắn |
|---|---|---|
| Kịch bản game | Game Design Document (GDD) | Tài liệu mô tả game chơi như thế nào |
| Vòng lặp cốt lõi | Core loop | Chuỗi hành động người chơi lặp lại nhiều nhất |
| Sản phẩm khả dụng tối thiểu | Minimum Viable Product (MVP) | Bản nhỏ nhất có thể đưa cho người dùng |
| Trụ cột thiết kế | Design pillars | Vài nguyên tắc lớn, dùng để quyết định thêm hay bỏ tính năng |
| Luống / ô đất / góc phần tư | Plot / parcel / quadrant | Các đơn vị đất trong game |
| Vùng | Chunk | Một mảng bản đồ, dùng để vẽ và gửi realtime theo từng phần |
| Nguồn tiền / chỗ rút tiền | Faucet / sink | Nơi tiền sinh ra và nơi tiền mất đi |
| Lạm phát | Inflation | Tiền nhiều lên nên mất giá trị |
| Tăng theo cấp số nhân | Exponential growth | Mỗi bước nhân lên một hệ số, ví dụ × 1,5 |
| Giữ tiền đặt cọc | Escrow | Server tạm giữ tiền cho tới khi giao dịch xong |
| Chống bắn tỉa | Anti-sniping | Gia hạn phiên đấu giá khi có người trả giá phút chót |
| Chốt phiên | Settlement | Kết thúc phiên đấu giá, giao hàng và giao tiền |
| Nguồn sự thật duy nhất | Single source of truth | Chỉ một nơi (server) quyết định dữ liệu đúng |
| Ý định | Intent | Yêu cầu từ client như "tôi muốn làm X" |
| Giới hạn tần suất | Rate limit | Số lần gọi tối đa trong một khoảng thời gian |
| Tranh chấp dữ liệu | Race condition | Hai thao tác cùng lúc làm sai dữ liệu |
| Khóa dòng | Row lock | Khóa một dòng dữ liệu khi đang sửa |
| Sổ cái | Ledger | Bảng ghi lại mọi giao dịch |
| Tài khoản phụ | Alt account | Tài khoản thứ hai của cùng một người |
| Đổ bóng phẳng | Flat shading | Mỗi mặt đa giác một màu, nhìn "góc cạnh" |
| Hiệu ứng sống động | Juice | Chuyển động nhỏ giúp game "sướng tay" |
| Giấy phép CC0 | CC0 license | Tác giả từ bỏ bản quyền, ai cũng dùng tự do |
| Trải nghiệm lần đầu | First-time user experience (FTUE) | Vài phút đầu tiên của người chơi mới |
| Chơi thử | Playtest | Cho người thật chơi để tìm lỗi và chỉnh cân bằng |
