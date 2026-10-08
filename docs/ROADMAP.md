# KỊCH BẢN LÀM (Development Roadmap)

> **Dự án:** Làng Ô Vuông (Patchwork Valley), web game nông trại 3D nhiều người chơi
> **Tài liệu đi kèm:** [GDD.md](GDD.md) (kịch bản game). Mọi số liệu game nằm ở GDD. Tài liệu này chỉ nói **cách làm**.
> **Người làm:** 1 sinh viên, 1–2 giờ mỗi ngày, có AI hỗ trợ viết code.

---

## Mục lục
0. [Góp ý về stack](#0-góp-ý-về-stack-công-nghệ)
1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể-architecture)
2. [Thiết kế database Supabase](#2-thiết-kế-database-supabase)
3. [Cấu trúc thư mục dự án](#3-cấu-trúc-thư-mục-dự-án)
4. [Cách vẽ bản đồ rộng mà vẫn mượt](#4-cách-vẽ-bản-đồ-rộng-mà-vẫn-mượt)
5. [Lộ trình theo giai đoạn (kèm prompt mẫu)](#5-lộ-trình-theo-giai-đoạn)
6. [Cách viết prompt cho AI](#6-cách-viết-prompt-cho-ai)
7. [Quy trình làm việc với AI](#7-quy-trình-làm-việc-với-ai)
8. [Rủi ro thường gặp và cách xử lý](#8-rủi-ro-thường-gặp-và-cách-xử-lý)
- [Bước tiếp theo](#bước-tiếp-theo-bắt-đầu-giai-đoạn-0)

---

## 0. Góp ý về stack (công nghệ)

Stack bạn chọn **hợp lý**, nên giữ nguyên. Tôi chỉ đề xuất thêm vài thư viện nhỏ và vài cách dùng cụ thể:

| Thành phần | Vai trò | Nhận xét |
|---|---|---|
| **React + Vite + TypeScript** | Khung giao diện, công cụ build, ngôn ngữ | Giữ nguyên. TypeScript giúp AI viết code ít lỗi hơn vì có kiểu dữ liệu. |
| **Three.js + React Three Fiber (R3F)** | Vẽ 3D | Giữ nguyên. Bạn đã quen Three.js. R3F cho phép viết cảnh 3D như component React. |
| **+ Drei** | Bộ tiện ích cho R3F: điều khiển camera, Instances, PerformanceMonitor… | Thêm vào. Bớt được rất nhiều code tự viết. |
| **+ Zustand** | Quản lý trạng thái (state management) | Thêm vào. Nhẹ, dễ học, cùng nhóm tác giả với R3F, dùng được cả trong UI lẫn cảnh 3D. |
| **+ Tailwind CSS** | Viết giao diện nhanh | Thêm vào. AI viết Tailwind rất tốt. Không bắt buộc. |
| **+ Vitest** | Kiểm thử tự động (unit test) | Thêm vào. Dùng để test các hàm tính toán (tọa độ, giá đất) và test chống gian lận. |
| **Supabase** (Auth, Postgres, Realtime) | Backend | Giữ nguyên. Xem cách dùng ở dưới. |
| **+ Supabase CLI** (cài qua npm) | Quản lý thay đổi database bằng file (migration) | Thêm vào. **Không cần Docker**: ta làm việc thẳng với project trên cloud. |
| **+ Supabase Cron** | Chạy việc định kỳ trong database | Dùng cho dọn dữ liệu cũ (MVP) và chốt đấu giá (sau MVP) |
| Supabase Edge Functions | Code server viết bằng TypeScript | **Chưa cần ở MVP.** Mọi thao tác nhạy cảm viết bằng **hàm Postgres (RPC)**: nhanh hơn, không bị khởi động chậm (cold start), ít thứ phải học hơn. |
| **Vercel** | Đưa web lên mạng (hosting) | Giữ nguyên. Mỗi lần push lên GitHub là Vercel tự deploy. |
| **Kenney, Quaternius** | Asset 3D miễn phí | Giữ nguyên. Ưu tiên giấy phép CC0. |

**Hai quyết định kỹ thuật quan trọng (giải thích kỹ ở mục 1 và 2):**

1. **Server quyết định mọi thứ (server-authoritative).** Client không được ghi thẳng vào bảng. Mọi thay đổi đi qua hàm Postgres. Đây là nền tảng chống gian lận.
2. **Realtime dùng Broadcast theo vùng (chunk), gửi từ hàm Postgres.** Không dùng cách "theo dõi mọi thay đổi của bảng" (Postgres Changes). Lý do: cách đó tốn hạn mức tin nhắn gấp hàng chục lần (có tính toán ở mục 8.2).

**Về phiên bản thư viện:** khi cài, dùng bản ổn định mới nhất. Sau đó **giữ nguyên** phiên bản trong `package.json` và ghi phiên bản các thư viện chính (React, R3F, Drei, Three, Supabase JS) vào `AGENTS.md`. Như vậy AI sẽ biết bạn đang dùng bản nào. R3F và React phải hợp phiên bản với nhau (ví dụ R3F 9 đi với React 19).

---

## 1. Kiến trúc tổng thể (Architecture)

### 1.1 Sơ đồ thành phần

```
┌──────────────────────── TRÌNH DUYỆT (Client) ────────────────────────┐
│                                                                       │
│   UI HTML (React + Tailwind)          Cảnh 3D (R3F + Drei)            │
│   thanh xu, bảng cửa hàng, nhiệm vụ   đất, cây, chuồng, con vật       │
│              │      ▲                        │      ▲                 │
│              ▼      │                        ▼      │                 │
│        ┌─────────────────── Zustand stores ───────────────────┐       │
│        │ authStore │ playerStore │ worldStore │ uiStore       │       │
│        └──────────────────────────┬───────────────────────────┘       │
│                                   │                                   │
│        services/: api.ts (gọi RPC) · queries.ts (đọc) ·               │
│                   realtime.ts (nghe) · serverTime.ts (giờ server)     │
└───────────────────┬──────────────────────────────▲────────────────────┘
                    │ HTTPS (supabase-js)          │ WebSocket
                    │ đọc bảng + gọi RPC           │ Broadcast + Presence
┌───────────────────▼──────────────────────────────┴────────────────────┐
│                          SUPABASE (Server)                            │
│  ┌──────────┐  ┌────────────────────────────────────┐  ┌──────────┐   │
│  │  Auth    │  │ PostgreSQL                         │  │ Realtime │   │
│  │ (Google, │  │  • Bảng cấu hình (cây, con vật...) │  │ (kênh    │   │
│  │  email)  │  │  • Bảng trạng thái (đất, kho...)   │──▶ chunk,   │   │
│  └──────────┘  │  • RLS: client CHỈ ĐỌC             │  │ presence)│   │
│                │  • Hàm RPC: mọi thao tác GHI       │  └──────────┘   │
│                │  • Cron: việc định kỳ              │                 │
│                └────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────── VERCEL (Hosting) ────────────────────────────┐
│  File tĩnh: index.html, JS, CSS, model 3D (.glb), âm thanh            │
│  Tự build mỗi khi push lên GitHub (nhánh main → Production,           │
│  nhánh khác → Preview)                                                 │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 Cái gì chạy ở client, cái gì bắt buộc ở server

| Việc | Client (trình duyệt) | Server (Supabase) |
|---|---|---|
| Vẽ 3D, hoạt ảnh, âm thanh | ✔ | |
| Tính giai đoạn cây để **vẽ** | ✔ (từ `planted_at`, `ready_at` và giờ server) | |
| Kiểm tra cây chín khi **thu hoạch** | Chỉ để làm mờ nút | ✔ **bắt buộc** |
| Giá đất, chi phí nâng cấp | Tính để **hiển thị** | ✔ **bắt buộc** (giá thật, trừ tiền thật) |
| Cộng/trừ xu, vật phẩm, XP, lên cấp | | ✔ **bắt buộc** |
| Quy tắc mua đất (kề bên, vùng ưu tiên…) | Tô màu gợi ý | ✔ **bắt buộc** |
| Tạo nhiệm vụ ngày, đơn hàng | | ✔ |
| Chốt phiên đấu giá | | ✔ (Cron + chốt khi có người mở xem) |
| Đăng nhập | Gọi Supabase Auth | ✔ Supabase Auth |

**Quy tắc nhớ nhanh:** cái gì liên quan đến **tiền, đồ, thời gian, quyền sở hữu** thì **server quyết định**. Client chỉ "đề nghị" và "hiển thị".

### 1.3 Luồng dữ liệu (Data flows)

**A. Khởi động game (boot)**
1. Mở web, kiểm tra phiên đăng nhập (session). Chưa đăng nhập thì hiện màn hình đăng nhập.
2. Đăng nhập rồi mà chưa có hồ sơ (`profiles`) thì hiện màn hình "Tạo nông trại", gọi RPC `start_game`.
3. Tải song song:
   - Dữ liệu cấu hình: cây, con vật, công thức, mức nâng cấp. Cache vào localStorage theo `config_version`.
   - Hồ sơ người chơi và kho.
   - Bản đồ: các ô đất, luống, công trình, con vật.
4. Gọi `server_now()` để tính độ lệch giờ giữa máy và server.
5. Vẽ cảnh. Bắt đầu nghe realtime theo các chunk đang nhìn. Vào kênh "đang online" (Presence).
6. Hiện thưởng đăng nhập nếu hôm nay chưa nhận.

**B. Một thao tác, ví dụ gieo ngô**
```
Người chơi chạm luống
  → input/: điểm chạm → ô đất (x,y) → luống → id luống
  → uiStore: đang cầm "Gieo", hạt "Ngô"
  → api.plant([ids], 'corn')  ── HTTPS ──▶  public.plant(...) trong Postgres
                                              1. kiểm tra đăng nhập, bị cấm, tần suất
                                              2. khóa dòng profile (FOR UPDATE)
                                              3. kiểm tra: của mình? trống? đủ cấp? đủ tiền?
                                              4. trừ tiền, ghi planted_at/ready_at
                                              5. ghi sổ cái, cập nhật nhiệm vụ
                                              6. realtime.send → kênh 'chunk:cx:cy'
  ◀── JSON: luống đã cập nhật + số xu mới ───┘
  → playerStore/worldStore cập nhật → cảnh 3D vẽ lại
```
Lúc đầu, **chờ server trả lời rồi mới đổi hình** (thường mất 100–300 ms). Cách này đơn giản và luôn đúng. Ở GĐ6, nếu muốn mượt hơn, có thể thêm **cập nhật lạc quan (optimistic update)**: đổi hình ngay, nếu server báo lỗi thì trả lại như cũ.

**C. Realtime: người khác thấy thay đổi**
1. Hàm RPC gửi tin `{ parcel_id }` vào kênh `chunk:<cx>:<cy>` (dùng `realtime.send`, kênh riêng tư – private).
2. Những client **đang nhìn chunk đó** nhận được tin, rồi **đọc lại dữ liệu ô đất đó** từ database.
3. Tin realtime chỉ là **"chuông báo"**, không chứa dữ liệu game. Vì vậy dù ai đó giả mạo tin thì cũng chỉ khiến client đọc lại dữ liệu thật. Không có gì bị phá.

**D. Đồng bộ giờ (time sync)**
- Lúc khởi động và cứ 5 phút một lần, client gọi `server_now()`.
- Độ lệch = giờ server − (thời điểm gửi + thời điểm nhận) ÷ 2.
- Mọi đồng hồ đếm ngược trên màn hình dùng **giờ máy + độ lệch**. Người chơi chỉnh giờ máy thì chỉ làm sai hình hiển thị của chính họ, không ảnh hưởng tới kết quả thật.

**E. Chốt phiên đấu giá [Sau MVP]**
- Supabase Cron gọi `settle_ended_auctions()` mỗi phút.
- Khi ai đó mở một phiên đã hết giờ mà chưa chốt, server chốt luôn. Đây là **lưới an toàn** cho lúc Cron không chạy, ví dụ project bị tạm dừng.
- Mỗi phiên chỉ chốt **một lần**: khóa dòng phiên, kiểm tra `status = 'active'`, rồi đổi thành `'settled'` trong cùng một giao dịch (transaction).

### 1.4 Quản lý trạng thái ở client (Zustand)

| Store | Chứa gì | Ai dùng |
|---|---|---|
| `authStore` | Phiên đăng nhập, user id | Màn hình đăng nhập, services |
| `playerStore` | Hồ sơ (xu, XP, cấp, cấp nhà/kho/công cụ), kho, nhiệm vụ, đơn hàng | UI (thanh trên, các bảng) |
| `worldStore` | Ô đất, luống, công trình, con vật, **chia theo chunk** | Cảnh 3D, bảng thông tin ô đất |
| `uiStore` | Công cụ đang chọn, hạt đang chọn, bảng nào đang mở, ô đang chọn | Cả UI lẫn cảnh 3D |
| `configStore` | Dữ liệu cấu hình (cây, con vật, công thức…) | Mọi nơi |

**Nguyên tắc:** store chỉ là **bản sao tạm (cache)** của dữ liệu server. Sau mỗi RPC, cập nhật store bằng kết quả server trả về. **Không tự cộng trừ tiền trong store.**

---

## 2. Thiết kế database Supabase

### 2.1 Khái niệm cần biết trước

| Thuật ngữ | Giải thích đơn giản |
|---|---|
| **Bảng (table), dòng (row), cột (column)** | Giống một sheet Excel: mỗi dòng là một bản ghi, mỗi cột là một thuộc tính |
| **Khóa chính (primary key – PK)** | Cột định danh duy nhất của mỗi dòng, ví dụ `id` |
| **Khóa ngoại (foreign key – FK)** | Cột trỏ tới khóa chính của bảng khác, ví dụ `plots.parcel_id` → `parcels.id` |
| **Ràng buộc (constraint)** | Luật database tự kiểm tra, ví dụ `coins >= 0`, tọa độ không trùng |
| **RLS (Row Level Security)** | Luật "ai được đọc/ghi dòng nào", kiểm tra cho **từng dòng** |
| **Hàm RPC (Remote Procedure Call)** | Hàm viết bằng SQL nằm trong database. Client gọi nó như gọi API. |
| **SECURITY DEFINER** | Hàm chạy bằng quyền của người tạo hàm, nên vẫn ghi được vào bảng dù client không có quyền ghi |
| **Giao dịch (transaction)** | Một nhóm thao tác "hoặc làm hết, hoặc không làm gì". Mỗi lần gọi RPC là một transaction. |
| **Khóa dòng (`FOR UPDATE`)** | Giữ một dòng lại, ai muốn sửa dòng đó phải chờ. Chống tiêu tiền hai lần. |
| **Migration** | Một file SQL mô tả **một lần thay đổi** database. Lưu trong Git, chạy theo thứ tự thời gian. |
| **`timestamptz`** | Kiểu thời gian có múi giờ. Luôn lưu theo UTC, hiển thị theo giờ Việt Nam. |
| **`jsonb`** | Kiểu dữ liệu JSON lưu trong một cột |

### 2.2 Sơ đồ quan hệ (Entity relationship)

```
auth.users (Supabase quản lý)
   │ 1–1
   ▼
profiles ──1–n──▶ inventory ◀──n–1── items ──1–1──▶ crops
   │  │                               ▲  ▲
   │  ├──1–n──▶ coin_ledger            │  └──── animal_types (feed_item, product_item)
   │  ├──1–1──▶ player_stats           │
   │  ├──1–n──▶ player_quests ──n–1──▶ quest_templates
   │  ├──1–n──▶ orders                 │
   │  └──1–n──▶ player_achievements ──n–1──▶ achievements
   │                                   │
   │ owner                             │
   ▼                                   │
parcels ──1–n──▶ plots ──n–1──(crop_item_id)
   │
   └──1–n──▶ structures ──n–1──▶ structure_types ──1–n──▶ recipes ──1–n──▶ recipe_inputs
                 │
                 ├──1–n──▶ animals ──n–1──▶ animal_types
                 └──1–n──▶ production_jobs ──n–1──▶ recipes

[Sau MVP]  market_listings, auctions ──1–n──▶ auction_bids, events
```

### 2.3 Bảng cấu hình (config tables): dữ liệu game, ít khi đổi

Các bảng này chứa **số liệu trong GDD**. Muốn chỉnh cân bằng thì sửa dữ liệu bằng một migration mới, không phải sửa code.

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `game_config` | `key` (PK), `value` (jsonb), `description` | Các hằng số: `starting_coins`=150, `land_base_price`=500, `land_growth`=1.5, `xp_factor`=40, `max_level`=30, `rate_limit_per_sec`=5, `rate_limit_per_min`=300, `order_refresh_minutes`=15, `login_rewards`=[50,80,120,160,220,300,500], `config_version`… Sau MVP thêm: `market_tax`=0.1, `market_price_min`=0.8, `market_price_max`=2.0, `auction_fee`=0.1, `anti_snipe_seconds`=120, `trade_min_level`=8, `trade_min_account_days`=3 |
| `items` | `id` (text, PK, ví dụ `corn`, `egg`), `name_vi`, `name_en`, `category`, `base_price`, `sellable`, `unlock_level`, `sort_order` | Mọi vật phẩm. `category` thuộc: crop, feed, animal_product, processed, rare |
| `crops` | `item_id` (PK, FK → items), `seed_price`, `grow_seconds`, `xp` | 10 cây ở GDD mục 3.2 |
| `animal_types` | `id` (`chicken`, `cow`), `name_vi`, `unlock_level`, `pen_type_id` (FK → structure_types), `price`, `feed_item_id` (FK), `product_item_id` (FK), `cycle_seconds`, `xp` | GDD mục 3.3 |
| `structure_types` | `id` (`home`, `chicken_pen`, `cow_pen`, `feed_mill`, `mill`, `bakery`, `dairy`), `name_vi`, `kind` (home/pen/processor/stall), `build_price`, `unlock_level`, `max_per_player`, `max_level` | Công trình |
| `recipes` | `id`, `structure_type_id` (FK), `output_item_id` (FK), `output_qty`, `seconds`, `unlock_level`, `xp` | GDD mục 3.4 |
| `recipe_inputs` | `recipe_id` (FK), `item_id` (FK), `qty`; PK là (`recipe_id`, `item_id`) | Tách bảng riêng để có khóa ngoại đúng chuẩn |
| `upgrade_levels` | `kind`, `level`, `cost`, `required_player_level`, `value`; PK là (`kind`, `level`) | `kind` là `house`, `barn`, `tool`, `fertility` hoặc id của một loại công trình. `value` là hiệu quả của cấp đó (số ô tối đa, sức chứa, % nhanh hơn…) |
| `quest_templates` | `id`, `type`, `difficulty`, `min_level`, `target_base`, `target_per_level`, `name_vi` | Mẫu nhiệm vụ ngày |
| `tutorial_steps` | `step` (PK), `type`, `target`, `reward_coins`, `reward_xp`, `text_vi` | 10 bước hướng dẫn |
| `achievements` | `id`, `name_vi`, `stat_key`, `bronze`, `silver`, `gold`, `reward_coins` | GDD mục 8.5 |

### 2.4 Bảng trạng thái (state tables): dữ liệu người chơi, đổi liên tục

**`profiles`**: hồ sơ người chơi

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid, PK, FK → `auth.users.id` | Xóa user thì xóa hồ sơ (on delete cascade) |
| `username` | text, duy nhất (unique) | 3–16 ký tự |
| `farm_name` | text | |
| `avatar_color` | text | Màu đại diện trên bản đồ |
| `coins` | bigint, ràng buộc `>= 0` | Database tự chặn số xu âm |
| `xp`, `level` | bigint, smallint | |
| `weekly_xp`, `week_start` | bigint, date | Cho bảng xếp hạng tuần |
| `house_level`, `barn_level`, `tool_level` | smallint, mặc định 1 | |
| `home_parcel_id` | bigint, FK → `parcels.id` | |
| `login_streak`, `last_login_date` | smallint, date | Thưởng đăng nhập |
| `tutorial_step` | smallint | |
| `rl_window_start`, `rl_count` | timestamptz, int | Đếm số lệnh để giới hạn tần suất |
| `is_admin`, `banned_at` | boolean, timestamptz | |
| `created_at`, `last_seen_at` | timestamptz | |

**`player_stats`**: bộ đếm cho thành tựu
`user_id` (PK), `harvested_total`, `crop_types_planted` (mảng text), `animal_products_total`, `produced_total`, `orders_total`, `visits_total`.

**`parcels`**: 1.024 ô đất, **tạo sẵn toàn bộ** bằng một migration

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | bigint, PK | |
| `x`, `y` | smallint, **duy nhất theo cặp (x, y)** | 0–31 |
| `chunk_x`, `chunk_y` | smallint, cột sinh tự động (generated) = x / 8, y / 8, có chỉ mục (index) | Để đọc theo vùng |
| `zone` | text: normal, town, lake, forest, alluvial | |
| `is_home_slot` | boolean | 60 vị trí nhà |
| `priority_slot_id` | bigint, FK → `parcels.id` | Ô này thuộc vùng ưu tiên của vị trí nhà nào |
| `owner_id` | uuid, FK → `profiles.id`, có thể rỗng (null) | null = chưa có chủ |
| `fertility_level` | smallint, mặc định 1 | |
| `purchased_at`, `updated_at` | timestamptz | |

**`plots`**: luống trồng. Chỉ tạo khi ô đất có chủ, nên tối đa khoảng 16.000 dòng.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | bigint, PK | |
| `parcel_id` | FK → `parcels.id` | |
| `owner_id` | uuid | Lặp lại thông tin chủ đất để lọc nhanh |
| `lx`, `ly` | smallint 0–3, duy nhất theo (`parcel_id`, `lx`, `ly`) | Vị trí trong ô đất |
| `crop_item_id` | text, FK → `crops`, có thể null | null = luống trống |
| `planted_at`, `ready_at` | timestamptz | **Mốc thời gian do server ghi** |

Ràng buộc: hoặc cả ba cột `crop_item_id`, `planted_at`, `ready_at` cùng rỗng, hoặc cả ba cùng có giá trị.

**`structures`**: công trình
`id`, `parcel_id` (FK), `quadrant` (0–3, duy nhất theo (`parcel_id`, `quadrant`)), `owner_id`, `type_id` (FK → `structure_types`), `level`, `created_at`.

**`animals`**: con vật
`id`, `structure_id` (FK, on delete cascade), `owner_id`, `animal_type_id` (FK), `fed_at`, `ready_at`, `created_at`.
Trạng thái của con vật:
- **Đói**: `fed_at` rỗng.
- **Đang làm sản phẩm**: giờ server < `ready_at`.
- **Có sản phẩm**: giờ server ≥ `ready_at`.

**`production_jobs`**: hàng đợi xưởng
`id`, `structure_id` (FK), `owner_id`, `recipe_id` (FK), `start_at`, `ready_at`, `collected_at` (null = chưa thu).

**`inventory`**: kho
`user_id` (FK), `item_id` (FK), `qty` (ràng buộc `>= 0`). PK là (`user_id`, `item_id`).

**`coin_ledger`**: sổ cái xu, giữ 30 ngày

| Cột | Ghi chú |
|---|---|
| `id`, `user_id`, `created_at` | Có chỉ mục (`user_id`, `created_at`) |
| `delta` | Số xu cộng (+) hoặc trừ (−) |
| `balance_after` | Số dư sau giao dịch |
| `reason` | seed, sell, land, upgrade, build, animal, quest, order, login, achievement. [Sau MVP] market_buy, market_sell, market_tax, auction_bid, auction_refund, auction_win, auction_fee. Thêm admin. |
| `counterpart_id` | Người giao dịch cùng (dùng khi có chợ, đấu giá) |
| `ref` | jsonb: chi tiết, ví dụ `{ parcel_id: 123 }` |

**`player_quests`**: `id`, `user_id`, `template_id`, `quest_date` (ngày theo giờ Việt Nam), `target`, `progress`, `reward_coins`, `reward_xp`, `claimed_at`. Duy nhất theo (`user_id`, `template_id`, `quest_date`).

**`orders`**: `id`, `user_id`, `slot` (0–5), `requirements` (jsonb, ví dụ `[{item_id, qty}]`), `reward_coins`, `reward_xp`, `available_at`, `completed_at`, `skipped_at`.

Ở đây dùng `jsonb` cho yêu cầu của đơn hàng vì đơn hàng là dữ liệu tạm, sinh ngẫu nhiên. Còn công thức chế biến là dữ liệu cấu hình cố định nên dùng bảng riêng `recipe_inputs` có khóa ngoại đúng chuẩn.

**`player_achievements`**: `user_id`, `achievement_id`, `tier` (1–3), `unlocked_at`. PK gồm cả 3 cột đầu.

### 2.5 Bảng sau MVP

| Bảng | Cột chính |
|---|---|
| `market_listings` | `id`, `seller_id`, `item_id`, `qty` (≤ 10), `unit_price`, `status` (active, sold, npc_sold, cancelled, expired), `buyer_id`, `created_at`, `expires_at`, `sold_at` |
| `auctions` | `id`, `kind` (system, player), `seller_id` (null nếu là hệ thống), `item_id`, `qty`, `parcel_id` (đấu giá đất phù sa), `start_price`, `current_bid`, `current_bidder_id`, `ends_at`, `status` (active, settled, cancelled), `settled_at` |
| `auction_bids` | `id`, `auction_id`, `bidder_id`, `amount`, `created_at`, `refunded_at` |
| `events` | `id`, `name_vi`, `starts_at`, `ends_at`, `effect` (jsonb, ví dụ `{ "sell_bonus": { "watermelon": 0.2 } }`) |

### 2.6 View

| View | Nội dung | Ai xem |
|---|---|---|
| `leaderboard_level` | Top 100 theo XP: tên, tên nông trại, cấp | Mọi người |
| `leaderboard_land` | Top 100 theo số ô đất | Mọi người |
| `leaderboard_weekly` | Top 100 theo XP trong tuần (chỉ tính người có `week_start` = tuần này) | Mọi người |
| `admin.money_supply` | Tổng xu đang lưu hành; xu tạo ra và mất đi mỗi ngày (tính từ sổ cái) | Chỉ admin |
| `admin.suspicious_pairs` | Các cặp tài khoản giao dịch với nhau nhiều bất thường [Sau MVP] | Chỉ admin |

**Lưu ý bảo mật:** view trong Postgres mặc định chạy bằng quyền người tạo, nên **bỏ qua RLS**.
- View công khai: chỉ chọn những cột được phép công khai.
- View quản trị: đặt trong schema `admin`. Schema này **không** được mở ra API, nên client không gọi được.

### 2.7 Chính sách bảo mật (RLS)

**Nguyên tắc: bật RLS cho MỌI bảng. Client chỉ có quyền ĐỌC. KHÔNG có chính sách nào cho phép INSERT, UPDATE hay DELETE từ client.**

| Bảng | Ai được đọc (SELECT) | Ghi |
|---|---|---|
| Các bảng cấu hình | Tất cả, kể cả chưa đăng nhập | Chỉ qua migration |
| `profiles` | Mọi người đã đăng nhập (vì là thông tin công khai trong game; email nằm ở `auth.users`, không ở đây) | Chỉ qua RPC |
| `parcels`, `plots`, `structures`, `animals` | Mọi người đã đăng nhập (để xem đất của nhau) | Chỉ qua RPC |
| `inventory`, `production_jobs`, `coin_ledger`, `player_quests`, `orders`, `player_stats`, `player_achievements` | **Chỉ chủ sở hữu** (`user_id = auth.uid()`) | Chỉ qua RPC |
| `market_listings`, `auctions`, `auction_bids` [Sau MVP] | Mọi người đã đăng nhập | Chỉ qua RPC |
| `realtime.messages` | Người đã đăng nhập được nghe các kênh `chunk:*` và `auction:*` | Chỉ server gửi |

**Quy tắc cho hàm:**
- Hàm public (client gọi được) đặt trong schema `public`, có `SECURITY DEFINER` và `set search_path = ''`. Bên trong luôn viết đầy đủ tên bảng, ví dụ `public.profiles`.
- **Thu hồi quyền chạy (revoke execute)** của `anon` và `public`, chỉ cấp cho `authenticated`.
- Hàm nội bộ (helper) đặt trong schema `private`. Schema này không mở ra API, nên client không gọi trực tiếp được.

### 2.8 Hàm server (RPC) cho các thao tác nhạy cảm

**Khung chung cho MỌI hàm RPC.** Hãy dán khung này cho AI mỗi lần nhờ viết hàm:

1. Lấy `uid = auth.uid()`. Nếu rỗng thì báo lỗi `NOT_AUTHENTICATED`.
2. Gọi `private.assert_player(uid)`: kiểm tra có hồ sơ, không bị cấm, chưa vượt giới hạn tần suất.
3. **Khóa dòng hồ sơ:** `select … from public.profiles where id = uid for update`.
4. **Kiểm tra** đầu vào và luật game. Sai thì `raise exception` kèm mã lỗi (xem 2.11).
5. **Thực hiện** thay đổi. Chỉ dùng giờ server `now()`, không bao giờ nhận thời gian từ client.
6. Ghi **sổ cái** nếu có thay đổi xu.
7. Cập nhật nhiệm vụ, bộ đếm, thành tựu.
8. Gửi realtime cho chunk liên quan (`private.notify_parcel`).
9. Trả về JSON chứa dữ liệu mới để client cập nhật store.

**Danh sách hàm cho client gọi (MVP):**

| Hàm | Tham số | Kiểm tra chính | Tác dụng |
|---|---|---|---|
| `start_game` | `p_username`, `p_farm_name` | Chưa có hồ sơ; tên 3–16 ký tự, không trùng, không chứa từ cấm; còn vị trí nhà trống | Tạo hồ sơ với 150 xu và `player_stats`. Chọn vị trí nhà trống gần trung tâm nhất (khóa bằng `for update skip locked` để 2 người không lấy trùng). Giao đất, xây nhà ở Q0, tạo 12 luống, đặt bước hướng dẫn 1. |
| `server_now` | – | – | Trả về `now()` |
| `plant` | `p_plot_ids[]`, `p_crop_id` | Mọi luống là của mình và đang trống; số luống và vị trí hợp với cấp công cụ; cây đã mở khóa; đủ xu cho tất cả | Trừ xu. Ghi `planted_at = now()`, `ready_at = now() + thời gian lớn × (1 − % nhanh hơn của ô đất)`. Ghi sổ cái (1 dòng cho cả lượt gieo). |
| `harvest` | `p_plot_ids[]` | Của mình; có cây; `now() >= ready_at`; hợp với cấp công cụ; kho còn chỗ (thiếu chỗ thì thu phần vừa đủ) | Thêm vào kho, cộng XP (có thể lên cấp), xóa cây khỏi luống, cập nhật bộ đếm và nhiệm vụ |
| `sell` | `p_item_id`, `p_qty` | Vật phẩm bán được; số lượng > 0 và ≤ số trong kho | Trừ kho, cộng `base_price × qty` xu, ghi sổ cái |
| `buy_parcel` | `p_parcel_id` | 5 quy tắc ở GDD mục 6.5; tính giá bằng `private.land_price(n)` | Trừ xu, gán chủ, tạo 16 luống, ghi sổ cái, gửi realtime |
| `upgrade` | `p_kind`, `p_target_id` (ô đất hoặc công trình, có thể null) | Có cấp tiếp theo; đủ cấp người chơi; đủ xu; mục tiêu là của mình | Tăng cấp, trừ xu, ghi sổ cái |
| `build_structure` | `p_parcel_id`, `p_quadrant`, `p_type_id` | Ô đất của mình; góc này không phải Q0 của đất gốc; 4 luống trong góc **đều trống**; chưa có công trình ở đó; đủ cấp; chưa vượt `max_per_player`; đủ xu | Xóa 4 luống, tạo công trình, trừ xu, gửi realtime |
| `buy_animal` | `p_structure_id` | Là chuồng của mình; số con < sức chứa của cấp chuồng; đủ cấp; đủ xu | Thêm 1 con vật, trừ xu |
| `feed_animals` | `p_structure_id` | Chuồng của mình; có thức ăn | Mỗi con đói ăn 1 phần (hết thức ăn thì dừng). Ghi `fed_at`, `ready_at`. |
| `collect_animals` | `p_structure_id` | Chuồng của mình; có con đã xong; kho còn chỗ | Thêm sản phẩm vào kho, cộng XP, đặt lại con vật về trạng thái đói |
| `start_production` | `p_structure_id`, `p_recipe_id` | Xưởng của mình; công thức thuộc xưởng này; đủ cấp; hàng đợi còn chỗ; đủ nguyên liệu | Trừ nguyên liệu. `start_at` = muộn nhất giữa `now()` và `ready_at` của món cuối trong hàng đợi. `ready_at` = `start_at` + thời gian chế biến. |
| `collect_production` | `p_structure_id` | Có món đã xong và chưa thu; kho còn chỗ | Thêm thành phẩm vào kho, ghi `collected_at`, cộng XP |
| `get_orders` | – | – | Ô đơn nào trống và đã đến `available_at` thì sinh đơn mới (theo cấp, chỉ dùng vật phẩm đã mở khóa). Trả về 6 ô. |
| `fulfill_order` | `p_order_id` | Đơn của mình, còn hiệu lực; kho đủ hàng | Trừ hàng, cộng xu và XP, đặt giờ đơn mới = `now()` + 15 phút |
| `skip_order` | `p_order_id` | Đơn của mình | Bỏ qua đơn, đơn mới đến sau 15 phút |
| `get_daily_quests` | – | – | Nếu hôm nay (giờ Việt Nam) chưa có thì tạo 3 nhiệm vụ. Trả về danh sách. |
| `claim_quest` | `p_quest_id` | Của mình; `progress >= target`; chưa nhận | Cộng thưởng. Nhận đủ 3 thì thưởng thêm. |
| `claim_tutorial_step` | – | Điều kiện của bước hiện tại đã đạt (đọc từ `player_stats`, kho…) | Cộng thưởng, chuyển sang bước tiếp |
| `claim_daily_login` | – | `last_login_date` < hôm nay (giờ Việt Nam) | Tính chuỗi ngày liên tiếp, cộng thưởng |
| `record_visit` | `p_target_user` | Không phải chính mình; mỗi người chỉ tính 1 lần mỗi ngày | Cộng bộ đếm số lần thăm (cho nhiệm vụ, thành tựu) |

**Hàm sau MVP:**

| Hàm | Ý chính |
|---|---|
| `create_listing`, `cancel_listing` | Kiểm tra cấp ≥ 8, tài khoản ≥ 3 ngày, giá trong khoảng cho phép, sạp còn ô trống. Khi bày hàng thì **trừ hàng khỏi kho ngay** (giữ hàng giống như giữ tiền đặt cọc). |
| `buy_listing` | **Khóa dòng món hàng** (`for update`), kiểm tra `status = 'active'` và người mua không phải người bán. Trừ xu người mua, cộng 90% cho người bán, ghi sổ cái hai bên (có `counterpart_id`), chuyển hàng vào kho người mua. |
| `create_auction` | Cấp ≥ 10, tối đa 3 phiên đang mở, thu phí mở phiên 2%, giữ hàng |
| `place_bid` | Khóa dòng phiên đấu giá. Kiểm tra còn giờ và mức trả tối thiểu. Trừ xu người trả giá mới, **hoàn ngay** cho người giữ giá cao trước đó. Gia hạn nếu còn dưới 2 phút. Gửi realtime vào `auction:<id>`. |
| `settle_auction` | Chốt 1 phiên. **Gọi bao nhiêu lần cũng an toàn (idempotent):** chỉ chốt khi `status = 'active'` và đã hết giờ. |
| `settle_ended_auctions` *(Cron, mỗi phút)* | Chốt mọi phiên đã hết giờ |
| `npc_buy_stale_listings` *(Cron, 10 phút)* | NPC mua những món treo quá 3 giờ có giá ≤ 1,1 lần giá gốc |
| `expire_listings` *(Cron, 10 phút)* | Trả lại hàng của những món hết hạn |
| `create_daily_system_auctions` *(Cron, 13:00 UTC = 20:00 Việt Nam)* | Mở các phiên đấu giá của hệ thống |

**Hàm nội bộ (schema `private`, client không gọi được):**

| Hàm | Việc |
|---|---|
| `assert_player(uid)` | Kiểm tra hồ sơ, bị cấm, giới hạn tần suất (đếm `rl_count` trong cửa sổ thời gian) |
| `add_coins(uid, delta, reason, counterpart, ref)` | Cộng/trừ xu (tự báo lỗi nếu bị âm) và ghi sổ cái. **Mọi thay đổi xu đều phải đi qua hàm này.** |
| `add_xp(uid, amount)` | Cộng XP và XP tuần, lên cấp nếu đủ (có thể lên nhiều cấp một lúc) |
| `give_items(uid, item, qty)` / `take_items(uid, item, qty)` | Thêm vào kho (kiểm tra sức chứa) / lấy ra khỏi kho (kiểm tra đủ hàng) |
| `barn_free_space(uid)` | Sức chứa còn trống của kho |
| `progress_quest(uid, type, amount)` | Cập nhật tiến độ nhiệm vụ ngày |
| `bump_stat(uid, key, amount)` | Tăng bộ đếm và kiểm tra thành tựu |
| `notify_parcel(parcel_id)` | `realtime.send` vào kênh của chunk chứa ô đất đó |
| `notify_topic(topic, event, payload)` | `realtime.send` vào một kênh bất kỳ, ví dụ `auction:<id>` [Sau MVP] |
| `vn_today()` | Ngày hiện tại theo múi giờ `Asia/Ho_Chi_Minh` |
| `land_price(n)` | 500 × 1,5^(n−1), làm tròn đến hàng chục |
| `tool_area_ok(plot_ids, tool_level)` | Kiểm tra các luống nằm gọn trong vùng tác động cho phép |

### 2.9 Cây lớn theo mốc thời gian lưu trên server

- **Không có gì "chạy" để cây lớn.** Server chỉ lưu 2 mốc: `planted_at` (lúc gieo) và `ready_at` (lúc chín).
- **Tiến độ** = (giờ hiện tại − `planted_at`) ÷ (`ready_at` − `planted_at`), giới hạn trong khoảng 0–1. Client dùng con số này để chọn giai đoạn và vẽ thanh tiến độ.
- **Khi thu hoạch,** server chỉ so sánh `now() >= ready_at`. Không cần biết client nói gì.
- **Độ phì nhiêu** và các bonus khác được tính **một lần lúc gieo** rồi ghi vào `ready_at`. Nâng độ phì nhiêu sau khi gieo thì không làm cây đang lớn chín nhanh hơn. Luật này giúp code đơn giản và dễ hiểu.
- Con vật (`fed_at`, `ready_at`) và xưởng (`start_at`, `ready_at`) dùng **đúng cách này**. Học kỹ một lần là dùng được cho cả ba.

### 2.10 Việc định kỳ (Supabase Cron)

| Việc | Lịch | Giai đoạn |
|---|---|---|
| `cleanup_ledger()`: xóa sổ cái cũ hơn 30 ngày | Mỗi ngày 20:00 UTC (= 03:00 sáng giờ Việt Nam) | GĐ4 |
| Các việc ở bảng "Hàm sau MVP" | Như ghi trong bảng | GĐ7 |

Nhiệm vụ ngày, đơn hàng và thưởng đăng nhập dùng cách **"lười" (lazy)**: chỉ tạo khi người chơi mở game. Vì vậy **không cần Cron** cho chúng, và không tốn tài nguyên cho người không online.

### 2.11 Mã lỗi (error codes)

Server báo lỗi bằng **mã** viết bằng tiếng Anh. Client dịch mã sang câu tiếng Việt trong file `src/ui/errorMessages.ts`.

| Mã | Câu hiển thị |
|---|---|
| `NOT_AUTHENTICATED` | Bạn cần đăng nhập lại |
| `BANNED` | Tài khoản đã bị khóa |
| `RATE_LIMITED` | Bạn thao tác nhanh quá, chờ một chút nhé |
| `NOT_OWNER` | Đây không phải đất/công trình của bạn |
| `NOT_ENOUGH_COINS` | Không đủ xu |
| `NOT_ENOUGH_ITEMS` | Không đủ vật phẩm trong kho |
| `NOT_READY` | Chưa xong đâu, chờ thêm nhé |
| `PLOT_NOT_EMPTY` | Luống này đang có cây |
| `LEVEL_TOO_LOW` | Cần lên cấp cao hơn |
| `BARN_FULL` | Kho đầy rồi, hãy bán bớt hoặc nâng cấp kho |
| `NOT_ADJACENT` | Chỉ mua được ô đất kề bên đất của bạn |
| `PRIORITY_ZONE` | Ô này thuộc vùng ưu tiên của người khác |
| `LAND_LIMIT` | Hãy nâng cấp nhà để sở hữu thêm đất |
| `QUEUE_FULL` | Hàng đợi của xưởng đã đầy |
| `MAX_LEVEL` | Đã đạt cấp tối đa |
| `INVALID_INPUT` | Dữ liệu không hợp lệ |
| `TRADE_LOCKED` [Sau MVP] | Cần cấp 8 và tài khoản 3 ngày để giao dịch |
| `AUCTION_ENDED`, `BID_TOO_LOW` [Sau MVP] | Phiên đã kết thúc / Giá trả quá thấp |

---

## 3. Cấu trúc thư mục dự án

```
GAME3DFARM/
├── docs/
│   ├── GDD.md                  # kịch bản game
│   ├── ROADMAP.md              # tài liệu này
│   └── LEARNING.md             # nhật ký học + từ vựng tiếng Anh (bạn tự viết)
├── public/                     # file tĩnh, Vercel phục vụ trực tiếp
│   ├── models/                 # .glb đã nén (nhà, con vật, công trình)
│   ├── sounds/                 # .mp3 / .ogg
│   └── favicon.svg
├── src/
│   ├── main.tsx                # điểm khởi động React
│   ├── App.tsx                 # chọn màn hình: đăng nhập / tạo nông trại / game
│   ├── game/                   # MỌI THỨ 3D (R3F)
│   │   ├── GameCanvas.tsx      # <Canvas>, ánh sáng, bầu trời
│   │   ├── camera/             # điều khiển camera, giới hạn, bay tới (fly-to)
│   │   ├── world/              # Chunk, mặt đất, lối đi, quảng trường, trang trí
│   │   ├── crops/              # model cây dựng bằng code, CropInstances
│   │   ├── structures/         # nhà, chuồng, xưởng, [sau] sạp hàng
│   │   ├── animals/            # con vật, đi lòng vòng
│   │   ├── effects/            # hạt bay, xu bay
│   │   └── input/              # điểm chạm → ô đất / luống
│   ├── logic/                  # HÀM THUẦN (pure functions): không React, không Three, có test
│   │   ├── grid.ts             # tọa độ thế giới ↔ ô đất ↔ luống ↔ chunk
│   │   ├── growth.ts           # tiến độ, giai đoạn
│   │   ├── economy.ts          # giá đất, chi phí nâng cấp (chỉ để HIỂN THỊ)
│   │   └── *.test.ts
│   ├── state/                  # Zustand stores (mục 1.4)
│   ├── services/               # nói chuyện với Supabase
│   │   ├── supabase.ts         # tạo client từ biến môi trường
│   │   ├── api.ts              # mỗi RPC một hàm: plant(), harvest()…
│   │   ├── queries.ts          # các câu đọc dữ liệu
│   │   ├── realtime.ts         # kênh chunk, presence
│   │   └── serverTime.ts       # đồng bộ giờ server
│   ├── ui/                     # giao diện HTML (React + Tailwind)
│   │   ├── hud/                # thanh trên, thanh công cụ, thông báo (toast)
│   │   ├── panels/             # cửa hàng, kho, nâng cấp, nhiệm vụ, đơn hàng, xếp hạng, chuồng, xưởng…
│   │   ├── screens/            # đăng nhập, tạo nông trại, đang tải
│   │   ├── components/         # nút, hộp thoại, thanh tiến độ, biểu tượng vật phẩm
│   │   └── errorMessages.ts    # mã lỗi → câu tiếng Việt
│   ├── config/constants.ts     # hằng số hiển thị (kích thước ô, màu)
│   ├── types/database.types.ts # SINH TỰ ĐỘNG bằng Supabase CLI, KHÔNG sửa tay
│   └── styles/index.css
├── supabase/
│   ├── config.toml
│   ├── migrations/             # mỗi thay đổi DB = 1 file SQL, tên bắt đầu bằng ngày giờ
│   └── dev/                    # SQL chỉ dùng khi phát triển (tạo người chơi giả để test)
├── tests/                      # test tích hợp và test gian lận (Vitest + supabase-js)
├── .env.example                # MẪU biến môi trường (được commit)
├── .env.local                  # GIÁ TRỊ THẬT (KHÔNG BAO GIỜ commit)
├── AGENTS.md                   # quy tắc cho AI (mục 7.3)
├── CREDITS.md                  # ghi công tác giả asset
├── README.md
└── index.html, package.json, tsconfig.json, vite.config.ts
```

**Luật ranh giới giữa các thư mục.** Ghi luật này vào `AGENTS.md` để AI không làm lộn xộn:
- `logic/` **không** import React, Three hay Supabase. Nhờ vậy test dễ và dùng lại được ở mọi nơi.
- `game/` và `ui/` **không** gọi Supabase trực tiếp. Chúng đi qua `state/` và `services/`.
- `ui/` không đụng tới object Three.js. `game/` không render HTML (trừ nhãn tên nhỏ trên bản đồ).
- Dữ liệu cấu hình game (giá, thời gian) nằm trong **database** (bảng cấu hình), **không** viết cứng trong code. Riêng GĐ1 được dùng file tạm, sang GĐ2 thì chuyển lên database.
- Mọi thay đổi database đều là **một file migration mới**. **Không sửa** migration đã chạy.

---

## 4. Cách vẽ bản đồ rộng mà vẫn mượt

### 4.1 Vài khái niệm hiệu năng

| Khái niệm | Giải thích đơn giản |
|---|---|
| **Draw call** | Mỗi lần CPU bảo GPU "vẽ cái này". Đây là thứ đắt nhất. Điện thoại nên dưới khoảng 100–150 draw call mỗi khung hình. |
| **Instancing (`InstancedMesh`)** | Vẽ **nhiều bản sao cùng hình dạng** trong **1 draw call**. Ví dụ 500 cây ngô = 1 lần vẽ thay vì 500 lần. |
| **Chunk** | Chia bản đồ thành từng mảng. Chỉ xử lý những mảng đang nhìn thấy. |
| **Frustum culling** | Không vẽ những gì nằm ngoài khung nhìn của camera. Three.js tự làm cho từng object, nên chia theo chunk thì nó loại được cả chunk một lần. |
| **LOD (Level of Detail)** | Ở xa thì vẽ hình đơn giản hơn |
| **`frameloop="demand"`** | R3F chỉ vẽ lại khi có thay đổi, không vẽ liên tục 60 lần/giây. Đỡ hao pin và đỡ nóng máy. |
| **DPR (Device Pixel Ratio)** | Điện thoại có màn hình độ phân giải rất cao. Giới hạn DPR ở 1–1,5 giúp nhẹ hơn rất nhiều mà mắt gần như không nhận ra. |

### 4.2 Hệ tọa độ và cách chọn ô bằng phép tính (không raycast từng vật)

- 1 luống = 1 đơn vị. Ô đất 4×4 luống. Lối đi rộng 1. Vì vậy **mỗi ô đất cách ô kế bên 5 đơn vị**.
- Ô đất (px, py) nằm trong vùng từ `px×5` đến `px×5 + 4` theo trục X. Trục Z cũng vậy.
- **Chọn ô khi người chơi chạm:**
  1. Bắn tia (raycast) vào **một mặt phẳng đất duy nhất** (vô hình, phủ cả bản đồ) để lấy điểm chạm (wx, wz).
  2. `px = floor(wx / 5)`. Phần dư `rx = wx − px × 5`.
  3. Nếu `rx >= 4` thì điểm chạm nằm trên lối đi.
  4. Ngược lại, `lx = floor(rx)` là cột luống. Làm tương tự với trục Z để được `py` và `ly`.
  5. Góc phần tư = (ly ≥ 2 ? 2 : 0) + (lx ≥ 2 ? 1 : 0).
- Cách này chạy **tức thì** dù bản đồ có 16.000 luống. Raycast vào từng luống sẽ rất chậm.
- Toàn bộ phần này nằm trong `src/logic/grid.ts` và **phải có unit test**.

### 4.3 Chia vùng (chunk)

- 1 chunk = 8 × 8 ô đất = 40 × 40 đơn vị. Cả bản đồ có **16 chunk** (4 × 4).
- `chunk_x = floor(px / 8)`, `chunk_y = floor(py / 8)`.
- Mỗi chunk là **một component React** (`<Chunk cx cy />`) chứa mọi thứ của vùng đó. Chunk nào nằm ngoài khung nhìn thì được bỏ qua cả cụm.
- Chunk cũng là **đơn vị gửi realtime**: kênh `chunk:cx:cy`.

### 4.4 Instancing cho từng loại đối tượng

| Đối tượng | Cách vẽ | Số draw call ước tính mỗi chunk |
|---|---|---|
| Mặt đất các ô đất (tô màu theo chủ) | 1 `InstancedMesh`, màu riêng cho từng bản sao (instance color) | 1 |
| Luống đất | 1 `InstancedMesh` | 1 |
| Cây trồng | 1 `InstancedMesh` cho mỗi cặp (loại cây × giai đoạn) **đang có mặt** trong chunk. Gộp các khối của một cây thành **1 hình (merged geometry)**, mỗi phần tô màu bằng vertex color. | Thường 5–15, tối đa 40 |
| Hàng rào, cây trang trí, đá | Gộp thành 1 hình tĩnh cho mỗi chunk | 1–3 |
| Nhà, chuồng, xưởng | Model riêng (số lượng ít), dùng chung material | Vài cái |
| Con vật | Model low-poly **không có xương** + chuyển động bằng code (nhún, đi lòng vòng), nên vẫn instancing được | 1 mỗi loại con |

Ở mức zoom bình thường, mỗi lúc chỉ thấy khoảng 2–6 chunk, tức tổng khoảng 40–120 draw call. Ổn với điện thoại.

### 4.5 Chỉ vẽ vùng đang nhìn và LOD

- Mỗi khi camera di chuyển, tính các chunk giao với khung nhìn (cộng thêm một vòng dự phòng).
  - Chunk **trong tầm**: vẽ đầy đủ.
  - Chunk **xa** (zoom ra xa): **LOD đơn giản**. Mỗi luống có cây chỉ là một khối vuông nhỏ đúng màu cây, cả chunk vẽ bằng 1 `InstancedMesh`. Không vẽ con vật.
  - Chunk **ngoài khung**: không vẽ.
- Giới hạn zoom: không cho zoom ra xa đến mức thấy cả 16 chunk ở chế độ chi tiết.

### 4.6 Các cài đặt khác cho điện thoại

- **`frameloop="demand"`**: gọi `invalidate()` khi dữ liệu đổi, khi camera di chuyển (Drei controls tự làm), và đặt hẹn giờ gọi `invalidate()` đúng lúc cây chuyển giai đoạn. Khi có con vật **đang ở gần camera** thì chuyển sang vẽ liên tục, nếu không thì quay lại chế độ demand.
- **DPR:** `dpr` từ 1 đến 1,5. Dùng `PerformanceMonitor` của Drei để tự hạ DPR khi FPS tụt.
- **Không đổ bóng thời gian thực** trên điện thoại, dùng bóng giả (blob shadow). Trên máy tính có thể bật một bóng nhỏ quanh camera.
- **Không dùng texture.** Màu phẳng và vertex color là đủ. Mọi object **dùng chung một vài material**.
- **Nén model** `.glb` bằng `gltf-transform` (meshopt hoặc draco) trước khi bỏ vào `public/models`.
- **Chia nhỏ code (code splitting):** các bảng UI lớn chỉ tải khi mở (React lazy).

### 4.7 Tải dữ liệu theo vùng

- **GĐ3 (làm đơn giản trước):** tải **toàn bộ** ô đất có chủ cùng các luống của chúng một lần lúc vào game. Với 50 người thì khoảng 400–800 ô đất và 7.000–13.000 luống. Chỉ chọn những cột cần thiết.
- **GĐ6 (chỉ làm nếu đo thấy chậm, hoặc băng thông gần chạm hạn mức):** tải theo chunk đang nhìn, cache trong `worldStore`, nhận chuông báo realtime thì đọc lại đúng ô đất thay đổi.

### 4.8 Ngân sách hiệu năng (Performance budget)

| Chỉ số | Máy tính | Điện thoại tầm trung |
|---|---|---|
| FPS | 60 | ≥ 30 |
| Draw call mỗi khung hình | < 200 | < 120 |
| Số tam giác (triangle) trên màn hình | < 500.000 | < 200.000 |
| Dung lượng JS lần tải đầu (sau gzip) | < 1 MB | < 1 MB |
| Tổng model 3D | < 5 MB | < 5 MB |
| Thời gian từ lúc mở đến lúc chơi được | < 3 giây | < 6 giây (4G) |

Đo bằng `r3f-perf` (hiện FPS và draw call ngay trên màn hình) và tab Performance của Chrome DevTools.

---

## 5. Lộ trình theo giai đoạn

### 5.0 Tổng quan

So với khung bạn đưa ra, tôi **chèn thêm GĐ5 Chăn nuôi và chế biến** (vì đã chốt chăn nuôi nằm trong MVP). "Tối ưu, bảo mật, deploy, kiểm thử" chuyển thành **GĐ6**. Ngoài ra web được **deploy liên tục ngay từ GĐ0**, không đợi tới cuối.

| GĐ | Tên | Kết quả chính | Thời gian (1–2 giờ/ngày) |
|---|---|---|---|
| 0 | Môi trường và Git | Trang 3D "Hello farm" chạy trên Vercel | 3–5 ngày |
| 1 | Một ô đất (chưa có server) | Trồng và thu hoạch 10 loại cây trên 1 ô đất | 2–3 tuần |
| 2 | Supabase | Đăng nhập, lưu trên server, RPC, chống sửa tiền | 3–4 tuần |
| 3 | Bản đồ | 32×32 ô đất, mua đất, thấy đất người khác | 3–4 tuần |
| 4 | Chiều sâu | Nâng cấp, nhiệm vụ, đơn hàng, bảng xếp hạng, realtime | 3–4 tuần |
| 5 | Chăn nuôi và chế biến | Gà, bò, 4 xưởng, hàng đợi | 3–4 tuần |
| 6 | Hoàn thiện, **phát hành MVP** | Mượt trên điện thoại, an toàn, bạn bè chơi thử | 2–3 tuần |
| 7 | Kinh tế người chơi | Sạp hàng, chợ, đấu giá | 4–5 tuần |
| 8 | Nội dung mở rộng | Con vật mới, sự kiện, thời tiết… | Làm liên tục |

**Tổng thời gian đến MVP: khoảng 4,5–6 tháng**, tính cả thời gian dự phòng cho những tuần bận học. Bạn không có deadline, nên hãy ưu tiên **làm chắc và hiểu rõ** hơn là làm nhanh.

Cách đọc mỗi giai đoạn: **Mục tiêu** → **Việc nhỏ** (đánh dấu ☐ khi xong) → **Kiểm tra** (chạy được thì mới chuyển giai đoạn) → **Prompt mẫu** (dán cho AI để làm việc đầu tiên hoặc khó nhất của giai đoạn).

---

### GĐ0: Cài môi trường trên Windows 11, Git, deploy trang đầu tiên

**Mục tiêu:** máy sẵn sàng, code nằm trên GitHub, mỗi lần push là Vercel tự đưa lên mạng.

**Việc nhỏ:**

☐ **1. Cài Node.js (bản LTS mới nhất).**
Mở PowerShell và chạy `winget install OpenJS.NodeJS.LTS`, hoặc tải từ nodejs.org. Kiểm tra lại bằng `node -v` và `npm -v`.

☐ **2. Cài Git for Windows.**
Chạy `winget install Git.Git`. Bộ cài có kèm **Git Bash** và **Git Credential Manager** (tự mở trình duyệt để đăng nhập GitHub khi push). Kiểm tra bằng `git --version`.

☐ **3. Đặt Git Bash làm terminal mặc định trong VS Code.**
Mở Settings, tìm "Terminal › Integrated › Default Profile: Windows", chọn **Git Bash**. Lý do:
- PowerShell trên Windows hay chặn chạy script `npm`.
- Lệnh `>` của PowerShell ghi file bằng mã UTF-16, làm hỏng file sinh tự động.
- Git Bash dùng cú pháp giống hầu hết hướng dẫn trên mạng.

☐ **4. Cài extension cho VS Code:**

| Extension | Để làm gì |
|---|---|
| ESLint | Báo lỗi cú pháp và quy tắc code |
| Prettier – Code formatter | Tự định dạng code đẹp, đồng nhất (bật "Format on Save") |
| Error Lens | Hiện lỗi ngay trên dòng code |
| Pretty TypeScript Errors | Lỗi TypeScript dễ đọc hơn |
| GitLens | Xem ai sửa dòng nào, lịch sử từng file |
| Tailwind CSS IntelliSense | Gợi ý class Tailwind |
| Vitest | Chạy test ngay trong VS Code |
| Code Spell Checker | Bắt lỗi chính tả tiếng Anh, giúp luyện tiếng Anh |
| glTF Tools | Xem trước model `.glb` |
| Markdown Preview Mermaid Support (không bắt buộc) | Xem sơ đồ trong Markdown |

☐ **5. Tạo tài khoản** GitHub, Vercel (đăng nhập bằng GitHub) và Supabase (đăng nhập bằng GitHub). Supabase sẽ dùng ở GĐ2.

☐ **6. Cấu hình Git một lần duy nhất:**
- `git config --global user.name "Tên Của Bạn"`
- `git config --global user.email "email-github-cua-ban"`
- `git config --global init.defaultBranch main`

☐ **7. Tạo dự án Vite ngay trong thư mục `C:\GAME3DFARM`.** Thư mục này đã có sẵn `docs/`.
- Mở thư mục bằng VS Code. Trong terminal Git Bash, chạy `npm create vite@latest . -- --template react-ts`.
- ⚠️ Khi được hỏi thư mục không trống, **chọn "Ignore files and continue"**. **Tuyệt đối không chọn "Remove existing files"**, vì sẽ xóa mất `docs/`.
- Chạy `npm install` rồi `npm run dev`. Mở `http://localhost:5173`.

☐ **8. Tạo repo Git và commit đầu tiên:**
- Chạy `git init`.
- Kiểm tra `.gitignore` đã có `node_modules`, `dist`, `*.local` (Vite tạo sẵn; `*.local` sẽ che file `.env.local` sau này).
- Chạy `git add .` rồi `git commit -m "chore: init vite react-ts project with docs"`.

☐ **9. Đẩy lên GitHub.**
- Tạo repo **trong tài khoản cá nhân**, không tạo trong organization (gói Vercel Hobby không kết nối được repo của organization).
- `git remote add origin <url>`
- `git push -u origin main`

☐ **10. Deploy lên Vercel.**
Vào Add New → Project, chọn repo, Vercel tự nhận ra Vite, bấm Deploy. Bạn sẽ có link dạng `ten-du-an.vercel.app`.

☐ **11. Tạo `AGENTS.md`** (nội dung ở mục 7.3) và `README.md` ngắn. Commit rồi push.

☐ **12. Dùng prompt mẫu GĐ0 bên dưới** để AI thêm cảnh 3D đầu tiên. Chạy thử, commit, push, rồi mở link Vercel trên điện thoại.

**Các lệnh Git cần thuộc:**

| Lệnh | Nghĩa tiếng Anh | Dùng khi nào |
|---|---|---|
| `git status` | show the working tree status | **Gõ liên tục**: xem file nào đã đổi, đang ở nhánh nào |
| `git diff` | show changes | Xem chính xác AI đã sửa gì, **trước khi commit** |
| `git add <file>` / `git add .` | stage changes | Chọn thay đổi để đưa vào commit |
| `git commit -m "..."` | record a snapshot | Lưu một "mốc" có thể quay lại |
| `git log --oneline` | show commit history | Xem các mốc đã lưu (kèm mã hash ngắn) |
| `git push` / `git pull` | upload / download | Đẩy lên GitHub / kéo về |
| `git switch -c feat/ten-viec` | create and switch branch | Bắt đầu một việc mới trên nhánh riêng |
| `git switch main` | switch branch | Quay về nhánh chính |
| `git merge feat/ten-viec` | merge branch | Gộp việc đã xong vào `main` |
| `git restore <file>` | discard changes | Bỏ thay đổi **chưa commit** của 1 file |
| `git stash` / `git stash pop` | shelve / restore changes | Cất tạm thay đổi / lấy lại |
| `git revert <hash>` | undo a commit safely | Tạo commit đảo ngược một commit cũ (an toàn) |
| `git reset --hard <hash>` | reset everything | ⚠️ **Nguy hiểm**: quay hẳn về mốc cũ, mất mọi thứ sau đó |
| `git reflog` | show where HEAD has been | "Phao cứu sinh": tìm lại commit tưởng đã mất |
| `git branch -d <tên>` | delete branch | Xóa nhánh đã gộp xong |

**Quy ước commit (Conventional Commits).** Viết commit bằng tiếng Anh để luyện tiếng Anh:
- `feat: add plot selection` (tính năng mới)
- `fix: harvest button disabled after reload` (sửa lỗi)
- `docs: update GDD crop table` (tài liệu)
- `refactor: move grid math to logic/grid.ts` (sắp xếp lại code, không đổi hành vi)
- `chore: upgrade dependencies` (việc lặt vặt)
- `test: add land price tests` (test)

**Cách dùng nhánh:**
- `main` lúc nào cũng phải chạy được.
- Mỗi việc làm trên một nhánh `feat/...`. Push nhánh lên thì Vercel tạo một **bản xem trước (Preview deployment)** có link riêng để thử.
- Thử xong, ổn rồi mới merge vào `main`.

**Kiểm tra:**
- Link Vercel mở được trên điện thoại, thấy mặt cỏ và một khối đất, xoay và zoom được bằng tay.
- Lệnh `git log --oneline` hiện ít nhất 3 commit.

**Thời gian:** 3–5 ngày.

**Prompt mẫu GĐ0** (AI tạo cảnh 3D đầu tiên):
```
Read AGENTS.md first.
Context: This is a new Vite + React + TypeScript project for a low-poly 3D farming
web game (see docs/GDD.md). Nothing 3D exists yet.
Task (only this): Install three, @react-three/fiber and @react-three/drei. Replace the
default Vite demo page with a full-screen R3F <Canvas> showing a 10x10 green grass plane
and one brown box (a "soil plot") in the center, with soft lighting and OrbitControls
so I can rotate and zoom with mouse and touch.
Do not: add any other library, routing, state management or game logic.
Done when: `npm run dev` shows the scene with no console errors, it works on my phone,
and `npm run build` succeeds.
After: list the files you changed, explain each change in 2-3 simple sentences
(I am a beginner), and suggest a Conventional Commit message.
```
*Tóm tắt:* nhờ AI cài R3F và vẽ mặt cỏ + một khối đất, xoay được camera, không làm gì thêm.

---

### GĐ1: Một ô đất 3D, trồng và thu hoạch (chưa có server)

**Mục tiêu:** chơi được vòng ngắn (gieo, chờ, thu hoạch, bán) trên **1 ô đất 4×4**. Dữ liệu tạm lưu trong trình duyệt. Học R3F, Zustand, hàm thuần và unit test.

**Việc nhỏ:**
- ☐ Cài `zustand`, `tailwindcss`, `vitest`. Thêm lệnh `npm run test`.
- ☐ Dựng cảnh: `GameCanvas`, ánh sáng bầu trời và mặt trời, màu nền bầu trời, mặt cỏ lớn.
- ☐ Camera nhìn chéo 50–60°, kéo để di chuyển, chụm hai ngón để zoom, có giới hạn góc và zoom (MapControls của Drei).
- ☐ `src/logic/grid.ts`: đổi tọa độ thế giới ↔ ô đất ↔ luống (mục 4.2), kèm **unit test**.
- ☐ Vẽ 1 ô đất 4×4 luống + viền. Chạm vào luống thì luống sáng lên (dùng phép tính ở mục 4.2, không raycast từng luống).
- ☐ `src/game/data/crops.ts` (**file tạm**): dữ liệu 10 cây theo GDD mục 3.2.
- ☐ `src/logic/growth.ts`: hàm tính tiến độ và giai đoạn từ `plantedAt`, `readyAt`, `now`, kèm unit test.
- ☐ Model cây dựng bằng code: 1 component `CropModel(cropId, stage)` gồm hình nón, cầu, trụ, có 4 giai đoạn. Làm 2–3 cây trước, đủ 10 cây sau.
- ☐ Store Zustand: xu, trạng thái từng luống, kho.
- ☐ UI: thanh xu ở trên; thanh công cụ (Gieo / Thu hoạch); bảng chọn hạt; bảng kho có nút bán; đếm ngược khi chạm vào cây đang lớn.
- ☐ Lưu vào `localStorage` để bấm F5 không mất dữ liệu.
- ☐ Thử trên điện thoại cùng Wi-Fi: chạy `npm run dev -- --host`, mở địa chỉ IP của máy tính trên điện thoại.

**Kiểm tra:**
- Gieo cải xanh, sau 30 giây thấy đủ 4 giai đoạn, thu hoạch được, bán được, xu tăng.
- F5 vẫn còn nguyên trạng thái.
- `npm run test` qua hết.
- Chơi được trên điện thoại.
- Đã deploy lên Vercel.

**Thời gian:** 2–3 tuần.

**Prompt mẫu GĐ1** (chọn luống bằng phép tính):
```
Read AGENTS.md and section 4.2 of docs/ROADMAP.md (coordinates and picking).
Current state: the scene shows a grass plane with MapControls. Zustand and Vitest
are installed.
Task (only this):
1. Create src/logic/grid.ts with pure functions worldToPlot(x, z) and plotToWorld(...).
   1 plot = 1 unit, a parcel is 4x4 plots, parcel pitch is 5 units (1-unit path).
   worldToPlot returns { parcelX, parcelY, plotX, plotY } or null when on a path.
2. Add unit tests in src/logic/grid.test.ts (plot center, point on a path,
   parcel (1,0), negative coordinates).
3. Render parcel (0,0) as 4x4 brown plots. On tap/click, raycast ONE invisible ground
   plane, convert the hit point with worldToPlot, and highlight that plot.
Do not: add crops, money, Supabase, or new libraries.
Done when: `npm run test` passes and tapping each plot highlights exactly that plot
on desktop and on my phone.
After: list changed files, explain simply, suggest a commit message.
```
*Tóm tắt:* viết hàm đổi tọa độ (có test), vẽ ô đất 4×4, chạm vào luống nào thì luống đó sáng lên.

---

### GĐ2: Supabase, đăng nhập, lưu trạng thái, tiền, cửa hàng

**Mục tiêu:** chuyển toàn bộ "luật chơi" lên server. Đăng nhập bằng Google. Đổi máy vẫn giữ nguyên trạng thái. **Không gian lận được bằng F12.**

**Việc nhỏ:**
- ☐ Tạo project Supabase, region **Southeast Asia (Singapore)** (gần Việt Nam nhất).
  - Lấy **Project URL** và **publishable key** (dự án cũ gọi là anon key) ghi vào `.env.local` dưới tên `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - Tạo `.env.example` có cùng tên biến nhưng để trống giá trị.
  - ⚠️ **Secret key / service_role key không bao giờ** được đưa vào code frontend hay Git.
- ☐ Cài Supabase CLI: `npm i -D supabase`, rồi chạy lần lượt `npx supabase login`, `npx supabase init`, `npx supabase link --project-ref <id>`.
- ☐ Migration 1: các bảng cấu hình `game_config`, `items`, `crops` + dữ liệu 10 cây.
- ☐ Migration 2: các bảng `profiles`, `player_stats`, `parcels` (đủ cột như mục 2.4; ở GĐ2 chỉ cần vài dòng để thử), `plots`, `inventory`, `coin_ledger`. **Bật RLS, chỉ cho đọc.**
- ☐ Migration 3: schema `private` và các hàm `assert_player`, `add_coins`, `add_xp`, `give_items`, `take_items`, `vn_today`.
- ☐ Migration 4: các RPC `start_game` (tạm thời giao ô đất theo thứ tự; GĐ3 mới dùng thuật toán vị trí nhà), `server_now`, `plant`, `harvest`, `sell`.
- ☐ Chạy `npx supabase db push` để áp migration lên cloud.
- ☐ Sinh kiểu TypeScript: `npx supabase gen types typescript --linked > src/types/database.types.ts` (chạy trong Git Bash).
- ☐ Bật đăng nhập Google: tạo OAuth client trong Google Cloud Console (miễn phí), dán vào Supabase. Thêm Redirect URL cho cả `http://localhost:5173` và link Vercel. Làm theo hướng dẫn "Login with Google" trên trang docs của Supabase.
- ☐ (Không bắt buộc) Đăng nhập bằng email: **phải cấu hình SMTP riêng**, vì email mặc định của Supabase chỉ gửi được 2 email/giờ (xem mục 8.1).
- ☐ Client:
  - Viết `services/supabase.ts`, `services/api.ts` và `services/serverTime.ts`.
  - Màn hình đăng nhập, màn hình tạo nông trại.
  - Thay logic tạm ở GĐ1 bằng các lệnh gọi RPC.
  - Đọc dữ liệu cấu hình từ database, bỏ file `crops.ts` tạm.
- ☐ Bảng cửa hàng làng: bán vật phẩm trong kho. Khi gieo thì trả tiền hạt ngay (GDD mục 2.2).
- ☐ Thông báo lỗi tiếng Việt theo mã lỗi (mục 2.11).
- ☐ Trên Vercel, vào Settings → Environment Variables và thêm 2 biến môi trường.
- ☐ Tạo 2 tài khoản test trong Supabase Dashboard (Authentication → Add user, chọn tự xác nhận). Lưu thông tin đăng nhập trong `.env.test.local` (không commit).

**Kiểm tra:**
- Đăng nhập trên máy tính, gieo cây. Mở trên điện thoại bằng cùng tài khoản thì thấy đúng cây đó.
- **Thử gian lận:** mở F12 → Console, thử cập nhật cột `coins` của mình bằng supabase-js. Phải **thất bại**.
- Chỉnh giờ máy tính nhanh lên 1 giờ rồi thu hoạch cây chưa chín. Server phải từ chối.
- Hai tài khoản có dữ liệu tách biệt.

**Thời gian:** 3–4 tuần. Đây là giai đoạn **học nhiều nhất**, cứ thong thả.

**Prompt mẫu GĐ2** (viết hàm `plant`):
```
Read AGENTS.md and docs/ROADMAP.md sections 2.7, 2.8 (RPC pattern + the `plant` row)
and 2.9.
Current state: migrations for game_config, items, crops, profiles, parcels, plots,
inventory, coin_ledger exist, plus private.assert_player() and private.add_coins().
Task (only this): Create a NEW migration supabase/migrations/<timestamp>_rpc_plant.sql
with public.plant(p_plot_ids bigint[], p_crop_id text) that follows the 9-step RPC
pattern exactly.
Rules: SECURITY DEFINER, set search_path = '', fully qualified table names, server
now() only, lock the profile row FOR UPDATE, max 16 plot ids, raise exceptions with
our error codes (NOT_OWNER, PLOT_NOT_EMPTY, LEVEL_TOO_LOW, NOT_ENOUGH_COINS,
INVALID_INPUT). Revoke execute from anon and public; grant to authenticated.
Ignore tool level for now (allow any plots of the same parcel).
Do not: edit existing migrations or any frontend file.
Done when: `npx supabase db push` succeeds and you give me 4 SQL test snippets
(success, not my plot, not enough coins, plot not empty) to run in the SQL editor.
After: explain each block of the function simply.
```
*Tóm tắt:* nhờ AI viết đúng một hàm `plant` theo khung chuẩn, kèm câu SQL để tự kiểm tra.

---

### GĐ3: Bản đồ nhiều ô, mua đất, xem đất người khác

**Mục tiêu:** có bản đồ 32×32 với làng chung. Người mới được xếp vị trí nhà, mua thêm được đất kề bên, nhìn thấy đất của nhau.

**Việc nhỏ:**
- ☐ Migration tạo sẵn 1.024 dòng `parcels`:
  - Dùng `generate_series` để sinh tọa độ.
  - Gán zone (quảng trường 13–18, hồ, rừng), `is_home_slot` và `priority_slot_id` theo GDD mục 6.3.
- ☐ Sửa `start_game`: chọn vị trí nhà trống gần tâm (15,5; 15,5) nhất, dùng `for update skip locked`.
- ☐ RPC `buy_parcel` với đủ 5 quy tắc + hàm `private.land_price`. Mỗi ô mua xong thì tạo 16 luống.
- ☐ `src/logic/economy.ts`: giá đất để hiển thị (có test, phải khớp số trong GDD bảng 4.4).
- ☐ Client đọc toàn bộ ô đất (`id, x, y, zone, owner_id, fertility_level`), tên chủ đất và luống của các ô có chủ.
- ☐ Vẽ theo chunk: `ChunkGround` (instancing, tô màu theo trạng thái), luống, `CropInstances` cho từng cặp (cây × giai đoạn).
- ☐ Camera: giới hạn trong bản đồ, nút "Về nhà", hiệu ứng bay tới (fly-to).
- ☐ Bảng thông tin ô đất:
  - Ô có chủ: hiện chủ, cấp, nút "Thăm".
  - Ô trống: hiện giá và có mua được không, nút "Mua".
- ☐ Quảng trường làng tạm dựng bằng các khối, có biển tên.
- ☐ `supabase/dev/fake_players.sql`: tạo khoảng 50 người chơi giả với đất và cây ngẫu nhiên, để đo hiệu năng. Chỉ chạy trên project dev.

**Kiểm tra:**
- Hai tài khoản (một cửa sổ thường, một cửa sổ ẩn danh) thấy đất của nhau sau khi tải lại trang.
- Thử gọi `buy_parcel` cho ô không kề bên hoặc ô thuộc vùng ưu tiên của người khác bằng Console. Phải bị từ chối với đúng mã lỗi.
- Với 50 người chơi giả: điện thoại vẫn đạt ≥ 30 FPS, số draw call nằm trong ngân sách ở mục 4.8.

**Thời gian:** 3–4 tuần.

**Prompt mẫu GĐ3** (vẽ mặt đất một chunk bằng instancing):
```
Read AGENTS.md and docs/ROADMAP.md sections 4.3 and 4.4.
Current state: worldStore holds all parcels as an array of
{ id, x, y, zone, ownerId }. The map is 32x32 parcels; a chunk is 8x8 parcels.
Task (only this): Create src/game/world/ChunkGround.tsx that renders the ground tiles
of ONE chunk with a single InstancedMesh (one 4x4 tile per parcel, parcel pitch 5).
Color each instance by state: mine, other player, free, town, lake, forest (colors
from GDD section 10.1). Render 16 <ChunkGround cx cy /> from World.tsx.
Do not: render crops, add libraries, or change the store shape.
Done when: the whole map shows with correct colors, r3f-perf shows about 16 draw calls
for the ground, and it is smooth on my phone.
After: list changed files, explain instancing in 3-4 simple sentences, suggest a commit
message.
```
*Tóm tắt:* vẽ mặt đất cả bản đồ bằng 16 InstancedMesh (mỗi chunk một cái), tô màu theo chủ đất.

---

### GĐ4: Nâng cấp, nhiệm vụ, đơn hàng, bảng xếp hạng, realtime

**Mục tiêu:** game có chiều sâu và làng "sống": thấy hàng xóm làm gì gần như ngay lập tức.

**Việc nhỏ:**
- ☐ Bảng `upgrade_levels` + dữ liệu từ GDD mục 5.1–5.4. RPC `upgrade` cho nhà, kho, công cụ, độ phì nhiêu.
- ☐ Thêm `private.tool_area_ok` vào `plant`/`harvest`. Bên client, chạm một lần sẽ chọn cả vùng theo cấp công cụ.
- ☐ Bảng nâng cấp ở UI. Nhà đổi model theo cấp.
- ☐ Nhiệm vụ: `tutorial_steps`, `quest_templates`, `player_quests`; RPC `get_daily_quests`, `claim_quest`, `claim_tutorial_step`; hàm `private.progress_quest` được gọi trong `harvest`, `sell`…
- ☐ Đơn hàng: bảng `orders`; RPC `get_orders`, `fulfill_order`, `skip_order`; bảng đơn hàng ở UI.
- ☐ Thưởng đăng nhập: `claim_daily_login` + hộp thoại khi vào game.
- ☐ Thành tựu: `achievements`, `player_achievements`, `private.bump_stat`.
- ☐ Bảng xếp hạng: 3 view + bảng UI có 3 thẻ. Bấm vào tên để đi thăm.
- ☐ **Realtime:**
  - Thêm chính sách RLS trên `realtime.messages`.
  - Viết `private.notify_parcel` (dùng `realtime.send`, kênh private).
  - Gọi nó trong mọi RPC có làm thay đổi ô đất.
  - Client chỉ nghe các kênh `chunk:cx:cy` đang nhìn thấy (prompt mẫu bên dưới).
- ☐ **Presence:** kênh `presence:village` cho danh sách người đang online, hiện chấm xanh trên đất của họ.
- ☐ Cron `cleanup_ledger` (mục 2.10).

**Kiểm tra:**
- Hai thiết bị nhìn cùng một khu vực: một bên thu hoạch, bên kia thấy thay đổi trong ≤ 2 giây.
- Kéo camera ra xa thì kênh cũ được rời (xem log).
- Nhiệm vụ ngày đổi sau 0h giờ Việt Nam (thử bằng cách sửa tay `quest_date` trong database dev).
- Nâng cấp trừ đúng số xu như bảng trong GDD.

**Thời gian:** 3–4 tuần.

**Prompt mẫu GĐ4** (nghe realtime theo chunk):
```
Read AGENTS.md and docs/ROADMAP.md section 1.3 (flow C: realtime).
Current state: the server function private.notify_parcel(parcel_id) calls
realtime.send(payload {parcel_id}, 'parcel_changed', 'chunk:<cx>:<cy>', true).
An RLS policy on realtime.messages lets authenticated users read these topics.
worldStore has refetchParcel(parcelId).
Task (only this): Create src/services/realtime.ts with a hook
useChunkSubscriptions(visibleChunks) that joins PRIVATE broadcast channels
'chunk:<cx>:<cy>' only for visible chunks, leaves channels that are no longer visible,
and on 'parcel_changed' calls worldStore.refetchParcel(parcel_id), debounced 300 ms
per parcel.
Do not: use postgres_changes, subscribe to the whole map, or change any SQL.
Done when: with two browsers (different users) looking at the same area, a harvest in
one shows up in the other within 2 seconds, and leaving an area removes its channel
(log it in the console in dev mode only).
After: list changed files and explain how channel cleanup works.
```
*Tóm tắt:* client chỉ nghe kênh của các vùng đang nhìn, nhận chuông báo thì đọc lại ô đất đó.

---

### GĐ5: Chăn nuôi và chế biến

**Mục tiêu:** mở vòng giữa: trồng cây → thức ăn → gà, bò → trứng, sữa → bánh, bơ, phô mai → đơn hàng.

**Việc nhỏ:**
- ☐ Bảng cấu hình `structure_types`, `animal_types`, `recipes`, `recipe_inputs` + dữ liệu từ GDD mục 3.3–3.4.
- ☐ Bảng trạng thái `structures`, `animals`, `production_jobs`. Sửa `start_game` để tạo công trình "home" ở Q0.
- ☐ RPC `build_structure`, `buy_animal`, `feed_animals`, `collect_animals`, `start_production`, `collect_production`. Mở rộng `upgrade` cho chuồng và xưởng.
- ☐ Vẽ công trình vào đúng góc phần tư. Con vật đi lòng vòng trong chuồng (chuyển động bằng code, chỉ chạy khi ở gần camera). Hiện bong bóng biểu tượng khi có sản phẩm.
- ☐ Bảng chuồng (mua con, cho ăn, thu, đếm ngược) và bảng xưởng (danh sách công thức, hàng đợi có đếm ngược, thu).
- ☐ Kho chia nhóm theo loại vật phẩm. Kiểm tra sức chứa khi thu.
- ☐ Đơn hàng và nhiệm vụ bắt đầu yêu cầu sản phẩm vật nuôi và hàng chế biến.
- ☐ Chép các bảng số liệu trong GDD sang Google Sheets để tính thử cân bằng trước khi chơi thử.

**Kiểm tra:**
- Xây chuồng gà, mua 2 gà, làm thức ăn gà, cho ăn. 20 phút sau thu được trứng.
- Làm bánh ngô từ bột ngô và trứng.
- Giao một đơn hàng có yêu cầu trứng.
- Thử xây chuồng lên góc đang có cây: phải bị từ chối.

**Thời gian:** 3–4 tuần.

**Prompt mẫu GĐ5** (hàm cho gà ăn):
```
Read AGENTS.md, docs/GDD.md section 3.3 and docs/ROADMAP.md sections 2.8 and 2.9.
Current state: tables structures, animals, animal_types and helpers
private.assert_player(), private.take_items() exist.
Task (only this): NEW migration with public.feed_animals(p_structure_id bigint).
Feed every hungry animal (fed_at is null) in this pen while the player still has the
right feed item: take 1 feed per animal, set fed_at = now(),
ready_at = now() + cycle_seconds. Return json { fed, still_hungry }.
Checks: 9-step RPC pattern; the structure belongs to the player and is a pen;
raise NOT_ENOUGH_ITEMS if no animal could be fed.
Do not: touch other functions or any frontend file.
Done when: `npx supabase db push` succeeds and you give me 3 SQL test snippets
(normal case, no feed, not my pen).
After: explain the function step by step.
```
*Tóm tắt:* viết hàm cho cả chuồng ăn: trừ thức ăn, ghi mốc thời gian, theo đúng khung chuẩn.

---

### GĐ6: Tối ưu, bảo mật, deploy chính thức, kiểm thử với nhiều người → PHÁT HÀNH MVP

**Mục tiêu:** chạy mượt trên điện thoại tầm trung, chặn được các kiểu gian lận dễ, có bản chính thức để 5–10 người bạn chơi thử 1 tuần.

**Việc nhỏ (hiệu năng):**
- ☐ Đo bằng `r3f-perf` trên điện thoại thật và ghi lại số liệu.
- ☐ Bật `frameloop="demand"`, giới hạn DPR, `PerformanceMonitor`, LOD cho chunk ở xa (mục 4.5–4.6), nếu các giai đoạn trước chưa làm.
- ☐ Nén model bằng `npx @gltf-transform/cli optimize`. Tải lười (lazy load) các bảng UI.
- ☐ Nếu băng thông cao: chỉ đọc cột cần thiết, tải theo chunk (mục 4.7).

**Việc nhỏ (bảo mật):**
- ☐ Chạy **Security Advisor** và **Performance Advisor** trong Supabase Dashboard, sửa hết cảnh báo.
- ☐ Rà lại từng hàm theo **checklist ở mục 7.7**.
- ☐ **Bộ test gian lận** tự động (prompt mẫu bên dưới).
- ☐ Bật **captcha** khi đăng ký (Cloudflare Turnstile hoặc hCaptcha, Supabase hỗ trợ sẵn, miễn phí).
- ☐ Chỉnh giới hạn tần suất sau khi đo thao tác thật.

**Việc nhỏ (deploy):**
- ☐ Tạo **project Supabase thứ hai** cho bản chính thức (production). Gói Free cho phép 2 project đang hoạt động. Project cũ giữ làm dev.
  - Áp migration lên production bằng `npx supabase db push`.
  - Trên Vercel: biến môi trường cho **Preview** trỏ tới dev, cho **Production** trỏ tới production.
- ☐ **Sao lưu:** gói Free không có bản sao lưu tải về được. Mỗi tuần chạy `npx supabase db dump` và cất file ở nơi an toàn (không đưa lên Git công khai).
- ☐ Hoàn thiện `README.md` (cách chạy dự án), `CREDITS.md`, và một trang ngắn "Quyền riêng tư" (lưu những gì: email, tên).
- ☐ Đánh dấu phiên bản: `git tag v1.0.0` rồi `git push --tags`.

**Việc nhỏ (chơi thử):**
- ☐ Mời 5–10 bạn chơi 1 tuần. Thu góp ý bằng Google Form.
- ☐ Mỗi ngày xem view `admin.money_supply`. Chỉnh cân bằng qua bảng cấu hình.
- ☐ Ghi lỗi vào GitHub Issues. Sửa lỗi nghiêm trọng trước.

**Kiểm tra:**
- Điện thoại tầm trung ≥ 30 FPS.
- 5 test gian lận đều qua.
- 5–10 người chơi một tuần không gặp lỗi mất dữ liệu.
- Tổng lượng xu tăng hợp lý.

**Thời gian:** 2–3 tuần.

**Prompt mẫu GĐ6** (bộ test gian lận):
```
Read AGENTS.md and docs/GDD.md section 9.
Task (only this): Create tests/security/cheating.test.ts (Vitest + supabase-js) and an
npm script "test:security". Sign in as TEST_USER_A (credentials from .env.test.local,
never commit it) and assert that each attempt FAILS:
1) update my own coins directly with .update();
2) update another player's plot directly;
3) call harvest on a plot that is not ready yet;
4) call buy_parcel on a non-adjacent parcel;
5) call plant twice in parallel with coins for only one -> exactly one must succeed.
Do not: change SQL or app code. If a test reveals a real security hole, stop and report
it to me instead of fixing it.
Done when: `npm run test:security` runs the 5 tests and prints a clear pass/fail list.
```
*Tóm tắt:* viết 5 bài test tự động thử gian lận. Test nào gian lận thành công nghĩa là có lỗ hổng cần sửa.

---

### GĐ7: Kinh tế người chơi: sạp hàng, chợ, đấu giá

**Mục tiêu:** người chơi mua bán với nhau và đấu giá, **an toàn** (không tạo xu từ hư không, không bị lợi dụng tài khoản phụ).

**Việc nhỏ:**
- ☐ Bảng `market_listings`, `auctions`, `auction_bids` + các khóa cấu hình chợ trong `game_config`.
- ☐ RPC `create_listing`, `cancel_listing`, `buy_listing` (khóa dòng món hàng, thuế 10%, sổ cái hai bên có `counterpart_id`).
- ☐ Kiểm tra điều kiện giao dịch: cấp ≥ 8, tài khoản ≥ 3 ngày, khoảng giá, giới hạn nhận xu mỗi ngày.
- ☐ Cron `npc_buy_stale_listings`, `expire_listings`.
- ☐ RPC `create_auction`, `place_bid` (prompt mẫu bên dưới), `settle_auction` (gọi nhiều lần vẫn an toàn) + Cron `settle_ended_auctions` mỗi phút + chốt "lười" khi có người mở phiên.
- ☐ Phiên của hệ thống: Cron `create_daily_system_auctions` lúc 20:00 giờ Việt Nam. Đất phù sa: kiểm tra điều kiện lúc trả giá **và** lúc chốt. Nếu lúc chốt không còn hợp lệ thì hoàn tiền và mở lại phiên.
- ☐ View `admin.suspicious_pairs`.
- ☐ UI:
  - Sạp hàng 3D trước nhà.
  - Bảng chợ làng (lọc theo vật phẩm).
  - Nhà đấu giá (đếm ngược, nút trả giá).
  - Thông báo realtime khi bị trả giá cao hơn (kênh `auction:<id>`).
- ☐ Test tự động: 2 người cùng mua một món, 2 người trả giá cùng lúc, chốt phiên 2 lần. Kết quả phải luôn đúng.

**Kiểm tra:**
- Hai tài khoản mua bán với nhau. Số xu khớp: người mua trả X thì người bán nhận 0,9X, sổ cái ghi đủ.
- Bị trả giá cao hơn thì được hoàn tiền ngay.
- Trả giá ở phút chót thì phiên kéo dài thêm.
- Chạy test đồng thời 20 lần không lần nào sai.

**Thời gian:** 4–5 tuần.

**Prompt mẫu GĐ7** (trả giá đấu giá):
```
Read AGENTS.md, docs/GDD.md section 7.3 and docs/ROADMAP.md section 2.8.
Current state: tables auctions and auction_bids exist; helpers private.assert_player(),
private.add_coins(), private.notify_topic() exist.
Task (only this): NEW migration with public.place_bid(p_auction_id bigint,
p_amount bigint). It must:
- lock the auction row FOR UPDATE; require status = 'active' and now() < ends_at;
- reject the seller, players below level 10, and amounts below
  greatest(start_price, current_bid * 1.05, current_bid + 10);
- take p_amount from the bidder via add_coins(..., 'auction_bid') (escrow);
- refund the previous top bidder immediately via add_coins(..., 'auction_refund');
- if less than 120 seconds remain, set ends_at = now() + 120 seconds (anti-sniping);
- insert into auction_bids and notify topic 'auction:<id>'.
Do not: implement settlement or any UI.
Done when: db push succeeds and you give me SQL tests for: valid bid, bid too low,
bid after the end, outbid refund, anti-sniping extension.
```
*Tóm tắt:* viết hàm trả giá có giữ tiền đặt cọc, hoàn tiền người bị vượt giá, chống bắn tỉa.

---

### GĐ8: Nội dung mở rộng (làm liên tục)

**Mục tiêu:** thêm nội dung theo danh sách ưu tiên ở GDD mục 11.3: heo, cừu, ong; xưởng dệt, máy ép, nhà làm mứt; sự kiện (bảng `events`); thời tiết; cây ăn quả; tưới giúp, tặng quà; trang trí; PWA; giao diện tiếng Anh.

**Mỗi tính năng làm theo một vòng nhỏ:**
1. Cập nhật GDD.
2. Viết migration (cấu hình + bảng).
3. Viết RPC.
4. Làm UI và 3D.
5. Test.
6. Deploy lên Preview, thử, rồi merge.

**Prompt mẫu GĐ8** (thời tiết):
```
Read AGENTS.md and docs/GDD.md section 8.7.
Task (only this): Add a NEW migration with public.get_weather(p_date date) returning
'sunny' | 'rain' | 'rainbow', deterministic from the date (same for everyone;
about 70% sunny, 25% rain, 5% rainbow). Add src/logic/weather.ts with a pure function
that maps weather to visual settings (sky colors, rain on/off) plus unit tests.
Do not: apply gameplay effects yet, or change other files.
Done when: get_weather for 30 consecutive dates gives a reasonable mix, tests pass,
and the sky changes when I force a weather value in dev.
```
*Tóm tắt:* thời tiết tính từ ngày (ai cũng thấy giống nhau). Bước này chỉ đổi hình ảnh, chưa có hiệu ứng lên lối chơi.

---

## 6. Cách viết prompt cho AI

### 6.1 Mẫu prompt dùng chung

Mỗi việc nhỏ dùng mẫu này. Các prompt ở mục 5 đều theo mẫu này.

```
Read AGENTS.md first. Also read: <docs section, e.g. docs/GDD.md section 3.2>.
Context / current state: <what already exists, which files, which functions>.
Task (only this): <ONE small, concrete thing>.
Rules: <names, patterns, constraints>.
Do not: <what must stay untouched>.
Done when: <how I will check: a command, what I should see>.
After: list the files you changed, explain simply, suggest a commit message.
```

**Với việc lớn hơn** (sửa từ 3 file trở lên), thêm câu sau để AI trình bày kế hoạch trước và chờ bạn đồng ý:
> *"Before writing any code, give me your plan in 3–5 bullet points and wait for my OK."*

### 6.2 Cụm từ tiếng Anh hay dùng khi làm việc với AI

| Tiếng Anh | Nghĩa |
|---|---|
| *Only change X. Do not touch Y.* | Chỉ sửa X, không đụng Y |
| *Explain it like I'm a beginner.* | Giải thích như cho người mới học |
| *What is the root cause? Don't write code yet.* | Nguyên nhân gốc là gì? Đừng viết code vội |
| *Which version of X are you assuming?* | Bạn đang giả định phiên bản X nào? |
| *Show me the minimal change.* | Cho tôi xem thay đổi nhỏ nhất |
| *This broke Z. Revert your last change and try a different approach.* | Cái này làm hỏng Z. Bỏ thay đổi vừa rồi và thử cách khác |
| *Write a test that reproduces the bug first.* | Viết test tái hiện lỗi trước đã |
| *Is there a security risk in this code?* | Code này có rủi ro bảo mật không? |
| *Summarize what you did in 3 bullet points.* | Tóm tắt việc đã làm trong 3 ý |

---

## 7. Quy trình làm việc với AI

### 7.1 Chia việc thế nào cho vừa

- **Một việc = 15–45 phút làm** = sửa **tối đa 3–4 file** = **1 commit**.
- Nếu không mô tả được kết quả của việc trong 1 câu, thì việc đó quá to, hãy chia nhỏ tiếp.
- **Thứ tự cho mỗi tính năng có database:**
  1. Migration (bảng).
  2. RPC (hàm), test bằng SQL.
  3. Sinh lại kiểu TypeScript.
  4. Hàm trong `services/api.ts`.
  5. Store.
  6. UI và 3D.
- Không gộp các bước này vào một prompt.
- Ví dụ chia "chuồng gà" thành 6 việc:
  1. Bảng cấu hình.
  2. Bảng trạng thái.
  3. `build_structure`.
  4. `buy_animal`.
  5. Vẽ chuồng trong góc phần tư.
  6. Bảng chuồng ở UI.

### 7.2 Vòng làm một việc

```
1. git status → phải "sạch" (không có thay đổi dở dang)
2. git switch -c feat/<ten-viec>
3. Dán prompt (mẫu 6.1) cho AI
4. Chạy thử: npm run dev / npm run test / npx supabase db push
5. git diff → đọc lại thay đổi, chỗ nào không hiểu thì hỏi AI giải thích
6. git add . && git commit -m "feat: ..."
7. Lặp lại 3–6 cho các việc nhỏ khác của cùng tính năng
8. git push → mở link Preview của Vercel thử lần cuối
9. git switch main && git merge feat/<ten-viec> && git push → lên Production
```

### 7.3 File quy tắc cho AI (`AGENTS.md`)

Đây là file AI đọc **đầu tiên** mỗi lần làm việc. Nhiều công cụ AI tự đọc `AGENTS.md`. Nếu công cụ bạn dùng không tự đọc, các prompt mẫu đã có sẵn câu "Read AGENTS.md first". Nếu dùng Claude Code, tạo thêm file `CLAUDE.md` chỉ có một dòng: "Xem AGENTS.md".

**Nội dung nên có** (bạn tự viết hoặc nhờ AI viết theo dàn ý này):

1. **Dự án là gì**: 2 dòng, kèm link tới `docs/GDD.md` và `docs/ROADMAP.md`.
2. **Stack và phiên bản**: React, R3F, Drei, Three, Zustand, Tailwind, Supabase JS (ghi số phiên bản thật lấy từ `package.json`).
3. **Lệnh**: `npm run dev`, `npm run build`, `npm run test`, `npx supabase db push`, lệnh sinh kiểu TypeScript.
4. **Luật vàng:**
   - Server quyết định mọi thứ. Client không bao giờ ghi thẳng vào bảng. Mọi thao tác ghi đi qua RPC trong `supabase/migrations`.
   - Mọi RPC theo khung 9 bước ở ROADMAP mục 2.8.
   - Không bao giờ đưa secret key / service_role key vào code frontend.
   - Không tự ý thêm thư viện. Phải hỏi trước.
   - TypeScript strict, không dùng `any`.
   - Hàm tính toán đặt trong `src/logic/` và phải có test.
   - Tuân theo luật ranh giới thư mục ở ROADMAP mục 3.
   - Không đổi tên hay di chuyển file nếu không được yêu cầu.
   - Không sửa migration cũ. Muốn thay đổi thì tạo migration mới.
   - Chữ hiển thị trên giao diện là tiếng Việt. Tên biến, tên hàm, comment là tiếng Anh.
5. **Cách trả lời:**
   - Thay đổi nhỏ.
   - Việc sửa từ 3 file trở lên thì trình bày kế hoạch trước.
   - Cuối câu trả lời liệt kê các file đã sửa và gợi ý một commit message.
   - Giải thích bằng tiếng Việt, giữ thuật ngữ tiếng Anh. Khi đã quen, đổi thành "explain in simple English" để luyện tiếng Anh.

### 7.4 Báo lỗi cho AI hiệu quả

**Tìm thông báo lỗi ở đâu:**

| Nơi | Cách mở | Thấy gì |
|---|---|---|
| Console của trình duyệt | F12 → tab Console | Lỗi JavaScript, lỗi React |
| Network của trình duyệt | F12 → tab Network → bấm vào request `rpc/...` → Response | Mã lỗi server trả về, ví dụ `NOT_ENOUGH_COINS` |
| Terminal | Cửa sổ đang chạy `npm run dev` | Lỗi build, lỗi TypeScript |
| Supabase | Dashboard → Logs (Postgres, API) | Lỗi SQL, lỗi trong hàm |
| Vercel | Project → Deployments → bản deploy → Build Logs | Lỗi khi build trên Vercel |

**Mẫu báo lỗi** (copy và điền vào):
```
Bug: <one sentence>
Steps to reproduce: 1) ... 2) ... 3) ...
Expected: ...
Actual: ...
Full error message (copied, not retyped): ...
Where I saw it: browser console / network response / terminal / Supabase logs
Relevant files: src/...
Last working commit: <hash> ("feat: ...")
What I already tried: ...
Please explain the root cause first, then propose the smallest fix.
```

**Mẹo:**
- Luôn **copy nguyên văn** thông báo lỗi, đừng tóm tắt. Chụp màn hình nếu lỗi nằm ở hình ảnh 3D.
- Ghi rõ commit gần nhất còn chạy đúng. Bạn có thể xem thay đổi kể từ commit đó bằng `git diff <hash>` để chỉ cho AI.

### 7.5 Khi nào commit

| Nên commit | Không bao giờ commit |
|---|---|
| Mỗi khi một việc nhỏ chạy được | `.env.local`, `.env.test.local` (chứa khóa) |
| **Trước** khi nhờ AI sửa một thứ lớn | `node_modules/`, `dist/` |
| Trước khi thử nghiệm một ý tưởng | File dump database |
| Cuối buổi làm (trên nhánh `feat/...`; nếu còn dở thì ghi `wip:` ở đầu message) | Code đang hỏng **lên nhánh `main`** |

### 7.6 Quay lại khi AI sửa hỏng

| Tình huống | Lệnh | Mất gì |
|---|---|---|
| AI làm hỏng 1 file, **chưa commit** | `git restore src/duong-dan/file.ts` | Thay đổi chưa commit của file đó |
| AI làm hỏng nhiều file, **chưa commit**, muốn bỏ hết | `git restore .` rồi `git clean -n` (xem trước file mới) và `git clean -fd` (xóa file mới) | Mọi thay đổi chưa commit |
| Muốn cất tạm để thử cách khác | `git stash` … rồi `git stash pop` | Không mất gì |
| Đã commit, muốn hủy commit đó | `git revert <hash>` | Không mất gì (tạo thêm commit đảo ngược) |
| Thử nghiệm lớn, rủi ro | Làm trên nhánh `experiment/...`. Hỏng thì `git switch main` và `git branch -D experiment/...` | Chỉ mất nhánh thử nghiệm |
| Muốn quay hẳn về một mốc cũ, **chưa push** | `git reset --hard <hash>` ⚠️ | Mọi commit sau mốc đó và mọi thay đổi chưa commit |
| Tưởng đã mất commit | `git reflog` → tìm hash → `git switch -c cuu-ho <hash>` | Thường lấy lại được |
| Migration sai, **đã chạy** lên database | Viết **migration mới** để sửa. Không sửa file cũ. | – |
| Bản trên Vercel bị lỗi | Vercel → Deployments → chọn bản cũ còn tốt → **Instant Rollback** hoặc **Promote to Production** | – |

**Quy tắc 2 lần:** nếu AI sửa **2 lần** vẫn không hết lỗi:
1. **Dừng lại.**
2. `git restore .` để về trạng thái sạch.
3. Hỏi AI *"What is the root cause? Don't write code yet."*
4. Chia việc nhỏ hơn hoặc đưa thêm ngữ cảnh (file liên quan, thông báo lỗi đầy đủ).
5. Có thể mở **cuộc trò chuyện mới** với AI. Cuộc trò chuyện quá dài làm AI dễ rối.

### 7.7 Checklist khi đọc code AI viết

**Với hàm SQL (quan trọng nhất, vì liên quan tiền và gian lận):**
- ☐ Có kiểm tra `auth.uid()` và gọi `assert_player`?
- ☐ Có `SECURITY DEFINER` + `set search_path = ''` + viết đầy đủ tên bảng `public.xxx`?
- ☐ Có **khóa dòng** (`for update`) **trước khi** kiểm tra tiền hoặc hàng?
- ☐ Có kiểm tra **quyền sở hữu** của mọi id client gửi lên?
- ☐ Chỉ dùng `now()` của server? Không nhận thời gian, giá hay số lượng "kết quả" từ client?
- ☐ Có giới hạn đầu vào: mảng không quá dài, số lượng > 0?
- ☐ Mọi thay đổi xu đều qua `add_coins` (có ghi sổ cái)?
- ☐ Đã thu hồi quyền chạy của `anon`?

**Với code client:**
- ☐ Không gọi `.insert/.update/.delete` vào bảng game (chỉ `.select` và `.rpc`)?
- ☐ Không viết cứng khóa bí mật trong code?
- ☐ Logic tính toán nằm trong `src/logic/` và có test?
- ☐ Không thêm thư viện lạ?

### 7.8 Học từ AI chứ không chỉ chép

- Sau mỗi giai đoạn, ghi vào `docs/LEARNING.md`:
  - 3 điều đã học.
  - 5 từ hoặc cụm từ tiếng Anh mới.
  - 1 lỗi đã gặp và cách sửa.
- Mỗi tuần chọn 1 file AI viết, đọc kỹ từng dòng, rồi tự giải thích lại cho AI nghe. Nhờ AI chỉ ra chỗ bạn hiểu sai.
- Thỉnh thoảng **tự viết** một hàm nhỏ trong `logic/` trước, rồi nhờ AI review.

---

## 8. Rủi ro thường gặp và cách xử lý

### 8.1 Hạn mức gói miễn phí

*Kiểm tra ngày 08/10/2026. Hạn mức có thể thay đổi, hãy xem lại tại supabase.com/pricing và vercel.com/docs/limits.*

| Dịch vụ | Hạn mức | Ảnh hưởng tới dự án |
|---|---|---|
| Supabase – Database | 500 MB | Đủ nếu dọn sổ cái sau 30 ngày (xem 8.2) |
| Supabase – Egress (băng thông ra) | 5 GB/tháng (thêm 5 GB cached egress) | **Cần chú ý**: chỉ đọc cột cần thiết, không tải lại toàn bản đồ liên tục |
| Supabase – File storage | 1 GB | Không dùng. Asset đặt trên Vercel. |
| Supabase – Người dùng hoạt động/tháng (MAU) | 50.000 | Thoải mái |
| Supabase – Realtime | 200 kết nối đồng thời; **2 triệu tin nhắn/tháng** | Broadcast tính **1 tin gửi + 1 tin cho mỗi người nhận**. Postgres Changes tính 1 tin cho mỗi người nghe **mỗi dòng thay đổi**. |
| Supabase – Số project | 2 project đang hoạt động | Một cho dev, một cho production |
| Supabase – **Tạm dừng** | Project bị tạm dừng sau **1 tuần không hoạt động** | Khi tạm dừng, Cron cũng ngừng |
| Supabase – Email mặc định | **2 email/giờ** cho cả project | Dùng đăng nhập Google, hoặc cấu hình SMTP riêng |
| Vercel Hobby – Băng thông (Fast Data Transfer) | 100 GB/tháng | Thoải mái nếu đã nén model |
| Vercel Hobby – Số lần deploy | 100 lần/ngày | Thoải mái |
| Vercel Hobby – Điều kiện | **Chỉ dùng phi thương mại** (nhận donate thì được). **Không kết nối được repo của GitHub organization.** | Không gắn quảng cáo, không bán gì. Repo đặt trong tài khoản cá nhân. |

### 8.2 Ước tính mức sử dụng (để thấy vì sao phải thiết kế như vậy)

**Tin nhắn Realtime mỗi tháng.** Giả sử: lúc đông nhất có 10 người online, mỗi người 200 thao tác/giờ, chơi 3 giờ/ngày.

| Cách làm | Công thức | Kết quả |
|---|---|---|
| ✅ **Broadcast theo chunk** (mỗi thao tác 1 tin, trung bình 2 người đang nhìn chunk đó) | (1 + 2) × 10 × 200 × 3 × 30 | ≈ **540.000** tin, dưới hạn mức 2 triệu |
| ❌ Postgres Changes trên bảng `plots` (thu hoạch 16 luống = 16 dòng thay đổi, cả 10 người cùng nghe) | 16 × 10 × 10 × 200 × 3 × 30 | ≈ **28,8 triệu** tin, **gấp 14 lần hạn mức** |

**Dung lượng database:**
- `plots` ≈ 16.000 dòng, vài MB.
- `coin_ledger` ≈ 20.000 dòng/ngày × 30 ngày ≈ 600.000 dòng, khoảng 100 MB tính cả chỉ mục.
- Các bảng khác nhỏ.
- Tổng **< 200 MB**, dưới hạn mức 500 MB. Nếu không dọn sổ cái, sau khoảng 4 tháng sẽ đầy.

**Egress (băng thông ra):**
- Một lần tải toàn bản đồ ≈ 0,5 MB.
- Nếu 50 người × 10 lần tải lại/ngày × 30 ngày ≈ **7,5 GB**, **vượt hạn mức 5 GB**.
- Cách xử lý:
  - Tải toàn bản đồ **1 lần mỗi phiên chơi**, sau đó chỉ đọc lại những ô đất có chuông báo.
  - Chỉ chọn cột cần thiết.
  - Cache dữ liệu cấu hình trong localStorage.
  - Sau khi xử lý: khoảng 1–2 GB/tháng.

### 8.3 Bảng rủi ro

| Rủi ro | Dấu hiệu | Cách phòng | Khi xảy ra thì làm gì |
|---|---|---|---|
| **Giật, nóng máy trên điện thoại** | FPS < 30, máy nóng, hao pin | Instancing, chunk, `frameloop="demand"`, giới hạn DPR, không bóng đổ, không texture (mục 4) | Đo bằng `r3f-perf`, tìm thứ tốn nhiều draw call nhất, bật LOD, giảm số tam giác của model |
| **Gian lận sửa tiền, sửa thời gian** | Xu tăng vọt bất thường trong `admin.money_supply` | Server quyết định mọi thứ, RLS chỉ đọc, checklist 7.7, bộ test gian lận | Tra sổ cái tìm nguồn, vá lỗ hổng, sửa số dư bằng migration của admin (ghi sổ cái lý do `admin`), cấm tài khoản nếu cố ý |
| **Tài khoản phụ (khi có chợ)** | Nhiều tài khoản mới chỉ giao dịch với một người | Cấp 8 + 3 ngày, khoảng giá, giới hạn nhận xu, captcha | View `suspicious_pairs`, khóa giao dịch, cấm tài khoản |
| **Chốt đấu giá sai, mua trùng** | Hai người cùng nhận một món, tiền lệch | Khóa dòng, chuyển trạng thái trong cùng một transaction, hàm chốt gọi nhiều lần vẫn an toàn, test đồng thời | Tra `auction_bids` và sổ cái, hoàn tiền bằng tay, viết test tái hiện lỗi rồi mới sửa |
| **Supabase tạm dừng project** | Web báo lỗi kết nối sau kỳ nghỉ | Vào game ít nhất mỗi tuần; trước kỳ nghỉ dài thì nhắc bạn bè chơi | Vào Supabase Dashboard → **Restore project** (dữ liệu vẫn còn). Kiểm tra Cron chạy lại chưa. |
| **Vượt egress / tin nhắn Realtime** | Usage trong Dashboard gần 80% | Thiết kế ở 8.2; Broadcast theo chunk | Giảm tần suất đọc lại, gộp tin, tắt Presence với người chỉ đang xem |
| **Database gần đầy** | Usage > 400 MB | Cron dọn sổ cái, không lưu dữ liệu thừa | Giảm thời gian giữ sổ cái xuống 14 ngày, xóa dữ liệu dev, `vacuum` |
| **Không gửi được email đăng nhập** | Người chơi kêu không nhận được email | Dùng Google làm cách đăng nhập chính | Cấu hình SMTP miễn phí (ví dụ Brevo, Resend) trong Supabase Auth |
| **Lộ khóa bí mật** | Thấy secret key trong code hoặc trên GitHub | `.env.local` có trong `.gitignore`; frontend chỉ dùng publishable/anon key (khóa này **được phép công khai** vì đã có RLS bảo vệ) | **Đổi khóa ngay** (rotate) trong Supabase Dashboard, xóa khỏi lịch sử Git, kiểm tra sổ cái |
| **Phình phạm vi (scope creep)** | Đang GĐ3 mà đã muốn làm đấu giá | Bám GDD mục 11. Ý tưởng mới ghi vào `docs/IDEAS.md`, chưa làm vội. | Tự hỏi: "Tính năng này có trong MVP không?" Nếu không thì để sau. |
| **AI dùng API cũ hoặc tự bịa** | Lỗi kiểu "X is not a function", import không tồn tại | Ghi phiên bản trong `AGENTS.md`; hỏi AI đang giả định phiên bản nào; dán link tài liệu chính thức | Đối chiếu tài liệu của R3F, Drei, Supabase, rồi yêu cầu AI sửa theo tài liệu đó |
| **Migration làm hỏng dữ liệu** | Bảng mất cột, dữ liệu sai | Luôn chạy trên project **dev** trước; dump database mỗi tuần | Khôi phục từ file dump, viết migration sửa |
| **Kinh tế lệch** (quá dễ hoặc quá khó) | Bạn bè mua hết đất trong 2 ngày, hoặc chán vì quá chậm | Mọi số liệu nằm trong bảng cấu hình; chơi thử sớm | Chỉnh `land_growth`, giá, thưởng bằng một migration dữ liệu. Không cần sửa code. |
| **Lệch múi giờ** | Nhiệm vụ ngày đổi lúc 7h sáng thay vì 0h | Lưu `timestamptz` (UTC); tính ngày bằng `vn_today()` ở server | Kiểm tra mọi chỗ tính "hôm nay" đều dùng `vn_today()` |
| **Lỗi riêng trên iPhone** | Safari không có tiếng, chạm sai | Bật âm thanh sau lần chạm đầu; thử trên iPhone nếu có | Nhờ bạn có iPhone thử và gửi ảnh chụp màn hình |
| **Mất động lực** | Nhiều ngày không mở dự án | Mỗi tuần có một kết quả chạy được; deploy để khoe bạn bè; ghi `LEARNING.md` | Chọn việc nhỏ nhất có thể làm trong 20 phút để quay lại nhịp |

---

## Bước tiếp theo: bắt đầu Giai đoạn 0

**Buổi 1 (khoảng 1 giờ):**
1. Cài Node.js LTS và Git (GĐ0, việc 1–2). Kiểm tra bằng `node -v` và `git --version`.
2. Đặt Git Bash làm terminal mặc định và cài các extension VS Code (việc 3–4).
3. Cấu hình `git config` (việc 6).

**Buổi 2 (khoảng 1–2 giờ):**
4. Tạo dự án Vite ngay trong `C:\GAME3DFARM`. ⚠️ Nhớ chọn **"Ignore files and continue"** (việc 7).
5. Chạy `git init` và tạo commit đầu tiên, có cả thư mục `docs/` (việc 8).
6. Đẩy lên GitHub và deploy lên Vercel (việc 9–10).

**Buổi 3:**
7. Viết `AGENTS.md` (mục 7.3).
8. Dán **Prompt mẫu GĐ0** cho AI. Chạy thử, commit, push, mở trên điện thoại.

Khi xong GĐ0, bạn sẽ có một link Vercel hiện cảnh 3D đầu tiên. Đó là nền móng cho mọi thứ phía sau.
