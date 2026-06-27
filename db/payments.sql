-- ===========================================================================
-- Atomic seat reservation + seat accounting
-- ===========================================================================
-- Run this in the Supabase SQL editor (after db/rls.sql). It makes enrollment
-- capacity safe under concurrency and gives the app ONE source of truth for
-- "seats remaining".
--
-- Model: courses.seats_taken always equals the number of HELD seats, i.e.
-- enrollments whose status is 'pending' or 'confirmed'. The public pages show
-- seats_total - seats_taken, and the capacity check uses the same definition,
-- so display and enforcement can never disagree.
--
-- NOTE: assumes courses.id and enrollments.user_id are uuid (Supabase default).
-- If your PKs are a different type, adjust the argument types below.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- recompute_course_seats: set seats_taken to the live count of held seats.
-- Used to backfill and to release a seat after a cancellation/failed payment.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_course_seats(p_course_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.courses
  set seats_taken = (
    select count(*)
    from public.enrollments
    where course_id = p_course_id
      and status in ('pending', 'confirmed')
  )
  where id = p_course_id;
$$;

-- ---------------------------------------------------------------------------
-- reserve_enrollment_seat: the only safe way to take a seat.
--
-- Locks the course row (FOR UPDATE) so concurrent callers serialize, checks
-- capacity, inserts a 'pending' enrollment, and refreshes seats_taken — all in
-- one transaction. Raises COURSE_NOT_FOUND / COURSE_FULL for the caller to map
-- to 404 / 409.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_enrollment_seat(
  p_course_id uuid,
  p_user_id uuid,
  p_amount integer
)
returns table (enrollment_id uuid, seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats_total integer;
  v_held integer;
begin
  select seats_total into v_seats_total
  from public.courses
  where id = p_course_id
  for update;                       -- serialize concurrent reservations

  if v_seats_total is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  select count(*) into v_held
  from public.enrollments
  where course_id = p_course_id
    and status in ('pending', 'confirmed');

  if v_held >= v_seats_total then
    raise exception 'COURSE_FULL';
  end if;

  insert into public.enrollments (user_id, course_id, status, amount_paid)
  values (p_user_id, p_course_id, 'pending', p_amount)
  returning id into enrollment_id;

  v_held := v_held + 1;
  seat_number := v_held;

  update public.courses
  set seats_taken = v_held
  where id = p_course_id;

  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: only the service role (used by the server API) may call these.
-- This blocks anon/authenticated clients from invoking them via PostgREST RPC.
-- ---------------------------------------------------------------------------
revoke all on function public.recompute_course_seats(uuid) from public;
revoke all on function public.reserve_enrollment_seat(uuid, uuid, integer) from public;
grant execute on function public.recompute_course_seats(uuid) to service_role;
grant execute on function public.reserve_enrollment_seat(uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- One-time backfill: align existing seats_taken with the new definition.
-- ---------------------------------------------------------------------------
update public.courses c
set seats_taken = (
  select count(*)
  from public.enrollments e
  where e.course_id = c.id
    and e.status in ('pending', 'confirmed')
);
-- ===========================================================================
