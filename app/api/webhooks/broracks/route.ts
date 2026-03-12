import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const timestamp = req.headers.get('X-BroRacks-Timestamp') || ''
  const signature = req.headers.get('X-BroRacks-Signature') || ''

  // Verify signature
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.BRORACKS_WEBHOOK_SECRET!)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Reject old webhooks (older than 5 minutes)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: 'Webhook expired' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'collection.success') {
    const reference = event.data?.reference

    // Find enrollment by reference
    const { data: enrollment } = await supabaseServer
      .from('enrollments')
      .select('*, courses(*)')
      .eq('stripe_session_id', reference)
      .single()

    if (!enrollment) return NextResponse.json({ received: true })

    // Confirm enrollment
    await supabaseServer
      .from('enrollments')
      .update({ status: 'confirmed' })
      .eq('id', enrollment.id)

    // Update seats taken
    await supabaseServer
      .from('courses')
      .update({ seats_taken: enrollment.courses.seats_taken + 1 })
      .eq('id', enrollment.course_id)

    // Send confirmation email
    await resend.emails.send({
      from: 'info@amqualitysystems.com',
      to: event.data.phone_number, // use stored email ideally
      subject: `Enrollment Confirmed — ${enrollment.courses.title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">Enrollment Confirmed ✓</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Your payment of <strong>UGX ${event.data.amount?.toLocaleString()}</strong> was received successfully.
            You are now enrolled in <strong>${enrollment.courses.title}</strong>.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            We will be in touch with joining instructions. Reference: <strong>${reference}</strong>
          </p>
        </div>
      `,
    })
  }

  if (event.event === 'collection.failed') {
    const reference = event.data?.reference
    await supabaseServer
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('stripe_session_id', reference)
  }

  return NextResponse.json({ received: true })
}
