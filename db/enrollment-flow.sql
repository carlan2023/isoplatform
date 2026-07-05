-- ===========================================================================
-- Enrollment flow v2 — decouple payment from enrollment
-- ===========================================================================
-- Run this in the Supabase SQL editor AFTER db/rls.sql and db/payments.sql.
--
-- What changes:
--   * profiles gains the columns the app writes (fixes the enroll 500 where
--     'name'/'full_name' etc. were "not found in the schema cache").
--   * enrollments.status gains 'awaiting_confirmation'.
--   * A seat is now HELD only from payment time onward: seats_taken counts
--     enrollments in ('awaiting_confirmation','confirmed'). A bare 'pending'
--     enrollment (details captured, not yet paid) holds NO seat.
--
-- New lifecycle:
--   pending  --pay-->  awaiting_confirmation  --webhook/admin-->  confirmed
--                                          \--cancel/fail--> cancelled
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) profiles columns — additive & idempotent. Fixes the missing-column error.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists name      text;
alter table public.profiles add column if not exists company   text;
alter table public.profiles add column if not exists phone     text;

-- ---------------------------------------------------------------------------
-- 2) enrollments.status — allow the new value. Replace the check constraint if
--    one pins the allowed set (no-op if status is free text).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'enrollments'
      and constraint_name = 'enrollments_status_check'
  ) then
    alter table public.enrollments drop constraint enrollments_status_check;
  end if;
end $$;

alter table public.enrollments
  add constraint enrollments_status_check
  check (status in ('pending', 'awaiting_confirmation', 'confirmed', 'cancelled'));

-- ---------------------------------------------------------------------------
-- 3) Seat accounting — held seats = awaiting_confirmation + confirmed.
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
      and status in ('awaiting_confirmation', 'confirmed')
  )
  where id = p_course_id;
$$;

-- ---------------------------------------------------------------------------
-- 4) reserve_seat_for_payment: the only safe way to hold a seat.
--
-- Called when the student initiates payment. Locks the course row, enforces
-- capacity, flips the enrollment pending -> awaiting_confirmation, records the
-- amount, and returns the seat ordinal. Idempotent: if the enrollment already
-- holds a seat it returns the existing ordinal without double-counting.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_seat_for_payment(
  p_enrollment_id uuid,
  p_amount integer
)
returns table (seat_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id   uuid;
  v_status      text;
  v_seats_total integer;
  v_held        integer;
  v_enrolled_at timestamptz;
begin
  select course_id, status, enrolled_at
    into v_course_id, v_status, v_enrolled_at
  from public.enrollments
  where id = p_enrollment_id
  for update;

  if v_course_id is null then
    raise exception 'ENROLLMENT_NOT_FOUND';
  end if;

  -- Already holding a seat -> return its ordinal, no re-count.
  if v_status in ('awaiting_confirmation', 'confirmed') then
    select count(*) into v_held
    from public.enrollments
    where course_id = v_course_id
      and status in ('awaiting_confirmation', 'confirmed')
      and enrolled_at <= v_enrolled_at;
    seat_number := v_held;
    return next;
    return;
  end if;

  if v_status <> 'pending' then
    raise exception 'ENROLLMENT_NOT_PENDING';
  end if;

  select seats_total into v_seats_total
  from public.courses
  where id = v_course_id
  for update;

  if v_seats_total is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  select count(*) into v_held
  from public.enrollments
  where course_id = v_course_id
    and status in ('awaiting_confirmation', 'confirmed');

  if v_held >= v_seats_total then
    raise exception 'COURSE_FULL';
  end if;

  update public.enrollments
  set status = 'awaiting_confirmation',
      amount_paid = p_amount
  where id = p_enrollment_id;

  v_held := v_held + 1;
  seat_number := v_held;

  update public.courses
  set seats_taken = v_held
  where id = v_course_id;

  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: only the service role (server API) may call these.
-- ---------------------------------------------------------------------------
revoke all on function public.recompute_course_seats(uuid) from public;
revoke all on function public.reserve_seat_for_payment(uuid, integer) from public;
grant execute on function public.recompute_course_seats(uuid) to service_role;
grant execute on function public.reserve_seat_for_payment(uuid, integer) to service_role;

-- The old reserve_enrollment_seat() (from payments.sql) is now unused — the
-- app reserves at payment time via reserve_seat_for_payment(). Left in place to
-- avoid breaking anything that may still reference it; safe to drop later.

-- ---------------------------------------------------------------------------
-- 5) Backfill seats_taken under the new definition.
-- ---------------------------------------------------------------------------
update public.courses c
set seats_taken = (
  select count(*)
  from public.enrollments e
  where e.course_id = c.id
    and e.status in ('awaiting_confirmation', 'confirmed')
);
-- ===========================================================================
