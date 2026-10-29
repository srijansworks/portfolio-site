-- Run in a NEW, separate portfolio Supabase project. Do not use BuildBase.
-- First counted homepage load displays 327. Each subsequent load adds one.
-- 327 is a configured starting number, not historical or unique-visitor analytics.
begin;
create table if not exists public.portfolio_visit_count (
 id boolean primary key default true check (id),
 baseline bigint not null default 327 check (baseline = 327),
 new_visits bigint not null default 0 check (new_visits >= 0)
);
alter table public.portfolio_visit_count enable row level security;
revoke all on public.portfolio_visit_count from public, anon, authenticated;
insert into public.portfolio_visit_count (id) values (true) on conflict do nothing;
create or replace function public.increment_portfolio_visits() returns bigint
language sql security definer set search_path = '' as $$
 update public.portfolio_visit_count
 set new_visits = new_visits + 1
 where id = true
 returning baseline + greatest(new_visits - 1, 0);
$$;
create or replace function public.read_portfolio_visits() returns bigint
language sql security definer set search_path = '' stable as $$
 select baseline + greatest(new_visits - 1, 0)
 from public.portfolio_visit_count where id = true;
$$;
revoke all on function public.increment_portfolio_visits() from public, anon, authenticated;
revoke all on function public.read_portfolio_visits() from public, anon, authenticated;
grant execute on function public.increment_portfolio_visits() to service_role;
grant execute on function public.read_portfolio_visits() to service_role;
comment on table public.portfolio_visit_count is
 'Portfolio-only visit counter. Starts at 327; counts fresh homepage loads, including reloads; not unique people.';
commit;
-- Read-only verification; does not spend a visit:
select public.read_portfolio_visits() as visits;
