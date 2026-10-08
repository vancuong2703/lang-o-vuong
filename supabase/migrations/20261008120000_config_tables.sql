-- Config tables: game data from docs/GDD.md (ROADMAP 2.3).
-- Everyone can read them. Nobody can write them through the API; changes come from new migrations.

create table public.game_config (
  key text primary key,
  value jsonb not null,
  description text
);

create table public.items (
  id text primary key,
  name_vi text not null,
  name_en text not null,
  category text not null check (category in ('crop', 'feed', 'animal_product', 'processed', 'rare')),
  base_price integer not null check (base_price >= 0),
  sellable boolean not null default true,
  unlock_level smallint not null default 1,
  sort_order smallint not null default 0
);

create table public.crops (
  item_id text primary key references public.items (id),
  seed_price integer not null check (seed_price >= 0),
  grow_seconds integer not null check (grow_seconds > 0),
  xp integer not null check (xp >= 0)
);

alter table public.game_config enable row level security;
alter table public.items enable row level security;
alter table public.crops enable row level security;

create policy "config is readable by everyone" on public.game_config for select to anon, authenticated using (true);
create policy "items are readable by everyone" on public.items for select to anon, authenticated using (true);
create policy "crops are readable by everyone" on public.crops for select to anon, authenticated using (true);

insert into public.game_config (key, value, description) values
  ('config_version', '1', 'Bump when config data changes so clients refresh their cache'),
  ('starting_coins', '150', 'Coins for a new player (GDD 4.2)'),
  ('xp_factor', '40', 'XP to next level = xp_factor * level^2 (GDD 2.5)'),
  ('max_level', '30', 'Max player level in MVP'),
  ('barn_capacity', '[75, 150, 300, 600, 1200]', 'Barn capacity by barn level 1..5 (GDD 5.2)'),
  ('land_base_price', '500', 'Land price = base * growth^(owned-1) (GDD 4.4)'),
  ('land_growth', '1.5', 'Land price growth factor'),
  ('rate_limit_per_min', '300', 'Max RPC calls per player per minute');

insert into public.items (id, name_vi, name_en, category, base_price, unlock_level, sort_order) values
  ('bok_choy',     'Cải xanh',   'Bok choy',     'crop', 10,   1,  1),
  ('radish',       'Củ cải',     'Radish',       'crop', 25,   2,  2),
  ('carrot',       'Cà rốt',     'Carrot',       'crop', 50,   3,  3),
  ('corn',         'Ngô',        'Corn',         'crop', 90,   5,  4),
  ('tomato',       'Cà chua',    'Tomato',       'crop', 160,  7,  5),
  ('sweet_potato', 'Khoai lang', 'Sweet potato', 'crop', 300,  9,  6),
  ('watermelon',   'Dưa hấu',    'Watermelon',   'crop', 540,  11, 7),
  ('pumpkin',      'Bí ngô',     'Pumpkin',      'crop', 950,  13, 8),
  ('rice',         'Lúa',        'Rice',         'crop', 1450, 15, 9),
  ('dragon_fruit', 'Thanh long', 'Dragon fruit', 'crop', 2100, 18, 10);

insert into public.crops (item_id, seed_price, grow_seconds, xp) values
  ('bok_choy',     5,   30,    1),
  ('radish',       10,  120,   2),
  ('carrot',       20,  300,   4),
  ('corn',         35,  600,   6),
  ('tomato',       60,  1200,  10),
  ('sweet_potato', 100, 2700,  18),
  ('watermelon',   180, 5400,  30),
  ('pumpkin',      300, 10800, 50),
  ('rice',         450, 18000, 75),
  ('dragon_fruit', 600, 28800, 110);
