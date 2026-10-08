-- State tables: player data (ROADMAP 2.4) + the 32x32 map (GDD 6.3).
-- RLS: clients can only READ. Every write goes through RPC functions.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(username) between 3 and 16),
  farm_name text not null check (char_length(farm_name) between 1 and 24),
  avatar_color text not null default '#4E9F3D',
  coins bigint not null default 0 check (coins >= 0),
  xp bigint not null default 0 check (xp >= 0),
  level smallint not null default 1,
  weekly_xp bigint not null default 0,
  week_start date,
  house_level smallint not null default 1,
  barn_level smallint not null default 1,
  tool_level smallint not null default 1,
  home_parcel_id bigint,
  login_streak smallint not null default 0,
  last_login_date date,
  tutorial_step smallint not null default 1,
  rl_window_start timestamptz not null default now(),
  rl_count integer not null default 0,
  is_admin boolean not null default false,
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

create table public.player_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  harvested_total bigint not null default 0,
  crop_types_planted text[] not null default '{}'
);

create table public.parcels (
  id bigint generated always as identity primary key,
  x smallint not null check (x >= 0),
  y smallint not null check (y >= 0),
  chunk_x smallint generated always as ((x / 8)::smallint) stored,
  chunk_y smallint generated always as ((y / 8)::smallint) stored,
  zone text not null default 'normal' check (zone in ('normal', 'town', 'lake', 'forest', 'alluvial')),
  is_home_slot boolean not null default false,
  priority_slot_id bigint references public.parcels (id),
  owner_id uuid references public.profiles (id) on delete set null,
  fertility_level smallint not null default 1,
  purchased_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (x, y)
);

create index parcels_owner_idx on public.parcels (owner_id);
create index parcels_chunk_idx on public.parcels (chunk_x, chunk_y);

alter table public.profiles
  add constraint profiles_home_parcel_fk foreign key (home_parcel_id) references public.parcels (id);

create table public.plots (
  id bigint generated always as identity primary key,
  parcel_id bigint not null references public.parcels (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  lx smallint not null check (lx between 0 and 3),
  ly smallint not null check (ly between 0 and 3),
  crop_item_id text references public.crops (item_id),
  planted_at timestamptz,
  ready_at timestamptz,
  unique (parcel_id, lx, ly),
  check (
    (crop_item_id is null and planted_at is null and ready_at is null)
    or (crop_item_id is not null and planted_at is not null and ready_at is not null)
  )
);

create index plots_owner_idx on public.plots (owner_id);

create table public.inventory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.items (id),
  qty integer not null default 0 check (qty >= 0),
  primary key (user_id, item_id)
);

create table public.coin_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta bigint not null,
  balance_after bigint not null,
  reason text not null,
  counterpart_id uuid references public.profiles (id) on delete set null,
  ref jsonb,
  created_at timestamptz not null default now()
);

create index coin_ledger_user_time_idx on public.coin_ledger (user_id, created_at desc);

-- RLS: read-only for clients. No insert/update/delete policies on purpose.
alter table public.profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.parcels enable row level security;
alter table public.plots enable row level security;
alter table public.inventory enable row level security;
alter table public.coin_ledger enable row level security;

create policy "profiles are public in game" on public.profiles for select to authenticated using (true);
create policy "parcels are visible to players" on public.parcels for select to authenticated using (true);
create policy "plots are visible to players" on public.plots for select to authenticated using (true);
create policy "own stats only" on public.player_stats for select to authenticated using (user_id = (select auth.uid()));
create policy "own inventory only" on public.inventory for select to authenticated using (user_id = (select auth.uid()));
create policy "own ledger only" on public.coin_ledger for select to authenticated using (user_id = (select auth.uid()));

-- Extra safety on top of RLS: the API roles cannot write any public table directly.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;

-- Seed the 32x32 map (GDD 6.3).
insert into public.parcels (x, y)
select x, y from generate_series(0, 31) as x, generate_series(0, 31) as y;

-- Town square in the middle (6x6).
update public.parcels set zone = 'town' where x between 13 and 18 and y between 13 and 18;

-- Forest on the west and south border lines (free lines, never in a priority zone).
update public.parcels set zone = 'forest' where x = 0 or y = 0;

-- Two small lakes on free columns x = 8 and x = 24.
update public.parcels set zone = 'lake' where (x = 8 and y between 20 and 24) or (x = 24 and y between 6 and 10);

-- Alluvial land next to the lakes (locked until auctions, post-MVP).
update public.parcels set zone = 'alluvial'
where (x = 8 and y in (18, 19, 25, 26))
   or (x = 24 and y in (4, 5, 11, 12))
   or (y = 8 and x in (23, 25))
   or (y = 24 and x in (7, 9));

-- 60 home slots every 4 parcels, except inside the town square.
update public.parcels set is_home_slot = true
where x in (2, 6, 10, 14, 18, 22, 26, 30)
  and y in (2, 6, 10, 14, 18, 22, 26, 30)
  and zone = 'normal';

-- Priority zone: the 8 parcels around each home slot belong to that slot.
update public.parcels p
set priority_slot_id = h.id
from public.parcels h
where h.is_home_slot
  and p.id <> h.id
  and abs(p.x - h.x) <= 1
  and abs(p.y - h.y) <= 1;
