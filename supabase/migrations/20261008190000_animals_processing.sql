-- Phase 5: animals and processing (GDD 3.3, 3.4, 5.5, 5.6; ROADMAP GĐ5).
-- A structure (pen or processor) takes one 2x2 quadrant of an owned parcel; the 4 plots there are removed.

update public.game_config set value = '5' where key = 'config_version';

-------------------------------------------------------------------------------
-- 1. New items
-------------------------------------------------------------------------------
insert into public.items (id, name_vi, name_en, category, base_price, sellable, unlock_level, sort_order) values
  ('chicken_feed', 'Thức ăn gà', 'Chicken feed', 'feed', 20, false, 4, 101),
  ('cow_feed', 'Thức ăn bò', 'Cow feed', 'feed', 115, false, 8, 102),
  ('egg', 'Trứng gà', 'Egg', 'animal_product', 110, true, 4, 201),
  ('milk', 'Sữa bò', 'Milk', 'animal_product', 450, true, 8, 202),
  ('cornmeal', 'Bột ngô', 'Cornmeal', 'processed', 360, true, 6, 301),
  ('corn_bread', 'Bánh ngô', 'Corn bread', 'processed', 780, true, 7, 302),
  ('butter', 'Bơ', 'Butter', 'processed', 1220, true, 9, 303),
  ('cheese', 'Phô mai', 'Cheese', 'processed', 1890, true, 9, 304),
  ('pumpkin_pie', 'Bánh bí ngô', 'Pumpkin pie', 'processed', 2110, true, 13, 305);

-------------------------------------------------------------------------------
-- 2. Config tables: structure types, animal types, recipes
-------------------------------------------------------------------------------
create table public.structure_types (
  id text primary key,
  name_vi text not null,
  kind text not null check (kind in ('pen', 'processor')),
  build_price integer not null check (build_price >= 0),
  unlock_level smallint not null,
  max_per_player smallint not null default 1,
  sort_order smallint not null default 0
);

insert into public.structure_types (id, name_vi, kind, build_price, unlock_level, max_per_player, sort_order) values
  ('chicken_pen', 'Chuồng gà', 'pen', 800, 4, 1, 1),
  ('feed_mill', 'Máy xay thức ăn', 'processor', 600, 4, 1, 2),
  ('mill', 'Cối xay', 'processor', 1500, 6, 1, 3),
  ('bakery', 'Lò bánh', 'processor', 2500, 7, 1, 4),
  ('cow_pen', 'Chuồng bò', 'pen', 3000, 8, 1, 5),
  ('dairy', 'Xưởng sữa', 'processor', 5000, 9, 1, 6);

create table public.animal_types (
  id text primary key,
  name_vi text not null,
  pen_type_id text not null unique references public.structure_types (id),
  unlock_level smallint not null,
  price integer not null check (price >= 0),
  feed_item_id text not null references public.items (id),
  product_item_id text not null references public.items (id),
  cycle_seconds integer not null check (cycle_seconds > 0),
  xp integer not null
);

insert into public.animal_types (id, name_vi, pen_type_id, unlock_level, price, feed_item_id, product_item_id, cycle_seconds, xp) values
  ('chicken', 'Gà', 'chicken_pen', 4, 150, 'chicken_feed', 'egg', 1200, 3),
  ('cow', 'Bò', 'cow_pen', 8, 1200, 'cow_feed', 'milk', 3600, 12);

create table public.recipes (
  id text primary key,
  structure_type_id text not null references public.structure_types (id),
  output_item_id text not null references public.items (id),
  output_qty integer not null check (output_qty > 0),
  seconds integer not null check (seconds > 0),
  unlock_level smallint not null,
  xp integer not null,
  sort_order smallint not null default 0
);

create table public.recipe_inputs (
  recipe_id text not null references public.recipes (id) on delete cascade,
  item_id text not null references public.items (id),
  qty integer not null check (qty > 0),
  primary key (recipe_id, item_id)
);

insert into public.recipes (id, structure_type_id, output_item_id, output_qty, seconds, unlock_level, xp, sort_order) values
  ('chicken_feed', 'feed_mill', 'chicken_feed', 3, 60, 4, 1, 1),
  ('cow_feed', 'feed_mill', 'cow_feed', 3, 300, 8, 3, 2),
  ('cornmeal', 'mill', 'cornmeal', 1, 600, 6, 5, 1),
  ('corn_bread', 'bakery', 'corn_bread', 1, 1800, 7, 12, 1),
  ('pumpkin_pie', 'bakery', 'pumpkin_pie', 1, 3600, 13, 30, 2),
  ('butter', 'dairy', 'butter', 1, 1800, 9, 18, 1),
  ('cheese', 'dairy', 'cheese', 1, 3600, 9, 28, 2);

insert into public.recipe_inputs (recipe_id, item_id, qty) values
  ('chicken_feed', 'bok_choy', 6),
  ('cow_feed', 'corn', 3),
  ('cow_feed', 'radish', 3),
  ('cornmeal', 'corn', 3),
  ('corn_bread', 'cornmeal', 1),
  ('corn_bread', 'egg', 2),
  ('pumpkin_pie', 'pumpkin', 1),
  ('pumpkin_pie', 'egg', 1),
  ('pumpkin_pie', 'milk', 1),
  ('butter', 'milk', 2),
  ('cheese', 'milk', 3);

-- Structure levels live in upgrade_levels too (kind = structure type id).
-- Pens: value = capacity; upgrade cost = 2x / 8x build price (GDD 5.5).
-- Processors: value = queue slots; upgrade cost = build price x 1 / 4 / 16 (GDD 5.6).
alter table public.upgrade_levels drop constraint upgrade_levels_kind_check;
alter table public.upgrade_levels add constraint upgrade_levels_kind_check
  check (kind in ('house', 'barn', 'tool', 'fertility', 'chicken_pen', 'cow_pen', 'feed_mill', 'mill', 'bakery', 'dairy'));

insert into public.upgrade_levels (kind, level, cost, required_player_level, value) values
  ('chicken_pen', 1, 0, 1, 4), ('chicken_pen', 2, 1600, 1, 6), ('chicken_pen', 3, 6400, 1, 8),
  ('cow_pen', 1, 0, 1, 3), ('cow_pen', 2, 6000, 1, 4), ('cow_pen', 3, 24000, 1, 6),
  ('feed_mill', 1, 0, 1, 2), ('feed_mill', 2, 600, 1, 3), ('feed_mill', 3, 2400, 1, 4), ('feed_mill', 4, 9600, 1, 5),
  ('mill', 1, 0, 1, 2), ('mill', 2, 1500, 1, 3), ('mill', 3, 6000, 1, 4), ('mill', 4, 24000, 1, 5),
  ('bakery', 1, 0, 1, 2), ('bakery', 2, 2500, 1, 3), ('bakery', 3, 10000, 1, 4), ('bakery', 4, 40000, 1, 5),
  ('dairy', 1, 0, 1, 2), ('dairy', 2, 5000, 1, 3), ('dairy', 3, 20000, 1, 4), ('dairy', 4, 80000, 1, 5);

alter table public.structure_types enable row level security;
alter table public.animal_types enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_inputs enable row level security;
create policy "structure types are readable by everyone" on public.structure_types for select to anon, authenticated using (true);
create policy "animal types are readable by everyone" on public.animal_types for select to anon, authenticated using (true);
create policy "recipes are readable by everyone" on public.recipes for select to anon, authenticated using (true);
create policy "recipe inputs are readable by everyone" on public.recipe_inputs for select to anon, authenticated using (true);

-------------------------------------------------------------------------------
-- 3. State tables
-------------------------------------------------------------------------------
create table public.structures (
  id bigint generated always as identity primary key,
  parcel_id bigint not null references public.parcels (id) on delete cascade,
  quadrant smallint not null check (quadrant between 0 and 3),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type_id text not null references public.structure_types (id),
  level smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (parcel_id, quadrant)
);

create index structures_owner_idx on public.structures (owner_id);

create table public.animals (
  id bigint generated always as identity primary key,
  structure_id bigint not null references public.structures (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  animal_type_id text not null references public.animal_types (id),
  fed_at timestamptz,
  ready_at timestamptz,
  created_at timestamptz not null default now(),
  -- hungry (both null) or producing / product ready (both set)
  check ((fed_at is null and ready_at is null) or (fed_at is not null and ready_at is not null))
);

create index animals_structure_idx on public.animals (structure_id);

create table public.production_jobs (
  id bigint generated always as identity primary key,
  structure_id bigint not null references public.structures (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id text not null references public.recipes (id),
  start_at timestamptz not null,
  ready_at timestamptz not null,
  collected_at timestamptz
);

create index production_jobs_open_idx on public.production_jobs (structure_id) where collected_at is null;

alter table public.structures enable row level security;
alter table public.animals enable row level security;
alter table public.production_jobs enable row level security;
create policy "structures are visible to players" on public.structures for select to authenticated using (true);
create policy "animals are visible to players" on public.animals for select to authenticated using (true);
create policy "own production jobs only" on public.production_jobs for select to authenticated using (owner_id = (select auth.uid()));

revoke insert, update, delete, truncate on
  public.structure_types, public.animal_types, public.recipes, public.recipe_inputs,
  public.structures, public.animals, public.production_jobs
from anon, authenticated;

-------------------------------------------------------------------------------
-- 4. Player state and world now include structures
-------------------------------------------------------------------------------
create or replace function private.player_state(p_uid uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p) - 'rl_window_start' - 'rl_count' - 'is_admin'
      from public.profiles p
      where p.id = p_uid
    ),
    'barn_capacity', private.barn_capacity(p_uid),
    'inventory', coalesce((
      select jsonb_object_agg(i.item_id, i.qty)
      from public.inventory i
      where i.user_id = p_uid and i.qty > 0
    ), '{}'::jsonb),
    'plots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pl.id, 'parcel_id', pl.parcel_id, 'lx', pl.lx, 'ly', pl.ly,
        'crop_item_id', pl.crop_item_id, 'planted_at', pl.planted_at, 'ready_at', pl.ready_at
      ) order by pl.id)
      from public.plots pl
      where pl.owner_id = p_uid
    ), '[]'::jsonb),
    'structures', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'parcel_id', s.parcel_id, 'quadrant', s.quadrant, 'type_id', s.type_id, 'level', s.level,
        'animals', coalesce((
          select jsonb_agg(jsonb_build_object('id', a.id, 'fed_at', a.fed_at, 'ready_at', a.ready_at) order by a.id)
          from public.animals a
          where a.structure_id = s.id
        ), '[]'::jsonb),
        'jobs', coalesce((
          select jsonb_agg(jsonb_build_object('id', j.id, 'recipe_id', j.recipe_id, 'start_at', j.start_at, 'ready_at', j.ready_at) order by j.ready_at)
          from public.production_jobs j
          where j.structure_id = s.id and j.collected_at is null
        ), '[]'::jsonb)
      ) order by s.id)
      from public.structures s
      where s.owner_id = p_uid
    ), '[]'::jsonb),
    'server_now', now()
  )
$$;

-- structures: [id, parcel_id, quadrant, type_id, level, animal_count]
create or replace function public.get_world()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'parcels', (
      select jsonb_agg(jsonb_build_array(p.id, p.x, p.y, p.zone, p.is_home_slot, p.priority_slot_id, p.owner_id, p.fertility_level) order by p.id)
      from public.parcels p
    ),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pr.id, 'username', pr.username, 'farm_name', pr.farm_name, 'level', pr.level,
        'avatar_color', pr.avatar_color, 'home_parcel_id', pr.home_parcel_id
      ))
      from public.profiles pr
    ), '[]'::jsonb),
    'plots', coalesce((
      select jsonb_agg(jsonb_build_array(pl.id, pl.parcel_id, pl.owner_id, pl.lx, pl.ly, pl.crop_item_id, pl.planted_at, pl.ready_at))
      from public.plots pl
    ), '[]'::jsonb),
    'structures', coalesce((
      select jsonb_agg(jsonb_build_array(
        s.id, s.parcel_id, s.quadrant, s.type_id, s.level,
        (select count(*) from public.animals a where a.structure_id = s.id)::integer
      ))
      from public.structures s
    ), '[]'::jsonb),
    'server_now', now()
  )
$$;

-------------------------------------------------------------------------------
-- 5. RPCs
-------------------------------------------------------------------------------

-- Build a pen or processor on an empty quadrant of an owned parcel (removes its 4 plots).
create function public.build_structure(p_parcel_id bigint, p_quadrant integer, p_type_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_type record;
  v_level smallint;
  v_count integer;
  v_plots bigint[];
  v_empty integer;
  v_id bigint;
begin
  v_uid := private.assert_player();

  if p_quadrant is null or p_quadrant not between 0 and 3 then
    raise exception 'INVALID_INPUT';
  end if;
  select * into v_type from public.structure_types where id = p_type_id;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  perform 1 from public.parcels where id = p_parcel_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;

  select level into v_level from public.profiles where id = v_uid;
  if v_level < v_type.unlock_level then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  select count(*) into v_count from public.structures where owner_id = v_uid and type_id = p_type_id;
  if v_count >= v_type.max_per_player then
    raise exception 'STRUCTURE_LIMIT';
  end if;

  -- Quadrant q covers lx in [(q % 2) * 2, +1] and ly in [(q / 2) * 2, +1] (same as src/logic/grid.ts quadrantOf).
  perform 1 from public.plots
  where parcel_id = p_parcel_id
    and lx between (p_quadrant % 2) * 2 and (p_quadrant % 2) * 2 + 1
    and ly between (p_quadrant / 2) * 2 and (p_quadrant / 2) * 2 + 1
  for update;

  v_plots := array(
    select id from public.plots
    where parcel_id = p_parcel_id
      and lx between (p_quadrant % 2) * 2 and (p_quadrant % 2) * 2 + 1
      and ly between (p_quadrant / 2) * 2 and (p_quadrant / 2) * 2 + 1
  );
  -- Fewer than 4 plots = the house corner of the home parcel, or a structure is already there.
  if coalesce(cardinality(v_plots), 0) <> 4 then
    raise exception 'QUADRANT_TAKEN';
  end if;

  select count(*) into v_empty from public.plots where id = any (v_plots) and crop_item_id is null;
  if v_empty <> 4 then
    raise exception 'PLOT_NOT_EMPTY';
  end if;

  perform private.add_coins(v_uid, -v_type.build_price, 'build',
    jsonb_build_object('type', p_type_id, 'parcel_id', p_parcel_id, 'quadrant', p_quadrant));

  delete from public.plots where id = any (v_plots);
  insert into public.structures (parcel_id, quadrant, owner_id, type_id)
  values (p_parcel_id, p_quadrant, v_uid, p_type_id)
  returning id into v_id;

  return private.player_state(v_uid) || jsonb_build_object('built_structure_id', v_id);
end;
$$;

-- Buy one animal for a pen (up to the pen's capacity for its level).
create function public.buy_animal(p_structure_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_s record;
  v_a record;
  v_level smallint;
  v_count integer;
begin
  v_uid := private.assert_player();

  select * into v_s from public.structures where id = p_structure_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  select * into v_a from public.animal_types where pen_type_id = v_s.type_id;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  select level into v_level from public.profiles where id = v_uid;
  if v_level < v_a.unlock_level then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  select count(*) into v_count from public.animals where structure_id = v_s.id;
  if v_count >= private.upgrade_value(v_s.type_id, v_s.level)::integer then
    raise exception 'PEN_FULL';
  end if;

  perform private.add_coins(v_uid, -v_a.price, 'animal', jsonb_build_object('animal', v_a.id, 'structure_id', v_s.id));
  insert into public.animals (structure_id, owner_id, animal_type_id) values (v_s.id, v_uid, v_a.id);

  return private.player_state(v_uid);
end;
$$;

-- Feed every hungry animal in a pen while there is feed in the barn (1 feed per animal).
create function public.feed_animals(p_structure_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_s record;
  v_a record;
  v_hungry integer;
  v_have integer;
  v_n integer;
begin
  v_uid := private.assert_player();

  select * into v_s from public.structures where id = p_structure_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  select * into v_a from public.animal_types where pen_type_id = v_s.type_id;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  select count(*) into v_hungry from public.animals where structure_id = v_s.id and fed_at is null;
  if v_hungry = 0 then
    raise exception 'NOTHING_TO_DO';
  end if;

  select coalesce((select qty from public.inventory where user_id = v_uid and item_id = v_a.feed_item_id), 0) into v_have;
  v_n := least(v_hungry, v_have);
  if v_n = 0 then
    raise exception 'NOT_ENOUGH_ITEMS';
  end if;

  perform private.take_items(v_uid, v_a.feed_item_id, v_n);
  update public.animals
  set fed_at = now(), ready_at = now() + make_interval(secs => v_a.cycle_seconds)
  where id in (
    select id from public.animals where structure_id = v_s.id and fed_at is null order by id limit v_n
  );

  return private.player_state(v_uid) || jsonb_build_object('fed', v_n, 'still_hungry', v_hungry - v_n);
end;
$$;

-- Collect products from animals that are ready (as many as the barn can hold).
create function public.collect_animals(p_structure_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_s record;
  v_a record;
  v_ready integer;
  v_n integer;
  v_level_up boolean;
begin
  v_uid := private.assert_player();

  select * into v_s from public.structures where id = p_structure_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  select * into v_a from public.animal_types where pen_type_id = v_s.type_id;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  -- Server time only: a product is ready when ready_at <= now().
  select count(*) into v_ready from public.animals where structure_id = v_s.id and ready_at <= now();
  if v_ready = 0 then
    raise exception 'NOT_READY';
  end if;

  v_n := least(v_ready, private.barn_capacity(v_uid) - private.barn_used(v_uid));
  if v_n <= 0 then
    raise exception 'BARN_FULL';
  end if;

  perform private.give_items(v_uid, v_a.product_item_id, v_n);
  update public.animals
  set fed_at = null, ready_at = null
  where id in (
    select id from public.animals where structure_id = v_s.id and ready_at <= now() order by ready_at limit v_n
  );
  v_level_up := private.add_xp(v_uid, v_a.xp * v_n);

  return private.player_state(v_uid) || jsonb_build_object('collected', v_n, 'level_up', v_level_up);
end;
$$;

-- Queue one recipe in a processor. Inputs are taken now; the job starts when the previous one ends.
create function public.start_production(p_structure_id bigint, p_recipe_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_s record;
  v_r record;
  v_level smallint;
  v_queue integer;
  v_last_ready timestamptz;
  v_start timestamptz;
  v_in record;
begin
  v_uid := private.assert_player();

  -- Locking the structure serializes queue updates for this processor.
  select * into v_s from public.structures where id = p_structure_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  select * into v_r from public.recipes where id = p_recipe_id;
  if not found or v_r.structure_type_id <> v_s.type_id then
    raise exception 'INVALID_INPUT';
  end if;

  select level into v_level from public.profiles where id = v_uid;
  if v_level < v_r.unlock_level then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  select count(*), max(ready_at) into v_queue, v_last_ready
  from public.production_jobs
  where structure_id = v_s.id and collected_at is null;
  if v_queue >= private.upgrade_value(v_s.type_id, v_s.level)::integer then
    raise exception 'QUEUE_FULL';
  end if;

  for v_in in select item_id, qty from public.recipe_inputs where recipe_id = v_r.id loop
    perform private.take_items(v_uid, v_in.item_id, v_in.qty);
  end loop;

  v_start := greatest(now(), coalesce(v_last_ready, now()));
  insert into public.production_jobs (structure_id, owner_id, recipe_id, start_at, ready_at)
  values (v_s.id, v_uid, v_r.id, v_start, v_start + make_interval(secs => v_r.seconds));

  return private.player_state(v_uid);
end;
$$;

-- Collect finished jobs, oldest first, while they fit in the barn.
create function public.collect_production(p_structure_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_s record;
  v_job record;
  v_free integer;
  v_done integer := 0;
  v_xp bigint := 0;
  v_level_up boolean;
begin
  v_uid := private.assert_player();

  select * into v_s from public.structures where id = p_structure_id and owner_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;

  if not exists (
    select 1 from public.production_jobs
    where structure_id = v_s.id and collected_at is null and ready_at <= now()
  ) then
    raise exception 'NOT_READY';
  end if;

  v_free := private.barn_capacity(v_uid) - private.barn_used(v_uid);
  for v_job in
    select j.id, r.output_item_id, r.output_qty, r.xp
    from public.production_jobs j
    join public.recipes r on r.id = j.recipe_id
    where j.structure_id = v_s.id and j.collected_at is null and j.ready_at <= now()
    order by j.ready_at
  loop
    exit when v_job.output_qty > v_free;
    perform private.give_items(v_uid, v_job.output_item_id, v_job.output_qty);
    update public.production_jobs set collected_at = now() where id = v_job.id;
    v_free := v_free - v_job.output_qty;
    v_done := v_done + 1;
    v_xp := v_xp + v_job.xp;
  end loop;

  if v_done = 0 then
    raise exception 'BARN_FULL';
  end if;
  v_level_up := private.add_xp(v_uid, v_xp);

  return private.player_state(v_uid) || jsonb_build_object('collected', v_done, 'level_up', v_level_up);
end;
$$;

-- upgrade(): also upgrades a structure (p_kind = 'structure', p_target_id = structure id).
create or replace function public.upgrade(p_kind text, p_target_id bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_current smallint;
  v_lookup text := p_kind;
  v_player_level smallint;
  v_next record;
begin
  v_uid := private.assert_player();

  if p_kind = 'house' then
    select house_level into v_current from public.profiles where id = v_uid;
  elsif p_kind = 'barn' then
    select barn_level into v_current from public.profiles where id = v_uid;
  elsif p_kind = 'tool' then
    select tool_level into v_current from public.profiles where id = v_uid;
  elsif p_kind = 'fertility' then
    select fertility_level into v_current from public.parcels where id = p_target_id and owner_id = v_uid for update;
    if not found then
      raise exception 'NOT_OWNER';
    end if;
  elsif p_kind = 'structure' then
    select level, type_id into v_current, v_lookup from public.structures where id = p_target_id and owner_id = v_uid for update;
    if not found then
      raise exception 'NOT_OWNER';
    end if;
  else
    raise exception 'INVALID_INPUT';
  end if;

  select level, cost, required_player_level into v_next
  from public.upgrade_levels
  where kind = v_lookup and level = v_current + 1;
  if not found then
    raise exception 'MAX_LEVEL';
  end if;

  select level into v_player_level from public.profiles where id = v_uid;
  if v_player_level < v_next.required_player_level then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  perform private.add_coins(v_uid, -v_next.cost, 'upgrade',
    jsonb_build_object('kind', v_lookup, 'level', v_next.level, 'target', p_target_id));

  if p_kind = 'house' then
    update public.profiles set house_level = v_next.level where id = v_uid;
  elsif p_kind = 'barn' then
    update public.profiles set barn_level = v_next.level where id = v_uid;
  elsif p_kind = 'tool' then
    update public.profiles set tool_level = v_next.level where id = v_uid;
  elsif p_kind = 'fertility' then
    update public.parcels set fertility_level = v_next.level, updated_at = now() where id = p_target_id;
  else
    update public.structures set level = v_next.level where id = p_target_id;
  end if;

  return private.player_state(v_uid)
    || jsonb_build_object('upgraded', p_kind, 'level', v_next.level, 'target', p_target_id);
end;
$$;

-------------------------------------------------------------------------------
-- 6. Orders may ask for animal products (from their unlock level) and processed goods (from level 7)
-------------------------------------------------------------------------------
create or replace function private.ensure_orders(p_uid uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_level integer;
  v_cooldown interval := make_interval(mins => private.cfg('order_refresh_minutes')::integer);
  v_slot integer;
  v_last timestamptz;
  v_kinds integer;
  v_req jsonb;
  v_value numeric;
begin
  select level into v_level from public.profiles where id = p_uid;
  if v_level is null or v_level < private.cfg('quests_unlock_level')::integer then
    return;
  end if;

  for v_slot in 0..5 loop
    if exists (select 1 from public.orders where user_id = p_uid and slot = v_slot and completed_at is null and skipped_at is null) then
      continue;
    end if;
    select max(coalesce(completed_at, skipped_at)) into v_last from public.orders where user_id = p_uid and slot = v_slot;
    if v_last is not null and v_last + v_cooldown > now() then
      continue;
    end if;

    v_kinds := 1 + floor(random() * 3)::integer;
    select jsonb_agg(jsonb_build_object('item_id', x.id, 'qty', x.qty)), sum(x.base_price * x.qty), count(*)
      into v_req, v_value, v_kinds
    from (
      select i.id, i.base_price,
        case i.category
          when 'crop' then (2 + floor(random() * (3 + v_level / 2)))::integer
          when 'animal_product' then (1 + floor(random() * 3))::integer
          else (1 + floor(random() * 2))::integer
        end as qty
      from public.items i
      where i.unlock_level <= v_level
        and (i.category in ('crop', 'animal_product') or (i.category = 'processed' and v_level >= 7))
      order by random()
      limit v_kinds
    ) x;

    insert into public.orders (user_id, slot, requirements, reward_coins, reward_xp)
    values (p_uid, v_slot, v_req, round(v_value * (1.05 + 0.15 * v_kinds)), greatest(1, round(v_value / 20)));
  end loop;
end;
$$;

-------------------------------------------------------------------------------
-- 7. New daily quests: feed animals, finish processing jobs (progress from triggers)
-------------------------------------------------------------------------------
alter table public.quest_templates drop constraint quest_templates_type_check;
alter table public.quest_templates add constraint quest_templates_type_check
  check (type in ('harvest', 'plant', 'sell_coins', 'orders', 'upgrade', 'feed', 'produce'));

insert into public.quest_templates (id, type, difficulty, min_level, target_base, target_per_level, name_vi) values
  ('feed', 'feed', 2, 4, 4, 0.5, 'Cho vật nuôi ăn {n} lần'),
  ('produce', 'produce', 2, 4, 2, 0.3, 'Làm xong {n} mẻ hàng ở xưởng');

create function private.on_animals_fed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select n.owner_id, count(*)::integer as fed
    from new_rows n
    join old_rows o on o.id = n.id
    where o.fed_at is null and n.fed_at is not null
    group by n.owner_id
  loop
    perform private.progress_quest(r.owner_id, 'feed', r.fed);
  end loop;
  return null;
end;
$$;

create trigger animals_quest_progress
  after update on public.animals
  referencing old table as old_rows new table as new_rows
  for each statement execute function private.on_animals_fed();

create function private.on_jobs_collected()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select n.owner_id, count(*)::integer as done
    from new_rows n
    join old_rows o on o.id = n.id
    where o.collected_at is null and n.collected_at is not null
    group by n.owner_id
  loop
    perform private.progress_quest(r.owner_id, 'produce', r.done);
  end loop;
  return null;
end;
$$;

create trigger production_jobs_quest_progress
  after update on public.production_jobs
  referencing old table as old_rows new table as new_rows
  for each statement execute function private.on_jobs_collected();

-------------------------------------------------------------------------------
-- 8. Realtime doorbells for removed plots, structures and animals
-------------------------------------------------------------------------------
create function private.on_plots_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_parcels(array(select distinct parcel_id from old_rows));
  return null;
end;
$$;

create trigger plots_notify_delete
  after delete on public.plots
  referencing old table as old_rows
  for each statement execute function private.on_plots_deleted();

create function private.on_structures_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_parcels(array(select distinct parcel_id from new_rows));
  return null;
end;
$$;

create trigger structures_notify_insert
  after insert on public.structures
  referencing new table as new_rows
  for each statement execute function private.on_structures_changed();

create trigger structures_notify_update
  after update on public.structures
  referencing new table as new_rows
  for each statement execute function private.on_structures_changed();

create function private.on_animals_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_parcels(array(
    select distinct s.parcel_id from new_rows n join public.structures s on s.id = n.structure_id
  ));
  return null;
end;
$$;

create trigger animals_notify_insert
  after insert on public.animals
  referencing new table as new_rows
  for each statement execute function private.on_animals_changed();

create trigger animals_notify_update
  after update on public.animals
  referencing new table as new_rows
  for each statement execute function private.on_animals_changed();

-------------------------------------------------------------------------------
-- 9. Permissions
-------------------------------------------------------------------------------
revoke all on function private.on_animals_fed() from public, anon, authenticated;
revoke all on function private.on_jobs_collected() from public, anon, authenticated;
revoke all on function private.on_plots_deleted() from public, anon, authenticated;
revoke all on function private.on_structures_changed() from public, anon, authenticated;
revoke all on function private.on_animals_changed() from public, anon, authenticated;

revoke execute on function public.build_structure(bigint, integer, text) from public, anon;
revoke execute on function public.buy_animal(bigint) from public, anon;
revoke execute on function public.feed_animals(bigint) from public, anon;
revoke execute on function public.collect_animals(bigint) from public, anon;
revoke execute on function public.start_production(bigint, text) from public, anon;
revoke execute on function public.collect_production(bigint) from public, anon;

grant execute on function public.build_structure(bigint, integer, text) to authenticated;
grant execute on function public.buy_animal(bigint) to authenticated;
grant execute on function public.feed_animals(bigint) to authenticated;
grant execute on function public.collect_animals(bigint) to authenticated;
grant execute on function public.start_production(bigint, text) to authenticated;
grant execute on function public.collect_production(bigint) to authenticated;
