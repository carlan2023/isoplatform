# iso-platform

Website for NAM Quality Management Systems (Kampala, Uganda): ISO
certification consulting pages, a course catalogue with monthly cohorts,
online enrollment with Mobile Money payment, and an admin page for managing
enrollments.

## Stack

- **Next.js 16** (App Router) + React 19, Tailwind CSS 4, TypeScript
- **Supabase** for the database and authentication
- **Resend** for transactional and staff emails
- **BroRacks** for Uganda Mobile Money collections (MTN + Airtel), confirmed
  by webhook at `/api/webhooks/broracks`
- **Vercel** for hosting; Vitest for tests

## Local setup

Requires Node.js 20+.

```bash
cp .env.example .env.local   # then fill in the values (see comments in the file)
npm ci
npm run dev                  # http://localhost:3000
```

Every environment variable the app reads is listed and explained in
[`.env.example`](.env.example).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run ci` | typecheck + lint + test (the same gate CI runs) |

## Deploy

[`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) runs typecheck, lint
and tests on every push and pull request, then deploys to Vercel:
pull requests get a Preview deployment, pushes to `main` go to Production.
App environment variables live in the Vercel project (Production and
Preview), not in GitHub. GitHub only needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`
and `VERCEL_PROJECT_ID`, plus the app variables if the optional
`ENABLE_BUILD_CHECK` build job is turned on.

## Database setup

Run these in the Supabase SQL editor, in this order (the `courses`,
`profiles` and `enrollments` tables must already exist):

1. `db/rls.sql` - Row-Level Security policies and the `is_admin()` helper
2. `db/payments.sql` - atomic seat reservation and seat accounting
3. `db/enrollment-flow.sql` - `awaiting_confirmation` status and profile columns
4. `db/cohorts.sql` - per-cohort (monthly) seat counting
5. `db/group-enrollments.sql` - Internal Auditor Courses group enrollments and participants
6. `db/certificates.sql` - NAM QMS certificates of completion (public verification)

`db/group-enrollments.sql` **must be run** in the Supabase SQL editor before
the Internal Auditor Courses checkout (`/internal-auditor-courses`) can save
a booking. Until it is run, the page still loads, but payment cannot be stored.

`db/certificates.sql` **must be run** before `/verify` can look up a certificate.
Run it again if it was applied for the earlier dash or slash numbers.
Visitors only see the holder name, course, training dates, issue date and
status, through the server. A number looks like `NQ26LA014E`: `NQ`, a
two-digit year, `LA` (Lead Auditor) or `IA` (Internal Auditor), a
three-digit serial, and a check letter. Spaces and hyphens typed into the
form are ignored. A wrong check letter is an invalid number.
Only a Vercel **preview** deployment inserts two fake rows on the first lookup
(`NQ26LA000G`, valid, and `NQ26IA000Q`, revoked, both for Sample Holder).
Production never inserts them, even if `CERTIFICATE_DEMO_SEED=true`.
If a preview shares the production database, delete those rows:

```sql
delete from public.certificates
where certificate_id in ('NQ26LA000G', 'NQ26IA000Q');
```

`POST /api/admin/certificates/service` adds, revokes, or bulk-loads certificates
without the admin UI. It requires `Authorization: Bearer <CERT_ADMIN_TOKEN>`
and `SUPABASE_SERVICE_ROLE_KEY`. The route rejects every request when
`CERT_ADMIN_TOKEN` is unset. Set that token in Vercel; do not commit it.

## Operations

- [Switching to a new BroRacks account](docs/broracks-cutover.md)
