-- Fix: the order cooldown setting (GDD 8.3) was documented but never inserted, so the cooldown was NULL
-- and new orders appeared immediately after delivering or skipping one.
insert into public.game_config (key, value, description) values
  ('order_refresh_minutes', '15', 'Minutes before a new order appears in a slot after delivering or skipping (GDD 8.3)')
on conflict (key) do update set value = excluded.value;
