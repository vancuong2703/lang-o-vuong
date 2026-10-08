-- Phase 4 part 1: upgrades (GDD 5.1-5.4) and tool areas (GDD 5.3).
-- upgrade_levels becomes the single source of truth for house limit, barn capacity, tool area and fertility.

create table public.upgrade_levels (
  kind text not null check (kind in ('house', 'barn', 'tool', 'fertility')),
  level smallint not null check (level >= 1),
  cost bigint not null check (cost >= 0),
  required_player_level smallint not null default 1,
  value numeric not null,
  primary key (kind, level)
);

alter table public.upgrade_levels enable row level security;
create policy "upgrade levels are readable by everyone" on public.upgrade_levels for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.upgrade_levels from anon, authenticated;

-- cost = cost to REACH this level (level 1 is free). value = effect at this level.
insert into public.upgrade_levels (kind, level, cost, required_player_level, value) values
  -- house: max parcels
  ('house', 1, 0, 1, 3), ('house', 2, 2000, 4, 6), ('house', 3, 8000, 8, 10), ('house', 4, 32000, 12, 16), ('house', 5, 128000, 16, 25),
  -- barn: capacity
  ('barn', 1, 0, 1, 75), ('barn', 2, 500, 1, 150), ('barn', 3, 2000, 1, 300), ('barn', 4, 8000, 1, 600), ('barn', 5, 32000, 1, 1200),
  -- tool: area code 1..5 (1 plot, quadrant, half parcel, parcel, all parcels)
  ('tool', 1, 0, 1, 1), ('tool', 2, 300, 1, 2), ('tool', 3, 1200, 1, 3), ('tool', 4, 4800, 1, 4), ('tool', 5, 19200, 1, 5),
  -- fertility (per parcel): growth speed bonus
  ('fertility', 1, 0, 1, 0), ('fertility', 2, 400, 1, 0.05), ('fertility', 3, 1600, 1, 0.10), ('fertility', 4, 6400, 1, 0.15), ('fertility', 5, 25600, 1, 0.20);

-- The old config arrays are replaced by upgrade_levels.
delete from public.game_config where key in ('barn_capacity', 'house_max_parcels');
update public.game_config set value = '3' where key = 'config_version';

create function private.upgrade_value(p_kind text, p_level integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select value from public.upgrade_levels where kind = p_kind and level = p_level
$$;

create or replace function private.barn_capacity(p_uid uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select private.upgrade_value('barn', p.barn_level)::integer from public.profiles p where p.id = p_uid
$$;

-- Do these plots fit in ONE tool area for this tool level? (GDD 5.3)
create function private.tool_area_ok(p_plot_ids bigint[], p_tool_level integer)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_tool_level >= 5 then true
    when p_tool_level = 4 then count(distinct parcel_id) = 1
    when p_tool_level = 3 then count(distinct parcel_id) = 1 and count(distinct (ly >= 2)) = 1
    when p_tool_level = 2 then count(distinct parcel_id) = 1 and count(distinct (ly >= 2, lx >= 2)) = 1
    else count(*) = 1
  end
  from public.plots
  where id = any (p_plot_ids)
$$;

revoke all on function private.upgrade_value(text, integer) from public, anon, authenticated;
revoke all on function private.tool_area_ok(bigint[], integer) from public, anon, authenticated;

-- plant: now checks the tool area and reads fertility from upgrade_levels. Up to 400 plots (25 parcels).
create or replace function public.plant(p_plot_ids bigint[], p_crop_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_ids bigint[];
  v_n integer;
  v_seed_price integer;
  v_grow_seconds integer;
  v_unlock smallint;
  v_level smallint;
  v_tool smallint;
  v_found integer;
  v_owned integer;
  v_empty integer;
begin
  v_uid := private.assert_player();

  v_ids := array(select distinct unnest(p_plot_ids));
  v_n := coalesce(cardinality(v_ids), 0);
  if v_n = 0 or v_n > 400 then
    raise exception 'INVALID_INPUT';
  end if;

  select c.seed_price, c.grow_seconds, i.unlock_level
    into v_seed_price, v_grow_seconds, v_unlock
  from public.crops c
  join public.items i on i.id = c.item_id
  where c.item_id = p_crop_id;
  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  select level, tool_level into v_level, v_tool from public.profiles where id = v_uid;
  if v_level < v_unlock then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  perform 1 from public.plots where id = any (v_ids) for update;

  select count(*),
         count(*) filter (where owner_id = v_uid),
         count(*) filter (where crop_item_id is null)
    into v_found, v_owned, v_empty
  from public.plots
  where id = any (v_ids);

  if v_found <> v_n or v_owned <> v_n then
    raise exception 'NOT_OWNER';
  end if;
  if v_empty <> v_n then
    raise exception 'PLOT_NOT_EMPTY';
  end if;
  if not private.tool_area_ok(v_ids, v_tool) then
    raise exception 'TOOL_AREA';
  end if;

  perform private.add_coins(v_uid, -(v_seed_price::bigint * v_n), 'seed',
    jsonb_build_object('crop', p_crop_id, 'plots', v_n));

  -- Fertility bonus is applied once, at planting time (ROADMAP 2.9).
  update public.plots pl
  set crop_item_id = p_crop_id,
      planted_at = now(),
      ready_at = now() + make_interval(secs => v_grow_seconds * (1 - coalesce(private.upgrade_value('fertility', pa.fertility_level), 0)))
  from public.parcels pa
  where pl.id = any (v_ids) and pa.id = pl.parcel_id;

  update public.player_stats
  set crop_types_planted = array(select distinct unnest(crop_types_planted || p_crop_id))
  where user_id = v_uid;

  return private.player_state(v_uid);
end;
$$;

-- harvest: tool area check, up to 400 plots.
create or replace function public.harvest(p_plot_ids bigint[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_ids bigint[];
  v_n integer;
  v_owned integer;
  v_tool smallint;
  v_free integer;
  v_ripe bigint[];
  v_xp bigint := 0;
  v_level_up boolean;
  r record;
begin
  v_uid := private.assert_player();

  v_ids := array(select distinct unnest(p_plot_ids));
  v_n := coalesce(cardinality(v_ids), 0);
  if v_n = 0 or v_n > 400 then
    raise exception 'INVALID_INPUT';
  end if;

  perform 1 from public.plots where id = any (v_ids) for update;

  select count(*) into v_owned from public.plots where id = any (v_ids) and owner_id = v_uid;
  if v_owned <> v_n then
    raise exception 'NOT_OWNER';
  end if;

  select tool_level into v_tool from public.profiles where id = v_uid;
  if not private.tool_area_ok(v_ids, v_tool) then
    raise exception 'TOOL_AREA';
  end if;

  v_free := private.barn_capacity(v_uid) - private.barn_used(v_uid);
  if v_free <= 0 then
    raise exception 'BARN_FULL';
  end if;

  v_ripe := array(
    select id from public.plots
    where id = any (v_ids) and crop_item_id is not null and ready_at <= now()
    order by id
    limit v_free
  );
  if coalesce(cardinality(v_ripe), 0) = 0 then
    raise exception 'NOT_READY';
  end if;

  for r in
    select pl.crop_item_id as crop_id, count(*)::integer as qty, c.xp
    from public.plots pl
    join public.crops c on c.item_id = pl.crop_item_id
    where pl.id = any (v_ripe)
    group by pl.crop_item_id, c.xp
  loop
    perform private.give_items(v_uid, r.crop_id, r.qty);
    v_xp := v_xp + r.xp * r.qty;
  end loop;

  update public.plots set crop_item_id = null, planted_at = null, ready_at = null where id = any (v_ripe);

  v_level_up := private.add_xp(v_uid, v_xp);

  update public.player_stats
  set harvested_total = harvested_total + cardinality(v_ripe)
  where user_id = v_uid;

  return private.player_state(v_uid)
    || jsonb_build_object('harvested', cardinality(v_ripe), 'level_up', v_level_up);
end;
$$;

-- buy_parcel: house limit now comes from upgrade_levels.
create or replace function public.buy_parcel(p_parcel_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_parcel record;
  v_slot_owner uuid;
  v_owned integer;
  v_max integer;
  v_price bigint;
begin
  v_uid := private.assert_player();

  select id, x, y, zone, is_home_slot, priority_slot_id, owner_id
    into v_parcel
  from public.parcels
  where id = p_parcel_id
  for update;

  if not found then
    raise exception 'INVALID_INPUT';
  end if;
  if v_parcel.owner_id is not null then
    raise exception 'ALREADY_OWNED';
  end if;
  if v_parcel.zone <> 'normal' or v_parcel.is_home_slot then
    raise exception 'NOT_BUYABLE';
  end if;
  if not exists (
    select 1 from public.parcels n
    where n.owner_id = v_uid and abs(n.x - v_parcel.x) + abs(n.y - v_parcel.y) = 1
  ) then
    raise exception 'NOT_ADJACENT';
  end if;
  if v_parcel.priority_slot_id is not null then
    select owner_id into v_slot_owner from public.parcels where id = v_parcel.priority_slot_id;
    if v_slot_owner is distinct from v_uid then
      raise exception 'PRIORITY_ZONE';
    end if;
  end if;

  select count(*) into v_owned from public.parcels where owner_id = v_uid;
  select private.upgrade_value('house', house_level)::integer into v_max from public.profiles where id = v_uid;
  if v_owned >= v_max then
    raise exception 'LAND_LIMIT';
  end if;

  v_price := private.land_price(v_owned);
  perform private.add_coins(v_uid, -v_price, 'land', jsonb_build_object('parcel_id', v_parcel.id, 'x', v_parcel.x, 'y', v_parcel.y));

  update public.parcels set owner_id = v_uid, purchased_at = now(), updated_at = now() where id = v_parcel.id;

  insert into public.plots (parcel_id, owner_id, lx, ly)
  select v_parcel.id, v_uid, lx, ly
  from generate_series(0, 3) as lx, generate_series(0, 3) as ly;

  return private.player_state(v_uid) || jsonb_build_object('bought_parcel_id', v_parcel.id, 'price', v_price);
end;
$$;

-- Upgrade house / barn / tool (player-wide) or fertility of one owned parcel.
create function public.upgrade(p_kind text, p_target_id bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_current smallint;
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
  else
    raise exception 'INVALID_INPUT';
  end if;

  select level, cost, required_player_level into v_next
  from public.upgrade_levels
  where kind = p_kind and level = v_current + 1;
  if not found then
    raise exception 'MAX_LEVEL';
  end if;

  select level into v_player_level from public.profiles where id = v_uid;
  if v_player_level < v_next.required_player_level then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  perform private.add_coins(v_uid, -v_next.cost, 'upgrade',
    jsonb_build_object('kind', p_kind, 'level', v_next.level, 'target', p_target_id));

  if p_kind = 'house' then
    update public.profiles set house_level = v_next.level where id = v_uid;
  elsif p_kind = 'barn' then
    update public.profiles set barn_level = v_next.level where id = v_uid;
  elsif p_kind = 'tool' then
    update public.profiles set tool_level = v_next.level where id = v_uid;
  else
    update public.parcels set fertility_level = v_next.level, updated_at = now() where id = p_target_id;
  end if;

  return private.player_state(v_uid)
    || jsonb_build_object('upgraded', p_kind, 'level', v_next.level, 'target', p_target_id);
end;
$$;

revoke execute on function public.upgrade(text, bigint) from public, anon;
grant execute on function public.upgrade(text, bigint) to authenticated;
