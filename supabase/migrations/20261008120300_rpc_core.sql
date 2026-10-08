-- Public RPC functions for phase 2 (ROADMAP 2.8): start_game, get_my_state, server_now, plant, harvest, sell.
-- All are SECURITY DEFINER with an empty search_path and fully qualified names.

-- Creates the profile, assigns the free home slot closest to the map center, builds 12 plots.
create function public.start_game(p_username text, p_farm_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_username, ''));
  v_farm text := btrim(coalesce(p_farm_name, ''));
  v_slot bigint;
  v_coins bigint := private.cfg('starting_coins')::bigint;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'ALREADY_STARTED';
  end if;
  if char_length(v_name) not between 3 and 16
     or v_name ~ '[[:cntrl:]<>"''`\\/@:;{}]'
     or char_length(v_farm) not between 1 and 24
     or v_farm ~ '[[:cntrl:]<>"''`\\/@:;{}]' then
    raise exception 'INVALID_NAME';
  end if;
  if exists (select 1 from public.profiles where lower(username) = lower(v_name)) then
    raise exception 'NAME_TAKEN';
  end if;

  -- SKIP LOCKED: two players joining at the same moment never get the same slot.
  select id into v_slot
  from public.parcels
  where is_home_slot and owner_id is null
  order by (x - 15.5) ^ 2 + (y - 15.5) ^ 2, random()
  limit 1
  for update skip locked;

  if v_slot is null then
    raise exception 'MAP_FULL';
  end if;

  insert into public.profiles (id, username, farm_name, coins, home_parcel_id)
  values (v_uid, v_name, v_farm, v_coins, v_slot);

  insert into public.player_stats (user_id) values (v_uid);

  update public.parcels set owner_id = v_uid, purchased_at = now(), updated_at = now() where id = v_slot;

  -- Quadrant 0 (lx < 2 and ly < 2) holds the house, so 12 plots.
  insert into public.plots (parcel_id, owner_id, lx, ly)
  select v_slot, v_uid, lx, ly
  from generate_series(0, 3) as lx, generate_series(0, 3) as ly
  where not (lx < 2 and ly < 2);

  insert into public.coin_ledger (user_id, delta, balance_after, reason)
  values (v_uid, v_coins, v_coins, 'start');

  return private.player_state(v_uid);
end;
$$;

-- Returns the player state, or null when the player has not created a farm yet.
create function public.get_my_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    return null;
  end if;
  return private.player_state(v_uid);
end;
$$;

create function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now()
$$;

-- Plant one crop on one or more empty plots of the same parcel.
create function public.plant(p_plot_ids bigint[], p_crop_id text)
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
  v_found integer;
  v_owned integer;
  v_empty integer;
  v_parcels integer;
begin
  v_uid := private.assert_player();

  v_ids := array(select distinct unnest(p_plot_ids));
  v_n := coalesce(cardinality(v_ids), 0);
  if v_n = 0 or v_n > 16 then
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

  select level into v_level from public.profiles where id = v_uid;
  if v_level < v_unlock then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  -- Lock the plots so a parallel request cannot plant on them too.
  perform 1 from public.plots where id = any (v_ids) for update;

  select count(*),
         count(*) filter (where owner_id = v_uid),
         count(*) filter (where crop_item_id is null),
         count(distinct parcel_id)
    into v_found, v_owned, v_empty, v_parcels
  from public.plots
  where id = any (v_ids);

  if v_found <> v_n or v_owned <> v_n then
    raise exception 'NOT_OWNER';
  end if;
  if v_empty <> v_n then
    raise exception 'PLOT_NOT_EMPTY';
  end if;
  if v_parcels <> 1 then
    raise exception 'INVALID_INPUT';
  end if;

  perform private.add_coins(v_uid, -(v_seed_price::bigint * v_n), 'seed',
    jsonb_build_object('crop', p_crop_id, 'plots', v_n));

  -- Fertility: level 1..5 = 0..20% faster, applied once at planting time (ROADMAP 2.9).
  update public.plots pl
  set crop_item_id = p_crop_id,
      planted_at = now(),
      ready_at = now() + make_interval(secs => v_grow_seconds * (1 - (pa.fertility_level - 1) * 0.05))
  from public.parcels pa
  where pl.id = any (v_ids) and pa.id = pl.parcel_id;

  update public.player_stats
  set crop_types_planted = array(select distinct unnest(crop_types_planted || p_crop_id))
  where user_id = v_uid;

  return private.player_state(v_uid);
end;
$$;

-- Harvest the ripe plots among the given ones, as many as the barn can hold.
create function public.harvest(p_plot_ids bigint[])
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
  v_free integer;
  v_ripe bigint[];
  v_xp bigint := 0;
  v_level_up boolean;
  r record;
begin
  v_uid := private.assert_player();

  v_ids := array(select distinct unnest(p_plot_ids));
  v_n := coalesce(cardinality(v_ids), 0);
  if v_n = 0 or v_n > 16 then
    raise exception 'INVALID_INPUT';
  end if;

  perform 1 from public.plots where id = any (v_ids) for update;

  select count(*) into v_owned from public.plots where id = any (v_ids) and owner_id = v_uid;
  if v_owned <> v_n then
    raise exception 'NOT_OWNER';
  end if;

  v_free := private.barn_capacity(v_uid) - private.barn_used(v_uid);
  if v_free <= 0 then
    raise exception 'BARN_FULL';
  end if;

  -- Only plots that are ripe by SERVER time; the client's clock is never trusted.
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

-- Sell items to the village shop at the fixed NPC price.
create function public.sell(p_item_id text, p_qty integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_price integer;
  v_sellable boolean;
begin
  v_uid := private.assert_player();

  if p_qty is null or p_qty <= 0 or p_qty > 10000 then
    raise exception 'INVALID_INPUT';
  end if;

  select base_price, sellable into v_price, v_sellable from public.items where id = p_item_id;
  if not found or not v_sellable then
    raise exception 'INVALID_INPUT';
  end if;

  perform private.take_items(v_uid, p_item_id, p_qty);
  perform private.add_coins(v_uid, v_price::bigint * p_qty, 'sell',
    jsonb_build_object('item', p_item_id, 'qty', p_qty));

  return private.player_state(v_uid);
end;
$$;

-- Only logged-in players may call these RPCs.
revoke execute on function public.start_game(text, text) from public, anon;
revoke execute on function public.get_my_state() from public, anon;
revoke execute on function public.plant(bigint[], text) from public, anon;
revoke execute on function public.harvest(bigint[]) from public, anon;
revoke execute on function public.sell(text, integer) from public, anon;

grant execute on function public.start_game(text, text) to authenticated;
grant execute on function public.get_my_state() to authenticated;
grant execute on function public.plant(bigint[], text) to authenticated;
grant execute on function public.harvest(bigint[]) to authenticated;
grant execute on function public.sell(text, integer) to authenticated;
grant execute on function public.server_now() to anon, authenticated;
