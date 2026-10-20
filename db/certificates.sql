-- ===========================================================================
-- NAM QMS certificates of completion
-- ===========================================================================
-- RUN THIS in the Supabase SQL editor. Safe to run more than once.
--
-- These rows record that a person finished a NAM QMS training course.
-- They are not ISO certificates, and NAM QMS does not certify organisations.
--
-- Contact details are not stored. Public visitors cannot read this table.
-- Lookups go through the server (service role) at /api/verify, which returns
-- only the holder name, course, training dates, issue date and status.
-- Admins write through /api/admin/certificates, also with the service role.
--
-- Preview deployments insert two clearly fake rows the first time someone
-- checks a certificate (NAMQMS-DEMO-0001 and NAMQMS-DEMO-0002, holder
-- "Sample Holder"). Remove them before launch:
--
--   delete from public.certificates
--   where certificate_id in ('NAMQMS-DEMO-0001', 'NAMQMS-DEMO-0002');
-- ===========================================================================

create extension if not exists pgcrypto;

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null,
  holder_full_name text not null,
  course text not null,
  training_start date not null,
  training_end date not null,
  issue_date date not null,
  status text not null default 'valid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificates_certificate_id_unique unique (certificate_id),
  constraint certificates_certificate_id_format
    check (certificate_id ~ '^NAMQMS-[A-Z0-9]+(-[A-Z0-9]+)*$'),
  constraint certificates_status_check
    check (status in ('valid', 'revoked')),
  constraint certificates_dates_check
    check (training_end >= training_start and issue_date >= training_start),
  constraint certificates_name_check
    check (char_length(holder_full_name) between 2 and 120),
  constraint certificates_course_check
    check (char_length(course) between 2 and 160)
);

comment on table public.certificates is
  'NAM QMS certificates of completion for training. Not an ISO certificate and not certification of an organisation.';

create index if not exists certificates_created_at_idx
  on public.certificates (created_at desc);

-- No select/insert/update/delete policies. anon and authenticated have no
-- grant, so the table cannot be listed or read from the browser. service_role
-- bypasses RLS and is used only by server routes.
alter table public.certificates enable row level security;

revoke all on table public.certificates from anon, authenticated;
grant select, insert, update, delete on table public.certificates to service_role;
-- ===========================================================================
