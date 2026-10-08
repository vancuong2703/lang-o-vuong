-- Phase 4 part 4: daily login reward (GDD 8.4), daily quests (GDD 8.2), order board (GDD 8.3).
-- Quest progress is driven by TRIGGERS on the coin ledger and player stats, so existing RPCs stay untouched.

insert into public.game_config (key, value, description) values
  ('login_rewards', '[50, 80, 120, 160, 220, 300, 500]', 'Daily login base coins for streak day 1..7 (GDD 8.4)'),
  ('quests_unlock_level', '3', 'Daily quests and the order board unlock at this level (GDD 2.6)')
on conflict (key) do update set value = excluded.value;

update public.game_config set value = '4' where key = 'config_version';

-------------------------------------------------------------------------------
-- Daily login
-------------------------------------------------------------------------------
create function public.claim_daily_login()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_today date := private.vn_today();
  v_last date;
  v_streak smallint;
  v_level smallint;
  v_reward bigint;
begin
  v_uid := private.assert_player();
  select last_login_date, login_streak, level into v_last, v_streak, v_level from public.profiles where id = v_uid;

  if v_last = v_today then
    raise exception 'ALREADY_CLAIMED';
  end if;

  -- Consecutive day continues the streak (day 7 wraps to day 1), otherwise restart at day 1.
  v_streak := case when v_last = v_today - 1 then (v_streak % 7) + 1 else 1 end;
  v_reward := round((private.cfg('login_rewards') ->> (v_streak - 1))::numeric * (1 + v_level / 10.0));

  update public.profiles set login_streak = v_streak, last_login_date = v_today where id = v_uid;
  perform private.add_coins(v_uid, v_reward, 'login', jsonb_build_object('day', v_streak));

  return private.player_state(v_uid) || jsonb_build_object('login_day', v_streak, 'login_reward', v_reward);
end;
$$;

-------------------------------------------------------------------------------
-- Daily quests
-------------------------------------------------------------------------------
create table public.quest_templates (
  id text primary key,
  type text not null check (type in ('harvest', 'plant', 'sell_coins', 'orders', 'upgrade')),
  difficulty smallint not null check (difficulty between 1 and 3),
  min_level smallint not null default 3,
  target_base integer not null,
  target_per_level numeric not null default 0,
  name_vi text not null -- '{n}' is replaced by the target
);

insert into public.quest_templates (id, type, difficulty, min_level, target_base, target_per_level, name_vi) values
  ('harvest', 'harvest', 1, 3, 15, 3, 'Thu hoạch {n} luống'),
  ('plant', 'plant', 1, 3, 15, 3, 'Gieo {n} luống'),
  ('sell', 'sell_coins', 2, 3, 200, 60, 'Bán hàng được {n} xu'),
  ('orders', 'orders', 3, 3, 2, 0.1, 'Giao {n} đơn hàng'),
  ('upgrade', 'upgrade', 2, 3, 1, 0, 'Nâng cấp {n} lần');

create table public.player_quests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id text not null references public.quest_templates (id),
  quest_date date not null,
  target integer not null check (target > 0),
  progress integer not null default 0,
  reward_coins integer not null,
  reward_xp integer not null,
  claimed_at timestamptz,
  unique (user_id, template_id, quest_date)
);

create index player_quests_user_date_idx on public.player_quests (user_id, quest_date);

alter table public.quest_templates enable row level security;
alter table public.player_quests enable row level security;
create policy "quest templates are readable by everyone" on public.quest_templates for select to anon, authenticated using (true);
create policy "own quests only" on public.player_quests for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.quest_templates, public.player_quests from anon, authenticated;

-- Create today's 3 quests (3 different types) if the player is high enough and has none yet.
create function private.ensure_daily_quests(p_uid uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_level integer;
  v_today date := private.vn_today();
begin
  select level into v_level from public.profiles where id = p_uid;
  if v_level is null or v_level < private.cfg('quests_unlock_level')::integer then
    return;
  end if;
  if exists (select 1 from public.player_quests where user_id = p_uid and quest_date = v_today) then
    return;
  end if;

  insert into public.player_quests (user_id, template_id, quest_date, target, reward_coins, reward_xp)
  select p_uid, t.id, v_today,
         greatest(1, round(t.target_base + t.target_per_level * v_level))::integer,
         15 * v_level * t.difficulty,
         5 * v_level
  from (
    select distinct on (type) * from public.quest_templates
    where min_level <= v_level
    order by type, random()
  ) t
  order by random()
  limit 3
  on conflict do nothing;
end;
$$;

create function private.progress_quest(p_uid uuid, p_type text, p_amount integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_amount <= 0 then
    return;
  end if;
  perform private.ensure_daily_quests(p_uid);
  update public.player_quests pq
  set progress = least(pq.target, pq.progress + p_amount)
  from public.quest_templates t
  where pq.template_id = t.id
    and t.type = p_type
    and pq.user_id = p_uid
    and pq.quest_date = private.vn_today()
    and pq.claimed_at is null;
end;
$$;

create function private.daily_quests_json(p_uid uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pq.id, 'type', t.type, 'name', replace(t.name_vi, '{n}', pq.target::text),
    'target', pq.target, 'progress', pq.progress,
    'reward_coins', pq.reward_coins, 'reward_xp', pq.reward_xp,
    'claimed', pq.claimed_at is not null
  ) order by pq.id), '[]'::jsonb)
  from public.player_quests pq
  join public.quest_templates t on t.id = pq.template_id
  where pq.user_id = p_uid and pq.quest_date = private.vn_today()
$$;

-- Progress from money movements (one ledger row per action).
create function private.on_ledger_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reason = 'seed' then
    perform private.progress_quest(new.user_id, 'plant', coalesce((new.ref ->> 'plots')::integer, 1));
  elsif new.reason = 'sell' then
    perform private.progress_quest(new.user_id, 'sell_coins', new.delta::integer);
  elsif new.reason = 'upgrade' then
    perform private.progress_quest(new.user_id, 'upgrade', 1);
  elsif new.reason = 'order' then
    perform private.progress_quest(new.user_id, 'orders', 1);
  end if;
  return null;
end;
$$;

create trigger coin_ledger_quest_progress
  after insert on public.coin_ledger
  for each row execute function private.on_ledger_insert();

-- Progress from harvest counters.
create function private.on_stats_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.harvested_total > old.harvested_total then
    perform private.progress_quest(new.user_id, 'harvest', (new.harvested_total - old.harvested_total)::integer);
  end if;
  return null;
end;
$$;

create trigger player_stats_quest_progress
  after update on public.player_stats
  for each row execute function private.on_stats_update();

create function public.get_daily_quests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_level smallint;
begin
  v_uid := private.assert_player();
  perform private.ensure_daily_quests(v_uid);
  select level into v_level from public.profiles where id = v_uid;
  return jsonb_build_object(
    'unlock_level', private.cfg('quests_unlock_level')::integer,
    'unlocked', v_level >= private.cfg('quests_unlock_level')::integer,
    'quests', private.daily_quests_json(v_uid)
  );
end;
$$;

create function public.claim_quest(p_quest_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_quest record;
  v_left integer;
  v_level smallint;
  v_bonus boolean := false;
  v_level_up boolean;
begin
  v_uid := private.assert_player();

  select * into v_quest from public.player_quests where id = p_quest_id and user_id = v_uid for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  if v_quest.quest_date <> private.vn_today() then
    raise exception 'QUEST_EXPIRED';
  end if;
  if v_quest.claimed_at is not null then
    raise exception 'ALREADY_CLAIMED';
  end if;
  if v_quest.progress < v_quest.target then
    raise exception 'NOT_READY';
  end if;

  update public.player_quests set claimed_at = now() where id = v_quest.id;
  perform private.add_coins(v_uid, v_quest.reward_coins, 'quest', jsonb_build_object('quest', v_quest.template_id));
  v_level_up := private.add_xp(v_uid, v_quest.reward_xp);

  -- All 3 quests of the day done: bonus XP (GDD 8.2).
  select count(*) into v_left from public.player_quests
  where user_id = v_uid and quest_date = v_quest.quest_date and claimed_at is null;
  if v_left = 0 then
    select level into v_level from public.profiles where id = v_uid;
    v_level_up := private.add_xp(v_uid, 10 * v_level) or v_level_up;
    v_bonus := true;
  end if;

  return private.player_state(v_uid) || jsonb_build_object(
    'quests', private.daily_quests_json(v_uid), 'all_done_bonus', v_bonus, 'level_up', v_level_up
  );
end;
$$;

-------------------------------------------------------------------------------
-- Order board: 6 slots, a new order 15 minutes after one is delivered or skipped
-------------------------------------------------------------------------------
create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot smallint not null check (slot between 0 and 5),
  requirements jsonb not null, -- [{ "item_id": "corn", "qty": 3 }, ...]
  reward_coins integer not null,
  reward_xp integer not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  skipped_at timestamptz
);

create unique index orders_one_active_per_slot on public.orders (user_id, slot) where completed_at is null and skipped_at is null;
create index orders_user_slot_idx on public.orders (user_id, slot);

alter table public.orders enable row level security;
create policy "own orders only" on public.orders for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.orders from anon, authenticated;

create function private.ensure_orders(p_uid uuid)
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

    -- 1 to 3 different unlocked crops; reward x1.2 / x1.35 / x1.5 of the market value (GDD 8.3).
    v_kinds := 1 + floor(random() * 3)::integer;
    select jsonb_agg(jsonb_build_object('item_id', x.id, 'qty', x.qty)), sum(x.base_price * x.qty), count(*)
      into v_req, v_value, v_kinds
    from (
      select i.id, i.base_price, (2 + floor(random() * (3 + v_level / 2)))::integer as qty
      from public.items i
      where i.category = 'crop' and i.unlock_level <= v_level
      order by random()
      limit v_kinds
    ) x;

    insert into public.orders (user_id, slot, requirements, reward_coins, reward_xp)
    values (p_uid, v_slot, v_req, round(v_value * (1.05 + 0.15 * v_kinds)), greatest(1, round(v_value / 20)));
  end loop;
end;
$$;

create function private.orders_json(p_uid uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with cooldown as (
    select make_interval(mins => private.cfg('order_refresh_minutes')::integer) as span
  )
  select jsonb_build_object(
    'active', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'slot', o.slot, 'requirements', o.requirements,
        'reward_coins', o.reward_coins, 'reward_xp', o.reward_xp
      ) order by o.slot)
      from public.orders o
      where o.user_id = p_uid and o.completed_at is null and o.skipped_at is null
    ), '[]'::jsonb),
    'cooldowns', coalesce((
      select jsonb_agg(jsonb_build_object('slot', x.slot, 'next_at', x.last_done + (select span from cooldown)) order by x.slot)
      from (
        select o.slot, max(coalesce(o.completed_at, o.skipped_at)) as last_done
        from public.orders o
        where o.user_id = p_uid
        group by o.slot
      ) x
      where x.last_done + (select span from cooldown) > now()
        and not exists (
          select 1 from public.orders a
          where a.user_id = p_uid and a.slot = x.slot and a.completed_at is null and a.skipped_at is null
        )
    ), '[]'::jsonb)
  )
$$;

create function public.get_orders()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_level smallint;
begin
  v_uid := private.assert_player();
  perform private.ensure_orders(v_uid);
  select level into v_level from public.profiles where id = v_uid;
  return private.orders_json(v_uid) || jsonb_build_object(
    'unlock_level', private.cfg('quests_unlock_level')::integer,
    'unlocked', v_level >= private.cfg('quests_unlock_level')::integer
  );
end;
$$;

create function public.fulfill_order(p_order_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_order record;
  v_req jsonb;
  v_level_up boolean;
begin
  v_uid := private.assert_player();

  select * into v_order from public.orders
  where id = p_order_id and user_id = v_uid and completed_at is null and skipped_at is null
  for update;
  if not found then
    raise exception 'NOT_OWNER';
  end if;

  -- take_items raises NOT_ENOUGH_ITEMS and rolls everything back if one item is missing.
  for v_req in select * from jsonb_array_elements(v_order.requirements) loop
    perform private.take_items(v_uid, v_req ->> 'item_id', (v_req ->> 'qty')::integer);
  end loop;

  update public.orders set completed_at = now() where id = v_order.id;
  perform private.add_coins(v_uid, v_order.reward_coins, 'order', jsonb_build_object('order_id', v_order.id));
  v_level_up := private.add_xp(v_uid, v_order.reward_xp);

  return private.player_state(v_uid) || jsonb_build_object('orders', private.orders_json(v_uid), 'level_up', v_level_up);
end;
$$;

create function public.skip_order(p_order_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := private.assert_player();
  update public.orders set skipped_at = now()
  where id = p_order_id and user_id = v_uid and completed_at is null and skipped_at is null;
  if not found then
    raise exception 'NOT_OWNER';
  end if;
  return private.orders_json(v_uid);
end;
$$;

-------------------------------------------------------------------------------
-- Permissions
-------------------------------------------------------------------------------
revoke all on function private.ensure_daily_quests(uuid) from public, anon, authenticated;
revoke all on function private.progress_quest(uuid, text, integer) from public, anon, authenticated;
revoke all on function private.daily_quests_json(uuid) from public, anon, authenticated;
revoke all on function private.on_ledger_insert() from public, anon, authenticated;
revoke all on function private.on_stats_update() from public, anon, authenticated;
revoke all on function private.ensure_orders(uuid) from public, anon, authenticated;
revoke all on function private.orders_json(uuid) from public, anon, authenticated;

revoke execute on function public.claim_daily_login() from public, anon;
revoke execute on function public.get_daily_quests() from public, anon;
revoke execute on function public.claim_quest(bigint) from public, anon;
revoke execute on function public.get_orders() from public, anon;
revoke execute on function public.fulfill_order(bigint) from public, anon;
revoke execute on function public.skip_order(bigint) from public, anon;

grant execute on function public.claim_daily_login() to authenticated;
grant execute on function public.get_daily_quests() to authenticated;
grant execute on function public.claim_quest(bigint) to authenticated;
grant execute on function public.get_orders() to authenticated;
grant execute on function public.fulfill_order(bigint) to authenticated;
grant execute on function public.skip_order(bigint) to authenticated;
