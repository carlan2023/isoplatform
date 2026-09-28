-- ===========================================================================
-- Monthly cohorts — seats reset every class intake
-- ===========================================================================
-- Run this in the Supabase SQL editor AFTER db/enrollment-flow.sql.
-- Safe to run more than once.
--
-- Problem it fixes: a course had ONE seat counter and an enrollment was not
-- tied to a class date, so people who enrolled for last month's class still
-- filled seats (and showed as "already enrolled") for every later class.
--
-- What changes:
--   * enrollments.cohort_start — the class start date the enrollment is for
--     (first Monday of the month after enrolling, matching lib/schedule.ts).
--   * Seats are counted PER COHORT. courses.seats_taken now means "seats held
--     in the cohort currently being sold".
--   * A pending (unpaid) enrollment from an earlier month is moved onto the
--     current cohort when the learner pays.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1) next_cohort_start — first Monday of the month after p_at (UTC).
--    Must stay in sync with firstMondayOfNextMonth() in lib/schedule.ts.
-- ---------------------------------------------------------------------------
create or replace function public.next_cohort_start(p_at timestamptz default now())
returns date
language sql
stable
as $$
  select d + ((8 - extract(isodow from d)::int) % 7)
  from (
    select (date_trunc('month', p_at at time zone 'UTC') + interval '1 month')::date as d
  ) s;
$$;

-- ---------------------------------------------------------------------------
-- 2) enrollments.cohort_start — add, backfill from enrolled_at, default.
-- ---------------------------------------------------------------------------
alter table public.enrollments add column if not exists cohort_start date;

update public.enrollments
set cohort_start = public.next_cohort_start(coalesce(enrolled_at, now()))
where cohort_start is null;

alter table public.enrollments
  alter column cohort_start set default public.next_cohort_start(now());
alter table public.enrollments alter column cohort_start set not null;

create index if not exists enrollments_course_cohort_status_idx
  on public.enrollments (course_id, cohort_start, status);

-- ---------------------------------------------------------------------------
-- 3) recompute_course_seats — held seats in the CURRENT cohort only.
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
      and cohort_start = public.next_cohort_start()
      and status in ('awaiting_confirmation', 'confirmed')
  )
  where id = p_course_id;
$$;

-- ---------------------------------------------------------------------------
-- 4) reserve_seat_for_payment — capacity is checked per cohort. A pending
--    enrollment is (re)assigned to the cohort currently on sale.
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

  -- Already holding a seat -> return its ordinal within its cohort.
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
      cohort_start = v_cohort
  where id = p_enrollment_id;

  v_held := v_held + 1;
  seat_number := v_held;

  update public.courses
  set seats_taken = v_held
  where id = v_course_id;

  return next;
end;
$$;

revoke all on function public.recompute_course_seats(uuid) from public;
revoke all on function public.reserve_seat_for_payment(uuid, integer) from public;
grant execute on function public.recompute_course_seats(uuid) to service_role;
grant execute on function public.reserve_seat_for_payment(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 5) Reset every course's counter to the current cohort.
-- ---------------------------------------------------------------------------
update public.courses c
set seats_taken = (
  select count(*)
  from public.enrollments e
  where e.course_id = c.id
    and e.cohort_start = public.next_cohort_start()
    and e.status in ('awaiting_confirmation', 'confirmed')
);
-- ===========================================================================
