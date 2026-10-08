-- Phase 3: read the whole village map in one call, and buy land (GDD 6.5, ROADMAP 2.8).

insert into public.game_config (key, value, description) values
  ('house_max_parcels', '[3, 6, 10, 16, 25]', 'Max parcels a player may own by house level 1..5 (GDD 5.1)');

update public.game_config set value = '2' where key = 'config_version';

-- Price of the next parcel when the player owns p_owned parcels: base * growth^(owned-1), rounded to 10.
create function private.land_price(p_owned integer)
returns bigint
language sql
stable
set search_path = ''
as $$
  select (round(
    private.cfg('land_base_price')::numeric * power(private.cfg('land_growth')::numeric, p_owned - 1) / 10
  ) * 10)::bigint
$$;

revoke all on function private.land_price(integer) from public, anon, authenticated;

-- The whole village in one compact payload (one row per parcel would hit the 1000-row API limit).
-- parcels: [id, x, y, zone, is_home_slot, priority_slot_id, owner_id, fertility_level]
-- plots:   [id, parcel_id, owner_id, lx, ly, crop_item_id, planted_at, ready_at]
create function public.get_world()
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
    'server_now', now()
  )
$$;

-- Buy one parcel. All 5 rules of GDD 6.5 are checked here; the client only shows hints.
create function public.buy_parcel(p_parcel_id bigint)
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

  -- Lock the parcel: two players clicking "buy" at the same time cannot both get it.
  select id, x, y, zone, is_home_slot, priority_slot_id, owner_id
    into v_parcel
  from public.parcels
  where id = p_parcel_id
  for update;

  if not found then
    raise exception 'INVALID_INPUT';
  end if;

  -- Rule 1: free and of a buyable kind.
  if v_parcel.owner_id is not null then
    raise exception 'ALREADY_OWNED';
  end if;
  if v_parcel.zone <> 'normal' or v_parcel.is_home_slot then
    raise exception 'NOT_BUYABLE';
  end if;

  -- Rule 2: shares an edge with a parcel the player owns.
  if not exists (
    select 1 from public.parcels n
    where n.owner_id = v_uid and abs(n.x - v_parcel.x) + abs(n.y - v_parcel.y) = 1
  ) then
    raise exception 'NOT_ADJACENT';
  end if;

  -- Rule 3: not in someone else's priority zone (reserved even if that slot is still empty).
  if v_parcel.priority_slot_id is not null then
    select owner_id into v_slot_owner from public.parcels where id = v_parcel.priority_slot_id;
    if v_slot_owner is distinct from v_uid then
      raise exception 'PRIORITY_ZONE';
    end if;
  end if;

  -- Rule 4: below the house limit.
  select count(*) into v_owned from public.parcels where owner_id = v_uid;
  select (private.cfg('house_max_parcels') ->> (house_level - 1))::integer
    into v_max
  from public.profiles where id = v_uid;
  if v_owned >= v_max then
    raise exception 'LAND_LIMIT';
  end if;

  -- Rule 5: enough coins (add_coins raises NOT_ENOUGH_COINS).
  v_price := private.land_price(v_owned);
  perform private.add_coins(v_uid, -v_price, 'land', jsonb_build_object('parcel_id', v_parcel.id, 'x', v_parcel.x, 'y', v_parcel.y));

  update public.parcels set owner_id = v_uid, purchased_at = now(), updated_at = now() where id = v_parcel.id;

  insert into public.plots (parcel_id, owner_id, lx, ly)
  select v_parcel.id, v_uid, lx, ly
  from generate_series(0, 3) as lx, generate_series(0, 3) as ly;

  return private.player_state(v_uid) || jsonb_build_object('bought_parcel_id', v_parcel.id, 'price', v_price);
end;
$$;

revoke execute on function public.get_world() from public, anon;
revoke execute on function public.buy_parcel(bigint) from public, anon;
grant execute on function public.get_world() to authenticated;
grant execute on function public.buy_parcel(bigint) to authenticated;
