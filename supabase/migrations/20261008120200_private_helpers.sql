-- Internal helper functions (ROADMAP 2.8). They live in schema `private`, which the API does not
-- expose, so clients cannot call them. Public RPCs (SECURITY DEFINER) call them.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Read one config value.
create function private.cfg(p_key text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select value from public.game_config where key = p_key
$$;

-- Today's date in Vietnam (daily resets happen at 00:00 Asia/Ho_Chi_Minh).
create function private.vn_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date
$$;

-- Total XP needed to reach a level: xp_factor * n(n+1)(2n+1)/6 with n = level - 1 (GDD 2.5).
create function private.total_xp_for_level(p_level integer)
returns bigint
language sql
stable
set search_path = ''
as $$
  select (private.cfg('xp_factor')::bigint * (p_level - 1) * p_level * (2 * p_level - 1)) / 6
$$;

create function private.level_from_xp(p_xp bigint)
returns smallint
language plpgsql
stable
set search_path = ''
as $$
declare
  v_level integer := 1;
  v_max integer := private.cfg('max_level')::integer;
begin
  while v_level < v_max and p_xp >= private.total_xp_for_level(v_level + 1) loop
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

-- Step 1-3 of the RPC pattern: logged in, has a profile, not banned, rate limit,
-- and LOCK the profile row (FOR UPDATE) for the rest of the transaction.
create function private.assert_player()
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_banned timestamptz;
  v_window timestamptz;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select banned_at, rl_window_start, rl_count
    into v_banned, v_window, v_count
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'NO_PROFILE';
  end if;
  if v_banned is not null then
    raise exception 'BANNED';
  end if;

  if now() - v_window > interval '1 minute' then
    update public.profiles set rl_window_start = now(), rl_count = 1, last_seen_at = now() where id = v_uid;
  elsif v_count >= private.cfg('rate_limit_per_min')::integer then
    raise exception 'RATE_LIMITED';
  else
    update public.profiles set rl_count = rl_count + 1, last_seen_at = now() where id = v_uid;
  end if;

  return v_uid;
end;
$$;

-- Every coin change goes through here so it is always written to the ledger.
create function private.add_coins(p_uid uuid, p_delta bigint, p_reason text, p_ref jsonb default null, p_counterpart uuid default null)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_balance bigint;
begin
  select coins into v_balance from public.profiles where id = p_uid for update;
  if v_balance + p_delta < 0 then
    raise exception 'NOT_ENOUGH_COINS';
  end if;

  update public.profiles set coins = coins + p_delta where id = p_uid returning coins into v_balance;

  insert into public.coin_ledger (user_id, delta, balance_after, reason, ref, counterpart_id)
  values (p_uid, p_delta, v_balance, p_reason, p_ref, p_counterpart);

  return v_balance;
end;
$$;

-- Adds XP (total + weekly) and updates the level. Returns true when the player leveled up.
create function private.add_xp(p_uid uuid, p_amount bigint)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_week date := date_trunc('week', private.vn_today())::date;
  v_xp bigint;
  v_old smallint;
  v_new smallint;
begin
  if p_amount <= 0 then
    return false;
  end if;

  select level into v_old from public.profiles where id = p_uid;

  update public.profiles
  set xp = xp + p_amount,
      weekly_xp = case when week_start = v_week then weekly_xp + p_amount else p_amount end,
      week_start = v_week
  where id = p_uid
  returning xp into v_xp;

  v_new := private.level_from_xp(v_xp);
  if v_new <> v_old then
    update public.profiles set level = v_new where id = p_uid;
  end if;
  return v_new > v_old;
end;
$$;

create function private.barn_capacity(p_uid uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select (private.cfg('barn_capacity') ->> (p.barn_level - 1))::integer
  from public.profiles p
  where p.id = p_uid
$$;

create function private.barn_used(p_uid uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(qty), 0)::integer from public.inventory where user_id = p_uid
$$;

create function private.give_items(p_uid uuid, p_item text, p_qty integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_qty <= 0 then
    return;
  end if;
  if private.barn_used(p_uid) + p_qty > private.barn_capacity(p_uid) then
    raise exception 'BARN_FULL';
  end if;
  insert into public.inventory (user_id, item_id, qty)
  values (p_uid, p_item, p_qty)
  on conflict (user_id, item_id) do update set qty = public.inventory.qty + excluded.qty;
end;
$$;

create function private.take_items(p_uid uuid, p_item text, p_qty integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.inventory
  set qty = qty - p_qty
  where user_id = p_uid and item_id = p_item and qty >= p_qty;
  if not found then
    raise exception 'NOT_ENOUGH_ITEMS';
  end if;
end;
$$;

-- Everything the client needs about the current player, returned by every RPC (step 9).
create function private.player_state(p_uid uuid)
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
    'server_now', now()
  )
$$;

revoke all on all functions in schema private from public, anon, authenticated;
