-- Phase 4 part 2: realtime "doorbells" (ROADMAP 1.3 C).
-- After any statement that changes plots or parcels, send ONE small broadcast per changed parcel
-- to the private topic 'chunk:<cx>:<cy>'. Clients then re-read that parcel from the database.
-- Messages carry no game data, so a forged message could only make a client re-read real data.

create function private.notify_parcels(p_parcel_ids bigint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in select id, chunk_x, chunk_y from public.parcels where id = any (p_parcel_ids) loop
    -- realtime.send never raises: if no client is connected it only logs a warning.
    perform realtime.send(
      jsonb_build_object('parcel_id', r.id),
      'parcel_changed',
      'chunk:' || r.chunk_x || ':' || r.chunk_y,
      true
    );
  end loop;
end;
$$;

-- Statement-level triggers with transition tables: harvesting 16 plots sends 1 message, not 16.
create function private.on_plots_changed()
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

create function private.on_parcels_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify_parcels(array(select id from new_rows));
  return null;
end;
$$;

revoke all on function private.notify_parcels(bigint[]) from public, anon, authenticated;
revoke all on function private.on_plots_changed() from public, anon, authenticated;
revoke all on function private.on_parcels_changed() from public, anon, authenticated;

create trigger plots_notify_insert
  after insert on public.plots
  referencing new table as new_rows
  for each statement execute function private.on_plots_changed();

create trigger plots_notify_update
  after update on public.plots
  referencing new table as new_rows
  for each statement execute function private.on_plots_changed();

create trigger parcels_notify_update
  after update on public.parcels
  referencing new table as new_rows
  for each statement execute function private.on_parcels_changed();

-- Realtime Authorization (private channels):
-- players may LISTEN to chunk topics and the 'village' presence topic,
-- and may only WRITE presence on 'village' (never broadcast to chunk topics).
create policy "players receive village realtime"
  on realtime.messages
  for select
  to authenticated
  using ((select realtime.topic()) like 'chunk:%' or (select realtime.topic()) = 'village');

create policy "players share presence in the village"
  on realtime.messages
  for insert
  to authenticated
  with check ((select realtime.topic()) = 'village' and extension = 'presence');
