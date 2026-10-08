-- Phase 4 part 3: leaderboards (GDD 7.1, ROADMAP 2.6).
-- security_invoker = true: the views run with the CALLER's rights, so normal RLS still applies
-- (logged-in players may read profiles and parcels; anonymous visitors may not).

create view public.leaderboard_level
with (security_invoker = true) as
select id, username, farm_name, level, xp
from public.profiles
where banned_at is null
order by xp desc, created_at
limit 100;

create view public.leaderboard_land
with (security_invoker = true) as
select pr.id, pr.username, pr.farm_name, pr.level, count(pa.id)::integer as parcels
from public.profiles pr
join public.parcels pa on pa.owner_id = pr.id
where pr.banned_at is null
group by pr.id
order by parcels desc, pr.xp desc
limit 100;

-- Weekly XP counts only if it belongs to the current week (Monday 00:00 Vietnam time).
create view public.leaderboard_weekly
with (security_invoker = true) as
select id, username, farm_name, level, weekly_xp
from public.profiles
where banned_at is null
  and weekly_xp > 0
  and week_start = date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date
order by weekly_xp desc
limit 100;

revoke all on public.leaderboard_level, public.leaderboard_land, public.leaderboard_weekly from anon;
grant select on public.leaderboard_level, public.leaderboard_land, public.leaderboard_weekly to authenticated;
