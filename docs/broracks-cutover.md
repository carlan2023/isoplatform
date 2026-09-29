# Switching to a new BroRacks account

A checklist for moving Mobile Money payments (MTN + Airtel) from the old
BroRacks account to a new one. Plan about an hour for the session, plus a
short check-up 48 hours later.

Throughout, `<domain>` means the live site address, for example
`amqualitysystems.com`.

---

## 1. Before the session (owner)

Log in to the **new** BroRacks dashboard and collect the following. Keep the
values in a password manager. Do not send them by email or chat.

- [ ] **Public key**
- [ ] **Secret key**
- [ ] **Webhook signing secret**
- [ ] Register the webhook URL `https://<domain>/api/webhooks/broracks`
      and tick these events:
  - [ ] `collection.success`
  - [ ] `collection.failed`
  - [ ] `collection.cancelled`
  - [ ] `collection.expired`
- [ ] Confirm the account is **live**, not sandbox/test mode.
- [ ] Confirm **MTN** and **Airtel** collections are both enabled.
- [ ] Confirm the account email is one you control, and decide who should
      get BroRacks alerts (payouts, failures, security notices).
- [ ] Have your old BroRacks keys and webhook secret to hand (or copy them
      from Vercel). You need them for the switch and for rollback.

## 2. Drain in-flight payments

A payment that someone started on the old account is confirmed by a webhook
from the old account. Deal with those before or during the switch.

- [ ] Sign in to `https://<domain>/admin` and filter to
      **Awaiting confirmation**.
- [ ] Look for rows that show a MoMo reference. These are payments started
      but not yet confirmed.
- [ ] Choose one:
  - **Wait**: let them finish (most complete or expire within minutes), then
    switch. **Or**
  - **Switch now**: put the old webhook secret in
    `BRORACKS_WEBHOOK_SECRET_PREVIOUS` (step 3) so late webhooks from the old
    account are still accepted.

## 3. Change the Vercel environment variables

Vercel > the project > **Settings > Environment Variables**. Make each change
for **Production** and for **Preview**.

| Variable | Old | New | Action |
| --- | --- | --- | --- |
| `BRORACKS_PUBLIC_KEY` | old public key | new public key | Replace |
| `BRORACKS_SECRET_KEY` | old secret key | new secret key | Replace |
| `BRORACKS_WEBHOOK_SECRET` | old webhook secret | new webhook secret | Replace |
| `BRORACKS_WEBHOOK_SECRET_PREVIOUS` | (not set) | old webhook secret | Add (temporary, see step 7) |
| `BRORACKS_API_URL` | (not set) | (not set) | Leave unset unless BroRacks gives you a different API address |

- [ ] Production updated
- [ ] Preview updated
- [ ] **Redeploy.** Vercel only picks up changed variables on a new deploy:
      Deployments > latest Production deployment > **...** > **Redeploy**.
      Wait until it shows **Ready**.

## 4. GitHub Actions secrets (usually not needed)

Only if the repository variable `ENABLE_BUILD_CHECK` is `true` (see
`.github/workflows/ci-cd.yml`, "Production build" job):

- [ ] GitHub > repository > **Settings > Secrets and variables > Actions**:
      update `BRORACKS_PUBLIC_KEY`, `BRORACKS_SECRET_KEY` and
      `BRORACKS_WEBHOOK_SECRET` to the new values.

If `ENABLE_BUILD_CHECK` is not set, skip this step. The live site reads its
keys from Vercel, not GitHub.

## 5. Verify

- [ ] **Health check.** While signed in as an admin, open
      `https://<domain>/api/admin/payments/health`. Expect `auth.ok` to be
      `true`. If it is `false`, the keys are wrong or the redeploy has not
      finished.
- [ ] **Real test payment.** Enrol in the lowest-priced course (or ask
      BroRacks for a test amount) and pay with your own phone.
  - [ ] The MoMo prompt arrives and you approve it.
  - [ ] In Vercel > the project > **Logs**, search for `[broracks webhook]`
        and see the event arrive with no "invalid signature" error.
  - [ ] In `/admin` the enrollment changes to **Confirmed**.
  - [ ] The learner confirmation email arrives, and the staff payment alert
        reaches the staff inbox.
- [ ] **Declined payment.** Start another payment and **decline** the prompt
      on the phone.
  - [ ] The enrollment becomes **Cancelled**.
  - [ ] The seat is released (the seats-left count for that course goes back
        up).
- [ ] Refund or cancel the test enrollments as needed.

## 6. If something goes wrong: rollback

- [ ] In Vercel (Production and Preview), put the **old** values back in
      `BRORACKS_PUBLIC_KEY`, `BRORACKS_SECRET_KEY` and
      `BRORACKS_WEBHOOK_SECRET`, and remove `BRORACKS_WEBHOOK_SECRET_PREVIOUS`.
- [ ] Redeploy (same as step 3).
- [ ] Re-run the health check. Payments now go through the old account again.
- [ ] Check `/admin` > **Awaiting confirmation** for anything paid on the new
      account during the failed attempt. Confirm those by hand after checking
      the new BroRacks dashboard.

## 7. After 48 hours

- [ ] Check `/admin` > **Awaiting confirmation** has nothing left from the
      old account.
- [ ] In Vercel (Production and Preview), **delete**
      `BRORACKS_WEBHOOK_SECRET_PREVIOUS`, then redeploy.
- [ ] In the **old** BroRacks dashboard: disable or delete the webhook, and
      disable the API keys.
- [ ] Rotate (regenerate) the old account's keys so any copies of them stop
      working.
- [ ] If step 4 applied, make sure GitHub has no old values left.
