-- ===========================================================================
-- Internal Auditor Courses — group enrollment
-- ===========================================================================
-- RUN THIS in the Supabase SQL editor AFTER db/rls.sql.
-- It must be run before the /internal-auditor-courses checkout can save a
-- booking. Until it is run, the page loads but payment cannot be stored.
-- Safe to run more than once.
--
-- A company books Internal Auditor Courses for several people and pays the
-- server-computed total in one Mobile Money collection. Prices live in
-- lib/pricing.ts (computePricing with product "internal-auditor"):
--   UGX 40,000 per person, or UGX 20,000 per person for groups of 5+.
-- The participant cap matches MAX_TEAM_SIZE (10). The amount check matches
-- the BroRacks whole-UGX window (MOMO_MIN_AMOUNT 500 .. MOMO_MAX_AMOUNT
-- 7,000,000) in lib/pricing.ts.
--
-- Writes happen only through the service role (the enroll API and the
-- BroRacks webhook). Signed-in admins may read the rows.
-- ===========================================================================

create extension if not exists pgcrypto;

create table if not exists public.group_enrollments (
  id uuid primary key default gen_random_uuid(),
  product text not null default 'internal-auditor',
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  momo_phone text not null,
  participant_count integer not null,
  per_person integer not null,
  amount integer not null,
  status text not null default 'pending',
  payment_reference text,
  created_at timestamptz not null default now(),
  constraint group_enrollments_product_check
    check (product in ('internal-auditor')),
  constraint group_enrollments_count_check
    check (participant_count >= 1 and participant_count <= 10),
  constraint group_enrollments_per_person_check
    check (per_person > 0),
  constraint group_enrollments_amount_check
    check (amount >= 500 and amount <= 7000000),
  constraint group_enrollments_amount_matches_check
    check (amount = per_person * participant_count),
  constraint group_enrollments_status_check
    check (status in ('pending', 'awaiting_confirmation', 'confirmed', 'cancelled'))
);

create table if not exists public.group_enrollment_participants (
  id uuid primary key default gen_random_uuid(),
  group_enrollment_id uuid not null
    references public.group_enrollments (id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists group_enrollments_payment_reference_idx
  on public.group_enrollments (payment_reference);

create index if not exists group_enrollment_participants_enrollment_idx
  on public.group_enrollment_participants (group_enrollment_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security. No client writes. Admins can read.
-- ---------------------------------------------------------------------------
alter table public.group_enrollments enable row level security;
alter table public.group_enrollment_participants enable row level security;

revoke all on table public.group_enrollments from anon, authenticated;
revoke all on table public.group_enrollment_participants from anon, authenticated;
grant select on table public.group_enrollments to authenticated;
grant select on table public.group_enrollment_participants to authenticated;

drop policy if exists "group_enrollments_admin_read" on public.group_enrollments;
create policy "group_enrollments_admin_read"
  on public.group_enrollments
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "group_participants_admin_read" on public.group_enrollment_participants;
create policy "group_participants_admin_read"
  on public.group_enrollment_participants
  for select
  to authenticated
  using (public.is_admin());
-- ===========================================================================
