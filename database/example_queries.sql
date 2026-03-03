-- Set user as admin by email
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'your-email@example.com'
on conflict (user_id) do update set role = excluded.role;

-- Upcoming race
select *
from public.v_upcoming_race
limit 1;

-- Current top 5 drivers
select *
from public.v_current_driver_standings
order by position asc
limit 5;

-- Current top 5 teams
select *
from public.v_current_team_standings
order by position asc
limit 5;

-- Season race list with circuit metadata
select r.id, r.name, r.round, r.date, r.status, c.name as circuit_name, c.country
from public.races r
join public.circuits c on c.id = r.circuit_id
join public.seasons s on s.id = r.season_id
where s.year = 2025
order by r.round asc;

-- Full classification table for one race
select
  rr.position,
  d.name as driver_name,
  t.name as team_name,
  rr.laps,
  rr.time,
  rr.status
from public.race_results rr
join public.drivers d on d.id = rr.driver_id
join public.teams t on t.id = rr.team_id
where rr.race_id = '00000000-0000-0000-0000-000000000000'
order by rr.position asc;

-- Search drivers
select id, name, number, nationality
from public.drivers
where name ilike '%max%'
order by name asc
limit 25;
