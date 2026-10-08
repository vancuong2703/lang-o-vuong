-- Phase 4 part 5: keep the coin ledger to 30 days so the free 500 MB database never fills up (ROADMAP 2.10, 8.2).
-- Runs every day at 20:00 UTC = 03:00 Vietnam time with Supabase Cron (pg_cron).
-- Note: while the free project is paused, cron jobs do not run; they continue after the project is restored.

create extension if not exists pg_cron with schema pg_catalog;

insert into public.game_config (key, value, description) values
  ('ledger_retention_days', '30', 'Coin ledger rows older than this are deleted daily')
on conflict (key) do update set value = excluded.value;

create function private.cleanup_ledger()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.coin_ledger
  where created_at < now() - make_interval(days => private.cfg('ledger_retention_days')::integer);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function private.cleanup_ledger() from public, anon, authenticated;

select cron.schedule('cleanup-coin-ledger', '0 20 * * *', 'select private.cleanup_ledger()');
