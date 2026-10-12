-- ===========================================================================
-- Mobile Money hold timestamp
-- ===========================================================================
-- Run this in the Supabase SQL editor AFTER db/cohorts.sql.
-- Safe to run more than once.
--
-- A cancelled USSD prompt must release the seat. The app learns that from
-- the BroRacks webhook or from a status poll, and it also releases a hold
-- that is still pending 15 minutes after it started. That clock is held_at.
-- Cash/offline bookings stay awaiting_confirmation until an admin confirms
-- them; the app never age-releases those.
-- ===========================================================================

alter table public.enrollments add column if not exists held_at timestamptz;

create index if not exists enrollments_awaiting_held_idx
  on public.enrollments (held_at)
  where status = 'awaiting_confirmation';

-- Stamp held_at when a pending enrollment actually takes a seat.
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
  v_cohort      date;
begin
  select course_id, status, enrolled_at, cohort_start
    into v_course_id, v_status, v_enrolled_at, v_cohort
  from public.enrollments
  where id = p_enrollment_id
  for update;

  if v_course_id is null then
    raise exception 'ENROLLMENT_NOT_FOUND';
  end if;

  if v_status in ('awaiting_confirmation', 'confirmed') then
    select count(*) into v_held
    from public.enrollments
    where course_id = v_course_id
      and cohort_start = v_cohort
      and status in ('awaiting_confirmation', 'confirmed')
      and enrolled_at <= v_enrolled_at;
    seat_number := v_held;
    return next;
    return;
  end if;

  if v_status <> 'pending' then
    raise exception 'ENROLLMENT_NOT_PENDING';
  end if;

  v_cohort := public.next_cohort_start();

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
    and cohort_start = v_cohort
    and status in ('awaiting_confirmation', 'confirmed');

  if v_held >= v_seats_total then
    raise exception 'COURSE_FULL';
  end if;

  update public.enrollments
  set status = 'awaiting_confirmation',
      amount_paid = p_amount,
      cohort_start = v_cohort,
      held_at = now()
  where id = p_enrollment_id;

  v_held := v_held + 1;
  seat_number := v_held;

  update public.courses
  set seats_taken = v_held
  where id = v_course_id;

  return next;
end;
$$;

revoke all on function public.reserve_seat_for_payment(uuid, integer) from public;
grant execute on function public.reserve_seat_for_payment(uuid, integer) to service_role;
