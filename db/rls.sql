-- ===========================================================================
-- Row-Level Security policies for the ISO platform
-- ===========================================================================
-- Run this in the Supabase SQL editor (or as a migration). This is the real
-- authorization backstop: middleware and the server routes assume these
-- policies are in place. The service_role key (used by getSupabaseAdmin)
-- BYPASSES RLS automatically, so privileged server code keeps working while
-- the public anon/authenticated clients are tightly constrained.
--
-- Model:
--   courses      public read; writes only via service role
--   profiles     a user sees/edits only their own row; admins can read all;
--                role changes only via service role
--   enrollments  a user sees only their own; admins read all; no client writes
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Helper: is_admin()
-- SECURITY DEFINER so it can read profiles without tripping profiles' own RLS,
-- which would otherwise recurse. Pinned search_path for safety.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
alter table public.courses enable row level security;

drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read"
  on public.courses
  for select
  to anon, authenticated
  using (true);

-- (No insert/update/delete policies: course management happens via service role.)

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_or_admin_read" on public.profiles;
create policy "profiles_self_or_admin_read"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Users may edit their own profile, but NOT promote themselves: the role must
-- be unchanged. Role changes and row creation go through the service role.
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------------
alter table public.enrollments enable row level security;

drop policy if exists "enrollments_owner_or_admin_read" on public.enrollments;
create policy "enrollments_owner_or_admin_read"
  on public.enrollments
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- No client insert/update/delete: enrollment creation (enroll API) and status
-- changes (admin API + payment webhook) all run with the service role.
-- ===========================================================================
